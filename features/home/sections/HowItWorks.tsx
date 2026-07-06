import {
  Car,
  CreditCard,
  FileCheck2,
  FileText,
  SearchCheck,
  UserRoundPlus,
} from "lucide-react";

import Container from "@/components/layout/Container";
import SectionHeader from "@/components/common/SectionHeader";

const steps = [
  {
    icon: UserRoundPlus,
    title: "Create your account",
    description:
      "Register and access your personal dashboard to manage all report requests securely.",
  },
  {
    icon: Car,
    title: "Submit vehicle details",
    description:
      "Enter the chassis number or VIN with optional vehicle information to start the request.",
  },
  {
    icon: CreditCard,
    title: "Complete payment",
    description:
      "Pay manually or through the online payment gateway. Manual payments can be verified by admin.",
  },
  {
    icon: SearchCheck,
    title: "Manual verification",
    description:
      "Our team checks the vehicle history details carefully before preparing your final report.",
  },
  {
    icon: FileCheck2,
    title: "Report preparation",
    description:
      "We prepare a clean professional PDF report based on the verified vehicle information.",
  },
  {
    icon: FileText,
    title: "PDF delivery",
    description:
      "Download the report from your account or receive it through email, chat, or WhatsApp.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-background py-20 lg:py-24">
      <Container>
        <SectionHeader
          badge="Simple Process"
          title="How your vehicle report request works"
          description="A clear step-by-step process designed for customers who want reliable Japanese vehicle history information without confusion."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="group relative rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-brand transition group-hover:bg-brand group-hover:text-brand-foreground">
                    <Icon className="h-6 w-6" />
                  </div>

                  <span className="text-4xl font-bold text-muted">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
