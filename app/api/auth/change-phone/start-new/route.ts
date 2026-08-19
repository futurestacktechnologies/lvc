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
          message: "Please login to continue.",
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

    const phoneChangeRequest = await prisma.phoneChangeRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING_NEW_OTP",
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!phoneChangeRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your current mobile number first.",
        },
        { status: 403 },
      );
    }

    const newPhone = normalizePhone(parsed.data.phone);

    if (newPhone === session.user.phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The new mobile number must be different from your current number.",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        phone: newPhone,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "This mobile number is already registered.",
        },
        { status: 409 },
      );
    }
    await prisma.phoneChangeRequest.update({
      where: {
        id: phoneChangeRequest.id,
      },
      data: {
        newPhone,
      },
    });

    const otp = generateOtp();

    const otpRecord = await prisma.otpCode.create({
      data: {
        userId: session.user.id,
        phone: newPhone,
        codeHash: hashOtp(otp, newPhone),
        purpose: "PHONE_CHANGE_NEW",
        channel: "SMS",
        expiresAt: getOtpExpiryDate(),
      },
    });

    try {
      await sendOtpSms({
        phone: newPhone,
        otp,
        purpose: "PHONE_CHANGE_NEW",
      });
    } catch (smsError) {
      await prisma.otpCode.delete({
        where: {
          id: otpRecord.id,
        },
      });

      console.error("New phone OTP SMS failed:", smsError);

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
      message: "OTP sent to your new mobile number.",
      devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Start new phone change failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while sending OTP.",
      },
      { status: 500 },
    );
  }
}
