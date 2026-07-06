"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LogoutToast() {
  const router = useRouter();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const logoutStatus = searchParams.get("logout");

    if (logoutStatus !== "success" || hasShownToast.current) {
      return;
    }

    hasShownToast.current = true;

    toast.success("Logged out successfully", {
      description: "You have been safely logged out.",
    });

    router.replace("/", {
      scroll: false,
    });
  }, [router]);

  return null;
}
