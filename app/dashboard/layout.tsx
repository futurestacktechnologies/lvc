import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import CustomerSidebar from "@/components/dashboard/CustomerSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <CustomerSidebar
        user={{
          name: user.name,
          phone: user.phone,
          role: user.role,
        }}
      />

      <div className="lg:pl-72">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
