import type React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Package,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma/client";
import { PaymentStatus, UserRole, UserStatus } from "@/generated/prisma";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminUserDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      phoneVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,

      agent: {
        select: {
          id: true,
          name: true,
          mobile: true,
          promoCode: true,
          status: true,
        },
      },

      packages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          packageNumber: true,
          totalRequests: true,
          usedRequests: true,
          remainingRequests: true,
          status: true,
          activatedAt: true,
          expiresAt: true,
          createdAt: true,

          plan: {
            select: {
              name: true,
              code: true,
              price: true,
              currency: true,
            },
          },
        },
      },

      payments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          currency: true,
          method: true,
          status: true,
          gatewayRef: true,
          createdAt: true,

          plan: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      },

      requests: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          requestNumber: true,
          vehicleIdentifier: true,
          lotNumber: true,
          auctionDate: true,
          auctionPlatform: true,
          status: true,
          createdAt: true,

          userPackage: {
            select: {
              packageNumber: true,
            },
          },

          _count: {
            select: {
              reports: true,
              messages: true,
            },
          },
        },
      },

      reports: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          fileUrl: true, // ✅ ADD THIS
          fileName: true,
          status: true,
          uploadedAt: true,
          createdAt: true,
          request: {
            select: {
              requestNumber: true,
              vehicleIdentifier: true,
            },
          },
        },
      },

      activityLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          action: true,
          description: true,
          createdAt: true,
        },
      },

      _count: {
        select: {
          requests: true,
          packages: true,
          payments: true,
          reports: true,
          notifications: true,
          activityLogs: true,
          messages: true,
          supportConversations: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl"
          >
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to users</span>
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>

            <p className="text-sm text-muted-foreground">
              User account details and activity
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <UserRoleBadge role={user.role} />
          <UserStatusBadge status={user.status} />
        </div>
      </div>

      {/* Profile */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-brand" />
              Profile Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <InfoItem label="Full Name" value={user.name} />

              <InfoItem
                label="Mobile Number"
                value={user.phone}
                icon={<Phone className="h-4 w-4" />}
              />

              <InfoItem label="User ID" value={user.id} />

              <InfoItem
                label="Phone Verification"
                value={user.phoneVerified ? "Verified" : "Not Verified"}
                icon={
                  user.phoneVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : undefined
                }
              />

              <InfoItem label="Created" value={formatDate(user.createdAt)} />

              <InfoItem
                label="Last Login"
                value={
                  user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand" />
              Account
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Role</p>

              <div className="mt-2">
                <UserRoleBadge role={user.role} />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Status
              </p>

              <div className="mt-2">
                <UserStatusBadge status={user.status} />
              </div>
            </div>

            {user.agent && (
              <div className="border-t border-border pt-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Assigned Agent
                </p>

                <p className="mt-1 font-semibold">{user.agent.name}</p>

                <p className="text-sm text-muted-foreground">
                  {user.agent.mobile}
                </p>

                <Badge variant="outline" className="mt-2">
                  {user.agent.promoCode}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Report Requests"
          value={user._count.requests}
          icon={<FileText className="h-5 w-5 text-brand" />}
        />

        <StatCard
          title="Packages"
          value={user._count.packages}
          icon={<Package className="h-5 w-5 text-brand" />}
        />

        <StatCard
          title="Payments"
          value={user._count.payments}
          icon={<CreditCard className="h-5 w-5 text-brand" />}
        />

        <StatCard
          title="Reports"
          value={user._count.reports}
          icon={<FileText className="h-5 w-5 text-brand" />}
        />
      </div>

      {/* Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-brand" />
            Recent Packages
          </CardTitle>
        </CardHeader>

        <CardContent>
          {user.packages.length === 0 ? (
            <EmptyState message="No packages found." />
          ) : (
            <div className="space-y-3">
              {user.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{pkg.plan.name}</p>

                      <PackageStatusBadge status={pkg.status} />
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {pkg.packageNumber}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <PackageMetric label="Total" value={pkg.totalRequests} />

                    <PackageMetric label="Used" value={pkg.usedRequests} />

                    <PackageMetric
                      label="Remaining"
                      value={pkg.remainingRequests}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-brand" />
            Recent Payments
          </CardTitle>
        </CardHeader>

        <CardContent>
          {user.payments.length === 0 ? (
            <EmptyState message="No payments found." />
          ) : (
            <div className="space-y-3">
              {user.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{payment.paymentNumber}</p>

                      <PaymentStatusBadge status={payment.status} />
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {payment.plan.name} · {payment.method}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="font-bold">
                      {formatMoney(payment.amount, payment.currency)}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand" />
            Recent Report Requests
          </CardTitle>
        </CardHeader>

        <CardContent>
          {user.requests.length === 0 ? (
            <EmptyState message="No report requests found." />
          ) : (
            <div className="space-y-3">
              {user.requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-border p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold">{request.requestNumber}</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {request.vehicleIdentifier}
                      </p>

                      {request.lotNumber && (
                        <p className="text-xs text-muted-foreground">
                          Lot: {request.lotNumber}
                        </p>
                      )}

                      {request.auctionPlatform && (
                        <p className="text-xs text-muted-foreground">
                          Platform: {request.auctionPlatform}
                        </p>
                      )}
                    </div>

                    <RequestStatusBadge status={request.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Created: {formatDate(request.createdAt)}</span>

                    <span>Reports: {request._count.reports}</span>

                    <span>Messages: {request._count.messages}</span>

                    {request.userPackage && (
                      <span>Package: {request.userPackage.packageNumber}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand" />
            Recent Reports
          </CardTitle>
        </CardHeader>

        <CardContent>
          {user.reports.length === 0 ? (
            <EmptyState message="No reports found." />
          ) : (
            <div className="space-y-3">
              {user.reports.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">{report.title}</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {report.request.requestNumber}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {report.request.vehicleIdentifier}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <ReportStatusBadge status={report.status} />

                    <a
                      href={report.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      View Report
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-brand" />
            Recent Activity
          </CardTitle>
        </CardHeader>

        <CardContent>
          {user.activityLogs.length === 0 ? (
            <EmptyState message="No activity recorded." />
          ) : (
            <div className="space-y-4">
              {user.activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />

                  <div className="min-w-0">
                    <p className="font-medium">{log.action}</p>

                    {log.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {log.description}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <div className="mt-1 flex items-center gap-2">
        {icon}

        <p className="break-all text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>

        {icon}
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function PackageMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

function UserRoleBadge({ role }: { role: UserRole }) {
  if (role === UserRole.SUPER_ADMIN) {
    return <Badge className="bg-brand text-white">SUPER ADMIN</Badge>;
  }

  if (role === UserRole.ADMIN) {
    return (
      <Badge className="bg-secondary text-secondary-foreground">ADMIN</Badge>
    );
  }

  return <Badge variant="outline">CUSTOMER</Badge>;
}

function UserStatusBadge({ status }: { status: UserStatus }) {
  if (status === UserStatus.ACTIVE) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        ACTIVE
      </Badge>
    );
  }

  if (status === UserStatus.BLOCKED) {
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

function PackageStatusBadge({ status }: { status: string }) {
  return <Badge variant="outline">{formatEnum(status)}</Badge>;
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    PROOF_UPLOADED: "border-blue-200 bg-blue-50 text-blue-700",
    VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
    PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
    FAILED: "border-rose-200 bg-rose-50 text-rose-700",
    REFUNDED: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return <Badge className={styles[status]}>{formatEnum(status)}</Badge>;
}

function RequestStatusBadge({ status }: { status: string }) {
  return <Badge variant="outline">{formatEnum(status)}</Badge>;
}

function ReportStatusBadge({ status }: { status: string }) {
  return <Badge variant="outline">{formatEnum(status)}</Badge>;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
