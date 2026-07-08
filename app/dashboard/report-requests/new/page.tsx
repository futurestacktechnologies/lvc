import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, ShieldCheck } from "lucide-react";

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

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
          New Report Request
        </h1>

        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Submit Japanese vehicle details for admin review and PDF report
          preparation.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Available Credits
            </CardTitle>
            <ShieldCheck className="h-5 w-5 text-brand" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{availableCredits}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Active Packages
            </CardTitle>
            <Package className="h-5 w-5 text-brand" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{activePackages.length}</div>
          </CardContent>
        </Card>
      </div>

      {availableCredits <= 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-brand">
              <Package className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-foreground">
              No active request credits
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              You need an active payment package before submitting a new vehicle
              report request.
            </p>

            <Link href="/payment-plans" className="mt-6 inline-flex">
              <Button className="cursor-pointer">Buy Package</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
          </CardHeader>

          <CardContent>
            <NewReportRequestForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
