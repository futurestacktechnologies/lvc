"use client";

import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import AdminDataTable, {
  type AdminDataTableColumn,
} from "@/components/admin/AdminDataTable";
import ReportRequestTableControls from "@/components/admin/ReportRequestTableControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ReportRequestStatusValue =
  | "NEW"
  | "PROCESSING"
  | "COMPLETED"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

type AdminReportRequestRow = {
  id: string;
  requestNumber: string;
  customerName: string;
  customerPhone: string;
  vehicleIdentifier: string;
  lotNumber: string | null;
  auctionDate: string | null;
  auctionPlatform: string | null;
  status: ReportRequestStatusValue;
  createdAt: string;
};

type AdminReportRequestsTableProps = {
  requests: AdminReportRequestRow[];
  totalRequests: number;
  currentPage: number;
  pageSize: number;
};

export default function AdminReportRequestsTable({
  requests,
  totalRequests,
  currentPage,
  pageSize,
}: AdminReportRequestsTableProps) {
  const columns: AdminDataTableColumn<AdminReportRequestRow>[] = [
    {
      id: "requestNumber",
      header: "Request #",
      cell: (request) => (
        <span className="font-medium">{request.requestNumber}</span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: (request) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {request.customerName}
          </span>

          <a
            href={`https://wa.me/${request.customerPhone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-brand"
          >
            {request.customerPhone}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ),
    },
    {
      id: "vehicle",
      header: "Vehicle",
      cell: (request) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {request.vehicleIdentifier}
          </span>

          {request.lotNumber && (
            <span className="text-xs text-muted-foreground">
              Lot: {request.lotNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "auction",
      header: "Auction",
      cell: (request) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {request.auctionPlatform || "Not provided"}
          </span>

          <span className="text-xs text-muted-foreground">
            {request.auctionDate
              ? new Date(request.auctionDate).toLocaleDateString("en-LK")
              : "No auction date"}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (request) => <ReportRequestStatusBadge status={request.status} />,
    },
    {
      id: "created",
      header: "Created",
      cell: (request) => (
        <span className="text-sm text-muted-foreground">
          {new Date(request.createdAt).toLocaleDateString("en-LK")}
        </span>
      ),
    },
  ];

  return (
    <AdminDataTable
      rows={requests}
      columns={columns}
      totalRows={totalRequests}
      currentPage={currentPage}
      pageSize={pageSize}
      controls={<ReportRequestTableControls />}
      emptyTitle="No report requests match your filters"
      emptyDescription="Try adjusting your search or status filter."
      renderActions={(request) => (
        <Link href={`/admin/report-requests/${request.id}`}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View
          </Button>
        </Link>
      )}
    />
  );
}

function ReportRequestStatusBadge({
  status,
}: {
  status: ReportRequestStatusValue;
}) {
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
