"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
};

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
};

export function Stagger({
  children,
  className,
  delay = 0,
  staggerDelay = 0.08,
}: StaggerProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: true,
        amount: 0.15,
      }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: shouldReduceMotion ? 0 : delay,
            staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: shouldReduceMotion
          ? { opacity: 1 }
          : {
              opacity: 0,
              y: 22,
            },
        visible: shouldReduceMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              },
            },
      }}
    >
      {children}
    </motion.div>
  );
}
