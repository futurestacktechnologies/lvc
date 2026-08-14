import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";
import { AgentCommissionStatus } from "@/generated/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();

    const { agentId } = await context.params;

    const body = await request.json();

    const paymentReference =
      typeof body.paymentReference === "string"
        ? body.paymentReference.trim()
        : "";

    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!agentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Agent ID is required.",
        },
        { status: 400 },
      );
    }

    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: "Agent not found.",
        },
        { status: 404 },
      );
    }

    const pendingCommissions = await prisma.agentCommission.findMany({
      where: {
        agentId,
        status: AgentCommissionStatus.PENDING,
      },
      select: {
        id: true,
        commissionAmount: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (pendingCommissions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This agent has no pending commission.",
        },
        { status: 400 },
      );
    }

    const payoutAmount = pendingCommissions.reduce(
      (total, commission) => total + commission.commissionAmount,
      0,
    );

    const payout = await prisma.$transaction(async (tx) => {
      const createdPayout = await tx.agentPayout.create({
        data: {
          agentId,
          amount: payoutAmount,
          paymentReference: paymentReference || null,
          note: note || null,
        },
      });

      await tx.agentCommission.updateMany({
        where: {
          id: {
            in: pendingCommissions.map((commission) => commission.id),
          },
          status: AgentCommissionStatus.PENDING,
        },
        data: {
          status: AgentCommissionStatus.PAID,
          paidAt: new Date(),
          payoutId: createdPayout.id,
          payoutReference: paymentReference || null,
          adminNote: note || null,
        },
      });

      return createdPayout;
    });

    return NextResponse.json({
      success: true,
      message: `LKR ${payoutAmount.toLocaleString(
        "en-LK",
      )} commission paid to ${agent.name}.`,
      payoutId: payout.id,
      amount: payout.amount,
    });
  } catch (error) {
    console.error("Agent payout failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while processing the payout.",
      },
      { status: 500 },
    );
  }
}
