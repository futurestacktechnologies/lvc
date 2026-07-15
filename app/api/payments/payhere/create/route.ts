import crypto from "crypto";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import {
  formatPayHereAmount,
  generatePayHereCheckoutHash,
  getPayHereConfig,
} from "@/lib/payhere";

export const runtime = "nodejs";

function createReference(prefix: string) {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

function splitCustomerName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "Customer",
    lastName: parts.slice(1).join(" ") || "Customer",
  };
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to continue.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const planCode = body?.planCode;

    if (typeof planCode !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Payment plan is required.",
        },
        { status: 400 },
      );
    }

    const plan = await prisma.paymentPlan.findUnique({
      where: {
        code: planCode,
      },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected payment plan is not available.",
        },
        { status: 404 },
      );
    }

    const config = getPayHereConfig();

    const paymentNumber = createReference("PAY");
    const packageNumber = createReference("PKG");

    const result = await prisma.$transaction(async (tx) => {
      const userPackage = await tx.userPackage.create({
        data: {
          packageNumber,
          userId: user.id,
          planId: plan.id,
          totalRequests: plan.requestCredits,
          usedRequests: 0,
          remainingRequests: plan.requestCredits,
          status: "PENDING_PAYMENT",
        },
      });

      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          customerId: user.id,
          planId: plan.id,
          userPackageId: userPackage.id,
          amount: plan.price,
          currency: plan.currency,
          method: "ONLINE_GATEWAY",
          status: "PENDING",
        },
      });

      return {
        payment,
        userPackage,
      };
    });

    const amount = formatPayHereAmount(plan.price);

    const hash = generatePayHereCheckoutHash({
      merchantId: config.merchantId,
      orderId: result.payment.paymentNumber,
      amount: plan.price,
      currency: plan.currency,
      merchantSecret: config.merchantSecret,
    });

    const { firstName, lastName } = splitCustomerName(user.name);

    return NextResponse.json({
      success: true,
      checkoutUrl: config.checkoutUrl,
      payment: {
        merchant_id: config.merchantId,
        return_url: `${config.appUrl}/payment/success?paymentNumber=${result.payment.paymentNumber}`,
        cancel_url: `${config.appUrl}/payment/cancel?paymentNumber=${result.payment.paymentNumber}`,
        notify_url: config.notifyUrl,

        order_id: result.payment.paymentNumber,
        items: `${plan.name} - ${plan.requestCredits} report credits`,
        amount,
        currency: plan.currency,
        hash,

        first_name: firstName,
        last_name: lastName,
        email: "info@enfieldnexus.com",
        phone: user.phone,
        address: "Online Customer",
        city: "Colombo",
        country: "Sri Lanka",

        custom_1: result.payment.id,
        custom_2: result.userPackage.id,
      },
    });
  } catch (error) {
    console.error("PayHere checkout creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while starting online payment.",
      },
      { status: 500 },
    );
  }
}
