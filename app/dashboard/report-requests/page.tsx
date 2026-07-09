import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Clock,
  FileText,
  PlusCircle,
  SearchCheck,
  Truck,
  XCircle,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import CustomerReportRequestsTable from "@/components/dashboard/CustomerReportRequestsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Prisma, ReportRequestStatus, ReportStatus } from "@/generated/prisma";

function parseFilters(searchParams: {
  status?: string;
  q?: string;
  page?: string;
  pageSize?: string;
}) {
  const status = searchParams.status || "all";
  const searchQuery = searchParams.q?.trim() || "";

  const requestedPage = Number(searchParams.page || "1");
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const requestedPageSize = Number(searchParams.pageSize || "5");
  const pageSize = [5, 10, 20].includes(requestedPageSize)
    ? requestedPageSize
    : 5;

  let statusFilter: ReportRequestStatus[] = [];

  if (status === "new") {
    statusFilter = [ReportRequestStatus.NEW];
  } else if (status === "processing") {
    statusFilter = [ReportRequestStatus.PROCESSING];
  } else if (status === "completed") {
    statusFilter = [ReportRequestStatus.COMPLETED];
  } else if (status === "delivered") {
    statusFilter = [ReportRequestStatus.DELIVERED];
  } else if (status === "rejected") {
    statusFilter = [
      ReportRequestStatus.REJECTED,
      ReportRequestStatus.CANCELLED,
    ];
  } else {
    statusFilter = [
      ReportRequestStatus.NEW,
      ReportRequestStatus.PROCESSING,
      ReportRequestStatus.COMPLETED,
      ReportRequestStatus.DELIVERED,
      ReportRequestStatus.CANCELLED,
      ReportRequestStatus.REJECTED,
    ];
  }

  return {
    statusFilter,
    searchQuery,
    page,
    pageSize,
  };
}

export default async function CustomerReportRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
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
  const { statusFilter, searchQuery, page, pageSize } = parseFilters(params);

  const where: Prisma.ReportRequestWhereInput = {
    customerId: user.id,
    status: {
      in: statusFilter,
    },
    ...(searchQuery
      ? {
          OR: [
            {
              requestNumber: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              vehicleIdentifier: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              lotNumber: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              auctionPlatform: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const filteredRequestsCount = await prisma.reportRequest.count({
    where,
  });

  const totalPages = Math.max(Math.ceil(filteredRequestsCount / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const requests = await prisma.reportRequest.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      reports: {
        where: {
          status: ReportStatus.ACTIVE,
        },
        orderBy: {
          uploadedAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          title: true,
          fileUrl: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          message: true,
        },
      },
    },
  });

  const requestsWithSignedReports = await Promise.all(
    requests.map(async (request) => {
      const latestReport = request.reports[0] || null;

      let latestReportUrl: string | null = null;

      if (latestReport) {
        const signedUrlResult = await supabaseAdmin.storage
          .from(REPORT_BUCKET)
          .createSignedUrl(latestReport.fileUrl, 60 * 10);

        latestReportUrl = signedUrlResult.data?.signedUrl || null;
      }

      return {
        ...request,
        latestReport,
        latestReportUrl,
        rejectionReason:
          request.status === ReportRequestStatus.REJECTED ||
          request.status === ReportRequestStatus.CANCELLED
            ? request.messages[0]?.message || null
            : null,
      };
    }),
  );

  const [
    totalRequests,
    newRequests,
    processingRequests,
    deliveredRequests,
    rejectedRequests,
  ] = await Promise.all([
    prisma.reportRequest.count({
      where: {
        customerId: user.id,
      },
    }),

    prisma.reportRequest.count({
      where: {
        customerId: user.id,
        status: ReportRequestStatus.NEW,
      },
    }),

    prisma.reportRequest.count({
      where: {
        customerId: user.id,
        status: ReportRequestStatus.PROCESSING,
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
        status: {
          in: [ReportRequestStatus.REJECTED, ReportRequestStatus.CANCELLED],
        },
      },
    }),
  ]);

  const tableRequests = requestsWithSignedReports.map((request) => ({
    id: request.id,
    requestNumber: request.requestNumber,
    vehicleIdentifier:
      request.vehicleIdentifier ||
      (request.lotNumber ? `Lot ${request.lotNumber}` : "Vehicle request"),
    lotNumber: request.lotNumber,
    auctionDate: request.auctionDate ? request.auctionDate.toISOString() : null,
    auctionPlatform: request.auctionPlatform,
    status: request.status,
    createdAt: request.createdAt.toISOString(),

    latestReportTitle: request.latestReport?.title || null,
    latestReportUrl: request.latestReportUrl,
    rejectionReason: request.rejectionReason,
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
                Request Tracking
              </p>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                My Report Requests
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Track every vehicle report request, view admin updates, open
                delivered PDF reports and manage rejected or pending requests in
                one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/report-requests/new">
                <Button className="h-11 cursor-pointer rounded-2xl">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Report
                </Button>
              </Link>

              <Link href="/dashboard/reports">
                <Button
                  variant="outline"
                  className="h-11 cursor-pointer rounded-2xl"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  My Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <RequestStatCard
          title="Total"
          value={totalRequests}
          description="All requests"
          icon={<FileText className="h-5 w-5" />}
        />

        <RequestStatCard
          title="New"
          value={newRequests}
          description="Waiting review"
          icon={<Clock className="h-5 w-5" />}
        />

        <RequestStatCard
          title="Processing"
          value={processingRequests}
          description="Admin checking"
          icon={<SearchCheck className="h-5 w-5" />}
        />

        <RequestStatCard
          title="Delivered"
          value={deliveredRequests}
          description="PDF ready"
          icon={<Truck className="h-5 w-5" />}
        />

        <RequestStatCard
          title="Rejected"
          value={rejectedRequests}
          description="Needs attention"
          icon={<XCircle className="h-5 w-5" />}
          danger={rejectedRequests > 0}
        />
      </section>

      <CustomerReportRequestsTable
        requests={tableRequests}
        totalRequests={filteredRequestsCount}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}

function RequestStatCard({
  title,
  value,
  description,
  icon,
  danger = false,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  danger?: boolean;
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

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              danger ? "bg-rose-50 text-rose-600" : "bg-secondary text-brand"
            }`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
