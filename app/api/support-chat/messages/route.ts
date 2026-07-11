import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

const schema = z.object({
  message: z
    .string()
    .min(1, "Message is required.")
    .max(1000, "Message must be less than 1000 characters."),
});

function createConversationNumber() {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SUP-${Date.now()}-${random}`;
}

export async function POST(request: Request) {
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

    const messageText = parsed.data.message.trim();

    let conversation = await prisma.supportConversation.findFirst({
      where: {
        customerId: user.id,
        status: {
          not: "CLOSED",
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    if (!conversation) {
      conversation = await prisma.supportConversation.create({
        data: {
          conversationNumber: createConversationNumber(),
          customerId: user.id,
          subject: "Customer Support",
          status: "WAITING_ADMIN",
        },
      });
    }

    const message = await prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        message: messageText,
        isReadByCustomer: true,
        isReadByAdmin: false,
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
        id: conversation.id,
      },
      data: {
        status: "WAITING_ADMIN",
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully.",
      supportMessage: message,
    });
  } catch (error) {
    console.error("Support message send failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while sending your message.",
      },
      { status: 500 },
    );
  }
}
