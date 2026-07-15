import Link from "next/link";
import { CarFront, Mail, MessageCircle, ShieldCheck } from "lucide-react";

import Container from "./Container";
import Logo from "../common/Logo";
import { APP } from "@/lib/constants";

const footerLinks = [
  {
    title: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "What You Get", href: "#what-you-get" },
      { label: "Payment Plans", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Portal",
    links: [
      { label: "Login", href: "/login" },
      { label: "Create Account", href: "/register" },
      { label: "Request Report", href: "/dashboard/report-requests/new" },
      { label: "Sample Report", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <Container>
        <div className="grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />

            <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
              A secure vehicle report request portal for customers who need
              reliable Japanese vehicle history information, manual
              verification, and professional PDF delivery.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:max-w-xl">
              <div className="rounded-2xl border border-border bg-background p-4">
                <CarFront className="h-5 w-5 text-brand" />
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  Vehicle Reports
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <ShieldCheck className="h-5 w-5 text-success" />
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  Manual Verification
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <MessageCircle className="h-5 w-5 text-warning" />
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  Support Delivery
                </p>
              </div>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {group.title}
              </h3>

              <div className="mt-5 flex flex-col gap-3">
                {group.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm text-muted-foreground transition hover:text-brand"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-border py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {APP.company}. All rights reserved.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href={`mailto:${APP.supportEmail}`}
              className="inline-flex items-center gap-2 transition hover:text-brand"
            >
              <Mail className="h-4 w-4" />
              {APP.supportEmail}
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
