"use client";

import Link from "next/link";
import { ExternalLink, Eye, FileText, Trash2 } from "lucide-react";

import ActionConfirmDialog from "@/components/common/ActionConfirmDialog";
import AdminDataTable, {
  type AdminDataTableColumn,
} from "@/components/admin/AdminDataTable";
import ReportTableControls from "@/components/admin/ReportTableControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ReportStatusValue = "ACTIVE" | "REPLACED" | "DELETED";

type AdminReportRow = {
  id: string;
  title: string;
  fileName: string | null;
  fileSize: number | null;
  status: ReportStatusValue;
  uploadedAt: string;
  signedUrl: string | null;

  requestId: string;
  requestNumber: string;
  vehicleIdentifier: string;

  customerName: string;
  customerPhone: string;

  uploadedByName: string | null;
  deletedByName: string | null;
};

type AdminReportsTableProps = {
  reports: AdminReportRow[];
  totalReports: number;
  currentPage: number;
  pageSize: number;
};

export default function AdminReportsTable({
  reports,
  totalReports,
  currentPage,
  pageSize,
}: AdminReportsTableProps) {
  const columns: AdminDataTableColumn<AdminReportRow>[] = [
    {
      id: "report",
      header: "Report",
      cell: (report) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{report.title}</span>
          <span className="text-xs text-muted-foreground">
            {report.fileName || "PDF report"}{" "}
            {report.fileSize ? `• ${formatFileSize(report.fileSize)}` : ""}
          </span>
        </div>
      ),
    },
    {
      id: "request",
      header: "Request",
      cell: (report) => (
        <div className="flex flex-col">
          <Link
            href={`/admin/report-requests/${report.requestId}`}
            className="font-medium text-brand hover:underline"
          >
            {report.requestNumber}
          </Link>
          <span className="text-xs text-muted-foreground">
            {report.vehicleIdentifier}
          </span>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: (report) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {report.customerName}
          </span>

          <a
            href={`https://wa.me/${report.customerPhone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-brand"
          >
            {report.customerPhone}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (report) => <ReportStatusBadge status={report.status} />,
    },
    {
      id: "uploadedBy",
      header: "Uploaded By",
      cell: (report) => (
        <span className="text-sm text-muted-foreground">
          {report.uploadedByName || "System / Unknown"}
        </span>
      ),
    },
    {
      id: "uploadedAt",
      header: "Uploaded",
      cell: (report) => (
        <span className="text-sm text-muted-foreground">
          {new Date(report.uploadedAt).toLocaleDateString("en-LK")}
        </span>
      ),
    },
  ];

  return (
    <AdminDataTable
      rows={reports}
      columns={columns}
      totalRows={totalReports}
      currentPage={currentPage}
      pageSize={pageSize}
      controls={<ReportTableControls />}
      emptyTitle="No reports match your filters"
      emptyDescription="Try adjusting your search or status filter."
      renderActions={(report) => (
        <>
          {report.signedUrl ? (
            <a href={report.signedUrl} target="_blank" rel="noreferrer">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="cursor-pointer"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                View PDF
              </Button>
            </a>
          ) : (
            <Button type="button" size="sm" variant="outline" disabled>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              No PDF
            </Button>
          )}

          <Link href={`/admin/report-requests/${report.requestId}`}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="cursor-pointer"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Request
            </Button>
          </Link>

          {report.status !== "DELETED" && (
            <ActionConfirmDialog
              title="Mark this report as deleted?"
              description={`Are you sure you want to mark "${report.title}" as deleted? The file will stay in storage, but it will no longer be treated as an active report.`}
              confirmLabel="Yes, Mark Deleted"
              confirmVariant="destructive"
              actionUrl={`/api/admin/reports/${report.id}/status`}
              hiddenFields={{
                status: "DELETED",
              }}
              successTitle="Report updated"
              successDescription="Report has been marked as deleted."
              errorTitle="Update failed"
              icon={<Trash2 className="h-6 w-6" />}
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              }
            />
          )}

          {report.status === "DELETED" && (
            <span className="text-xs text-muted-foreground">
              {report.deletedByName ? `by ${report.deletedByName}` : "Deleted"}
            </span>
          )}
        </>
      )}
    />
  );
}

function ReportStatusBadge({ status }: { status: ReportStatusValue }) {
  if (status === "ACTIVE") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        ACTIVE
      </Badge>
    );
  }

  if (status === "REPLACED") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
        REPLACED
      </Badge>
    );
  }

  if (status === "DELETED") {
    return (
      <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
        DELETED
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
}

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}
