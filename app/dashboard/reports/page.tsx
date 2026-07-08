import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileText, PackageCheck, PlusCircle } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import CustomerReportsTable from "@/components/dashboard/CustomerReportsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const [totalDeliveredReports, totalDeliveredRequests] = await Promise.all([
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
    vehicleIdentifier: report.request.vehicleIdentifier,
    lotNumber: report.request.lotNumber,
    auctionPlatform: report.request.auctionPlatform,
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
              My Reports
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              View and download all delivered PDF vehicle reports.
            </p>
          </div>

          <Link href="/dashboard/report-requests/new">
            <Button className="cursor-pointer rounded-2xl">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Report Request
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="h-25">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Delivered Reports
              </CardTitle>
              <FileText className="h-5 w-5 text-brand" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold">{totalDeliveredReports}</div>
            </CardContent>
          </Card>

          <Card className="h-25">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Delivered Requests
              </CardTitle>
              <PackageCheck className="h-5 w-5 text-brand" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold">{totalDeliveredRequests}</div>
            </CardContent>
          </Card>
        </div>

        <CustomerReportsTable
          reports={tableReports}
          totalReports={filteredReportsCount}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      </section>
    </main>
  );
}
