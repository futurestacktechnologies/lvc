import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";
import { PaymentStatus, UserPackageStatus } from "@/generated/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { paymentId } = await context.params;

    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      select: {
        id: true,
        paymentNumber: true,
        status: true,
        userPackageId: true,
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

    if (payment.status !== PaymentStatus.PROOF_UPLOADED) {
      return NextResponse.json(
        {
          success: false,
          message: "Only uploaded payment proofs can be approved.",
        },
        { status: 400 },
      );
    }

    if (!payment.userPackageId) {
      return NextResponse.json(
        {
          success: false,
          message: "This payment is not connected to a package.",
        },
        { status: 400 },
      );
    }

    const userPackageId = payment.userPackageId;

    await prisma.$transaction([
      prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.VERIFIED,
          verifiedById: admin.id,
          verifiedAt: new Date(),
        },
      }),

      prisma.userPackage.update({
        where: {
          id: userPackageId,
        },
        data: {
          status: UserPackageStatus.ACTIVE,
          activatedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `${payment.paymentNumber} has been approved successfully.`,
    });
  } catch (error) {
    console.error("Payment approval failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while approving the payment.",
      },
      { status: 500 },
    );
  }
}
