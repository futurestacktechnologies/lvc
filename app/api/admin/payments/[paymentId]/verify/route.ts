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
          status: "VERIFIED",
          verifiedById: admin.id,
          verifiedAt: new Date(),
        },
      }),

      prisma.userPackage.update({
        where: {
          id: payment.userPackageId!,
        },
        data: {
          status: "ACTIVE",
          activatedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.redirect(
      new URL("/admin/payments?verified=success", _request.url),
    );
  } catch (error) {
    console.error("Payment verification failed:", error);

    return NextResponse.redirect(
      new URL("/admin/payments?verified=failed", _request.url),
    );
  }
}
