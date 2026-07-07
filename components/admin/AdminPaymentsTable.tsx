"use client";

import { CheckCircle2, ExternalLink, ShieldCheck, XCircle } from "lucide-react";

import ActionConfirmDialog from "@/components/common/ActionConfirmDialog";
import AdminDataTable, {
  type AdminDataTableColumn,
} from "@/components/admin/AdminDataTable";
import PaymentTableControls from "@/components/admin/PaymentTableControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PaymentStatusValue =
  | "PENDING"
  | "PROOF_UPLOADED"
  | "VERIFIED"
  | "PAID"
  | "REJECTED"
  | "FAILED"
  | "REFUNDED";

type PaymentMethodValue = "BANK_TRANSFER" | "ONLINE_GATEWAY";

type AdminPaymentRow = {
  id: string;
  paymentNumber: string;
  customerName: string;
  customerPhone: string;
  planName: string;
  requestCredits: number;
  method: PaymentMethodValue;
  amount: number;
  currency: string;
  status: PaymentStatusValue;
  proofUrl: string | null;
  verifiedByName: string | null;
};

type AdminPaymentsTableProps = {
  payments: AdminPaymentRow[];
  totalPayments: number;
  currentPage: number;
  pageSize: number;
};

export default function AdminPaymentsTable({
  payments,
  totalPayments,
  currentPage,
  pageSize,
}: AdminPaymentsTableProps) {
  const columns: AdminDataTableColumn<AdminPaymentRow>[] = [
    {
      id: "paymentNumber",
      header: "Payment #",
      cell: (payment) => (
        <span className="font-medium">{payment.paymentNumber}</span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: (payment) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {payment.customerName}
          </span>

          <a
            href={`https://wa.me/${payment.customerPhone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-brand"
          >
            {payment.customerPhone}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ),
    },
    {
      id: "package",
      header: "Package",
      cell: (payment) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{payment.planName}</span>
          <span className="text-xs text-muted-foreground">
            {payment.requestCredits} requests
          </span>
        </div>
      ),
    },
    {
      id: "method",
      header: "Method",
      cell: (payment) => <PaymentMethodBadge method={payment.method} />,
    },
    {
      id: "amount",
      header: "Amount",
      cell: (payment) => (
        <span className="font-semibold">
          {payment.currency} {payment.amount.toLocaleString()}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (payment) => <PaymentStatusBadge status={payment.status} />,
    },
    {
      id: "proof",
      header: "Proof",
      cell: (payment) =>
        payment.proofUrl ? (
          <a
            href={payment.proofUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-brand hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            View
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">No file</span>
        ),
    },
  ];

  return (
    <AdminDataTable
      rows={payments}
      columns={columns}
      totalRows={totalPayments}
      currentPage={currentPage}
      pageSize={pageSize}
      controls={<PaymentTableControls />}
      emptyTitle="No payments match your filters"
      emptyDescription="Try adjusting your filter criteria."
      renderActions={(payment) =>
        payment.status === "PROOF_UPLOADED" ? (
          <>
            <ActionConfirmDialog
              title="Approve this payment?"
              description={`Are you sure you want to approve ${payment.paymentNumber}? This will activate the customer's selected package.`}
              confirmLabel="Yes, Approve"
              confirmVariant="default"
              actionUrl={`/api/admin/payments/${payment.id}/verify`}
              successTitle="Payment approved"
              successDescription={`${payment.paymentNumber} has been approved successfully.`}
              errorTitle="Approve failed"
              icon={<ShieldCheck className="h-6 w-6" />}
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="cursor-pointer border-success text-success hover:bg-success/10"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Approve
                </Button>
              }
            />

            <ActionConfirmDialog
              title="Reject this payment?"
              description={`Are you sure you want to reject ${payment.paymentNumber}? The customer's package will not be activated.`}
              confirmLabel="Yes, Reject"
              confirmVariant="destructive"
              actionUrl={`/api/admin/payments/${payment.id}/reject`}
              successTitle="Payment rejected"
              successDescription={`${payment.paymentNumber} has been rejected.`}
              errorTitle="Reject failed"
              icon={<XCircle className="h-6 w-6" />}
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Reject
                </Button>
              }
            />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            {payment.verifiedByName
              ? `by ${payment.verifiedByName}`
              : "No action"}
          </span>
        )
      }
    />
  );
}

function PaymentMethodBadge({ method }: { method: PaymentMethodValue }) {
  if (method === "BANK_TRANSFER") {
    return <Badge variant="outline">BANK</Badge>;
  }

  return <Badge className="bg-secondary text-secondary-foreground">CARD</Badge>;
}

function PaymentStatusBadge({ status }: { status: PaymentStatusValue }) {
  const labelMap: Record<PaymentStatusValue, string> = {
    PROOF_UPLOADED: "PENDING",
    VERIFIED: "VERIFIED",
    PAID: "PAID",
    REJECTED: "REJECTED",
    FAILED: "FAILED",
    PENDING: "PENDING",
    REFUNDED: "REFUNDED",
  };

  const label = labelMap[status] || status;

  if (status === "VERIFIED" || status === "PAID") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        {label}
      </Badge>
    );
  }

  if (status === "PROOF_UPLOADED" || status === "PENDING") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
        {label}
      </Badge>
    );
  }

  if (status === "REJECTED" || status === "FAILED") {
    return (
      <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
        {label}
      </Badge>
    );
  }

  return <Badge variant="outline">{label}</Badge>;
}
