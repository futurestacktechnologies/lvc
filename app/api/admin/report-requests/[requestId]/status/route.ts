import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";
import { ReportRequestStatus } from "@/generated/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { requestId } = await context.params;

    const formData = await request.formData();
    const status = formData.get("status");

    if (
      status !== ReportRequestStatus.NEW &&
      status !== ReportRequestStatus.PROCESSING &&
      status !== ReportRequestStatus.COMPLETED &&
      status !== ReportRequestStatus.DELIVERED &&
      status !== ReportRequestStatus.CANCELLED &&
      status !== ReportRequestStatus.REJECTED
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report request status selected.",
        },
        { status: 400 },
      );
    }

    const reportRequest = await prisma.reportRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
        requestNumber: true,
        status: true,
      },
    });

    if (!reportRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Report request not found.",
        },
        { status: 404 },
      );
    }

    await prisma.$transaction([
      prisma.reportRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status,
          assignedAdminId:
            status === ReportRequestStatus.PROCESSING ? admin.id : undefined,
        },
      }),

      prisma.activityLog.create({
        data: {
          userId: admin.id,
          requestId,
          action: "REPORT_REQUEST_STATUS_UPDATED",
          description: `${reportRequest.requestNumber} status changed from ${reportRequest.status} to ${status}.`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `${reportRequest.requestNumber} status updated to ${status}.`,
    });
  } catch (error) {
    console.error("Report request status update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the report request.",
      },
      { status: 500 },
    );
  }
}
