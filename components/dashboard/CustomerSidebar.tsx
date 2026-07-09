"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Logo from "@/components/common/Logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type CustomerSidebarProps = {
  user: {
    name: string;
    phone: string;
    role: string;
  };
};

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Requests",
    href: "/dashboard/report-requests",
    icon: FileText,
  },
  {
    label: "My Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    label: "New Report",
    href: "/dashboard/report-requests/new",
    icon: PlusCircle,
  },
  {
    label: "Buy Package",
    href: "/payment-plans",
    icon: Package,
  },
];

export default function CustomerSidebar({ user }: CustomerSidebarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    if (href === "/dashboard/report-requests/new") {
      return pathname === "/dashboard/report-requests/new";
    }

    if (href === "/dashboard/report-requests") {
      return (
        pathname === "/dashboard/report-requests" ||
        (pathname.startsWith("/dashboard/report-requests/") &&
          pathname !== "/dashboard/report-requests/new")
      );
    }

    if (href === "/dashboard/reports") {
      return pathname === "/dashboard/reports";
    }

    if (href === "/payment-plans") {
      return (
        pathname === "/payment-plans" || pathname.startsWith("/payment-plans/")
      );
    }

    return pathname === href;
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-border bg-card shadow-sm lg:flex">
        <div className="border-b border-border p-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-sm shadow-brand/20"
            >
              <ShieldCheck className="h-5 w-5" />
            </Link>

            <div className="min-w-0 py-2">
              <Logo />
              <p className="mt-1 text-xs text-muted-foreground">
                Customer Portal
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <div className="rounded-3xl border border-border bg-muted/40 p-4">
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
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-secondary text-brand shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border p-4">
          <div className="flex flex-col gap-3">
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
              <Link
                href="/admin"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full justify-center rounded-2xl",
                )}
              >
                Admin Dashboard
              </Link>
            )}

            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full justify-center rounded-2xl",
              )}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>

            <form action="/api/auth/logout" method="POST" className="block">
              <Button
                type="submit"
                variant="outline"
                className="w-full cursor-pointer rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-sm shadow-brand/20"
            >
              <ShieldCheck className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <Logo />
              <p className="mt-0.5 text-xs text-muted-foreground">
                Customer Portal
              </p>
            </div>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "h-10 w-10 shrink-0 rounded-2xl",
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
                <div className="flex min-w-0 items-center gap-3">
                  <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white"
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </Link>

                  <div className="min-w-0">
                    <Logo />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Customer Portal
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-4">
                <div className="rounded-3xl border border-border bg-muted/40 p-4">
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
                </div>

                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                          active
                            ? "bg-secondary text-brand shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}

                  <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                </nav>
              </div>

              <div className="border-t border-border p-4">
                <div className="flex flex-col gap-3">
                  {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className={cn(
                        buttonVariants({ variant: "default" }),
                        "w-full justify-center rounded-2xl",
                      )}
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-center rounded-2xl",
                    )}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>

                  <form
                    action="/api/auth/logout"
                    method="POST"
                    className="block"
                  >
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full cursor-pointer rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </form>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
