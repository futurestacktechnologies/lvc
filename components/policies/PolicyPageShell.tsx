import Link from "next/link";
import { CheckCircle2, Clock, Mail, ShieldCheck } from "lucide-react";
import Container from "@/components/layout/Container";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

type PolicySection = {
  title: string;
  content: string[];
};

type PolicyPageShellProps = {
  badge: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: PolicySection[];
};

export default function PolicyPageShell({
  badge,
  title,
  description,
  lastUpdated,
  sections,
}: PolicyPageShellProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden border-b border-border bg-muted/30">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_35%),radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_30%)]" />
          <Container className="pt-8 lg:pt-12 pb-12 lg:pb-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-brand" />
                {badge}{" "}
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {title}
              </h1>

              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                {description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
                  <Clock className="size-4 text-primary" />
                  Last updated: {lastUpdated}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
                  <ShieldCheck className="size-4 text-primary" />
                  Enfield Nexus (Pvt) Ltd
                </div>
              </div>
            </div>
          </Container>
        </section>

        <Container className="pt-8 lg:pt-12 pb-12 lg:pb-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <article className="space-y-6">
              {sections.map((section, index) => (
                <div
                  key={section.title}
                  className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
                >
                  <div className="flex gap-4 items-center">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CheckCircle2 className="size-5" />
                    </div>

                    <div>
                      <p className="text-4xl font-bold text-primary/20">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-foreground">
                        {section.title}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
                    {section.content.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </article>

            <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
              <h3 className="text-base font-semibold text-foreground">
                Need assistance?
              </h3>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                For questions about payments, reports, refunds, privacy, or
                service terms, please contact our support team.
              </p>

              <div className="mt-5 rounded-2xl bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <Mail className="size-5 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Email
                    </p>
                    <a
                      href="mailto:info@enfieldnexus.com"
                      className="text-sm font-semibold text-foreground transition hover:text-primary"
                    >
                      info@enfieldnexus.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <Link
                  href="/privacy-policy"
                  className="block rounded-xl px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms-and-conditions"
                  className="block rounded-xl px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="/refund-policy"
                  className="block rounded-xl px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Refund Policy
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
