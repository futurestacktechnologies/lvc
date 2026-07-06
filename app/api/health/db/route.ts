import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const plans = await prisma.paymentPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        code: true,
        name: true,
        price: true,
        currency: true,
        requestCredits: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database connected successfully",
      plans,
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 },
    );
  }
}
