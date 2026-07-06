import Link from "next/link";
import { Menu } from "lucide-react";

import Container from "./Container";
import Logo from "../common/Logo";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "What You Get", href: "#what-you-get" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Support", href: "#support" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 shadow-sm backdrop-blur-xl">
      <Container className="flex h-14 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Login
          </Link>

          <Link
            href="/register"
            className={buttonVariants({ variant: "default" })}
          >
            Get Started
          </Link>
        </div>

        <Sheet>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "lg:hidden",
            )}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>

          <SheetContent side="right" className="w-80">
            <div className="mt-8 flex flex-col gap-6">
              <Logo />

              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-base font-medium text-muted-foreground transition hover:text-brand"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/login"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className={buttonVariants({ variant: "default" })}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}
