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
    const reason = formData.get("reason");

    if (
      status !== ReportRequestStatus.PROCESSING &&
      status !== ReportRequestStatus.DELIVERED &&
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
        customerId: true,
        reports: {
          select: {
            id: true,
          },
        },
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

    if (
      status === ReportRequestStatus.DELIVERED &&
      reportRequest.reports.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please upload the PDF report before marking this request as delivered.",
        },
        { status: 400 },
      );
    }

    if (status === ReportRequestStatus.REJECTED) {
      if (typeof reason !== "string" || reason.trim().length < 5) {
        return NextResponse.json(
          {
            success: false,
            message: "Please enter a valid rejection reason.",
          },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.reportRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status,
          assignedAdminId:
            status === ReportRequestStatus.PROCESSING ? admin.id : undefined,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: admin.id,
          requestId,
          action: "REPORT_REQUEST_STATUS_UPDATED",
          description: `${reportRequest.requestNumber} status changed from ${reportRequest.status} to ${status}.`,
        },
      });

      if (
        status === ReportRequestStatus.REJECTED &&
        typeof reason === "string"
      ) {
        await tx.message.create({
          data: {
            requestId,
            senderId: admin.id,
            message: `Your report request ${reportRequest.requestNumber} was rejected. Reason: ${reason.trim()}`,
          },
        });

        await tx.activityLog.create({
          data: {
            userId: admin.id,
            requestId,
            action: "REPORT_REQUEST_REJECTED_REASON",
            description: reason.trim(),
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message:
        status === ReportRequestStatus.PROCESSING
          ? `${reportRequest.requestNumber} moved to processing.`
          : status === ReportRequestStatus.DELIVERED
            ? `${reportRequest.requestNumber} has been delivered.`
            : `${reportRequest.requestNumber} has been rejected.`,
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
