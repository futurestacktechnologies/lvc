"use client";

import { motion } from "motion/react";
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

const sectionVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 35,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-10 relative overflow-hidden bg-background py-12 lg:py-16"
    >
      {/* Subtle background glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          duration: 1,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="pointer-events-none absolute left-1/2 top-20 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/5 blur-3xl"
      />

      <Container>
        {/* Section heading */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.25,
          }}
          variants={sectionVariants}
        >
          <motion.div variants={itemVariants}>
            <SectionHeader
              badge="Simple Process"
              title="How your vehicle report request works"
              description="A clear step-by-step process designed for customers who want reliable Japanese vehicle history information without confusion."
            />
          </motion.div>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.12,
          }}
          variants={sectionVariants}
          className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.title}
                variants={itemVariants}
                whileHover={{
                  y: -8,
                  transition: {
                    duration: 0.25,
                  },
                }}
                className="group relative rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl"
              >
                {/* Step connector */}
                {index < steps.length - 1 && (
                  <div className="pointer-events-none absolute right-[-1.5rem] top-1/2 hidden h-px w-6 bg-border lg:block" />
                )}

                <div className="mb-6 flex items-center justify-between">
                  {/* Icon */}
                  <motion.div
                    whileHover={{
                      rotate: 4,
                      scale: 1.05,
                    }}
                    transition={{ duration: 0.2 }}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-foreground"
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>

                  {/* Step number */}
                  <span className="text-4xl font-bold text-muted transition-colors duration-300 group-hover:text-brand/20">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>

                {/* Bottom accent */}
                <motion.div
                  initial={{ width: 0 }}
                  whileHover={{ width: "35%" }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 h-1 rounded-full bg-brand"
                />
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
