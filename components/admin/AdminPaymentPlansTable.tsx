"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import ActionConfirmDialog from "@/components/common/ActionConfirmDialog";
import AdminDataTable, {
  type AdminDataTableColumn,
} from "@/components/admin/AdminDataTable";
import PaymentPlanFormDialog from "@/components/admin/PaymentPlanFormDialog";
import PaymentPlanTableControls from "@/components/admin/PaymentPlanTableControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AdminPaymentPlanRow = {
  id: string;
  code: string;
  name: string;
  price: number;
  currency: string;
  requestCredits: number;
  isActive: boolean;
  sortOrder: number;
  purchasesCount: number;
  paymentsCount: number;
  createdAt: string;
};

type AdminPaymentPlansTableProps = {
  plans: AdminPaymentPlanRow[];
  totalPlans: number;
  currentPage: number;
  pageSize: number;
};

export default function AdminPaymentPlansTable({
  plans,
  totalPlans,
  currentPage,
  pageSize,
}: AdminPaymentPlansTableProps) {
  const columns: AdminDataTableColumn<AdminPaymentPlanRow>[] = [
    {
      id: "plan",
      header: "Plan",
      cell: (plan) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{plan.name}</span>
          <span className="text-xs text-muted-foreground">{plan.code}</span>
        </div>
      ),
    },
    {
      id: "price",
      header: "Price",
      cell: (plan) => (
        <span className="font-semibold">
          {plan.currency} {plan.price.toLocaleString()}
        </span>
      ),
    },
    {
      id: "credits",
      header: "Credits",
      cell: (plan) => (
        <span className="text-sm font-medium">
          {plan.requestCredits} request
          {plan.requestCredits !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (plan) => <PaymentPlanStatusBadge isActive={plan.isActive} />,
    },
    {
      id: "usage",
      header: "Usage",
      cell: (plan) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {plan.purchasesCount} purchases
          </span>
          <span className="text-xs text-muted-foreground">
            {plan.paymentsCount} payments
          </span>
        </div>
      ),
    },
    {
      id: "sortOrder",
      header: "Sort",
      cell: (plan) => (
        <span className="text-sm text-muted-foreground">{plan.sortOrder}</span>
      ),
    },
    {
      id: "created",
      header: "Created",
      cell: (plan) => (
        <span className="text-sm text-muted-foreground">
          {new Date(plan.createdAt).toLocaleDateString("en-LK")}
        </span>
      ),
    },
  ];

  return (
    <AdminDataTable
      rows={plans}
      columns={columns}
      totalRows={totalPlans}
      currentPage={currentPage}
      pageSize={pageSize}
      controls={<PaymentPlanTableControls />}
      emptyTitle="No payment plans match your filters"
      emptyDescription="Try adjusting your search or status filter."
      renderActions={(plan) => (
        <>
          <PaymentPlanFormDialog mode="edit" plan={plan} />

          {plan.isActive ? (
            <ActionConfirmDialog
              title="Deactivate this payment plan?"
              description={`Are you sure you want to deactivate "${plan.name}"? Customers will no longer be able to select this plan, but old payments and packages will remain safe.`}
              confirmLabel="Yes, Deactivate"
              confirmVariant="destructive"
              actionUrl={`/api/admin/payment-plans/${plan.id}/status`}
              hiddenFields={{
                isActive: "false",
              }}
              successTitle="Plan deactivated"
              successDescription="Payment plan has been deactivated."
              errorTitle="Update failed"
              icon={<XCircle className="h-6 w-6" />}
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Deactivate
                </Button>
              }
            />
          ) : (
            <ActionConfirmDialog
              title="Activate this payment plan?"
              description={`Are you sure you want to activate "${plan.name}"? Customers will be able to select this plan.`}
              confirmLabel="Yes, Activate"
              confirmVariant="default"
              actionUrl={`/api/admin/payment-plans/${plan.id}/status`}
              hiddenFields={{
                isActive: "true",
              }}
              successTitle="Plan activated"
              successDescription="Payment plan has been activated."
              errorTitle="Update failed"
              icon={<CheckCircle2 className="h-6 w-6" />}
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="cursor-pointer border-success text-success hover:bg-success/10"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Activate
                </Button>
              }
            />
          )}
        </>
      )}
    />
  );
}

function PaymentPlanStatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        ACTIVE
      </Badge>
    );
  }

  return (
    <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
      INACTIVE
    </Badge>
  );
}
