import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["OPEN", "WAITING_ADMIN", "WAITING_CUSTOMER", "CLOSED"]),
});

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { conversationId } = await context.params;

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid status.",
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

    const updatedConversation = await prisma.supportConversation.update({
      where: {
        id: conversationId,
      },
      data: {
        assignedAdminId: admin.id,
        status: parsed.data.status,
        closedAt: parsed.data.status === "CLOSED" ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        parsed.data.status === "CLOSED"
          ? "Conversation closed successfully."
          : "Conversation status updated successfully.",
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error("Admin support status update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating conversation status.",
      },
      { status: 500 },
    );
  }
}
