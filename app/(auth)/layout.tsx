"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowLeft, CarFront, FileCheck2, ShieldCheck } from "lucide-react";

import Logo from "@/components/common/Logo";

const contentVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const formVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const featureContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const featureVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
        {/* Left Panel */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={contentVariants}
          className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between"
        >
          {/* Background Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.45),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(245,158,11,0.28),transparent_28%)]"
          />

          <div className="relative z-10">
            {/* Back Link */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.15,
              }}
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-white/75 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                Back to website
              </Link>
            </motion.div>

            {/* Main Content */}
            <div className="mt-20 max-w-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{
                  scale: 1.05,
                  rotate: 2,
                  transition: {
                    duration: 0.2,
                  },
                }}
                className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"
              >
                <CarFront className="h-7 w-7" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mt-8 text-4xl font-bold leading-tight tracking-tight"
              >
                Secure Japanese vehicle history report portal.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mt-5 text-base leading-8 text-white/70"
              >
                Create an account with your mobile number, verify using OTP,
                purchase a request package, and download verified vehicle
                reports from your dashboard.
              </motion.p>
            </div>
          </div>

          {/* Feature Cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={featureContainerVariants}
            className="relative z-10 grid gap-4"
          >
            <motion.div
              variants={featureVariants}
              whileHover={{
                y: -3,
                transition: {
                  duration: 0.2,
                },
              }}
              className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-success" />

                <div>
                  <p className="font-semibold">Manual verification</p>

                  <p className="text-sm text-white/65">
                    Every request is checked by your admin team.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={featureVariants}
              whileHover={{
                y: -3,
                transition: {
                  duration: 0.2,
                },
              }}
              className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <FileCheck2 className="h-6 w-6 text-warning" />

                <div>
                  <p className="font-semibold">PDF delivery</p>

                  <p className="text-sm text-white/65">
                    Customers can download reports from their account.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Right Side */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={formVariants}
          className="flex min-h-screen items-center justify-center px-6 py-10"
        >
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
              }}
              className="mb-8 flex items-center justify-between lg:hidden"
            >
              <Logo />

              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground transition hover:text-brand"
              >
                Home
              </Link>
            </motion.div>

            {children}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
