import {
  CreditCard,
  FileText,
  Package,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    pendingPayments,
    activePackages,
    totalReportRequests,
    completedReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.payment.count({ where: { status: "PROOF_UPLOADED" } }),
    prisma.userPackage.count({ where: { status: "ACTIVE" } }),
    prisma.reportRequest.count(),
    prisma.report.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <section className="mx-auto max-w-7xl">
      <div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Admin Overview
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor your platform activity, payments, users and report requests.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <AdminStatCard
            title="Total Users"
            value={totalUsers}
            icon={<UsersRound className="h-5 w-5 text-brand" />}
            description="Registered users and admins"
          />
          <AdminStatCard
            title="Pending Payments"
            value={pendingPayments}
            icon={<CreditCard className="h-5 w-5 text-brand" />}
            description="Waiting for verification"
          />
          <AdminStatCard
            title="Active Packages"
            value={activePackages}
            icon={<Package className="h-5 w-5 text-brand" />}
            description="Verified customer packages"
          />
          <AdminStatCard
            title="Report Requests"
            value={totalReportRequests}
            icon={<FileText className="h-5 w-5 text-brand" />}
            description="Total customer requests"
          />
          <AdminStatCard
            title="Completed Reports"
            value={completedReports}
            icon={<ShieldCheck className="h-5 w-5 text-brand" />}
            description="Uploaded PDF reports"
          />
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-bold text-foreground">
            Admin dashboard modules
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            This dashboard will later include user management, payment
            verification, report request management, payment plan settings,
            uploaded reports and system settings.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ModuleBox
              title="User Details"
              description="Name, mobile number and active status."
            />
            <ModuleBox
              title="Report Requests"
              description="VIN/chassis, lot number, auction date, platform and status."
            />
            <ModuleBox
              title="Payment Verification"
              description="View bank transfer proof and approve or reject payments."
            />
            <ModuleBox
              title="Payment Plans"
              description="Manage request packages and customer balances."
            />
            <ModuleBox
              title="Reports"
              description="Upload PDF reports and assign them to customer requests."
            />
            <ModuleBox
              title="Settings"
              description="Manage bank details, platform settings and future options."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminStatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-xl bg-secondary/50 p-2 text-brand">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ModuleBox({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
