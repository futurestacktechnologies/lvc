import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    planId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { planId } = await context.params;

    const formData = await request.formData();
    const isActiveValue = formData.get("isActive");

    if (isActiveValue !== "true" && isActiveValue !== "false") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid plan status selected.",
        },
        { status: 400 },
      );
    }

    const isActive = isActiveValue === "true";

    const plan = await prisma.paymentPlan.findUnique({
      where: {
        id: planId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment plan not found.",
        },
        { status: 404 },
      );
    }

    const updatedPlan = await prisma.paymentPlan.update({
      where: {
        id: plan.id,
      },
      data: {
        isActive,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: isActive
          ? "PAYMENT_PLAN_ACTIVATED"
          : "PAYMENT_PLAN_DEACTIVATED",
        description: `${updatedPlan.name} payment plan was ${
          isActive ? "activated" : "deactivated"
        }.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${updatedPlan.name} has been ${
        isActive ? "activated" : "deactivated"
      }.`,
    });
  } catch (error) {
    console.error("Payment plan status update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the payment plan.",
      },
      { status: 500 },
    );
  }
}
