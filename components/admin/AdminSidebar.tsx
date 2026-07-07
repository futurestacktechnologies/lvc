"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminLinks = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Users", href: "/admin/users", icon: UsersRound },
  { label: "Report Requests", href: "/admin/report-requests", icon: FileText },
  { label: "Payment Plans", href: "/admin/payment-plans", icon: Package },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

type AdminSidebarProps = {
  admin: {
    name: string;
    phone: string;
    role: string;
  };
};

export default function AdminSidebar({ admin }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 flex-col border-r border-border bg-background lg:flex">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-brand">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {admin.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {admin.role}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-8">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand/20 text-brand shadow-sm shadow-brand/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <form action="/api/auth/logout" method="POST">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-muted hover:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>
    </aside>
  );
}
