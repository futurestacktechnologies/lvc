import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";
import { AgentStatus, Prisma } from "@/generated/prisma";

export const runtime = "nodejs";

function normalizePromoCode(value: string) {
  return value.trim().toUpperCase();
}

export async function GET(request: Request) {
  try {
    await requireAdminUser();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status") || "all";

    const where: Prisma.AgentWhereInput = {
      ...(status !== "all"
        ? {
            status:
              status === "ACTIVE"
                ? AgentStatus.ACTIVE
                : status === "INACTIVE"
                  ? AgentStatus.INACTIVE
                  : status === "BLOCKED"
                    ? AgentStatus.BLOCKED
                    : undefined,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                mobile: {
                  contains: search,
                },
              },
              {
                promoCode: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    };

    const agents = await prisma.agent.findMany({
      where,
      orderBy: {
        createdAt: "desc",
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
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        mobile: agent.mobile,
        address: agent.address,
        nicDlUrl: agent.nicDlUrl,
        nicDlFileName: agent.nicDlFileName,
        nicDlFileType: agent.nicDlFileType,
        nicDlFileSize: agent.nicDlFileSize,
        promoCode: agent.promoCode,
        status: agent.status,
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
        _count: agent._count,
      })),
    });
  } catch (error) {
    console.error("Fetch agents failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while loading agents.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser();

    const body = await request.json();

    const name = String(body.name || "").trim();
    const mobile = String(body.mobile || "").trim();
    const address = String(body.address || "").trim();

    const rawPromoCode = String(body.promoCode || "");
    const promoCode = normalizePromoCode(rawPromoCode);

    const rawStatus = String(body.status || AgentStatus.ACTIVE);

    if (!name || !mobile || !address || !promoCode) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Agent name, mobile number, address, and promo code are required.",
        },
        { status: 400 },
      );
    }

    if (
      rawStatus !== AgentStatus.ACTIVE &&
      rawStatus !== AgentStatus.INACTIVE &&
      rawStatus !== AgentStatus.BLOCKED
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid agent status selected.",
        },
        { status: 400 },
      );
    }

    const existingPromoCode = await prisma.agent.findUnique({
      where: {
        promoCode,
      },
      select: {
        id: true,
      },
    });

    if (existingPromoCode) {
      return NextResponse.json(
        {
          success: false,
          message: "This promo code is already assigned to another agent.",
        },
        { status: 409 },
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        mobile,
        address,
        promoCode,
        status: rawStatus as AgentStatus,
      },
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Agent created successfully.",
        agent: {
          id: agent.id,
          name: agent.name,
          mobile: agent.mobile,
          address: agent.address,
          nicDlUrl: agent.nicDlUrl,
          nicDlFileName: agent.nicDlFileName,
          nicDlFileType: agent.nicDlFileType,
          nicDlFileSize: agent.nicDlFileSize,
          promoCode: agent.promoCode,
          status: agent.status,
          createdAt: agent.createdAt.toISOString(),
          updatedAt: agent.updatedAt.toISOString(),
          _count: agent._count,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create agent failed:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This promo code is already assigned to another agent.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating the agent.",
      },
      { status: 500 },
    );
  }
}
