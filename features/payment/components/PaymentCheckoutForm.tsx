"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Package,
  UploadCloud,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PaymentMethod = "BANK_TRANSFER" | "ONLINE_GATEWAY";

type PaymentPlan = {
  code: string;
  name: string;
  price: number;
  currency: string;
  requestCredits: number;
};

type UserInfo = {
  name: string;
  phone: string;
};

type PaymentCheckoutFormProps = {
  plan: PaymentPlan;
  user: UserInfo;
};

type PayHereCreateResponse = {
  success: boolean;
  message?: string;
  checkoutUrl?: string;
  payment?: Record<string, string>;
};

function redirectToPayHere(
  checkoutUrl: string,
  paymentFields: Record<string, string>,
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;
  form.style.display = "none";

  Object.entries(paymentFields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export default function PaymentCheckoutForm({
  plan,
  user,
}: PaymentCheckoutFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("BANK_TRANSFER");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const pricePerRequest = useMemo(() => {
    return Math.round(plan.price / plan.requestCredits);
  }, [plan.price, plan.requestCredits]);

  function handleProofChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setPaymentProof(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a PDF, JPG, PNG, or WebP file.",
      });

      event.target.value = "";
      setPaymentProof(null);
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Payment proof must be less than 5MB.",
      });

      event.target.value = "";
      setPaymentProof(null);
      return;
    }

    setPaymentProof(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (paymentMethod === "ONLINE_GATEWAY") {
      try {
        setIsSubmitting(true);

        const response = await fetch("/api/payments/payhere/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planCode: plan.code,
          }),
        });

        const result = (await response.json()) as PayHereCreateResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.checkoutUrl ||
          !result.payment
        ) {
          toast.error("Online payment failed", {
            description: result.message || "Unable to start PayHere payment.",
          });
          return;
        }

        toast.success("Redirecting to PayHere", {
          description: "Please complete your payment securely.",
        });

        redirectToPayHere(result.checkoutUrl, result.payment);
      } catch (error) {
        console.error(error);

        toast.error("Online payment failed", {
          description: "Something went wrong while starting PayHere payment.",
        });
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (!paymentProof) {
      toast.error("Payment proof required", {
        description: "Please upload your bank transfer receipt.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("planCode", plan.code);
      formData.append("paymentProof", paymentProof);

      const response = await fetch("/api/payments/bank-transfer", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Payment submission failed", {
          description: result.message || "Please try again.",
        });
        return;
      }

      toast.success("Payment proof submitted", {
        description: "Your payment is now waiting for admin verification.",
      });

      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      toast.error("Payment submission failed", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      {/* Left Column: Package & User details */}
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-3xl border-0 shadow-xl shadow-slate-200/70">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand/5 blur-2xl" />
          <CardHeader className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/10 text-brand">
              <Package className="h-7 w-7" />
            </div>

            <div className="mt-2">
              <Badge className="mb-2 bg-secondary/80 text-secondary-foreground border-0">
                Selected Package
              </Badge>
              <CardTitle className="text-3xl font-extrabold tracking-tight">
                {plan.name}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 p-6 dark:from-slate-800/50 dark:to-slate-900/50">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand/10 blur-2xl" />
              <div className="relative">
                <p className="text-sm font-medium text-muted-foreground">
                  Package Price
                </p>

                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {plan.price.toLocaleString()}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-muted-foreground">
                    {plan.currency}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.requestCredits} report{" "}
                  {plan.requestCredits > 1 ? "requests" : "request"}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Around LKR {pricePerRequest.toLocaleString()} per request
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <SummaryItem>
                Request credits added after verification
              </SummaryItem>
              <SummaryItem>
                Track requests & downloads from your dashboard
              </SummaryItem>
              <SummaryItem>
                Secure payments verified by our admin team
              </SummaryItem>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-xl shadow-slate-200/70">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Customer Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Name
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {user.name}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Mobile Number
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {user.phone}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Checkout */}
      <Card className="overflow-hidden rounded-3xl border-0 shadow-2xl shadow-slate-200/70">
        <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-brand/5 blur-3xl" />
        <CardHeader className="relative">
          <Badge className="w-fit gap-2 border-0 bg-gradient-to-r from-brand/20 to-brand/10 text-brand">
            <Wallet className="h-4 w-4" />
            Checkout
          </Badge>

          <CardTitle className="mt-3 text-3xl font-extrabold tracking-tight">
            Choose your payment method
          </CardTitle>

          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Select your preferred payment method. You can either pay via bank
            transfer by uploading a receipt, or pay online using a debit/credit
            card.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <PaymentMethodCard
                active={paymentMethod === "BANK_TRANSFER"}
                icon={<Building2 className="h-6 w-6" />}
                title="Bank Transfer"
                description="Upload receipt as PDF or image"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
              />

              <PaymentMethodCard
                active={paymentMethod === "ONLINE_GATEWAY"}
                icon={<CreditCard className="h-6 w-6" />}
                title=" Debit / Credit Card"
                description="Pay online by adding your card details"
                onClick={() => setPaymentMethod("ONLINE_GATEWAY")}
              />
            </div>

            {paymentMethod === "BANK_TRANSFER" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="rounded-2xl border border-border bg-slate-50/80 p-6 dark:bg-slate-800/50">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-brand/10 p-3 text-brand">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        Bank Transfer Details
                      </p>

                      <div className="mt-4 grid gap-2 text-sm">
                        <BankDetail
                          label="Account Name"
                          value="Enfield Nexus Consultancies"
                        />
                        <BankDetail
                          label="Account Number"
                          value="172013758531001"
                        />
                        <BankDetail label="Bank Name" value="Seylan Bank" />
                        <BankDetail label="Branch" value="Hettipola Branch" />

                        <BankDetail
                          label="Payment Reference"
                          value={plan.code}
                        />
                      </div>

                      <p className="mt-4 text-xs leading-5 text-muted-foreground">
                        Once you done the payment please upload the payment
                        proof below.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="paymentProof" className="text-sm font-medium">
                    Upload payment proof{" "}
                    <span className="text-destructive">*</span>
                  </Label>

                  <label
                    htmlFor="paymentProof"
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background px-6 py-8 text-center transition",
                      "hover:border-brand hover:bg-secondary/40",
                      paymentProof && "border-brand bg-secondary/30",
                    )}
                  >
                    {paymentProof ? (
                      <>
                        <FileText className="h-12 w-12 text-brand" />
                        <p className="mt-3 text-sm font-semibold text-foreground">
                          {paymentProof.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="mt-2 text-xs text-brand">
                          Click to change file
                        </p>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-12 w-12 text-brand" />
                        <p className="mt-3 text-sm font-semibold text-foreground">
                          Upload receipt PDF or image
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          PDF, JPG, PNG, or WebP. Maximum 5MB.
                        </p>
                      </>
                    )}

                    <input
                      id="paymentProof"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={handleProofChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {paymentMethod === "ONLINE_GATEWAY" && (
              <div className="rounded-2xl border border-border bg-slate-50/80 p-6 dark:bg-slate-800/50 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-brand/10 p-3 text-brand">
                    <CreditCard className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-foreground">
                      Pay securely with PayHere
                    </p>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      You will be redirected to PayHere to complete the payment
                      using a debit card, credit card, or another supported
                      online payment method. Your package credits will be
                      activated automatically after PayHere confirms the
                      payment.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 p-6 dark:from-slate-800/50 dark:to-slate-900/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {plan.currency} {plan.price.toLocaleString()}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full cursor-pointer text-base"
            >
              {isSubmitting
                ? "Submitting..."
                : paymentMethod === "BANK_TRANSFER"
                  ? "Submit Payment Proof"
                  : "Continue to Online Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentMethodCard({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border-2 p-5 text-left transition-all duration-300 cursor-pointer",
        active
          ? "border-brand bg-secondary/80 text-foreground shadow-lg shadow-brand/20"
          : "border-border bg-background text-muted-foreground hover:border-brand/50 hover:bg-secondary/20",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
          active
            ? "bg-gradient-to-br from-brand to-brand/80 text-white shadow-md shadow-brand/30"
            : "bg-muted text-brand",
        )}
      >
        {icon}
      </div>

      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </button>
  );
}

function BankDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 py-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

function SummaryItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand" />
      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}
