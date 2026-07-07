import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { requireAdminUser } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar
        admin={{
          name: admin.name,
          phone: admin.phone,
          role: admin.role,
        }}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
