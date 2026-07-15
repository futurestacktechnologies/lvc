import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";

import Container from "@/components/layout/Container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CTA() {
  return (
    <section id="contact" className="bg-background py-20 lg:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-primary px-6 py-14 text-primary-foreground shadow-2xl shadow-slate-300/40 sm:px-10 lg:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.35),transparent_30%),radial-gradient(circle_at_85%_30%,rgba(245,158,11,0.28),transparent_28%)]" />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80">
                <ShieldCheck className="h-4 w-4" />
                Secure vehicle report requests
              </div>

              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Ready to check your Japanese vehicle history?
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
                Create your account, submit the chassis number, complete the
                payment, and let our team prepare your verified report.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/dashboard/report-requests/new"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "h-12 min-w-44 text-base font-semibold",
                )}
              >
                Start Request
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-12 min-w-44 border-white/20 bg-white/10 text-base font-semibold text-white hover:bg-white/20",
                )}
              >
                Contact Support
                <MessageCircle className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
