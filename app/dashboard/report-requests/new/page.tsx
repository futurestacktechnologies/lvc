import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
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
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-brand">
                New Vehicle Report
              </p>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Submit a Report Request
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Enter either chassis/VIN details or auction lot details. Our
                admin team will manually verify the vehicle information and
                deliver a professional PDF report to your account.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/report-requests">
                <Button
                  variant="outline"
                  className="cursor-pointer rounded-2xl"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  My Requests
                </Button>
              </Link>

              <Link href="/payment-plans">
                <Button
                  variant="outline"
                  className="cursor-pointer rounded-2xl"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Buy Package
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-[2rem]">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Available Credits
                </p>
                <p className="mt-3 text-3xl font-bold text-foreground">
                  {availableCredits}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ready to use for new requests
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-brand">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem]">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Packages
                </p>
                <p className="mt-3 text-3xl font-bold text-foreground">
                  {activePackages.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Packages with remaining credits
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-brand">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] md:col-span-2 xl:col-span-1">
          <CardContent className="p-5">
            {primaryPackage ? (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Using Package
                    </p>
                    <p className="mt-3 font-bold text-foreground">
                      {primaryPackage.plan.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {primaryPackage.packageNumber}
                    </p>
                  </div>

                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30">
                    ACTIVE
                  </Badge>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${Math.max(
                        5,
                        Math.min(
                          100,
                          (primaryPackage.remainingRequests /
                            primaryPackage.totalRequests) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {primaryPackage.remainingRequests} of{" "}
                  {primaryPackage.totalRequests} credits remaining
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-semibold text-foreground">
                    No active package
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Buy a package before submitting a new report request.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {availableCredits <= 0 ? (
        <Card className="rounded-[2rem]">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-brand">
              <CreditCard className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-foreground">
              You need request credits
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              You do not have any active report credits at the moment. Please
              buy a package to submit a new Japanese vehicle report request.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/payment-plans">
                <Button className="cursor-pointer rounded-2xl">
                  <Package className="mr-2 h-4 w-4" />
                  View Payment Plans
                </Button>
              </Link>

              <Link href="/dashboard/report-requests">
                <Button
                  variant="outline"
                  className="cursor-pointer rounded-2xl"
                >
                  My Requests
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-[2rem] xl:col-span-2">
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

          <Card className="rounded-[2rem]">
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
