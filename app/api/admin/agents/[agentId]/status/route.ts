import { NextResponse } from "next/server";
import { z } from "zod";
import { agentStatusSchema } from "@/lib/validations/agent";
import { requireAdminUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { AgentStatus } from "@/generated/prisma";

export const runtime = "nodejs";

const updateStatusSchema = z.object({
  status: agentStatusSchema,
});

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();

    const { agentId } = await context.params;

    const formData = await request.formData();

    const parsed = updateStatusSchema.safeParse({
      status: formData.get("status"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid agent status.",
        },
        { status: 400 },
      );
    }

    const existingAgent = await prisma.agent.findUnique({
      where: {
        id: agentId,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!existingAgent) {
      return NextResponse.json(
        {
          success: false,
          message: "Agent not found.",
        },
        { status: 404 },
      );
    }

    const newStatus = parsed.data.status as AgentStatus;

    if (existingAgent.status === newStatus) {
      return NextResponse.json({
        success: true,
        message: `Agent is already ${newStatus.toLowerCase()}.`,
      });
    }

    const agent = await prisma.agent.update({
      where: {
        id: agentId,
      },
      data: {
        status: newStatus,
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    const statusMessage =
      newStatus === AgentStatus.ACTIVE
        ? `${agent.name} has been activated successfully.`
        : newStatus === AgentStatus.BLOCKED
          ? `${agent.name} has been blocked successfully.`
          : `${agent.name} has been marked as inactive.`;

    return NextResponse.json({
      success: true,
      message: statusMessage,
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status,
        updatedAt: agent.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin agent status update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the agent status.",
      },
      { status: 500 },
    );
  }
}
