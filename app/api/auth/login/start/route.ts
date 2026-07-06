import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma/client";
import { normalizePhone } from "@/lib/auth/phone";
import { generateOtp, getOtpExpiryDate, hashOtp } from "@/lib/auth/otp";

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

    const phone = normalizePhone(parsed.data.phone);

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user || !user.phoneVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "No verified account found for this mobile number.",
        },
        { status: 404 },
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not active. Please contact support.",
        },
        { status: 403 },
      );
    }

    const otp = generateOtp();

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        phone,
        codeHash: hashOtp(otp, phone),
        purpose: "LOGIN",
        channel: "BOTH",
        expiresAt: getOtpExpiryDate(),
      },
    });

    console.log(`[DEV OTP - LOGIN] ${phone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent through WhatsApp and SMS.",
      devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Login start failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while sending OTP.",
      },
      { status: 500 },
    );
  }
}
