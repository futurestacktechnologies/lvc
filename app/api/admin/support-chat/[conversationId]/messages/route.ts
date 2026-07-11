import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { uploadSupportAttachment } from "@/lib/support-chat/attachment";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { conversationId } = await context.params;

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
        userId: admin.id,
        conversationId,
      });
    }

    const supportMessage = await prisma.supportMessage.create({
      data: {
        conversationId,
        senderId: admin.id,
        message: messageText || "Attachment",
        attachmentUrl: uploadedAttachment?.attachmentUrl,
        attachmentFileName: uploadedAttachment?.attachmentFileName,
        attachmentFileType: uploadedAttachment?.attachmentFileType,
        attachmentFileSize: uploadedAttachment?.attachmentFileSize,
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

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while sending reply.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
