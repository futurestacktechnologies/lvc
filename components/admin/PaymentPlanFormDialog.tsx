"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Pencil, PlusCircle, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PaymentPlanFormDialogProps = {
  mode: "create" | "edit";
  plan?: {
    id: string;
    code: string;
    name: string;
    price: number;
    currency: string;
    requestCredits: number;
    sortOrder: number;
  };
};

export default function PaymentPlanFormDialog({
  mode,
  plan,
}: PaymentPlanFormDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formValues, setFormValues] = useState({
    code: plan?.code || "",
    name: plan?.name || "",
    price: plan?.price ? String(plan.price) : "",
    currency: plan?.currency || "LKR",
    requestCredits: plan?.requestCredits ? String(plan.requestCredits) : "",
    sortOrder:
      plan?.sortOrder !== undefined && plan?.sortOrder !== null
        ? String(plan.sortOrder)
        : "0",
  });

  const isEditMode = mode === "edit";

  function updateField(name: keyof typeof formValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues.code.trim()) {
      toast.error("Plan code required", {
        description: "Please enter a unique plan code.",
      });
      return;
    }

    if (!formValues.name.trim()) {
      toast.error("Plan name required", {
        description: "Please enter a plan name.",
      });
      return;
    }

    const price = Number(formValues.price);
    const requestCredits = Number(formValues.requestCredits);
    const sortOrder = Number(formValues.sortOrder);

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Invalid price", {
        description: "Please enter a valid plan price.",
      });
      return;
    }

    if (!Number.isInteger(requestCredits) || requestCredits <= 0) {
      toast.error("Invalid request credits", {
        description: "Request credits must be a positive whole number.",
      });
      return;
    }

    if (!Number.isInteger(sortOrder)) {
      toast.error("Invalid sort order", {
        description: "Sort order must be a whole number.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("code", formValues.code.trim().toUpperCase());
      formData.append("name", formValues.name.trim());
      formData.append("price", String(price));
      formData.append("currency", formValues.currency.trim().toUpperCase());
      formData.append("requestCredits", String(requestCredits));
      formData.append("sortOrder", String(sortOrder));

      const response = await fetch(
        isEditMode && plan
          ? `/api/admin/payment-plans/${plan.id}`
          : "/api/admin/payment-plans",
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(isEditMode ? "Update failed" : "Create failed", {
          description: result.message || "Please try again.",
        });
        return;
      }

      toast.success(isEditMode ? "Plan updated" : "Plan created", {
        description:
          result.message ||
          (isEditMode
            ? "Payment plan updated successfully."
            : "Payment plan created successfully."),
      });

      setOpen(false);
      router.refresh();
    } catch {
      toast.error(isEditMode ? "Update failed" : "Create failed", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={isEditMode ? "outline" : "default"}
        size={isEditMode ? "sm" : "default"}
        onClick={() => setOpen(true)}
        className={isEditMode ? "cursor-pointer" : "cursor-pointer rounded-2xl"}
      >
        {isEditMode ? (
          <>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Plan
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[2rem] sm:max-w-2xl">
          <DialogHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-brand">
              <CreditCard className="h-6 w-6" />
            </div>

            <DialogTitle>
              {isEditMode ? "Edit Payment Plan" : "Create Payment Plan"}
            </DialogTitle>

            <DialogDescription>
              Manage customer package pricing, request credits and display
              order.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Plan code</Label>
                <Input
                  id="code"
                  value={formValues.code}
                  onChange={(event) => updateField("code", event.target.value)}
                  placeholder="STARTER_1"
                  disabled={isEditMode}
                  className="h-11 rounded-2xl uppercase"
                />
                {isEditMode && (
                  <p className="text-xs text-muted-foreground">
                    Plan code cannot be changed after creation.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Plan name</Label>
                <Input
                  id="name"
                  value={formValues.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Starter Plan"
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  value={formValues.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  placeholder="2500"
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formValues.currency}
                  onChange={(event) =>
                    updateField("currency", event.target.value)
                  }
                  placeholder="LKR"
                  className="h-11 rounded-2xl uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestCredits">Request credits</Label>
                <Input
                  id="requestCredits"
                  type="number"
                  min="1"
                  value={formValues.requestCredits}
                  onChange={(event) =>
                    updateField("requestCredits", event.target.value)
                  }
                  placeholder="1"
                  className="h-11 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formValues.sortOrder}
                  onChange={(event) =>
                    updateField("sortOrder", event.target.value)
                  }
                  placeholder="0"
                  className="h-11 rounded-2xl"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-2xl"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer rounded-2xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditMode ? (
                  "Save Changes"
                ) : (
                  "Create Plan"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
