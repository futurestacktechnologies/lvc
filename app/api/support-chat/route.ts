import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { createSupportAttachmentSignedUrl } from "@/lib/support-chat/attachment";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to continue.",
        },
        { status: 401 },
      );
    }

    const conversation = await prisma.supportConversation.findFirst({
      where: {
        customerId: user.id,
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
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    if (!conversation) {
      return NextResponse.json({
        success: true,
        conversation: null,
      });
    }

    await prisma.supportMessage.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: {
          not: user.id,
        },
        isReadByCustomer: false,
      },
      data: {
        isReadByCustomer: true,
      },
    });

    const messages = await Promise.all(
      conversation.messages.map(async (message) => ({
        ...message,
        attachmentSignedUrl: message.attachmentUrl
          ? await createSupportAttachmentSignedUrl(message.attachmentUrl)
          : null,
      })),
    );

    return NextResponse.json({
      success: true,
      conversation: {
        ...conversation,
        messages,
      },
    });
  } catch (error) {
    console.error("Support chat fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while loading support chat.",
      },
      { status: 500 },
    );
  }
}
