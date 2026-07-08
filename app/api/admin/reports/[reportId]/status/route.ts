import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";
import { ReportStatus } from "@/generated/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { reportId } = await context.params;

    const formData = await request.formData();
    const status = formData.get("status");

    if (
      status !== ReportStatus.ACTIVE &&
      status !== ReportStatus.REPLACED &&
      status !== ReportStatus.DELETED
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report status selected.",
        },
        { status: 400 },
      );
    }

    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        requestId: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found.",
        },
        { status: 404 },
      );
    }

    await prisma.$transaction([
      prisma.report.update({
        where: {
          id: report.id,
        },
        data: {
          status,
        },
      }),

      prisma.activityLog.create({
        data: {
          userId: admin.id,
          requestId: report.requestId,
          action:
            status === ReportStatus.DELETED
              ? "REPORT_DELETED"
              : "REPORT_STATUS_UPDATED",
          description:
            status === ReportStatus.DELETED
              ? `${report.id} | ${report.title} was marked as deleted.`
              : `${report.title} status changed from ${report.status} to ${status}.`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `${report.title} has been updated.`,
    });
  } catch (error) {
    console.error("Report status update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the report.",
      },
      { status: 500 },
    );
  }
}
