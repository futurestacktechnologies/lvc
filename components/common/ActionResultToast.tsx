"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type ToastType = "success" | "error" | "warning" | "info";

type ToastMessage = {
  type: ToastType;
  title: string;
  description?: string;
};

type ActionResultToastProps = {
  paramName: string;
  messages: Record<string, ToastMessage>;
};

export default function ActionResultToast({
  paramName,
  messages,
}: ActionResultToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const result = searchParams.get(paramName);

    if (!result || hasShownToast.current) return;

    const message = messages[result];

    if (!message) return;

    hasShownToast.current = true;

    if (message.type === "success") {
      toast.success(message.title, {
        description: message.description,
      });
    }

    if (message.type === "error") {
      toast.error(message.title, {
        description: message.description,
      });
    }

    if (message.type === "warning") {
      toast.warning(message.title, {
        description: message.description,
      });
    }

    if (message.type === "info") {
      toast.info(message.title, {
        description: message.description,
      });
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramName);

    const queryString = params.toString();

    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [messages, paramName, pathname, router, searchParams]);

  return null;
}
