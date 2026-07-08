import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import ReportUploadForm from "@/components/admin/ReportUploadForm";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, FileText, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportRequestStatus } from "@/generated/prisma";
import ReportRequestActions from "@/components/admin/ReportRequestActions";
import CreateReportDialog from "@/components/admin/CreateReportDialog";

type ReportRequestDetailsPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function ReportRequestDetailsPage({
  params,
}: ReportRequestDetailsPageProps) {
  const { requestId } = await params;

  const request = await prisma.reportRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
          role: true,
          status: true,
        },
      },
      assignedAdmin: {
        select: {
          name: true,
          phone: true,
        },
      },
      reports: {
        orderBy: {
          uploadedAt: "desc",
        },
        select: {
          id: true,
          title: true,
          fileUrl: true,
          fileName: true,
          status: true,
          uploadedAt: true,
        },
      },
      activityLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          action: true,
          description: true,
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            {request.requestNumber}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Review customer vehicle request details and update the processing
            status.
          </p>
        </div>

        <ReportRequestStatusBadge status={request.status} />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Current Status
            </CardTitle>
            <FileText className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <ReportRequestStatusBadge status={request.status} />
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
            <UserRound className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">{request.customer.name}</div>
            <a
              href={`https://wa.me/${request.customer.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand"
            >
              {request.customer.phone}
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Auction Date</CardTitle>
            <CalendarDays className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {request.auctionDate
                ? request.auctionDate.toLocaleDateString("en-LK")
                : "Not provided"}
            </div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Assigned Admin
            </CardTitle>
            <UserRound className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {request.assignedAdmin?.name || "Not assigned"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Request Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
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

            <DetailItem
              label="Created Date"
              value={request.createdAt.toLocaleString("en-LK")}
            />

            <DetailItem
              label="Last Updated"
              value={request.updatedAt.toLocaleString("en-LK")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ReportRequestActions
              requestId={request.id}
              requestNumber={request.requestNumber}
              status={request.status}
              uploadedReportsCount={reportsWithSignedUrls.length}
            />

            <div className="rounded-2xl border border-border p-4">
              <p className="mb-4 text-sm font-semibold text-foreground">
                Upload final PDF report
              </p>

              {request.status === ReportRequestStatus.PROCESSING ? (
                <ReportUploadForm
                  requestId={request.id}
                  requestNumber={request.requestNumber}
                />
              ) : request.status === ReportRequestStatus.NEW ? (
                <p className="text-sm text-muted-foreground">
                  Start processing this request before uploading the final PDF
                  report.
                </p>
              ) : request.status === ReportRequestStatus.DELIVERED ? (
                <p className="text-sm text-muted-foreground">
                  This report has already been delivered to the customer.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  PDF upload is not available for this request status.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-dashed border-border p-4">
              <p className="text-sm font-semibold text-foreground">
                Create report
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Generate a PDF report by entering vehicle details manually.
              </p>

              <div className="mt-4">
                {request.status === ReportRequestStatus.PROCESSING ? (
                  <CreateReportDialog
                    requestId={request.id}
                    requestNumber={request.requestNumber}
                    vehicleIdentifier={request.vehicleIdentifier}
                  />
                ) : request.status === ReportRequestStatus.NEW ? (
                  <p className="text-sm text-muted-foreground">
                    Start processing this request before creating a report.
                  </p>
                ) : request.status === ReportRequestStatus.DELIVERED ? (
                  <p className="text-sm text-muted-foreground">
                    This report has already been delivered to the customer.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Create report is not available for this request status.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Reports</CardTitle>
          </CardHeader>

          <CardContent>
            {reportsWithSignedUrls.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No PDF reports uploaded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {reportsWithSignedUrls.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-border p-4"
                  >
                    <p className="font-semibold text-foreground">
                      {report.title}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.fileName || "PDF report"} • {report.status}
                    </p>

                    {report.signedUrl && (
                      <a
                        href={report.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
                      >
                        View PDF
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>

          <CardContent>
            {request.activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {request.activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-border p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {log.action}
                    </p>
                    {log.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {log.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {log.createdAt.toLocaleString("en-LK")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
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
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function ReportRequestStatusBadge({ status }: { status: ReportRequestStatus }) {
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
