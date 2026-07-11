import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { conversationId } = await context.params;

    const conversation = await prisma.supportConversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: "Support conversation not found.",
        },
        { status: 404 },
      );
    }

    await prisma.supportMessage.updateMany({
      where: {
        conversationId,
        senderId: {
          not: admin.id,
        },
        isReadByAdmin: false,
      },
      data: {
        isReadByAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Admin support conversation fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while loading support conversation.",
      },
      { status: 500 },
    );
  }
}
