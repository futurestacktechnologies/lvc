import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma/client";
import { normalizePhone } from "@/lib/auth/phone";
import { generateOtp, getOtpExpiryDate, hashOtp } from "@/lib/auth/otp";
import { sendOtpSms } from "@/lib/sms/notify-lk";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  phone: z.string().min(7, "Mobile number is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid request",
        },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();

    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHENTICATED",
          message: "Please login to change your mobile number.",
        },
        { status: 401 },
      );
    }

    const sessionTokenHash = hashSessionToken(sessionToken);

    const session = await prisma.userSession.findFirst({
      where: {
        tokenHash: sessionTokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHENTICATED",
          message: "Your session has expired. Please login again.",
        },
        { status: 401 },
      );
    }

    const oldPhone = normalizePhone(parsed.data.phone);

    if (oldPhone !== session.user.phone) {
      return NextResponse.json(
        {
          success: false,
          message: "The mobile number does not match your account.",
        },
        { status: 400 },
      );
    }

    // Cancel any previous unfinished phone-change requests
    await prisma.phoneChangeRequest.updateMany({
      where: {
        userId: session.user.id,
        status: {
          in: ["PENDING_OLD_OTP", "PENDING_NEW_OTP"],
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    // Create a new phone change request
    await prisma.phoneChangeRequest.create({
      data: {
        userId: session.user.id,
        oldPhone,
        status: "PENDING_OLD_OTP",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const otp = generateOtp();

    const otpRecord = await prisma.otpCode.create({
      data: {
        userId: session.user.id,
        phone: oldPhone,
        codeHash: hashOtp(otp, oldPhone),
        purpose: "PHONE_CHANGE_OLD",
        channel: "SMS",
        expiresAt: getOtpExpiryDate(),
      },
    });

    try {
      await sendOtpSms({
        phone: oldPhone,
        otp,
        purpose: "PHONE_CHANGE_OLD",
      });
    } catch (smsError) {
      await prisma.otpCode.delete({
        where: {
          id: otpRecord.id,
        },
      });

      console.error("Old phone OTP SMS failed:", smsError);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to send OTP SMS. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your old mobile number.",
      devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Start old phone change failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while sending OTP.",
      },
      { status: 500 },
    );
  }
}
