"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import Logo from "@/components/common/Logo";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type HeaderMobileMenuProps = {
  user: {
    name: string;
    phone: string;
  } | null;
};

const navLinks = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "What You Get", href: "#what-you-get" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Support", href: "#support" },
];

export default function HeaderMobileMenu({ user }: HeaderMobileMenuProps) {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-10 w-10 rounded-2xl lg:hidden",
        )}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex max-sm:!w-screen max-sm:!max-w-none sm:!w-[88%] sm:!max-w-sm flex-col border-l border-border bg-card p-0"
      >
        <div className="border-b border-border p-5">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <nav className="space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:border-brand/40 hover:bg-secondary hover:text-brand"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </nav>

          {user ? (
            <div className="mt-6 rounded-3xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand">
                  <UserRound className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.phone}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full rounded-2xl",
                  )}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>

                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full cursor-pointer rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive",
                    )}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-border bg-muted/40 p-4">
              <p className="font-semibold text-foreground">
                Start your report request
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Create an account or login to request Japanese vehicle history
                reports.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full rounded-2xl",
                  )}
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={closeMenu}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full rounded-2xl",
                  )}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
