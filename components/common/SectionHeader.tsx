// interface SectionHeaderProps {
//   badge?: string;
//   title: string;
//   description?: string;
// }

// export default function SectionHeader({
//   badge,
//   title,
//   description,
// }: SectionHeaderProps) {
//   return (
//     <div className="mx-auto max-w-3xl text-center">
//       {badge && (
//         <div className="mb-4 inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-brand shadow-sm">
//           {badge}
//         </div>
//       )}

//       <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
//         {title}
//       </h2>

//       {description && (
//         <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
//           {description}
//         </p>
//       )}
//     </div>
//   );
// }

"use client";

import { motion, useReducedMotion } from "motion/react";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
}

export default function SectionHeader({
  badge,
  title,
  description,
}: SectionHeaderProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="mx-auto max-w-3xl text-center">
      {badge && (
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 0,
                  y: 12,
                  scale: 0.96,
                }
          }
          whileInView={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }
          }
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-4 inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-brand shadow-sm"
        >
          {badge}
        </motion.div>
      )}

      <motion.h2
        initial={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                opacity: 0,
                y: 20,
              }
        }
        whileInView={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                opacity: 1,
                y: 0,
              }
        }
        viewport={{ once: true, amount: 0.4 }}
        transition={{
          duration: 0.65,
          delay: badge ? 0.08 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
      >
        {title}
      </motion.h2>

      {description && (
        <motion.p
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 0,
                  y: 18,
                }
          }
          whileInView={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: 0,
                }
          }
          viewport={{ once: true, amount: 0.4 }}
          transition={{
            duration: 0.6,
            delay: badge ? 0.16 : 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
