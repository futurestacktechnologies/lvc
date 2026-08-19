"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";

import Container from "@/components/layout/Container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const contentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const textContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const textItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const buttonsVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 25,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      delay: 0.25,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function CTA() {
  return (
    <section id="support" className="scroll-mt-16 bg-background py-12 lg:py-16">
      <Container>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.25,
          }}
          variants={contentVariants}
          className="relative overflow-hidden rounded-[2rem] border border-border bg-primary px-6 py-14 text-primary-foreground shadow-2xl shadow-slate-300/40 sm:px-10 lg:px-16"
        >
          {/* Animated background glow */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.35),transparent_30%),radial-gradient(circle_at_85%_30%,rgba(245,158,11,0.28),transparent_28%)]"
          />

          {/* Subtle decorative glow */}
          <motion.div
            animate={{
              x: [0, 25, 0],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"
          />

          <motion.div
            animate={{
              x: [0, -20, 0],
              y: [0, 15, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
          />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            {/* Text Content */}
            <motion.div variants={textContainerVariants} className="max-w-3xl">
              {/* Badge */}
              <motion.div
                variants={textItemVariants}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm"
              >
                <motion.span
                  animate={{
                    scale: [1, 1.12, 1],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                </motion.span>
                Secure vehicle report requests
              </motion.div>

              {/* Heading */}
              <motion.h2
                variants={textItemVariants}
                className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
              >
                Ready to check your Japanese vehicle history?
              </motion.h2>

              {/* Description */}
              <motion.p
                variants={textItemVariants}
                className="mt-5 max-w-2xl text-base leading-8 text-white/70 sm:text-lg"
              >
                Create your account, submit the chassis number, complete the
                payment, and let our team prepare your verified report.
              </motion.p>
            </motion.div>

            {/* Buttons */}
            <motion.div
              variants={buttonsVariants}
              className="flex flex-col gap-3 sm:flex-row lg:flex-col"
            >
              <motion.div
                whileHover={{
                  y: -4,
                  scale: 1.02,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                <Link
                  href="/dashboard/report-requests/new"
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "h-12 min-w-44 text-base font-semibold shadow-lg",
                  )}
                >
                  Start Request
                  <motion.span
                    animate={{
                      x: [0, 4, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.span>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{
                  y: -4,
                  scale: 1.02,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                <Link
                  href="/contact"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-12 min-w-44 border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white",
                  )}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
