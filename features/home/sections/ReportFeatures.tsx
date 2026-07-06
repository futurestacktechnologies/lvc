import {
  BadgeCheck,
  Camera,
  CarFront,
  FileSearch,
  FileText,
  Gauge,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeader from "@/components/common/SectionHeader";

const reportItems = [
  {
    icon: TrendingUp,
    title: "Auction history",
    description:
      "View previous auction records, auction dates, results, and selling information where available.",
  },
  {
    icon: Gauge,
    title: "Mileage history",
    description:
      "Check mileage records and identify possible mileage inconsistencies or suspicious changes.",
  },
  {
    icon: ShieldAlert,
    title: "Accident indicators",
    description:
      "Understand whether the vehicle may have accident history or condition changes.",
  },
  {
    icon: FileSearch,
    title: "Auction sheet details",
    description:
      "Receive important auction sheet details, grades, and condition notes in a clear format.",
  },
  {
    icon: Camera,
    title: "Vehicle photos",
    description:
      "Where available, report details can include vehicle images and visual references.",
  },
  {
    icon: FileText,
    title: "Professional PDF report",
    description:
      "A clean PDF report prepared by our team and delivered to your customer account.",
  },
];

export default function ReportFeatures() {
  return (
    <section
      id="what-you-get"
      className="relative overflow-hidden bg-muted py-20 lg:py-24"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,#dbeafe,transparent_28%),radial-gradient(circle_at_85%_35%,#fef3c7,transparent_26%)]" />

      <Container>
        <SectionHeader
          badge="Report Details"
          title="What you’ll get in your vehicle report"
          description="Every report is prepared to help you understand the vehicle history before making an import or purchase decision."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="grid gap-5 md:grid-cols-2">
            {reportItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-secondary text-brand">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-lg font-bold text-foreground">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-slate-200/70">
            <div className="rounded-3xl bg-gradient-to-br from-primary to-slate-800 p-6 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Sample Report</p>
                  <h3 className="mt-1 text-2xl font-bold">
                    Vehicle History Summary
                  </h3>
                </div>

                <div className="rounded-2xl bg-white/10 p-3">
                  <CarFront className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {[
                  "Auction records found",
                  "Mileage history checked",
                  "Condition details reviewed",
                  "PDF report ready",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3"
                  >
                    <BadgeCheck className="h-5 w-5 text-success" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-border bg-background p-5">
              <p className="text-sm font-semibold text-foreground">
                Delivery included
              </p>

              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Once completed, the report can be downloaded from the customer
                dashboard. You can also send it through email, website chat, or
                WhatsApp.
              </p>

              <div className="mt-5 rounded-2xl bg-warning/10 px-4 py-3 text-sm font-medium text-foreground">
                Report price: LKR 2,500 per request
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
