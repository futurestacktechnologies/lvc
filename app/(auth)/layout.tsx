import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CarFront, FileCheck2, ShieldCheck } from "lucide-react";

import Logo from "@/components/common/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.45),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(245,158,11,0.28),transparent_28%)]" />

          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/75 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </Link>

            <div className="mt-20 max-w-xl">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <CarFront className="h-7 w-7" />
              </div>

              <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight">
                Secure Japanese vehicle history report portal.
              </h1>

              <p className="mt-5 text-base leading-8 text-white/70">
                Create an account, submit vehicle details, track payment status,
                and download verified PDF reports from your dashboard.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-success" />
                <div>
                  <p className="font-semibold">Manual verification</p>
                  <p className="text-sm text-white/65">
                    Every request is checked by your admin team.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <FileCheck2 className="h-6 w-6 text-warning" />
                <div>
                  <p className="font-semibold">PDF delivery</p>
                  <p className="text-sm text-white/65">
                    Customers can download reports from their account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Logo />

              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground transition hover:text-brand"
              >
                Home
              </Link>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
