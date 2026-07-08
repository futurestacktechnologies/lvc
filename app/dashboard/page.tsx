import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Clock3,
  CreditCard,
  FileText,
  Package,
  Phone,
  UserRound,
  ArrowLeft,
  Eye,
  AlertCircle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import { ReportRequestStatus, ReportStatus } from "@/generated/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [userPackages, recentRequests, totalRequests] = await Promise.all([
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
      take: 5,
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
  ]);

  const totalRemainingRequests = userPackages.reduce((total, userPackage) => {
    if (userPackage.status !== "ACTIVE") {
      return total;
    }

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
          request.status === ReportRequestStatus.REJECTED
            ? request.messages[0]?.message || null
            : null,
      };
    }),
  );

  return (
    <main className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Customer Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Welcome, {user.name}
            </h1>
          </div>
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3">
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <Link href="/admin">
                <Button variant="default">Admin Dashboard</Button>
              </Link>
            )}
            <Link href="/dashboard/reports">
              <Button variant="outline" className="cursor-pointer">
                My Reports
              </Button>
            </Link>

            <form action="/api/auth/logout" method="POST">
              <Button
                type="submit"
                variant="outline"
                className="cursor-pointer"
              >
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Account Status
              </CardTitle>
              <UserRound className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.status}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Phone verified account
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Remaining Requests
              </CardTitle>
              <Package className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRemainingRequests}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Available from active packages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Pending Payments
              </CardTitle>
              <Clock3 className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Waiting for admin verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <FileText className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Reports requested so far
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold text-foreground">{user.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Mobile Number</p>
                <div className="mt-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-brand" />
                  <p className="font-semibold text-foreground">{user.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge className="mt-1">{user.role}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Payment Packages</CardTitle>
            </CardHeader>

            <CardContent>
              {userPackages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                  <p className="font-semibold text-foreground">
                    No package selected yet
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Select a payment plan to start requesting vehicle reports.
                  </p>

                  <Link href="/payment-plans">
                    <Button className="mt-5 cursor-pointer">
                      View Payment Plans
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPackages.map((userPackage) => {
                    const latestPayment = userPackage.payments[0];

                    return (
                      <div
                        key={userPackage.id}
                        className="rounded-2xl border border-border p-4"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div>
                            <p className="font-semibold text-foreground">
                              {userPackage.plan.name}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Package No: {userPackage.packageNumber}
                            </p>
                          </div>

                          <PackageStatusBadge status={userPackage.status} />
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
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

                  <Link href="/payment-plans">
                    <Button variant="outline" className="mt-2 cursor-pointer">
                      Buy Another Package
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recent Report Requests</CardTitle>
                <Link
                  href="/dashboard/report-requests"
                  className="mt-1 inline-flex text-sm font-medium text-brand hover:underline"
                >
                  View all requests
                </Link>
              </div>

              {totalRemainingRequests > 0 ? (
                <Link href="/dashboard/report-requests/new">
                  <Button size="sm" className="cursor-pointer rounded-xl">
                    New Report
                  </Button>
                </Link>
              ) : (
                <Link href="/payment-plans">
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer rounded-xl"
                  >
                    Buy a Package
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="font-semibold text-foreground">
                  No report requests yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your vehicle report requests will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequestsWithReports.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-border p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <p className="font-semibold text-foreground">
                          {request.vehicleIdentifier}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Request No: {request.requestNumber}
                        </p>

                        {request.auctionPlatform && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Auction Platform: {request.auctionPlatform}
                          </p>
                        )}
                      </div>

                      <RequestStatusBadge status={request.status} />
                    </div>

                    {request.status === ReportRequestStatus.DELIVERED &&
                      request.latestReport &&
                      request.signedReportUrl && (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            Report Delivered
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {request.latestReport.title}
                          </p>

                          <a
                            href={request.signedReportUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex"
                          >
                            <Button
                              size="sm"
                              className="cursor-pointer rounded-xl"
                            >
                              <Eye className="mr-1.5 h-4 w-4" />
                              View PDF Report
                            </Button>
                          </a>
                        </div>
                      )}

                    {request.status === ReportRequestStatus.REJECTED &&
                      request.rejectionReason && (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600" />

                            <div>
                              <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                                Request Rejected
                              </p>

                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {request.rejectionReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    <div className="mt-4 flex justify-end">
                      <Link href={`/dashboard/report-requests/${request.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer rounded-xl"
                        >
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function PackageStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PackageStatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ");

  if (status === "ACTIVE") {
    return <Badge className="bg-success text-white">{label}</Badge>;
  }

  if (status === "PENDING_PAYMENT") {
    return <Badge className="bg-warning text-white">{label}</Badge>;
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
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
        NEW
      </Badge>
    );
  }

  if (status === ReportRequestStatus.PROCESSING) {
    return (
      <Badge className="border-sky-200 bg-sky-50 text-sky-700 ring-1 ring-sky-500/30 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400">
        PROCESSING
      </Badge>
    );
  }

  if (status === ReportRequestStatus.COMPLETED) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        COMPLETED
      </Badge>
    );
  }

  if (status === ReportRequestStatus.DELIVERED) {
    return (
      <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/30 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400">
        DELIVERED
      </Badge>
    );
  }

  if (
    status === ReportRequestStatus.REJECTED ||
    status === ReportRequestStatus.CANCELLED
  ) {
    return (
      <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
        {status}
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
}
