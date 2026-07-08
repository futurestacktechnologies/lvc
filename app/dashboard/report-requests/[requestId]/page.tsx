import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Eye,
  FileText,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportRequestStatus, ReportStatus } from "@/generated/prisma";

type CustomerReportRequestDetailsPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function CustomerReportRequestDetailsPage({
  params,
}: CustomerReportRequestDetailsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { requestId } = await params;

  const request = await prisma.reportRequest.findFirst({
    where: {
      id: requestId,
      customerId: user.id,
    },
    include: {
      reports: {
        where: {
          status: ReportStatus.ACTIVE,
        },
        orderBy: {
          uploadedAt: "desc",
        },
        select: {
          id: true,
          title: true,
          fileUrl: true,
          fileName: true,
          uploadedAt: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          message: true,
          createdAt: true,
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  const reportsWithSignedUrls = await Promise.all(
    request.reports.map(async (report) => {
      const signedUrlResult = await supabaseAdmin.storage
        .from(REPORT_BUCKET)
        .createSignedUrl(report.fileUrl, 60 * 10);

      return {
        ...report,
        signedUrl: signedUrlResult.data?.signedUrl || null,
      };
    }),
  );

  const latestMessage = request.messages[0] || null;

  return (
    <main className="min-h-screen bg-muted/40">
      <section className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {request.requestNumber}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                View request status, report delivery and admin messages.
              </p>
            </div>

            <RequestStatusBadge status={request.status} />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <DetailItem
                label="Vehicle Identifier / Chassis / VIN"
                value={request.vehicleIdentifier}
              />

              <DetailItem label="Lot Number" value={request.lotNumber} />

              <DetailItem
                label="Auction Platform"
                value={request.auctionPlatform}
              />

              <DetailItem
                label="Auction Date"
                value={
                  request.auctionDate
                    ? request.auctionDate.toLocaleDateString("en-LK")
                    : null
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Timeline</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
                <CalendarDays className="mt-0.5 h-5 w-5 text-brand" />

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Request Created
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.createdAt.toLocaleString("en-LK")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
                <FileText className="mt-0.5 h-5 w-5 text-brand" />

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Current Status
                  </p>
                  <div className="mt-2">
                    <RequestStatusBadge status={request.status} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {request.status === ReportRequestStatus.REJECTED && latestMessage && (
          <Card className="border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-5 w-5" />
                Rejection Reason
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                {latestMessage.message}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Delivered Reports</CardTitle>
          </CardHeader>

          <CardContent>
            {reportsWithSignedUrls.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="font-semibold text-foreground">
                  No report delivered yet
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Once admin delivers your report, the PDF will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reportsWithSignedUrls.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {report.title}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {report.fileName || "PDF report"} • Uploaded{" "}
                        {report.uploadedAt.toLocaleDateString("en-LK")}
                      </p>
                    </div>

                    {report.signedUrl && (
                      <a
                        href={report.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="sm" className="cursor-pointer rounded-xl">
                          <Eye className="mr-1.5 h-4 w-4" />
                          View PDF
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function RequestStatusBadge({ status }: { status: ReportRequestStatus }) {
  if (status === ReportRequestStatus.NEW) {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
        NEW
      </Badge>
    );
  }

  if (status === ReportRequestStatus.PROCESSING) {
    return (
      <Badge className="border-sky-200 bg-sky-50 text-sky-700 ring-1 ring-sky-500/30 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400">
        PROCESSING
      </Badge>
    );
  }

  if (status === ReportRequestStatus.COMPLETED) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        COMPLETED
      </Badge>
    );
  }

  if (status === ReportRequestStatus.DELIVERED) {
    return (
      <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/30 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400">
        DELIVERED
      </Badge>
    );
  }

  if (
    status === ReportRequestStatus.REJECTED ||
    status === ReportRequestStatus.CANCELLED
  ) {
    return (
      <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
        {status}
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
}
