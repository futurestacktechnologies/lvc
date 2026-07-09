import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  Package,
  Phone,
  PlusCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import { ReportRequestStatus, ReportStatus } from "@/generated/prisma";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [
    userPackages,
    recentRequests,
    totalRequests,
    deliveredReports,
    unreadUpdates,
  ] = await Promise.all([
    prisma.userPackage.findMany({
      where: {
        userId: user.id,
      },
      include: {
        plan: true,
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.reportRequest.findMany({
      where: {
        customerId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
      include: {
        reports: {
          where: {
            status: ReportStatus.ACTIVE,
          },
          orderBy: {
            uploadedAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            title: true,
            fileUrl: true,
            fileName: true,
            uploadedAt: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            message: true,
            createdAt: true,
          },
        },
      },
    }),

    prisma.reportRequest.count({
      where: {
        customerId: user.id,
      },
    }),

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

    prisma.message.count({
      where: {
        isRead: false,
        senderId: {
          not: user.id,
        },
        request: {
          is: {
            customerId: user.id,
          },
        },
      },
    }),
  ]);

  const activePackages = userPackages.filter(
    (userPackage) => userPackage.status === "ACTIVE",
  );

  const totalRemainingRequests = activePackages.reduce((total, userPackage) => {
    return total + userPackage.remainingRequests;
  }, 0);

  const pendingPayments = userPackages.filter(
    (userPackage) => userPackage.status === "PENDING_PAYMENT",
  ).length;

  const recentRequestsWithReports = await Promise.all(
    recentRequests.map(async (request) => {
      const latestReport = request.reports[0] || null;

      let signedReportUrl: string | null = null;

      if (latestReport) {
        const signedUrlResult = await supabaseAdmin.storage
          .from(REPORT_BUCKET)
          .createSignedUrl(latestReport.fileUrl, 60 * 10);

        signedReportUrl = signedUrlResult.data?.signedUrl || null;
      }

      return {
        ...request,
        latestReport,
        signedReportUrl,
        rejectionReason:
          request.status === ReportRequestStatus.REJECTED ||
          request.status === ReportRequestStatus.CANCELLED
            ? request.messages[0]?.message || null
            : null,
      };
    }),
  );

  const latestActivePackage = activePackages[0] || null;

  return (
    <div className="space-y-8">
      <div className="relative p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-brand">
              Customer Dashboard
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Welcome back, {user.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Manage your Japanese vehicle report requests, track report
              preparation status, and access delivered PDF reports from one
              simple dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {totalRemainingRequests > 0 ? (
              <Link href="/dashboard/report-requests/new">
                <Button className="h-11 cursor-pointer rounded-2xl">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Report Request
                </Button>
              </Link>
            ) : (
              <Link href="/payment-plans">
                <Button className="h-11 cursor-pointer rounded-2xl">
                  <Package className="mr-2 h-4 w-4" />
                  Buy Package
                </Button>
              </Link>
            )}

            <Link href="/dashboard/reports">
              <Button
                variant="outline"
                className="h-11 cursor-pointer rounded-2xl"
              >
                <FileText className="mr-2 h-4 w-4" />
                My Reports
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Remaining Credits"
          value={totalRemainingRequests}
          description="Available report requests"
          icon={<Package className="h-5 w-5" />}
        />

        <DashboardStatCard
          title="Total Requests"
          value={totalRequests}
          description="All submitted requests"
          icon={<FileText className="h-5 w-5" />}
        />

        <DashboardStatCard
          title="Delivered Reports"
          value={deliveredReports}
          description="Ready PDF reports"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <DashboardStatCard
          title="Pending Payments"
          value={pendingPayments}
          description="Waiting admin approval"
          icon={<Clock3 className="h-5 w-5" />}
          warning={pendingPayments > 0}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[2rem] xl:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Quick Actions</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Common actions for your account
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-3">
            <QuickActionCard
              title="Submit New Request"
              description="Use chassis number or auction lot details."
              href="/dashboard/report-requests/new"
              icon={<PlusCircle className="h-5 w-5" />}
            />

            <QuickActionCard
              title="Track Requests"
              description="View request status and admin updates."
              href="/dashboard/report-requests"
              icon={<ShieldCheck className="h-5 w-5" />}
            />

            <QuickActionCard
              title="View Reports"
              description="Open delivered PDF reports anytime."
              href="/dashboard/reports"
              icon={<FileText className="h-5 w-5" />}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Account Summary</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-brand">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.status} account
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Mobile Number</p>
              <div className="mt-1 flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand" />
                <p className="font-semibold text-foreground">{user.phone}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Unread Updates</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {unreadUpdates}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-[2rem] xl:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Active Package</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Current request credit balance
                </p>
              </div>

              <Link href="/payment-plans">
                <Button size="sm" variant="outline" className="rounded-xl">
                  Buy
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            {!latestActivePackage ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-brand">
                  <Package className="h-5 w-5" />
                </div>

                <p className="mt-4 font-semibold text-foreground">
                  No active package
                </p>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Buy a package to start submitting report requests.
                </p>

                <Link href="/payment-plans">
                  <Button className="mt-5 cursor-pointer rounded-xl">
                    View Packages
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-muted/30 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {latestActivePackage.plan.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {latestActivePackage.packageNumber}
                    </p>
                  </div>

                  <PackageStatusBadge status={latestActivePackage.status} />
                </div>

                <div className="mt-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-3xl font-bold text-foreground">
                        {latestActivePackage.remainingRequests}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      of {latestActivePackage.totalRequests}
                    </p>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: `${Math.max(
                          5,
                          Math.min(
                            100,
                            (latestActivePackage.remainingRequests /
                              latestActivePackage.totalRequests) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <PackageStat
                    label="Total"
                    value={latestActivePackage.totalRequests}
                  />
                  <PackageStat
                    label="Used"
                    value={latestActivePackage.usedRequests}
                  />
                  <PackageStat
                    label="Left"
                    value={latestActivePackage.remainingRequests}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] xl:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recent Report Requests</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Latest updates from your submitted requests
                </p>
              </div>

              <Link href="/dashboard/report-requests">
                <Button variant="outline" size="sm" className="rounded-xl">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            {recentRequestsWithReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-brand">
                  <FileText className="h-6 w-6" />
                </div>

                <p className="mt-5 font-semibold text-foreground">
                  No report requests yet
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Submit your first vehicle report request to get started.
                </p>

                <Link href="/dashboard/report-requests/new">
                  <Button className="mt-5 cursor-pointer rounded-xl">
                    New Report Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequestsWithReports.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-3xl border border-border bg-background p-4 transition hover:border-brand/30 hover:shadow-sm"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {getRequestDisplayName(request)}
                          </p>

                          <RequestStatusBadge status={request.status} />
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Request No: {request.requestNumber}
                        </p>

                        {request.auctionPlatform && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {request.auctionPlatform}
                            {request.lotNumber
                              ? ` • Lot ${request.lotNumber}`
                              : ""}
                          </p>
                        )}
                      </div>

                      <Link href={`/dashboard/report-requests/${request.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer rounded-xl"
                        >
                          Details
                        </Button>
                      </Link>
                    </div>

                    {request.status === ReportRequestStatus.DELIVERED &&
                      request.latestReport &&
                      request.signedReportUrl && (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                Report Delivered
                              </p>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {request.latestReport.title}
                              </p>
                            </div>

                            <a
                              href={request.signedReportUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button
                                size="sm"
                                className="cursor-pointer rounded-xl"
                              >
                                <Eye className="mr-1.5 h-4 w-4" />
                                View PDF
                              </Button>
                            </a>
                          </div>
                        </div>
                      )}

                    {(request.status === ReportRequestStatus.REJECTED ||
                      request.status === ReportRequestStatus.CANCELLED) &&
                      request.rejectionReason && (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600" />

                            <div>
                              <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                                Request Update
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
          </CardContent>
        </Card>
      </section>

      {userPackages.length > 0 && (
        <Card className="rounded-[2rem]">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Payment Packages</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your purchased packages and payment status
                </p>
              </div>

              <Link href="/payment-plans">
                <Button variant="outline" size="sm" className="rounded-xl">
                  Buy Another Package
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              {userPackages.slice(0, 4).map((userPackage) => {
                const latestPayment = userPackage.payments[0];

                return (
                  <div
                    key={userPackage.id}
                    className="rounded-3xl border border-border p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-semibold text-foreground">
                          {userPackage.plan.name}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {userPackage.packageNumber}
                        </p>
                      </div>

                      <PackageStatusBadge status={userPackage.status} />
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <PackageStat
                        label="Total"
                        value={userPackage.totalRequests}
                      />
                      <PackageStat
                        label="Used"
                        value={userPackage.usedRequests}
                      />
                      <PackageStat
                        label="Remaining"
                        value={
                          userPackage.status === "ACTIVE"
                            ? userPackage.remainingRequests
                            : 0
                        }
                      />
                    </div>

                    {latestPayment && (
                      <div className="mt-5 rounded-2xl bg-muted p-4">
                        <div className="flex items-start gap-3">
                          <CreditCard className="mt-0.5 h-5 w-5 text-brand" />

                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Payment Status
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {latestPayment.paymentNumber} —{" "}
                              {latestPayment.status.replaceAll("_", " ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardStatCard({
  title,
  value,
  description,
  icon,
  warning = false,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <Card className="rounded-[2rem]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              warning ? "bg-amber-50 text-amber-600" : "bg-secondary text-brand"
            }`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-border bg-background p-5 transition hover:border-brand/40 hover:shadow-sm"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-brand transition group-hover:bg-brand group-hover:text-white">
        {icon}
      </div>

      <p className="mt-4 font-semibold text-foreground">{title}</p>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      <div className="mt-4 inline-flex items-center text-sm font-semibold text-brand">
        Open
        <ArrowRight className="ml-1.5 h-4 w-4" />
      </div>
    </Link>
  );
}

function PackageStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold text-foreground">{value}</p>
    </div>
  );
}

function PackageStatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ");

  if (status === "ACTIVE") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30">
        {label}
      </Badge>
    );
  }

  if (status === "PENDING_PAYMENT") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30">
        {label}
      </Badge>
    );
  }

  if (status === "EXHAUSTED") {
    return <Badge variant="outline">{label}</Badge>;
  }

  if (status === "CANCELLED") {
    return <Badge variant="destructive">{label}</Badge>;
  }

  return <Badge variant="outline">{label}</Badge>;
}

function RequestStatusBadge({ status }: { status: ReportRequestStatus }) {
  if (status === ReportRequestStatus.NEW) {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30">
        NEW
      </Badge>
    );
  }

  if (status === ReportRequestStatus.PROCESSING) {
    return (
      <Badge className="border-sky-200 bg-sky-50 text-sky-700 ring-1 ring-sky-500/30">
        PROCESSING
      </Badge>
    );
  }

  if (status === ReportRequestStatus.COMPLETED) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30">
        COMPLETED
      </Badge>
    );
  }

  if (status === ReportRequestStatus.DELIVERED) {
    return (
      <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/30">
        DELIVERED
      </Badge>
    );
  }

  if (
    status === ReportRequestStatus.REJECTED ||
    status === ReportRequestStatus.CANCELLED
  ) {
    return (
      <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30">
        {status}
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
}

function getRequestDisplayName(request: {
  vehicleIdentifier: string;
  lotNumber: string | null;
}) {
  if (request.vehicleIdentifier) {
    return request.vehicleIdentifier;
  }

  if (request.lotNumber) {
    return `Lot ${request.lotNumber}`;
  }

  return "Vehicle request";
}
