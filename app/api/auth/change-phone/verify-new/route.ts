import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma/client";
import { normalizePhone } from "@/lib/auth/phone";
import { hashOtp } from "@/lib/auth/otp";
import { SESSION_COOKIE_NAME, hashSessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  phone: z.string().min(7, "Mobile number is required"),
  otp: z
    .string()
    .length(5, "OTP must be 5 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
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
          message:
            "No active phone change request found. Please verify your current mobile number first.",
        },
        { status: 403 },
      );
    }

    if (!phoneChangeRequest.oldPhoneVerifiedAt) {
      return NextResponse.json(
        {
          success: false,
          message: "Your current mobile number has not been verified.",
        },
        { status: 403 },
      );
    }

    const newPhone = normalizePhone(parsed.data.phone);

    if (phoneChangeRequest.newPhone !== newPhone) {
      return NextResponse.json(
        {
          success: false,
          message: "The mobile number does not match the number you requested.",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        phone: newPhone,
      },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "This mobile number is already registered.",
        },
        { status: 409 },
      );
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: session.user.id,
        phone: newPhone,
        purpose: "PHONE_CHANGE_NEW",
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

    const incomingHash = hashOtp(parsed.data.otp, newPhone);

    if (incomingHash !== otpRecord.codeHash) {
      await prisma.otpCode.update({
        where: {
          id: otpRecord.id,
        },
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

    await prisma.$transaction([
      prisma.otpCode.update({
        where: {
          id: otpRecord.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),

      prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          phone: newPhone,
          phoneVerified: true,
        },
      }),

      prisma.phoneChangeRequest.update({
        where: {
          id: phoneChangeRequest.id,
        },
        data: {
          status: "COMPLETED",
          newPhoneVerifiedAt: new Date(),
          completedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Phone number changed successfully.",
    });
  } catch (error) {
    console.error("Verify new phone failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while changing your phone number.",
      },
      { status: 500 },
    );
  }
}
