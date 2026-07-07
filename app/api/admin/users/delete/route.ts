import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();

    const formData = await request.formData();
    const rawUserIds = formData.get("userIds");

    if (typeof rawUserIds !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "No users selected.",
        },
        { status: 400 },
      );
    }

    const userIds = JSON.parse(rawUserIds) as string[];

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No users selected.",
        },
        { status: 400 },
      );
    }

    if (userIds.includes(admin.id)) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own admin account.",
        },
        { status: 400 },
      );
    }

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        role: true,
      },
    });

    const hasSuperAdmin = users.some((user) => user.role === "SUPER_ADMIN");

    if (hasSuperAdmin && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Only a super admin can delete another super admin account.",
        },
        { status: 403 },
      );
    }

    const result = await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        result.count === 1
          ? "User deleted successfully."
          : `${result.count} users deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete users failed:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "User could not be deleted. If this user has payments, packages, or report history, block the user instead of deleting.",
      },
      { status: 500 },
    );
  }
}
