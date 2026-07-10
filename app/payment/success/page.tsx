import Link from "next/link";
import { Info } from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import PaymentStatusPoller from "@/components/payment/PaymentStatusPoller";

type PaymentSuccessPageProps = {
  searchParams: Promise<{
    paymentNumber?: string;
  }>;
};

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const params = await searchParams;
  const paymentNumber = params.paymentNumber || null;

  return (
    <MainLayout>
      <main className="bg-gradient-to-b from-slate-50/80 to-white px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand">
                <Info className="h-5 w-5" />
              </div>

              <div>
                <p className="font-semibold text-foreground">
                  Payment confirmation in progress
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  You returned from PayHere. We will check your payment status
                  automatically. Package credits are added only after the secure
                  PayHere notification confirms the payment.
                </p>

                {!paymentNumber && (
                  <p className="mt-2 text-sm text-destructive">
                    Payment number is missing from the URL. Please go to your{" "}
                    <Link
                      href="/dashboard"
                      className="font-semibold underline underline-offset-4"
                    >
                      dashboard
                    </Link>{" "}
                    and check your latest payment.
                  </p>
                )}
              </div>
            </div>
          </div>

          <PaymentStatusPoller paymentNumber={paymentNumber} />
        </div>
      </main>
    </MainLayout>
  );
}
