import { CheckCircle2, Clock, FileText, LoaderCircle } from "lucide-react";

import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminReportRequestsTable from "@/components/admin/AdminReportRequestsTable";
import { Prisma, ReportRequestStatus } from "@/generated/prisma";

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

  if (status === "pending") {
    statusFilter = [ReportRequestStatus.NEW];
  } else if (status === "reviewing") {
    statusFilter = [ReportRequestStatus.PROCESSING];
  } else if (status === "completed") {
    statusFilter = [
      ReportRequestStatus.COMPLETED,
      ReportRequestStatus.DELIVERED,
    ];
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

export default async function AdminReportRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const params = await searchParams;
  const { statusFilter, searchQuery, page, pageSize } = parseFilters(params);

  const where: Prisma.ReportRequestWhereInput = {
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
            {
              customer: {
                is: {
                  name: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              customer: {
                is: {
                  phone: {
                    contains: searchQuery,
                  },
                },
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
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });

  const [totalRequests, pendingRequests, reviewingRequests, completedRequests] =
    await Promise.all([
      prisma.reportRequest.count(),
      prisma.reportRequest.count({
        where: {
          status: ReportRequestStatus.NEW,
        },
      }),
      prisma.reportRequest.count({
        where: {
          status: ReportRequestStatus.PROCESSING,
        },
      }),
      prisma.reportRequest.count({
        where: {
          status: {
            in: [ReportRequestStatus.COMPLETED, ReportRequestStatus.DELIVERED],
          },
        },
      }),
    ]);

  const tableRequests = requests.map((request) => ({
    id: request.id,
    requestNumber: request.requestNumber,
    customerName: request.customer.name,
    customerPhone: request.customer.phone,
    vehicleIdentifier: request.vehicleIdentifier,
    lotNumber: request.lotNumber,
    auctionDate: request.auctionDate ? request.auctionDate.toISOString() : null,
    auctionPlatform: request.auctionPlatform,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Report Requests
          </h1>
          <span className="text-sm text-muted-foreground">
            Review and process customer vehicle report requests
          </span>
        </div>
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
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Reviewing</CardTitle>
            <LoaderCircle className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewingRequests}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRequests}</div>
          </CardContent>
        </Card>
      </div>

      <AdminReportRequestsTable
        requests={tableRequests}
        totalRequests={filteredRequestsCount}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}
