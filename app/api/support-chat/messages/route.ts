import crypto from "crypto";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { uploadSupportAttachment } from "@/lib/support-chat/attachment";

export const runtime = "nodejs";

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

    const formData = await request.formData();
    const messageValue = formData.get("message");
    const attachmentValue = formData.get("attachment");

    const messageText =
      typeof messageValue === "string" ? messageValue.trim() : "";

    const attachment =
      attachmentValue instanceof File && attachmentValue.size > 0
        ? attachmentValue
        : null;

    if (!messageText && !attachment) {
      return NextResponse.json(
        {
          success: false,
          message: "Please type a message or upload an attachment.",
        },
        { status: 400 },
      );
    }

    if (messageText.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "Message must be less than 1000 characters.",
        },
        { status: 400 },
      );
    }

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

    let uploadedAttachment:
      | {
          attachmentUrl: string;
          attachmentFileName: string;
          attachmentFileType: string;
          attachmentFileSize: number;
        }
      | undefined;

    if (attachment) {
      uploadedAttachment = await uploadSupportAttachment({
        file: attachment,
        userId: user.id,
        conversationId: conversation.id,
      });
    }

    const supportMessage = await prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        message: messageText || "Attachment",
        attachmentUrl: uploadedAttachment?.attachmentUrl,
        attachmentFileName: uploadedAttachment?.attachmentFileName,
        attachmentFileType: uploadedAttachment?.attachmentFileType,
        attachmentFileSize: uploadedAttachment?.attachmentFileSize,
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
      supportMessage,
    });
  } catch (error) {
    console.error("Support message send failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while sending your message.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
