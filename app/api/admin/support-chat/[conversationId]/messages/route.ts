import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

const schema = z.object({
  message: z
    .string()
    .min(1, "Message is required.")
    .max(1000, "Message must be less than 1000 characters."),
});

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { conversationId } = await context.params;

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid message.",
        },
        { status: 400 },
      );
    }

    const conversation = await prisma.supportConversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        status: true,
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

    if (conversation.status === "CLOSED") {
      return NextResponse.json(
        {
          success: false,
          message: "This support conversation is already closed.",
        },
        { status: 400 },
      );
    }

    const supportMessage = await prisma.supportMessage.create({
      data: {
        conversationId,
        senderId: admin.id,
        message: parsed.data.message.trim(),
        isReadByAdmin: true,
        isReadByCustomer: false,
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
    });

    await prisma.supportConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        assignedAdminId: admin.id,
        status: "WAITING_CUSTOMER",
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully.",
      supportMessage,
    });
  } catch (error) {
    console.error("Admin support reply failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while sending reply.",
      },
      { status: 500 },
    );
  }
}
