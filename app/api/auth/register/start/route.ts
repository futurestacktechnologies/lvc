import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma/client";
import { normalizePhone } from "@/lib/auth/phone";
import { generateOtp, getOtpExpiryDate, hashOtp } from "@/lib/auth/otp";
import { sendOtpSms } from "@/lib/sms/notify-lk";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(7, "Mobile number is required"),
  promoCode: z
    .string()
    .trim()
    .max(50, "Promo code is too long")
    .optional()
    .or(z.literal("")),
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

    const promoCode = parsed.data.promoCode?.trim().toUpperCase() || "";

    /*
     * Validate promo code when provided.
     * Promo code is optional.
     */
    let agentId: string | null = null;

    if (promoCode) {
      const agent = await prisma.agent.findUnique({
        where: {
          promoCode,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!agent || agent.status !== "ACTIVE") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid or inactive promo code.",
          },
          { status: 400 },
        );
      }

      agentId = agent.id;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        phone,
      },
    });

    /*
     * Prevent already verified users from registering again.
     */
    if (existingUser?.phoneVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "This mobile number is already registered. Please login.",
        },
        { status: 409 },
      );
    }

    /*
     * Create a new customer or continue with an existing
     * unverified customer account.
     */
    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          name: parsed.data.name,
          phone,
          phoneVerified: false,
          ...(agentId
            ? {
                agent: {
                  connect: {
                    id: agentId,
                  },
                },
              }
            : {}),
        },
      }));

    /*
     * Update an existing unverified account.
     *
     * If a valid promo code is provided, associate the customer
     * with that agent.
     */
    if (existingUser && !existingUser.phoneVerified) {
      await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          name: parsed.data.name,
          ...(agentId
            ? {
                agent: {
                  connect: {
                    id: agentId,
                  },
                },
              }
            : {}),
        },
      });
    }

    const otp = generateOtp();

    const otpRecord = await prisma.otpCode.create({
      data: {
        userId: user.id,
        phone,
        codeHash: hashOtp(otp, phone),
        purpose: "SIGNUP",
        channel: "SMS",
        expiresAt: getOtpExpiryDate(),
      },
    });

    try {
      await sendOtpSms({
        phone,
        otp,
        purpose: "SIGNUP",
      });
    } catch (smsError) {
      await prisma.otpCode.delete({
        where: {
          id: otpRecord.id,
        },
      });

      console.error("Signup OTP SMS failed:", smsError);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to send OTP SMS. Please try again.",
        },
        { status: 500 },
      );
    }

    console.log(`[OTP - SIGNUP SENT] ${phone}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent to your mobile number.",
      devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Register start failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while sending OTP.",
      },
      { status: 500 },
    );
  }
}
