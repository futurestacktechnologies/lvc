"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

type ActionConfirmDialogProps = {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  actionUrl: string;
  hiddenFields?: Record<string, string>;
  icon?: React.ReactNode;
  successTitle?: string;
  successDescription?: string;
  errorTitle?: string;
};

export default function ActionConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Yes, Continue",
  cancelLabel = "No, Cancel",
  confirmVariant = "default",
  actionUrl,
  hiddenFields = {},
  icon,
  successTitle = "Action completed",
  successDescription = "The action has been completed successfully.",
  errorTitle = "Action failed",
}: ActionConfirmDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    try {
      setIsSubmitting(true);

      const formData = new FormData();

      Object.entries(hiddenFields).forEach(([name, value]) => {
        formData.append(name, value);
      });

      const response = await fetch(actionUrl, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(errorTitle, {
          description: result.message || "Please try again.",
        });
        return;
      }

      toast.success(successTitle, {
        description: result.message || successDescription,
      });

      setOpen(false);
      router.refresh();
    } catch {
      toast.error(errorTitle, {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex">
        {trigger}
      </span>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              {icon || <AlertTriangle className="h-6 w-6" />}
            </div>

            <AlertDialogTitle>{title}</AlertDialogTitle>

            <AlertDialogDescription className="leading-7">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              {cancelLabel}
            </Button>

            <Button
              type="button"
              variant={confirmVariant}
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="cursor-pointer"
            >
              {isSubmitting ? "Processing..." : confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
