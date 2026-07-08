import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();

    const formData = await request.formData();

    const code = getText(formData, "code").toUpperCase();
    const name = getText(formData, "name");
    const currency = getText(formData, "currency").toUpperCase() || "LKR";
    const price = Number(getText(formData, "price"));
    const requestCredits = Number(getText(formData, "requestCredits"));
    const sortOrder = Number(getText(formData, "sortOrder") || "0");

    if (!code || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Plan code and name are required.",
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

    const existingPlan = await prisma.paymentPlan.findUnique({
      where: {
        code,
      },
      select: {
        id: true,
      },
    });

    if (existingPlan) {
      return NextResponse.json(
        {
          success: false,
          message: "A payment plan with this code already exists.",
        },
        { status: 409 },
      );
    }

    const createdPlan = await prisma.paymentPlan.create({
      data: {
        code,
        name,
        price,
        currency,
        requestCredits,
        sortOrder,
        isActive: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "PAYMENT_PLAN_CREATED",
        description: `${createdPlan.name} payment plan was created.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${createdPlan.name} has been created successfully.`,
    });
  } catch (error) {
    console.error("Payment plan create failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating the payment plan.",
      },
      { status: 500 },
    );
  }
}
