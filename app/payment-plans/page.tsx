import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Package,
  Sparkles,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import CustomerSidebar from "@/components/dashboard/CustomerSidebar";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function PaymentPlansPage() {
  const user = await getCurrentUser();

  const plans = await prisma.paymentPlan.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const content = (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge className="gap-2 border-0 bg-secondary text-brand">
                <Sparkles className="h-4 w-4" />
                Payment Plans
              </Badge>

              <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Select a package to request Japanese vehicle reports
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Choose a request package based on how many vehicle reports you
                need. After payment verification, your request credits will be
                added to your account.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {user && (
                <Link href="/dashboard/report-requests">
                  <Button
                    variant="outline"
                    className="cursor-pointer rounded-2xl"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    My Requests
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {user && (
        <section className="grid gap-5 md:grid-cols-3">
          <PlanInfoCard
            title="Flexible Credits"
            description="Use your package credits for vehicle report requests anytime."
            icon={<Package className="h-5 w-5" />}
          />

          <PlanInfoCard
            title="Manual Verification"
            description="Each request is reviewed by the admin team before delivery."
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <PlanInfoCard
            title="PDF Delivery"
            description="Completed reports are delivered securely to your account."
            icon={<FileText className="h-5 w-5" />}
          />
        </section>
      )}
      {plans.length === 0 ? (
        <Card className="rounded-[2rem]">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-brand">
              <CreditCard className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-foreground">
              No active payment plans
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              Payment packages are currently unavailable. Please check again
              later or contact support.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const pricePerRequest = Math.round(
              plan.price / plan.requestCredits,
            );

            const isPopular = plan.code === "VALUE_10";
            const selectHref = user ? `/payment-plans/${plan.code}` : "/login";

            return (
              <Card
                key={plan.id}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-[2rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                  isPopular
                    ? "border-brand bg-card shadow-brand/10 ring-2 ring-brand/20"
                    : "border-border bg-card shadow-sm",
                )}
              >
                {isPopular && (
                  <div className="absolute right-4 top-4 z-10">
                    <Badge className="bg-brand text-white shadow-lg shadow-brand/20">
                      Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 pt-7">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl",
                      isPopular
                        ? "bg-brand text-white"
                        : "bg-secondary text-brand",
                    )}
                  >
                    <Package className="h-7 w-7" />
                  </div>

                  <div className="mt-6">
                    <h2 className="text-2xl font-bold text-foreground">
                      {plan.name}
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.requestCredits} report{" "}
                      {plan.requestCredits > 1 ? "requests" : "request"}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  <div className="rounded-3xl bg-muted/60 p-5 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      Package Price
                    </p>

                    <div className="mt-1 flex items-end justify-center gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price.toLocaleString()}
                      </span>

                      <span className="pb-1 text-sm font-semibold text-muted-foreground">
                        {plan.currency}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Around LKR {pricePerRequest.toLocaleString()} per request
                    </p>
                  </div>

                  <div className="space-y-3">
                    <PlanFeature>
                      {plan.requestCredits} vehicle report request credits
                    </PlanFeature>
                    <PlanFeature>Customer dashboard tracking</PlanFeature>
                    <PlanFeature>
                      Verified Japanese vehicle history report
                    </PlanFeature>
                    <PlanFeature>24/7 customer support</PlanFeature>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Link href={selectHref} className="w-full">
                    <Button
                      className={cn(
                        "h-12 w-full cursor-pointer rounded-2xl text-base font-semibold",
                        isPopular
                          ? "bg-brand shadow-lg shadow-brand/20 hover:bg-brand/90"
                          : "",
                      )}
                    >
                      {user ? "Select Package" : "Login to Purchase"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </section>
      )}

      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-foreground">
              Payment verification process
            </p>

            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              Bank transfer and online payment options are available in the next
              step. For bank transfer, upload your payment proof as an image or
              PDF. Admin will verify it and activate your package credits.
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  if (user) {
    return (
      <CustomerPortalShell
        user={{
          name: user.name,
          phone: user.phone,
          role: user.role,
        }}
      >
        {content}
      </CustomerPortalShell>
    );
  }

  return (
    <MainLayout>
      <main className="bg-gradient-to-b from-slate-50/80 to-white">
        <section className="mx-auto max-w-7xl px-6 py-10 lg:py-12">
          {content}
        </section>
      </main>
    </MainLayout>
  );
}

function CustomerPortalShell({
  user,
  children,
}: {
  user: {
    name: string;
    phone: string;
    role: string;
  };
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <CustomerSidebar user={user} />

      <div className="lg:pl-72">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function PlanInfoCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card className="rounded-[2rem]">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand">
            {icon}
          </div>

          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanFeature({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand" />
      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}
