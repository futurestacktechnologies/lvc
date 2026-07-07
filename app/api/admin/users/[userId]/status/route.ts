import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";
import { UserStatus } from "@/generated/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { userId } = await context.params;

    const formData = await request.formData();
    const status = formData.get("status");

    if (
      status !== UserStatus.ACTIVE &&
      status !== UserStatus.INACTIVE &&
      status !== UserStatus.BLOCKED
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user status selected.",
        },
        { status: 400 },
      );
    }

    if (admin.id === userId && status !== UserStatus.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot block your own admin account.",
        },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 },
      );
    }

    if (targetUser.role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only a super admin can update another super admin account.",
        },
        { status: 403 },
      );
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        status === UserStatus.BLOCKED
          ? `${targetUser.name} has been blocked successfully.`
          : `${targetUser.name} has been activated successfully.`,
    });
  } catch (error) {
    console.error("User status update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the user status.",
      },
      { status: 500 },
    );
  }
}
