import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreditCard,
  FileText,
  Package,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewReportRequestForm from "@/components/dashboard/NewReportRequestForm";
import { UserPackageStatus } from "@/generated/prisma";

export default async function NewReportRequestPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const activePackages = await prisma.userPackage.findMany({
    where: {
      userId: user.id,
      status: UserPackageStatus.ACTIVE,
      remainingRequests: {
        gt: 0,
      },
    },
    include: {
      plan: true,
    },
    orderBy: [
      {
        activatedAt: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  const availableCredits = activePackages.reduce(
    (total, userPackage) => total + userPackage.remainingRequests,
    0,
  );

  const primaryPackage = activePackages[0] || null;

  return (
    <div className="space-y-5 sm:space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="relative p-5 sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-brand">
                New Vehicle Report
              </p>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Submit Report Request
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:leading-7">
                Enter chassis/VIN details or auction lot details.
                <span className="hidden sm:inline">
                  {" "}
                  Our admin team will manually verify the vehicle information
                  and deliver a professional PDF report to your account.
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/report-requests"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  className="w-full cursor-pointer rounded-2xl sm:w-auto"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  My Requests
                </Button>
              </Link>

              <Link href="/payment-plans" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer rounded-2xl sm:w-auto"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Buy Package
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm md:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              Available Credits
            </p>

            <p className="mt-2 text-3xl font-bold text-foreground">
              {availableCredits}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {activePackages.length > 0
                ? `${activePackages.length} active package${activePackages.length > 1 ? "s" : ""}`
                : "No active package"}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        {primaryPackage && (
          <div className="mt-5 rounded-2xl bg-muted/60 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Using Package
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {primaryPackage.plan.name}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {primaryPackage.remainingRequests} of{" "}
              {primaryPackage.totalRequests} credits remaining
            </p>
          </div>
        )}
      </section>
      {availableCredits <= 0 ? (
        <Card className="rounded-[2rem]">
          <CardContent className="p-6 text-center sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-brand">
              <CreditCard className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-foreground sm:text-2xl">
              You need request credits
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              You do not have any active report credits at the moment. Please
              buy a package to submit a new Japanese vehicle report request.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/payment-plans" className="w-full sm:w-auto">
                <Button className="w-full cursor-pointer rounded-2xl sm:w-auto">
                  <Package className="mr-2 h-4 w-4" />
                  View Payment Plans
                </Button>
              </Link>

              <Link
                href="/dashboard/report-requests"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  className="w-full cursor-pointer rounded-2xl sm:w-auto"
                >
                  My Requests
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-5 xl:grid-cols-3 xl:gap-6">
          <Card className="rounded-[1.5rem] sm:rounded-[2rem] xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-brand" />
                  Vehicle Details
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Submit using one method only: chassis/VIN or auction lot
                  details.
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <NewReportRequestForm />
            </CardContent>
          </Card>

          <Card className="hidden rounded-[2rem] xl:block">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <StepItem
                number="01"
                title="Submit details"
                description="Enter chassis/VIN or auction lot details."
              />

              <StepItem
                number="02"
                title="Credit used"
                description="One request credit is deducted after submission."
              />

              <StepItem
                number="03"
                title="Admin verifies"
                description="Our team manually checks the vehicle information."
              />

              <StepItem
                number="04"
                title="Report delivered"
                description="Your PDF report appears inside your account."
              />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-brand">
          {number}
        </div>

        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
