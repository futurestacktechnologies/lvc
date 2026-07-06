import Container from "@/components/layout/Container";
import SectionHeader from "@/components/common/SectionHeader";

const faqs = [
  {
    question: "Do I need to create an account to request a report?",
    answer:
      "Yes. Customers need to create an account so they can submit requests, track status, view payment details, and download completed PDF reports securely.",
  },
  {
    question: "How much does one report request cost?",
    answer:
      "One report request costs LKR 2,500. This price can be updated later from the admin system when pricing management is added.",
  },
  {
    question: "How do I make the payment?",
    answer:
      "You can pay manually or through the online payment gateway once it is enabled. For manual payments, the admin team will verify the payment before processing the report.",
  },
  {
    question: "How will I receive the report?",
    answer:
      "The completed report will be uploaded to your customer account as a PDF. It can also be sent through email, website chat, or WhatsApp.",
  },
  {
    question: "Is the report generated automatically?",
    answer:
      "No. Your request is checked manually by the admin team. This helps ensure the details are reviewed properly before the final PDF report is prepared.",
  },
  {
    question: "What details do I need to submit?",
    answer:
      "The main required detail is the chassis number or VIN. You can also provide vehicle make, model, year, and notes to help the admin team identify the correct vehicle.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="bg-muted py-20 lg:py-24">
      <Container>
        <SectionHeader
          badge="Questions & Answers"
          title="Frequently asked questions"
          description="Here are the most common questions customers may ask before requesting a Japanese vehicle history report."
        />

        <div className="mx-auto mt-14 max-w-4xl space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6">
                <h3 className="text-base font-semibold text-foreground sm:text-lg">
                  {faq.question}
                </h3>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-bold text-brand transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
