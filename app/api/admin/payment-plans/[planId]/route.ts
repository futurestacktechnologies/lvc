import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    planId: string;
  }>;
};

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { planId } = await context.params;

    const formData = await request.formData();

    const name = getText(formData, "name");
    const currency = getText(formData, "currency").toUpperCase() || "LKR";
    const price = Number(getText(formData, "price"));
    const requestCredits = Number(getText(formData, "requestCredits"));
    const sortOrder = Number(getText(formData, "sortOrder") || "0");

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan name is required.",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(price) || price <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan price must be a positive whole number.",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(requestCredits) || requestCredits <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Request credits must be a positive whole number.",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(sortOrder)) {
      return NextResponse.json(
        {
          success: false,
          message: "Sort order must be a whole number.",
        },
        { status: 400 },
      );
    }

    const plan = await prisma.paymentPlan.findUnique({
      where: {
        id: planId,
      },
      select: {
        id: true,
        name: true,
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
        name,
        price,
        currency,
        requestCredits,
        sortOrder,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "PAYMENT_PLAN_UPDATED",
        description: `${updatedPlan.name} payment plan was updated.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${updatedPlan.name} has been updated successfully.`,
    });
  } catch (error) {
    console.error("Payment plan update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the payment plan.",
      },
      { status: 500 },
    );
  }
}
