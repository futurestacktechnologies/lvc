"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { AlertCircle, CalendarDays, Eye, FileText } from "lucide-react";

import CustomerReportRequestFilters from "@/components/dashboard/CustomerReportRequestFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ReportRequestStatusValue =
  | "NEW"
  | "PROCESSING"
  | "COMPLETED"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

type CustomerReportRequestRow = {
  id: string;
  requestNumber: string;
  vehicleIdentifier: string;
  lotNumber: string | null;
  auctionDate: string | null;
  auctionPlatform: string | null;
  status: ReportRequestStatusValue;
  createdAt: string;

  latestReportTitle: string | null;
  latestReportUrl: string | null;
  rejectionReason: string | null;
};

type CustomerReportRequestsTableProps = {
  requests: CustomerReportRequestRow[];
  totalRequests: number;
  currentPage: number;
  pageSize: number;
};

export default function CustomerReportRequestsTable({
  requests,
  totalRequests,
  currentPage,
  pageSize,
}: CustomerReportRequestsTableProps) {
  const totalPages = Math.max(Math.ceil(totalRequests / pageSize), 1);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildPageHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));

    const queryString = params.toString();

    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  return (
    <div className="rounded-[2rem] border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5">
        <CustomerReportRequestFilters />
      </div>

      {requests.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-brand">
            <FileText className="h-7 w-7" />
          </div>

          <p className="mt-5 font-semibold text-foreground">
            No report requests found
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or status filter.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {requests.map((request) => (
            <div key={request.id} className="p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-foreground">
                      {request.vehicleIdentifier}
                    </p>

                    <RequestStatusBadge status={request.status} />
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Request No: {request.requestNumber}
                  </p>

                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                    <span>Lot: {request.lotNumber || "Not provided"}</span>
                    <span>
                      Platform: {request.auctionPlatform || "Not provided"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {request.auctionDate
                        ? new Date(request.auctionDate).toLocaleDateString(
                            "en-LK",
                          )
                        : "No auction date"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {request.status === "DELIVERED" &&
                    request.latestReportUrl && (
                      <a
                        href={request.latestReportUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button
                          type="button"
                          size="sm"
                          className="cursor-pointer rounded-xl"
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          View PDF
                        </Button>
                      </a>
                    )}

                  <Link href={`/dashboard/report-requests/${request.id}`}>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer rounded-xl"
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>

              {request.status === "DELIVERED" && request.latestReportTitle && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Report delivered
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.latestReportTitle}
                  </p>
                </div>
              )}

              {request.status === "REJECTED" && request.rejectionReason && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600" />

                    <div>
                      <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                        Request rejected
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {request.rejectionReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} • {totalRequests} request
          {totalRequests !== 1 ? "s" : ""}
        </p>

        <div className="flex items-center gap-2">
          <PaginationButton
            label="Previous"
            href={buildPageHref(currentPage - 1)}
            disabled={currentPage <= 1}
          />

          <PaginationButton
            label="Next"
            href={buildPageHref(currentPage + 1)}
            disabled={currentPage >= totalPages}
          />
        </div>
      </div>
    </div>
  );
}

function PaginationButton({
  label,
  href,
  disabled,
}: {
  label: string;
  href: string;
  disabled: boolean;
}) {
  return (
    <Link
      href={disabled ? "#" : href}
      aria-disabled={disabled}
      className={disabled ? "pointer-events-none opacity-50" : ""}
    >
      <Button type="button" size="sm" variant="outline" className="rounded-xl">
        {label}
      </Button>
    </Link>
  );
}

function RequestStatusBadge({ status }: { status: ReportRequestStatusValue }) {
  if (status === "NEW") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
        NEW
      </Badge>
    );
  }

  if (status === "PROCESSING") {
    return (
      <Badge className="border-sky-200 bg-sky-50 text-sky-700 ring-1 ring-sky-500/30 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400">
        PROCESSING
      </Badge>
    );
  }

  if (status === "COMPLETED") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        COMPLETED
      </Badge>
    );
  }

  if (status === "DELIVERED") {
    return (
      <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/30 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400">
        DELIVERED
      </Badge>
    );
  }

  if (status === "REJECTED" || status === "CANCELLED") {
    return (
      <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
        {status}
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
}
