import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createReportRequestForUser,
  createReportRequestSchema,
} from "@/lib/report-requests/create-report-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHENTICATED",
          message: "Please login before submitting a report request.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const parsed = createReportRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message ||
            "Please check your request details.",
        },
        { status: 400 },
      );
    }

    const reportRequest = await createReportRequestForUser({
      userId: user.id,
      input: parsed.data,
    });

    return NextResponse.json({
      success: true,
      message: "Report request submitted successfully.",
      request: {
        id: reportRequest.id,
        requestNumber: reportRequest.requestNumber,
        status: reportRequest.status,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while creating the report request.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 },
    );
  }
}
