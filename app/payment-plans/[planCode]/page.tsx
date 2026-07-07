import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { buttonVariants } from "@/components/ui/button";
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
    <main className="min-h-screen bg-muted/40">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/payment-plans"
            className={buttonVariants({ variant: "outline" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payment Plans
          </Link>
        </div>

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
      </section>
    </main>
  );
}
