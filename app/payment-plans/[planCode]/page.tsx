import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CreditCard, Package, ShieldCheck } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import CustomerSidebar from "@/components/dashboard/CustomerSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PaymentCheckoutForm from "@/features/payment/components/PaymentCheckoutForm";

type PaymentPlanCheckoutPageProps = {
  params: Promise<{
    planCode: string;
  }>;
};

export default async function PaymentPlanCheckoutPage({
  params,
}: PaymentPlanCheckoutPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { planCode } = await params;

  const plan = await prisma.paymentPlan.findUnique({
    where: {
      code: planCode,
    },
    select: {
      code: true,
      name: true,
      price: true,
      currency: true,
      requestCredits: true,
      isActive: true,
    },
  });

  if (!plan || !plan.isActive) {
    notFound();
  }

  return (
    <CustomerPortalShell
      user={{
        name: user.name,
        phone: user.phone,
        role: user.role,
      }}
    >
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
          <div className="relative p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-brand">
                  Package Checkout
                </p>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Complete Package Purchase
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Review your selected package and complete the payment process.
                  Once verified, your request credits will be activated.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/payment-plans">
                  <Button
                    variant="outline"
                    className="cursor-pointer rounded-2xl"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Payment Plans
                  </Button>
                </Link>

                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="cursor-pointer rounded-2xl"
                  >
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <CheckoutInfoCard
            title="Selected Plan"
            value={plan.name}
            description={`${plan.requestCredits} report request credits`}
            icon={<Package className="h-5 w-5" />}
          />

          <CheckoutInfoCard
            title="Package Price"
            value={`${plan.currency} ${plan.price.toLocaleString()}`}
            description="One-time package purchase"
            icon={<CreditCard className="h-5 w-5" />}
          />

          <CheckoutInfoCard
            title="Verification"
            value="Admin Review"
            description="Credits activate after payment approval"
            icon={<ShieldCheck className="h-5 w-5" />}
          />
        </section>

        <PaymentCheckoutForm
          plan={{
            code: plan.code,
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
            requestCredits: plan.requestCredits,
          }}
          user={{
            name: user.name,
            phone: user.phone,
          }}
        />
      </div>
    </CustomerPortalShell>
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

function CheckoutInfoCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card className="rounded-[2rem]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 truncate text-2xl font-bold text-foreground">
              {value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
