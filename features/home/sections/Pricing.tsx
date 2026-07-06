import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { APP } from "@/lib/constants";
import Container from "@/components/layout/Container";
import SectionHeader from "@/components/common/SectionHeader";
import { buttonVariants } from "@/components/ui/button";

const includedFeatures = [
  "Japanese vehicle history checking",
  "Manual expert verification",
  "Auction history review",
  "Mileage history review",
  "Professional PDF report",
  "Dashboard report download",
  "Email / WhatsApp / chat delivery support",
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-background py-20 lg:py-24">
      <Container>
        <SectionHeader
          badge="Simple Pricing"
          title="One clear price for every report request"
          description="No complicated plans. Customers pay per request and receive a verified vehicle history report prepared by our team."
        />

        <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl shadow-slate-200/70">
            <div className="inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
              Standard Report
            </div>

            <div className="mt-8">
              <p className="text-sm font-medium text-muted-foreground">
                Starting from
              </p>

              <div className="mt-2 flex items-end gap-2">
                <h3 className="text-5xl font-bold tracking-tight text-foreground">
                  {APP.currency} {APP.reportPrice.toLocaleString()}
                </h3>

                <span className="pb-2 text-sm font-medium text-muted-foreground">
                  / request
                </span>
              </div>

              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                Perfect for customers who want to verify Japanese vehicle
                history before making an import or purchase decision.
              </p>
            </div>

            <Link
              href="/register"
              className={buttonVariants({
                variant: "default",
                className: "mt-8 h-12 w-full text-base",
              })}
            >
              Start Your Request
            </Link>

            <div className="mt-6 rounded-2xl border border-border bg-muted p-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                  <Wallet className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Manual and online payments
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Customers can pay manually or through the online payment
                    gateway once enabled.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-foreground">
              What is included?
            </h3>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Every request is handled by your team manually, so customers get a
              verified and easy-to-understand report instead of raw confusing
              data.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {includedFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span className="text-sm font-medium text-foreground">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background p-5">
                <ShieldCheck className="h-6 w-6 text-brand" />
                <p className="mt-4 text-sm font-semibold text-foreground">
                  Verified
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Manual checking by admin team
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <FileText className="h-6 w-6 text-brand" />
                <p className="mt-4 text-sm font-semibold text-foreground">
                  PDF Report
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Clean downloadable document
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5">
                <CreditCard className="h-6 w-6 text-brand" />
                <p className="mt-4 text-sm font-semibold text-foreground">
                  Easy Payment
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Manual or online payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
