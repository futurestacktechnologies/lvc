import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";
import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import { ReportRequestStatus } from "@/generated/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

    const titleValue = formData.get("title");
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload a PDF report file.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "PDF file size must be less than 10MB.",
        },
        { status: 400 },
      );
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        {
          success: false,
          message: "Only PDF files are allowed.",
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
        customerId: true,
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

    if (
      reportRequest.status === ReportRequestStatus.REJECTED ||
      reportRequest.status === ReportRequestStatus.CANCELLED
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot upload report for a rejected or cancelled request.",
        },
        { status: 400 },
      );
    }

    const reportTitle =
      typeof titleValue === "string" && titleValue.trim()
        ? titleValue.trim()
        : `${reportRequest.requestNumber} Vehicle Report`;

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase();

    const filePath = `${reportRequest.customerId}/${reportRequest.id}/${Date.now()}-${safeFileName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const uploadResult = await supabaseAdmin.storage
      .from(REPORT_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadResult.error) {
      return NextResponse.json(
        {
          success: false,
          message: uploadResult.error.message || "PDF upload failed.",
        },
        { status: 500 },
      );
    }

    await prisma.$transaction([
      prisma.report.create({
        data: {
          requestId: reportRequest.id,
          customerId: reportRequest.customerId,
          title: reportTitle,
          fileUrl: filePath,
          fileName: file.name,
          fileSize: file.size,
          uploadedById: admin.id,
        },
      }),

      prisma.reportRequest.update({
        where: {
          id: reportRequest.id,
        },
        data: {
          status: ReportRequestStatus.DELIVERED,
          assignedAdminId: admin.id,
        },
      }),

      prisma.activityLog.create({
        data: {
          userId: admin.id,
          requestId: reportRequest.id,
          action: "REPORT_UPLOADED",
          description: `${reportTitle} uploaded for ${reportRequest.requestNumber}. Request marked as DELIVERED.`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "PDF report uploaded successfully.",
    });
  } catch (error) {
    console.error("Report upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while uploading the report.",
      },
      { status: 500 },
    );
  }
}
