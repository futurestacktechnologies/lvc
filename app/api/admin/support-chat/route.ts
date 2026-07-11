import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdminUser();

    const conversations = await prisma.supportConversation.findMany({
      orderBy: {
        lastMessageAt: "desc",
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
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            message: true,
            createdAt: true,
            senderId: true,
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isReadByAdmin: false,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Admin support chat list failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while loading support conversations.",
      },
      { status: 500 },
    );
  }
}
