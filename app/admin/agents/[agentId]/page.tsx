import type React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MapPin,
  Pencil,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AgentPayoutButton from "@/components/admin/AgentPayoutButton";
import AgentCommissionFilters from "@/components/admin/AgentCommissionFilters";

import { prisma } from "@/lib/prisma/client";
import { AgentStatus, AgentCommissionStatus, Prisma } from "@/generated/prisma";

type AgentDetailsPageProps = {
  params: Promise<{
    agentId: string;
  }>;
  searchParams: Promise<{
    commissionRange?: string;
    from?: string;
    to?: string;
  }>;
};

type CommissionRange =
  | "all"
  | "this-month"
  | "last-month"
  | "last-3-months"
  | "custom";

function getCommissionDateRange(
  range: CommissionRange,
  from?: string,
  to?: string,
) {
  const now = new Date();

  // All time
  if (range === "all") {
    return undefined;
  }

  // This month
  if (range === "this-month") {
    return {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
      lte: now,
    };
  }

  // Previous calendar month
  if (range === "last-month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return {
      gte: start,
      lte: end,
    };
  }

  // Current month + previous two months
  if (range === "last-3-months") {
    return {
      gte: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      lte: now,
    };
  }

  // Custom
  if (range === "custom" && from && to) {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59.999`);

    if (start <= end) {
      return {
        gte: start,
        lte: end,
      };
    }
  }

  return undefined;
}

export default async function AgentDetailsPage({
  params,
  searchParams,
}: AgentDetailsPageProps) {
  const { agentId } = await params;
  const filters = await searchParams;

  const commissionRange: CommissionRange =
    filters.commissionRange === "this-month" ||
    filters.commissionRange === "last-month" ||
    filters.commissionRange === "last-3-months" ||
    filters.commissionRange === "custom"
      ? filters.commissionRange
      : "all";

  const commissionDateRange = getCommissionDateRange(
    commissionRange,
    filters.from,
    filters.to,
  );

  const agent = await prisma.agent.findUnique({
    where: {
      id: agentId,
    },
    include: {
      customers: {
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          phoneVerified: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      _count: {
        select: {
          customers: true,
        },
      },
    },
  });

  if (!agent) {
    notFound();
  }

  const commissionWhere: Prisma.AgentCommissionWhereInput = {
    agentId: agent.id,

    status: {
      in: [AgentCommissionStatus.PENDING, AgentCommissionStatus.PAID],
    },

    ...(commissionDateRange
      ? {
          createdAt: commissionDateRange,
        }
      : {}),
  };

  const [
    commissionSummary,
    paidCommissionSummary,
    pendingCommissionSummary,
    allPendingCommissionSummary,
    commissions,
  ] = await Promise.all([
    // Filtered summary
    prisma.agentCommission.aggregate({
      where: commissionWhere,
      _sum: {
        paymentAmount: true,
        commissionAmount: true,
      },
      _count: {
        _all: true,
      },
    }),

    // Filtered paid
    prisma.agentCommission.aggregate({
      where: {
        ...commissionWhere,
        status: "PAID",
      },
      _sum: {
        commissionAmount: true,
      },
    }),

    // Filtered pending
    prisma.agentCommission.aggregate({
      where: {
        ...commissionWhere,
        status: "PENDING",
      },
      _sum: {
        commissionAmount: true,
      },
    }),

    // ALL pending — used for actual payout
    prisma.agentCommission.aggregate({
      where: {
        agentId: agent.id,
        status: "PENDING",
      },
      _sum: {
        commissionAmount: true,
      },
    }),

    // Filtered history
    prisma.agentCommission.findMany({
      where: commissionWhere,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        payment: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  const totalPayments = commissionSummary._sum?.paymentAmount ?? 0;

  const totalCommission = commissionSummary._sum?.commissionAmount ?? 0;

  const paidCommission = paidCommissionSummary._sum?.commissionAmount ?? 0;

  const pendingCommission =
    pendingCommissionSummary._sum?.commissionAmount ?? 0;

  const allPendingCommission =
    allPendingCommissionSummary._sum?.commissionAmount ?? 0;

  const commissionTransactionCount = commissions.length;

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/admin/agents">
            <Button
              variant="outline"
              size="icon"
              className="mt-1 h-10 w-10 cursor-pointer rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <UserRound className="h-5 w-5 text-brand" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {agent.name}
              </h1>

              <AgentStatusBadge status={agent.status} />
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Agent profile, referral activity, commission earnings and
              verification information.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-xs font-semibold text-brand">
                {agent.promoCode}
              </span>

              <span className="text-xs text-muted-foreground">
                Agent ID: {agent.id}
              </span>
            </div>
          </div>
        </div>

        <Link href={`/admin/agents/${agent.id}/edit`}>
          <Button className="h-10 cursor-pointer rounded-xl px-4">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Agent
          </Button>
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Customers"
          value={agent._count.customers}
          icon={<UsersRound className="h-5 w-5 text-brand" />}
        />

        <SummaryCard
          title="Payment Volume"
          value={`LKR ${totalPayments.toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<FileText className="h-5 w-5 text-brand" />}
        />

        <SummaryCard
          title="Total Commission"
          value={`LKR ${totalCommission.toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<span className="font-mono font-bold text-brand">%</span>}
        />

        <SummaryCard
          title="Pending Commission"
          value={`LKR ${pendingCommission.toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<span className="font-mono font-bold text-amber-500">%</span>}
        />
      </div>

      {/* AGENT INFORMATION */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>

          <p className="text-sm text-muted-foreground">
            Basic information and referral details for this agent.
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <InfoItem
              icon={<UserRound className="h-4 w-4" />}
              label="Agent Name"
              value={agent.name}
            />

            <InfoItem
              icon={<Phone className="h-4 w-4" />}
              label="Mobile Number"
              value={agent.mobile}
              href={`https://wa.me/${agent.mobile.replace(/\D/g, "")}`}
            />

            <InfoItem
              icon={<MapPin className="h-4 w-4" />}
              label="Address"
              value={agent.address}
            />

            <InfoItem
              icon={<span className="font-mono text-xs">%</span>}
              label="Promo Code"
              value={agent.promoCode}
              mono
            />

            <InfoItem
              icon={<FileText className="h-4 w-4" />}
              label="Created"
              value={agent.createdAt.toLocaleString("en-LK")}
            />

            <InfoItem
              icon={<FileText className="h-4 w-4" />}
              label="Last Updated"
              value={agent.updatedAt.toLocaleString("en-LK")}
            />
          </div>
        </CardContent>
      </Card>

      {/* COMMISSION SUMMARY */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-xl">Commission Summary</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Commission is calculated at 5% from qualifying payments made by
                customers referred by this agent.
              </p>
            </div>

            <Badge variant="secondary" className="w-fit rounded-xl px-3 py-1">
              5% Commission
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <AgentCommissionFilters
            range={commissionRange}
            from={filters.from}
            to={filters.to}
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <CommissionItem
              label="Transactions"
              value={commissionTransactionCount.toString()}
            />

            <CommissionItem
              label="Payment Volume"
              value={`LKR ${totalPayments.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            />

            <CommissionItem
              label="Total Commission"
              value={`LKR ${totalCommission.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              highlight
            />

            <CommissionItem
              label="Paid Commission"
              value={`LKR ${paidCommission.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              success
            />

            <CommissionItem
              label="Pending Commission"
              value={`LKR ${pendingCommission.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              warning
            />
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">
              Showing commission for
            </span>

            <span className="font-semibold text-foreground">
              {getCommissionRangeLabel(
                commissionRange,
                filters.from,
                filters.to,
              )}
            </span>
          </div>

          <div className="flex justify-end">
            <AgentPayoutButton
              agentId={agent.id}
              agentName={agent.name}
              pendingAmount={allPendingCommission}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Commission History</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Commission earned from payments made by this agent&apos;s
                referred customers.
              </p>
            </div>

            <Badge variant="secondary">5% Commission</Badge>
          </div>
        </CardHeader>

        <CardContent>
          {commissions.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold">
                      Payment
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Payment Amount
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">Rate</th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Commission
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {commissions.map((commission) => (
                    <tr
                      key={commission.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            {commission.payment.paymentNumber}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {commission.payment.status}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {commission.customer.name}
                          </p>

                          <a
                            href={`https://wa.me/${commission.customer.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground transition hover:text-brand"
                          >
                            {commission.customer.phone}
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-medium">
                        LKR{" "}
                        {commission.paymentAmount.toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td className="px-4 py-4">
                        {(commission.commissionRate * 100).toFixed(0)}%
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-semibold text-brand">
                          LKR{" "}
                          {commission.commissionAmount.toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <CommissionStatusBadge status={commission.status} />
                      </td>

                      <td className="px-4 py-4 text-muted-foreground">
                        {commission.createdAt.toLocaleDateString("en-LK")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-semibold">
                No commission earned yet
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Commission will appear here when a referred customer makes a
                verified payment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VERIFICATION DOCUMENT */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Document</CardTitle>

          <p className="text-sm text-muted-foreground">
            Agent NIC or Driving Licence document.
          </p>
        </CardHeader>

        <CardContent>
          {agent.nicDlUrl && agent.nicDlFileName ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <FileText className="h-5 w-5 text-brand" />
                </div>

                <div>
                  <p className="text-sm font-semibold">{agent.nicDlFileName}</p>

                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {agent.nicDlFileType && <span>{agent.nicDlFileType}</span>}

                    {agent.nicDlFileSize && (
                      <>
                        <span>•</span>

                        <span>
                          {(agent.nicDlFileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href={`/api/admin/agents/${agent.id}/document/view`}
                target="_blank"
              >
                <Button variant="outline" className="cursor-pointer rounded-xl">
                  <FileText className="mr-2 h-4 w-4" />
                  View Document
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-semibold">
                No verification document uploaded
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Upload the agent&apos;s NIC or Driving Licence from the edit
                page.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* REFERRED CUSTOMERS */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Referred Customers</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Customers registered using this agent&apos;s referral code.
              </p>
            </div>

            <Badge variant="secondary">
              {agent._count.customers} Customers
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {agent.customers.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">Phone</th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Phone Verified
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Registered
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {agent.customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {customer.name}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {customer.id}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <a
                          href={`https://wa.me/${customer.phone.replace(
                            /\D/g,
                            "",
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-muted-foreground transition hover:text-brand"
                        >
                          {customer.phone}
                        </a>
                      </td>

                      <td className="px-4 py-4">
                        <Badge variant="outline">{customer.status}</Badge>
                      </td>

                      <td className="px-4 py-4">
                        {customer.phoneVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not Verified
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-muted-foreground">
                        {customer.createdAt.toLocaleDateString("en-LK")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-semibold">
                No referred customers yet
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Customers using this agent&apos;s promo code will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-6 pt-6">
        <span className="text-sm font-medium text-foreground">{title}</span>

        {icon}
      </div>

      <div className="px-6 pb-6 pt-2">
        <div className="truncate text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

function CommissionItem({
  label,
  value,
  highlight = false,
  success = false,
  warning = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  success?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 transition",
        highlight
          ? "border-brand/30 bg-brand/5"
          : success
            ? "border-emerald-500/20 bg-emerald-500/5"
            : warning
              ? "border-amber-500/20 bg-amber-500/5"
              : "border-border bg-muted/20",
      ].join(" ")}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <p
        className={[
          "mt-2 text-xl font-bold",
          highlight
            ? "text-brand"
            : success
              ? "text-emerald-600 dark:text-emerald-400"
              : warning
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  href,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-brand">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>

        <p
          className={`mt-1 break-words text-sm font-semibold text-foreground ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl transition hover:bg-muted/50"
    >
      {content}
    </a>
  );
}

function getCommissionRangeLabel(
  range: CommissionRange,
  from?: string,
  to?: string,
) {
  if (range === "this-month") {
    return "This Month";
  }

  if (range === "last-month") {
    return "Last Month";
  }

  if (range === "last-3-months") {
    return "Last 3 Months";
  }

  if (range === "custom" && from && to) {
    return `${from} → ${to}`;
  }

  return "All Time";
}

function CommissionStatusBadge({ status }: { status: string }) {
  if (status === "PAID") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        PAID
      </Badge>
    );
  }

  if (status === "PENDING") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
        PENDING
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
}

function AgentStatusBadge({ status }: { status: AgentStatus }) {
  if (status === AgentStatus.ACTIVE) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        ACTIVE
      </Badge>
    );
  }

  if (status === AgentStatus.BLOCKED) {
    return (
      <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
        BLOCKED
      </Badge>
    );
  }

  return (
    <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
      INACTIVE
    </Badge>
  );
}
