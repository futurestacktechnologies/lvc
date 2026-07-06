import Container from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Clock,
  Download,
  FileText,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

const stats = [
  {
    icon: ShieldCheck,
    value: "100%",
    label: "Manual Verification",
    text: "Every record checked by our team",
  },
  {
    icon: Clock,
    value: "24h",
    label: "Fast Delivery",
    text: "Receive reports quickly online",
  },
  {
    icon: FileText,
    value: "PDF",
    label: "Professional Report",
    text: "Delivered to your account securely",
  },
  {
    icon: LockKeyhole,
    value: "Secure",
    label: "Data Protection",
    text: "Your request details stay safe",
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background with gradient and glow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50/50 via-background to-background" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />

      <Container className="pt-8 lg:pt-10 pb-12 lg:pb-16">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Japan Vehicle History Reports
            </div>

            <h1 className="mt-7 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              Get{" "}
              <span className="bg-gradient-to-r from-brand to-indigo-400 bg-clip-text text-transparent">
                Authentic
              </span>{" "}
              Japanese Vehicle History Reports
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Enter your chassis number, complete the payment, and our team will
              manually verify the vehicle details before delivering a
              professional PDF report to your account.
            </p>

            {/* Search Card with glass effect */}
            <div className="mt-8 max-w-2xl rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-2xl shadow-slate-200/60 backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Enter Chassis Number or VIN"
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 text-base shadow-none focus:ring-2 focus:ring-brand/50"
                  />
                </div>

                <Button className="h-14 rounded-2xl bg-brand px-7 text-base font-semibold shadow-lg shadow-brand/30 hover:bg-brand/90 hover:shadow-brand/40 transition-all duration-300 cursor-pointer">
                  Check Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 flex flex-col gap-3 px-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <button className="inline-flex items-center gap-2 font-medium text-brand hover:text-indigo-700 transition-colors cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Search by lot number
                </button>

                <button className="inline-flex items-center gap-2 font-medium text-brand hover:text-indigo-700 transition-colors cursor-pointer">
                  <Download className="h-4 w-4" />
                  See report sample
                </button>
              </div>
            </div>

            {/* Mini Cards */}
            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-brand">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-950">
                      Manual Verification
                    </p>
                    <p className="text-sm text-slate-500">
                      Experts verify every record
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-950">
                      Quick Delivery
                    </p>
                    <p className="text-sm text-slate-500">
                      Get your PDF report fast
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual - unchanged */}
          <div className="relative hidden min-h-[520px] lg:block">
            {/* Main Report Card */}
            <div className="absolute left-0 top-8 w-[560px] rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/50">
              <Image
                src="/hero-bg.png"
                alt="Vehicle report preview"
                width={560}
                height={520}
                className="w-full rounded-[1.5rem]"
                priority
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-sm md:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-2xl p-3 lg:border-r lg:border-slate-100 lg:last:border-r-0"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-brand">
                      {item.value}
                    </p>
                    <p className="font-semibold text-slate-950">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
