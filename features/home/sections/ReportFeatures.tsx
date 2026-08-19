"use client";

import { motion } from "motion/react";
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

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    x: -35,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const rightVariants = {
  hidden: {
    opacity: 0,
    x: 45,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function ReportFeatures() {
  return (
    <section
      id="what-you-get"
      className="scroll-mt-10 relative overflow-hidden bg-muted py-12 lg:py-16"
    >
      {/* Background decoration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{
          once: true,
          amount: 0.2,
        }}
        transition={{
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="pointer-events-none absolute -left-32 top-20 -z-10 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{
          once: true,
          amount: 0.2,
        }}
        transition={{
          duration: 1.2,
          delay: 0.15,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="pointer-events-none absolute -right-32 bottom-10 -z-10 h-96 w-96 rounded-full bg-amber-100/30 blur-3xl"
      />

      <Container>
        {/* Section heading */}
        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.25,
          }}
          transition={{
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <SectionHeader
            badge="Report Details"
            title="What you’ll get in your vehicle report"
            description="Every report is prepared to help you understand the vehicle history before making an import or purchase decision."
          />
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Left - Feature cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.12,
            }}
            variants={containerVariants}
            className="grid gap-5 md:grid-cols-2"
          >
            {reportItems.map((item) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  variants={cardVariants}
                  whileHover={{
                    y: -7,
                    transition: {
                      duration: 0.25,
                    },
                  }}
                  className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl"
                >
                  <motion.div
                    whileHover={{
                      scale: 1.08,
                      rotate: 4,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                    className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-secondary text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-foreground"
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>

                  <h3 className="text-lg font-bold text-foreground">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>

                  <motion.div
                    initial={{
                      width: 0,
                    }}
                    whileHover={{
                      width: "30%",
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className="mt-5 h-1 rounded-full bg-brand"
                  />
                </motion.div>
              );
            })}
          </motion.div>

          {/* Right - Sample report */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.15,
            }}
            variants={rightVariants}
            className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-slate-200/70"
          >
            {/* Report preview */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.6,
                delay: 0.15,
              }}
              className="rounded-3xl bg-gradient-to-br from-primary to-slate-800 p-6 text-primary-foreground"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Sample Report</p>

                  <h3 className="mt-1 text-2xl font-bold">
                    Vehicle History Summary
                  </h3>
                </div>

                <motion.div
                  animate={{
                    y: [0, -4, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="rounded-2xl bg-white/10 p-3"
                >
                  <CarFront className="h-7 w-7" />
                </motion.div>
              </div>

              {/* Checklist */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{
                  once: true,
                  amount: 0.15,
                }}
                variants={containerVariants}
                className="mt-8 space-y-4"
              >
                {[
                  "Auction records found",
                  "Mileage history checked",
                  "Condition details reviewed",
                  "PDF report ready",
                ].map((item) => (
                  <motion.div
                    key={item}
                    variants={{
                      hidden: {
                        opacity: 0,
                        x: 15,
                      },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: {
                          duration: 0.45,
                          ease: [0.22, 1, 0.36, 1] as const,
                        },
                      },
                    }}
                    className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3"
                  >
                    <BadgeCheck className="h-5 w-5 text-success" />

                    <span className="text-sm font-medium">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Delivery information */}
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.6,
                delay: 0.35,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-6 rounded-3xl border border-border bg-background p-5"
            >
              <p className="text-sm font-semibold text-foreground">
                Delivery included
              </p>

              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Once completed, the report can be downloaded from the customer
                dashboard. You can also send it through email, website chat, or
                WhatsApp.
              </p>

              <motion.div
                whileHover={{
                  scale: 1.02,
                }}
                transition={{
                  duration: 0.2,
                }}
                className="mt-5 rounded-2xl bg-warning/10 px-4 py-3 text-sm font-medium text-foreground"
              >
                Report price: LKR 2,500 per request
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
