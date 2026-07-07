import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return user;
}
