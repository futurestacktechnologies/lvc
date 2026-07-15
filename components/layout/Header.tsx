import Link from "next/link";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";

import Container from "./Container";
import Logo from "../common/Logo";
import { buttonVariants } from "@/components/ui/button";
import HeaderMobileMenu from "./HeaderMobileMenu";
import { getCurrentUser } from "@/lib/auth/current-user";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "What You Get", href: "#what-you-get" },
  { label: "Payment Plans", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Support", href: "#support" },
];

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between">
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

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted [&::-webkit-details-marker]:hidden">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-brand">
                  <UserRound className="h-4 w-4" />
                </span>
                <span className="max-w-32 truncate">{user.name}</span>
              </summary>

              <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl">
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
                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-destructive transition hover:bg-destructive/10"
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

        <HeaderMobileMenu
          user={
            user
              ? {
                  name: user.name,
                  phone: user.phone,
                }
              : null
          }
        />
      </Container>
    </header>
  );
}
