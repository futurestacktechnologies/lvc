import { CheckCircle2, FileText, RotateCcw, Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma/client";
import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import AdminReportsTable from "@/components/admin/AdminReportsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Prisma, ReportStatus } from "@/generated/prisma";

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

  let statusFilter: ReportStatus[] = [];

  if (status === "active") {
    statusFilter = [ReportStatus.ACTIVE];
  } else if (status === "replaced") {
    statusFilter = [ReportStatus.REPLACED];
  } else if (status === "deleted") {
    statusFilter = [ReportStatus.DELETED];
  } else {
    statusFilter = [
      ReportStatus.ACTIVE,
      ReportStatus.REPLACED,
      ReportStatus.DELETED,
    ];
  }

  return {
    statusFilter,
    searchQuery,
    page,
    pageSize,
  };
}

export default async function AdminReportsPage({
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

  const where: Prisma.ReportWhereInput = {
    status: {
      in: statusFilter,
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
        },
      },
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      uploadedBy: {
        select: {
          name: true,
        },
      },
    },
  });

  const reportsWithSignedUrls = await Promise.all(
    reports.map(async (report) => {
      const signedUrlResult = await supabaseAdmin.storage
        .from(REPORT_BUCKET)
        .createSignedUrl(report.fileUrl, 60 * 10);

      const deletedLog =
        report.status === ReportStatus.DELETED
          ? await prisma.activityLog.findFirst({
              where: {
                requestId: report.request.id,
                action: "REPORT_DELETED",
                description: {
                  contains: report.id,
                },
              },
              orderBy: {
                createdAt: "desc",
              },
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            })
          : null;

      return {
        ...report,
        signedUrl: signedUrlResult.data?.signedUrl || null,
        deletedByName: deletedLog?.user?.name || null,
      };
    }),
  );

  const [totalReports, activeReports, replacedReports, deletedReports] =
    await Promise.all([
      prisma.report.count(),
      prisma.report.count({
        where: {
          status: ReportStatus.ACTIVE,
        },
      }),
      prisma.report.count({
        where: {
          status: ReportStatus.REPLACED,
        },
      }),
      prisma.report.count({
        where: {
          status: ReportStatus.DELETED,
        },
      }),
    ]);

  const tableReports = reportsWithSignedUrls.map((report) => ({
    id: report.id,
    title: report.title,
    fileName: report.fileName,
    fileSize: report.fileSize,
    status: report.status,
    uploadedAt: report.uploadedAt.toISOString(),
    signedUrl: report.signedUrl,

    requestId: report.request.id,
    requestNumber: report.request.requestNumber,
    vehicleIdentifier: report.request.vehicleIdentifier,

    customerName: report.customer.name,
    customerPhone: report.customer.phone,

    uploadedByName: report.uploadedBy?.name || null,
    deletedByName: report.deletedByName,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Reports
          </h1>
          <span className="text-sm text-muted-foreground">
            {filteredReportsCount} report
            {filteredReportsCount !== 1 ? "s" : ""} found
          </span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Active Reports
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReports}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Replaced</CardTitle>
            <RotateCcw className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{replacedReports}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Deleted</CardTitle>
            <Trash2 className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deletedReports}</div>
          </CardContent>
        </Card>
      </div>

      <AdminReportsTable
        reports={tableReports}
        totalReports={filteredReportsCount}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}
