import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Download,
  Eye,
  FileText,
  Hash,
  Package,
  SearchCheck,
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
          fileSize: true,
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
          senderId: true,
        },
      },
      userPackage: {
        select: {
          packageNumber: true,
          plan: {
            select: {
              name: true,
            },
          },
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
  const requestTitle = getRequestDisplayName({
    vehicleIdentifier: request.vehicleIdentifier,
    lotNumber: request.lotNumber,
  });

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-brand">
                Request Details
              </p>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {requestTitle}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Track request status, vehicle details, admin updates and
                delivered PDF reports for this vehicle report request.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <RequestStatusBadge status={request.status} />

                <span className="text-sm text-muted-foreground">
                  {request.requestNumber}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/report-requests">
                <Button
                  variant="outline"
                  className="cursor-pointer rounded-2xl"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  My Requests
                </Button>
              </Link>

              <Link href="/dashboard/report-requests/new">
                <Button className="cursor-pointer rounded-2xl">
                  <SearchCheck className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <RequestInfoCard
          title="Current Status"
          value={request.status.replaceAll("_", " ")}
          description="Latest request stage"
          icon={<Clock3 className="h-5 w-5" />}
        />

        <RequestInfoCard
          title="Request Number"
          value={request.requestNumber}
          description="Unique tracking ID"
          icon={<Hash className="h-5 w-5" />}
        />

        <RequestInfoCard
          title="Reports"
          value={reportsWithSignedUrls.length}
          description="Delivered PDF files"
          icon={<Download className="h-5 w-5" />}
        />

        <RequestInfoCard
          title="Package"
          value={request.userPackage?.plan.name || "Not linked"}
          description={request.userPackage?.packageNumber || "Package details"}
          icon={<Package className="h-5 w-5" />}
        />
      </section>

      {(request.status === ReportRequestStatus.REJECTED ||
        request.status === ReportRequestStatus.CANCELLED) &&
        latestMessage && (
          <Card className="rounded-[2rem] border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-5 w-5" />
                Request Update
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                {latestMessage.message}
              </p>

              <p className="mt-3 text-xs text-muted-foreground">
                Updated on {latestMessage.createdAt.toLocaleString("en-LK")}
              </p>
            </CardContent>
          </Card>
        )}

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[2rem] xl:col-span-2">
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <DetailItem
              label="Vehicle Identifier / Chassis / VIN"
              value={request.vehicleIdentifier || "Not provided"}
            />

            <DetailItem
              label="Lot Number"
              value={request.lotNumber || "Not provided"}
            />

            <DetailItem
              label="Auction Platform"
              value={request.auctionPlatform || "Not provided"}
            />

            <DetailItem
              label="Auction Date"
              value={
                request.auctionDate
                  ? request.auctionDate.toLocaleDateString("en-LK")
                  : "Not provided"
              }
            />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <TimelineItem
              title="Request Created"
              description={request.createdAt.toLocaleString("en-LK")}
              icon={<CalendarDays className="h-4 w-4" />}
            />

            <TimelineItem
              title="Last Updated"
              description={request.updatedAt.toLocaleString("en-LK")}
              icon={<Clock3 className="h-4 w-4" />}
            />

            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold text-foreground">
                Current Status
              </p>

              <div className="mt-2">
                <RequestStatusBadge status={request.status} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[2rem]">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Delivered Reports</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                PDF reports delivered by the admin team
              </p>
            </div>

            <Link href="/dashboard/reports">
              <Button variant="outline" size="sm" className="rounded-xl">
                View All Reports
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {reportsWithSignedUrls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-brand">
                <FileText className="h-6 w-6" />
              </div>

              <p className="mt-5 font-semibold text-foreground">
                No report delivered yet
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Once admin completes and delivers your request, the PDF report
                will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reportsWithSignedUrls.map((report) => (
                <div
                  key={report.id}
                  className="rounded-3xl border border-border bg-background p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {report.title}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {report.fileName || "PDF report"}
                        {report.fileSize
                          ? ` • ${formatFileSize(report.fileSize)}`
                          : ""}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Uploaded {report.uploadedAt.toLocaleDateString("en-LK")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {report.signedUrl ? (
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
                    ) : (
                      <Button size="sm" disabled className="rounded-xl">
                        <Eye className="mr-1.5 h-4 w-4" />
                        No PDF
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {request.messages.length > 0 && (
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Admin Updates</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {request.messages.map((message) => (
              <div
                key={message.id}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <p className="text-sm leading-7 text-muted-foreground">
                  {message.message}
                </p>

                <p className="mt-3 text-xs text-muted-foreground">
                  {message.createdAt.toLocaleString("en-LK")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RequestInfoCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-[2rem]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 truncate text-2xl font-bold text-foreground">
              {value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}

function TimelineItem({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-brand">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function RequestStatusBadge({ status }: { status: ReportRequestStatus }) {
  if (status === ReportRequestStatus.NEW) {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30">
        NEW
      </Badge>
    );
  }

  if (status === ReportRequestStatus.PROCESSING) {
    return (
      <Badge className="border-sky-200 bg-sky-50 text-sky-700 ring-1 ring-sky-500/30">
        PROCESSING
      </Badge>
    );
  }

  if (status === ReportRequestStatus.COMPLETED) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30">
        COMPLETED
      </Badge>
    );
  }

  if (status === ReportRequestStatus.DELIVERED) {
    return (
      <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/30">
        DELIVERED
      </Badge>
    );
  }

  if (
    status === ReportRequestStatus.REJECTED ||
    status === ReportRequestStatus.CANCELLED
  ) {
    return (
      <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30">
        {status}
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
}

function getRequestDisplayName(request: {
  vehicleIdentifier: string;
  lotNumber: string | null;
}) {
  if (request.vehicleIdentifier) {
    return request.vehicleIdentifier;
  }

  if (request.lotNumber) {
    return `Lot ${request.lotNumber}`;
  }

  return "Vehicle request";
}

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}
