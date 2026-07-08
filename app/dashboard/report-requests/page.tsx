import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  PlusCircle,
  Truck,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import CustomerReportRequestsTable from "@/components/dashboard/CustomerReportRequestsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const [totalRequests, newRequests, processingRequests, deliveredRequests] =
    await Promise.all([
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
    ]);

  const tableRequests = requestsWithSignedReports.map((request) => ({
    id: request.id,
    requestNumber: request.requestNumber,
    vehicleIdentifier: request.vehicleIdentifier,
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
    <main className="min-h-screen bg-muted/40">
      <section className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
              My Report Requests
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Track all your vehicle report requests, delivered PDFs and admin
              updates.
            </p>
          </div>

          <Link href="/dashboard/report-requests/new">
            <Button className="cursor-pointer rounded-2xl">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card className="h-25">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <FileText className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests}</div>
            </CardContent>
          </Card>

          <Card className="h-25">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <Clock className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newRequests}</div>
            </CardContent>
          </Card>

          <Card className="h-25">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{processingRequests}</div>
            </CardContent>
          </Card>

          <Card className="h-25">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <Truck className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveredRequests}</div>
            </CardContent>
          </Card>
        </div>

        <CustomerReportRequestsTable
          requests={tableRequests}
          totalRequests={filteredRequestsCount}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      </section>
    </main>
  );
}
