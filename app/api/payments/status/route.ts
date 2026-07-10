import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to check payment status.",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentNumber = searchParams.get("paymentNumber");

    if (!paymentNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment number is required.",
        },
        { status: 400 },
      );
    }

    const payment = await prisma.payment.findFirst({
      where: {
        paymentNumber,
        customerId: user.id,
      },
      include: {
        plan: true,
        userPackage: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found.",
        },
        { status: 404 },
      );
    }

    const isSuccessful =
      payment.status === "PAID" || payment.status === "VERIFIED";

    const isFailed =
      payment.status === "FAILED" ||
      payment.status === "REJECTED" ||
      payment.status === "REFUNDED";

    const isFinal = isSuccessful || isFailed;

    return NextResponse.json(
      {
        success: true,
        payment: {
          paymentNumber: payment.paymentNumber,
          status: payment.status,
          method: payment.method,
          amount: payment.amount,
          currency: payment.currency,
          gatewayRef: payment.gatewayRef,
          adminNote: payment.adminNote,
          verifiedAt: payment.verifiedAt,
          createdAt: payment.createdAt,
        },
        package: payment.userPackage
          ? {
              packageNumber: payment.userPackage.packageNumber,
              status: payment.userPackage.status,
              totalRequests: payment.userPackage.totalRequests,
              remainingRequests: payment.userPackage.remainingRequests,
              activatedAt: payment.userPackage.activatedAt,
            }
          : null,
        plan: {
          name: payment.plan.name,
          requestCredits: payment.plan.requestCredits,
        },
        state: {
          isSuccessful,
          isFailed,
          isFinal,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Payment status check failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while checking payment status.",
      },
      { status: 500 },
    );
  }
}
