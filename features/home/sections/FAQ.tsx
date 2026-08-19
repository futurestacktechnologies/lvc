"use client";

import { motion, type Variants } from "motion/react";
import Container from "@/components/layout/Container";
import SectionHeader from "@/components/common/SectionHeader";

const faqs = [
  {
    question: "What is a Japan Vehicle History Report?",
    answer:
      "A Japan Vehicle History Report provides detailed information about a vehicle's history in Japan, helping you make a more informed decision before purchasing a used vehicle.",
  },
  {
    question: "What information do I need to request a report?",
    answer:
      "A chassis number or VIN is preferred when requesting a report. If you do not have it, you can provide the vehicle's lot number, auction date, and auction platform to help us identify the vehicle.",
  },
  {
    question: "How much does a vehicle history report cost?",
    answer:
      "A vehicle history report costs LKR 2,500 per request. The applicable price is displayed on the website before you submit your request.",
  },
  {
    question: "How can I make a payment?",
    answer:
      "You can pay for your report using a bank transfer or securely through our online payment option using a debit or credit card.",
  },
  {
    question: "How long does it take to receive my report?",
    answer:
      "Once your report request is approved, the completed report will be available within 10 minutes.",
  },
  {
    question: "How will I receive my report?",
    answer:
      "Once your report is completed, you can access and download it as a PDF directly from your account portal. We will also send the completed report to you via WhatsApp.",
  },
  {
    question: "What happens if I enter the wrong chassis number?",
    answer:
      "Please make sure the vehicle details are correct before submitting your request. If the information provided is incorrect and the vehicle cannot be identified, the request will be rejected. The request credit used for that request will then be returned to your account.",
  },
  {
    question: "Is the report generated automatically?",
    answer:
      "No. Each request is processed and reviewed by our team. The information is manually checked and the available vehicle history is compiled into a report for you.",
  },
  {
    question: "Can I track the status of my report request?",
    answer:
      "Yes. You can log in to your account to view your request status and follow the progress of your report from submission through completion.",
  },
];

const faqVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 25,
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

const faqContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function FAQ() {
  return (
    <section id="faq" className="scroll-mt-10 bg-muted py-12 lg:py-16">
      <Container>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <SectionHeader
            badge="Questions & Answers"
            title="Frequently asked questions"
            description="Here are the most common questions customers may ask before requesting a Japanese vehicle history report."
          />
        </motion.div>

        {/* FAQ List */}
        <motion.div
          className="mx-auto mt-14 max-w-4xl space-y-4"
          variants={faqContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {faqs.map((faq) => (
            <motion.details
              key={faq.question}
              variants={faqVariants}
              whileHover={{
                y: -2,
                transition: {
                  duration: 0.2,
                },
              }}
              className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-md open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-6 [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-semibold text-foreground sm:text-lg">
                  {faq.question}
                </h3>

                <motion.span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xl font-medium text-brand"
                  animate={{
                    rotate: 0,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                >
                  <span className="transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </motion.span>
              </summary>

              <div className="px-6 pb-6">
                <div className="h-px bg-border" />

                <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {faq.answer}
                </p>
              </div>
            </motion.details>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
