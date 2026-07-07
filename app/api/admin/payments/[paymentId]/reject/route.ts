import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";

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
      include: {
        userPackage: true,
      },
    });

    if (!payment) {
      return NextResponse.redirect(new URL("/admin/payments", _request.url));
    }

    if (payment.status !== "PROOF_UPLOADED") {
      return NextResponse.redirect(new URL("/admin/payments", _request.url));
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "REJECTED",
          verifiedById: admin.id,
          verifiedAt: new Date(),
          adminNote: "Payment proof rejected by admin.",
        },
      }),

      prisma.userPackage.update({
        where: {
          id: payment.userPackageId!,
        },
        data: {
          status: "CANCELLED",
        },
      }),
    ]);

    return NextResponse.redirect(
      new URL("/admin/payments?rejected=success", _request.url),
    );
  } catch (error) {
    console.error("Payment rejection failed:", error);

    return NextResponse.redirect(
      new URL("/admin/payments?rejected=failed", _request.url),
    );
  }
}
