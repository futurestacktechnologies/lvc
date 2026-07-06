import Link from "next/link";
import { LayoutDashboard, LogOut, Menu, UserRound } from "lucide-react";

import Container from "./Container";
import Logo from "../common/Logo";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/current-user";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "What You Get", href: "#what-you-get" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Support", href: "#support" },
];

export default async function Header() {
  const user = await getCurrentUser();

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
          {user ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted [&::-webkit-details-marker]:hidden">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-brand">
                  <UserRound className="h-4 w-4" />
                </span>
                <span className="max-w-32 truncate">{user.name}</span>
              </summary>

              <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl">
                <div className="border-b border-border px-3 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {user.phone}
                  </p>
                </div>

                <Link
                  href="/dashboard"
                  className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>

                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-destructive transition hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost" })}
              >
                Login
              </Link>

              <Link
                href="/register"
                className={buttonVariants({ variant: "default" })}
              >
                Get Started
              </Link>
            </>
          )}
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

              {user ? (
                <div className="mt-4 rounded-2xl border border-border bg-muted p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-brand">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.phone}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      href="/dashboard"
                      className={buttonVariants({ variant: "default" })}
                    >
                      Dashboard
                    </Link>

                    <form action="/api/auth/logout" method="POST">
                      <button
                        type="submit"
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "w-full text-destructive hover:text-destructive cursor-pointer",
                        )}
                      >
                        Logout
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}
