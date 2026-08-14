import { NextResponse } from "next/server";
import { z } from "zod";
import { agentStatusSchema } from "@/lib/validations/agent";
import { requireAdminUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

const updateAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Agent name is required.")
    .max(100, "Agent name is too long."),

  mobile: z
    .string()
    .trim()
    .min(7, "Mobile number is required.")
    .max(20, "Mobile number is too long."),

  address: z
    .string()
    .trim()
    .min(5, "Address is required.")
    .max(500, "Address is too long."),

  promoCode: z
    .string()
    .trim()
    .min(3, "Promo code must be at least 3 characters.")
    .max(50, "Promo code is too long.")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Promo code can only contain letters, numbers, hyphens, and underscores.",
    ),

  status: agentStatusSchema,
});

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminUser();

    const { agentId } = await context.params;

    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
      },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
            phoneVerified: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            customers: true,
          },
        },
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

    return NextResponse.json({
      success: true,
      agent,
    });
  } catch (error) {
    console.error("Admin agent fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while loading the agent.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();

    const { agentId } = await context.params;

    const body = await request.json();
    const parsed = updateAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid agent details.",
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

    const promoCode = parsed.data.promoCode.trim().toUpperCase();

    const promoCodeOwner = await prisma.agent.findFirst({
      where: {
        promoCode,
        id: {
          not: agentId,
        },
      },
      select: {
        id: true,
      },
    });

    if (promoCodeOwner) {
      return NextResponse.json(
        {
          success: false,
          message: "This promo code is already assigned to another agent.",
        },
        { status: 409 },
      );
    }

    const agent = await prisma.agent.update({
      where: {
        id: agentId,
      },
      data: {
        name: parsed.data.name.trim(),
        mobile: parsed.data.mobile.trim(),
        address: parsed.data.address.trim(),
        promoCode,
        status: parsed.data.status,
      },
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Agent updated successfully.",
      agent,
    });
  } catch (error) {
    console.error("Admin agent update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the agent.",
      },
      { status: 500 },
    );
  }
}
