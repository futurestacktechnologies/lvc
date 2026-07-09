import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Download,
  FileText,
  PackageCheck,
  PlusCircle,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import CustomerReportsTable from "@/components/dashboard/CustomerReportsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Prisma, ReportRequestStatus, ReportStatus } from "@/generated/prisma";

function parseFilters(searchParams: {
  q?: string;
  page?: string;
  pageSize?: string;
}) {
  const searchQuery = searchParams.q?.trim() || "";

  const requestedPage = Number(searchParams.page || "1");
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const requestedPageSize = Number(searchParams.pageSize || "6");
  const pageSize = [5, 6, 10, 20].includes(requestedPageSize)
    ? requestedPageSize
    : 6;

  return {
    searchQuery,
    page,
    pageSize,
  };
}

export default async function CustomerReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const { searchQuery, page, pageSize } = parseFilters(params);

  const where: Prisma.ReportWhereInput = {
    customerId: user.id,
    status: ReportStatus.ACTIVE,
    request: {
      is: {
        status: ReportRequestStatus.DELIVERED,
      },
    },
    ...(searchQuery
      ? {
          OR: [
            {
              title: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              fileName: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              request: {
                is: {
                  requestNumber: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              request: {
                is: {
                  vehicleIdentifier: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              request: {
                is: {
                  lotNumber: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              request: {
                is: {
                  auctionPlatform: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const filteredReportsCount = await prisma.report.count({
    where,
  });

  const totalPages = Math.max(Math.ceil(filteredReportsCount / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const reports = await prisma.report.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: {
      uploadedAt: "desc",
    },
    include: {
      request: {
        select: {
          id: true,
          requestNumber: true,
          vehicleIdentifier: true,
          lotNumber: true,
          auctionPlatform: true,
        },
      },
    },
  });

  const reportsWithSignedUrls = await Promise.all(
    reports.map(async (report) => {
      const signedUrlResult = await supabaseAdmin.storage
        .from(REPORT_BUCKET)
        .createSignedUrl(report.fileUrl, 60 * 10);

      return {
        ...report,
        signedUrl: signedUrlResult.data?.signedUrl || null,
      };
    }),
  );

  const [totalDeliveredReports, totalDeliveredRequests, totalRequests] =
    await Promise.all([
      prisma.report.count({
        where: {
          customerId: user.id,
          status: ReportStatus.ACTIVE,
          request: {
            is: {
              status: ReportRequestStatus.DELIVERED,
            },
          },
        },
      }),

      prisma.reportRequest.count({
        where: {
          customerId: user.id,
          status: ReportRequestStatus.DELIVERED,
        },
      }),

      prisma.reportRequest.count({
        where: {
          customerId: user.id,
        },
      }),
    ]);

  const tableReports = reportsWithSignedUrls.map((report) => ({
    id: report.id,
    title: report.title,
    fileName: report.fileName,
    fileSize: report.fileSize,
    uploadedAt: report.uploadedAt.toISOString(),
    signedUrl: report.signedUrl,

    requestId: report.request.id,
    requestNumber: report.request.requestNumber,
    vehicleIdentifier:
      report.request.vehicleIdentifier ||
      (report.request.lotNumber
        ? `Lot ${report.request.lotNumber}`
        : "Vehicle request"),
    lotNumber: report.request.lotNumber,
    auctionPlatform: report.request.auctionPlatform,
  }));

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-brand">
                Delivered Reports
              </p>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                My Reports
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                View, download and manage all delivered Japanese vehicle PDF
                reports from your account. Each report is connected to its
                original request for easy tracking.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/report-requests/new">
                <Button className="h-11 cursor-pointer rounded-2xl">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Report Request
                </Button>
              </Link>

              <Link href="/dashboard/report-requests">
                <Button
                  variant="outline"
                  className="h-11 cursor-pointer rounded-2xl"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  My Requests
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <ReportStatCard
          title="Delivered Reports"
          value={totalDeliveredReports}
          description="PDF reports ready"
          icon={<Download className="h-5 w-5" />}
        />

        <ReportStatCard
          title="Delivered Requests"
          value={totalDeliveredRequests}
          description="Requests completed"
          icon={<PackageCheck className="h-5 w-5" />}
        />

        <ReportStatCard
          title="Total Requests"
          value={totalRequests}
          description="All submitted requests"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </section>

      <CustomerReportsTable
        reports={tableReports}
        totalReports={filteredReportsCount}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}

function ReportStatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-[2rem]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-brand">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
