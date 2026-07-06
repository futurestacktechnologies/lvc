import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma/client";
import { normalizePhone } from "@/lib/auth/phone";
import { hashOtp } from "@/lib/auth/otp";
import {
  generateSessionToken,
  getSessionExpiryDate,
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  phone: z.string().min(7, "Mobile number is required"),
  otp: z
    .string()
    .length(5, "OTP must be 5 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
  type: z.enum(["signup", "login"]),
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
    const purpose = parsed.data.type === "signup" ? "SIGNUP" : "LOGIN";

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    if (parsed.data.type === "login" && !user.phoneVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete signup verification first.",
        },
        { status: 403 },
      );
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        phone,
        purpose,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP expired or not found. Please request a new OTP.",
        },
        { status: 400 },
      );
    }

    if (otpRecord.attemptCount >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many failed attempts. Please request a new OTP.",
        },
        { status: 429 },
      );
    }

    const incomingHash = hashOtp(parsed.data.otp, phone);

    if (incomingHash !== otpRecord.codeHash) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: {
          attemptCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP code.",
        },
        { status: 400 },
      );
    }

    const sessionToken = generateSessionToken();
    const sessionTokenHash = hashSessionToken(sessionToken);
    const sessionExpiresAt = getSessionExpiryDate();

    await prisma.$transaction([
      prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: {
          usedAt: new Date(),
        },
      }),

      prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          lastLoginAt: new Date(),
        },
      }),

      prisma.userSession.create({
        data: {
          userId: user.id,
          tokenHash: sessionTokenHash,
          expiresAt: sessionExpiresAt,
          userAgent: request.headers.get("user-agent"),
          ipAddress: request.headers.get("x-forwarded-for"),
        },
      }),
    ]);

    const response = NextResponse.json({
      success: true,
      message: "OTP verified successfully.",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: sessionExpiresAt,
    });

    return response;
  } catch (error) {
    console.error("OTP verification failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while verifying OTP.",
      },
      { status: 500 },
    );
  }
}
