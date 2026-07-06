"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, RefreshCcw, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { otpSchema, type OtpInput } from "@/lib/validations/auth";

export default function OtpForm() {
  const router = useRouter();

  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  function updateOtpValue(nextValues: string[]) {
    setOtpValues(nextValues);
    setValue("otp", nextValues.join(""), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function handleOtpChange(value: string, index: number) {
    const digit = value.replace(/\D/g, "").slice(-1);

    const nextValues = [...otpValues];
    nextValues[index] = digit;

    updateOtpValue(nextValues);

    if (digit && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key === "Backspace") {
      if (otpValues[index]) {
        const nextValues = [...otpValues];
        nextValues[index] = "";
        updateOtpValue(nextValues);
        return;
      }

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();

        const nextValues = [...otpValues];
        nextValues[index - 1] = "";
        updateOtpValue(nextValues);
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pastedValue = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 5);

    if (!pastedValue) return;

    const nextValues = ["", "", "", "", ""];

    pastedValue.split("").forEach((digit, index) => {
      nextValues[index] = digit;
    });

    updateOtpValue(nextValues);

    const focusIndex = Math.min(pastedValue.length, 5) - 1;
    inputRefs.current[focusIndex]?.focus();
  }

  async function onSubmit(data: OtpInput) {
    console.log("OTP data:", data);

    toast.success("OTP verified successfully", {
      description: "Backend OTP verification will be connected later.",
    });

    router.push("/dashboard");
  }

  function handleResendOtp() {
    toast.success("OTP resent", {
      description: "Real OTP resend will be connected later.",
    });
  }

  return (
    <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl shadow-slate-200/70">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-brand">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <p className="mt-6 text-sm font-semibold text-brand">
          OTP verification
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Verify your account
        </h1>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Enter the 5-digit OTP code sent to your email or phone number to
          continue securely.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-3">
          <Label>OTP code</Label>

          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {otpValues.map((value, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value}
                onChange={(event) => handleOtpChange(event.target.value, index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onPaste={handlePaste}
                className="h-12 w-12 rounded-md border border-input bg-background text-center text-xl font-bold text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 sm:h-14 sm:w-14"
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <KeyRound className="h-4 w-4" />
            Enter all 5 digits to continue.
          </div>

          {errors.otp && (
            <p className="text-sm font-medium text-destructive">
              {errors.otp.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full text-base"
        >
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-border bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?
        </p>

        <button
          type="button"
          onClick={handleResendOtp}
          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand/80"
        >
          <RefreshCcw className="h-4 w-4" />
          Resend OTP
        </button>
      </div>
    </div>
  );
}
