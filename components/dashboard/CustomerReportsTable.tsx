"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  CalendarDays,
  Eye,
  FileText,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CustomerReportRow = {
  id: string;
  title: string;
  fileName: string | null;
  fileSize: number | null;
  uploadedAt: string;
  signedUrl: string | null;

  requestId: string;
  requestNumber: string;
  vehicleIdentifier: string;
  lotNumber: string | null;
  auctionPlatform: string | null;
};

type CustomerReportsTableProps = {
  reports: CustomerReportRow[];
  totalReports: number;
  currentPage: number;
  pageSize: number;
};

export default function CustomerReportsTable({
  reports,
  totalReports,
  currentPage,
  pageSize,
}: CustomerReportsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(Math.ceil(totalReports / pageSize), 1);

  const currentSearch = searchParams.get("q") || "";
  const [searchValue, setSearchValue] = useState(currentSearch);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasActiveSearch = currentSearch !== "";

  function buildUrl({
    q = currentSearch,
    page = currentPage,
    newPageSize = pageSize,
  }: {
    q?: string;
    page?: number;
    newPageSize?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }

    params.set("page", String(page));
    params.set("pageSize", String(newPageSize));

    const queryString = params.toString();

    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  function updateSearch(value: string) {
    setSearchValue(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      router.replace(
        buildUrl({
          q: value,
          page: 1,
        }),
        {
          scroll: false,
        },
      );
    }, 250);
  }

  function clearSearch() {
    setSearchValue("");

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    router.replace(
      buildUrl({
        q: "",
        page: 1,
      }),
      {
        scroll: false,
      },
    );
  }

  function updatePageSize(newPageSize: number) {
    router.push(
      buildUrl({
        q: searchValue,
        page: 1,
        newPageSize,
      }),
      {
        scroll: false,
      },
    );
  }

  function buildPageHref(page: number) {
    return buildUrl({
      q: currentSearch,
      page,
      newPageSize: pageSize,
    });
  }

  return (
    <div className="rounded-[2rem] border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-full xl:max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchValue}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search report, request, vehicle..."
              className="h-11 rounded-2xl pl-10 pr-10"
            />

            {searchValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows</span>

            {[5, 10, 20].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => updatePageSize(size)}
                className={`rounded-xl border px-3 py-1 text-xs font-semibold transition ${
                  pageSize === size
                    ? "border-brand bg-secondary text-brand"
                    : "border-border hover:bg-muted"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {hasActiveSearch && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSearch}
              className="h-10 rounded-2xl text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-brand">
            <FileText className="h-7 w-7" />
          </div>

          <p className="mt-5 font-semibold text-foreground">
            No delivered reports found
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Delivered PDF reports will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col rounded-2xl border border-border bg-background p-5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-brand">
                <FileText className="h-5 w-5" />
              </div>

              <div className="mt-4 flex-1">
                <p className="font-semibold text-foreground">{report.title}</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {report.fileName || "PDF report"}
                  {report.fileSize
                    ? ` • ${formatFileSize(report.fileSize)}`
                    : ""}
                </p>

                <div className="mt-4 space-y-2 rounded-2xl bg-muted/50 p-4">
                  <InfoRow label="Request No" value={report.requestNumber} />
                  <InfoRow label="Vehicle" value={report.vehicleIdentifier} />
                  <InfoRow
                    label="Lot"
                    value={report.lotNumber || "Not provided"}
                  />
                  <InfoRow
                    label="Platform"
                    value={report.auctionPlatform || "Not provided"}
                  />
                </div>

                <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Uploaded{" "}
                  {new Date(report.uploadedAt).toLocaleDateString("en-LK")}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {report.signedUrl ? (
                  <a href={report.signedUrl} target="_blank" rel="noreferrer">
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

                <Link href={`/dashboard/report-requests/${report.requestId}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer rounded-xl"
                  >
                    View Request
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} • {totalReports} report
          {totalReports !== 1 ? "s" : ""}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
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

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}
