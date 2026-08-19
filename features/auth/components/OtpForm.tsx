"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, KeyRound, RefreshCcw, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { otpSchema, type OtpInput } from "@/lib/validations/auth";

const OTP_LENGTH = 5;

const ease = [0.22, 1, 0.36, 1] as const;

type PendingAuth = {
  phone: string;
  type: "signup" | "login";
  name?: string;
};

function getPendingAuth(): PendingAuth | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = sessionStorage.getItem("jrp_pending_auth");

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as PendingAuth;

    if (!parsedValue.phone || !parsedValue.type) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

export default function OtpForm() {
  const router = useRouter();

  const [otpValues, setOtpValues] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );

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

  useEffect(() => {
    const pendingAuth = getPendingAuth();

    if (!pendingAuth) {
      sessionStorage.removeItem("jrp_pending_auth");

      toast.error("OTP session not found", {
        description: "Please login or register again.",
      });

      router.push("/login");
    }
  }, [router]);

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

    if (digit && index < OTP_LENGTH - 1) {
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

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pastedValue = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedValue) return;

    const nextValues = Array.from({ length: OTP_LENGTH }, () => "");

    pastedValue.split("").forEach((digit, index) => {
      nextValues[index] = digit;
    });

    updateOtpValue(nextValues);

    const focusIndex = Math.min(pastedValue.length, OTP_LENGTH) - 1;
    inputRefs.current[focusIndex]?.focus();
  }

  async function onSubmit(data: OtpInput) {
    const pendingAuth = getPendingAuth();

    if (!pendingAuth) {
      toast.error("OTP session not found", {
        description: "Please login or register again.",
      });

      router.push("/login");
      return;
    }

    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: pendingAuth.phone,
        otp: data.otp,
        type: pendingAuth.type,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      toast.error("OTP verification failed", {
        description: result.message || "Please check your OTP code.",
      });
      return;
    }

    sessionStorage.removeItem("jrp_pending_auth");

    toast.success("OTP verified successfully", {
      description: "You are now logged in.",
    });

    const userRole = result.user?.role;

    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  }

  async function handleResendOtp() {
    const pendingAuth = getPendingAuth();

    if (!pendingAuth) {
      toast.error("OTP session not found", {
        description: "Please login or register again.",
      });

      router.push("/login");
      return;
    }

    const endpoint =
      pendingAuth.type === "signup"
        ? "/api/auth/register/start"
        : "/api/auth/login/start";

    const body =
      pendingAuth.type === "signup"
        ? {
            name: pendingAuth.name || "Customer",
            phone: pendingAuth.phone,
          }
        : {
            phone: pendingAuth.phone,
          };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      toast.error("OTP resend failed", {
        description: result.message || "Please try again.",
      });
      return;
    }

    toast.success("OTP resent", {
      description: result.devOtp
        ? `Development OTP: ${result.devOtp}`
        : "OTP sent through WhatsApp and SMS.",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.65,
        ease,
      }}
      className="rounded-[2rem] border border-border bg-card p-8 shadow-xl shadow-slate-200/70"
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.45,
          delay: 0.08,
          ease,
        }}
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.18,
          ease,
        }}
        className="mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-brand"
      >
        <ShieldCheck className="h-7 w-7" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.25,
          ease,
        }}
      >
        <p className="mt-6 text-sm font-semibold text-brand">
          OTP verification
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Verify your account
        </h1>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Enter the 5-digit OTP code sent to your mobile number through WhatsApp
          and SMS.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08,
              delayChildren: 0.35,
            },
          },
        }}
      >
        <motion.div
          variants={{
            hidden: {
              opacity: 0,
              y: 15,
            },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.45,
                ease,
              },
            },
          }}
          className="space-y-3"
        >
          <div className="flex gap-2 sm:gap-3">
            {otpValues.map((value, index) => (
              <motion.input
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
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.35,
                  delay: 0.4 + index * 0.05,
                  ease,
                }}
                className="h-15 w-15 rounded-md border border-input bg-background text-center text-xl font-bold text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 sm:h-14 sm:w-14"
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
        </motion.div>

        <motion.div
          variants={{
            hidden: {
              opacity: 0,
              y: 12,
            },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.45,
                ease,
              },
            },
          }}
        >
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/20"
          >
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </Button>
        </motion.div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          delay: 0.75,
          ease,
        }}
        className="mt-6 rounded-2xl border border-border bg-muted p-4"
      >
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?
        </p>

        <button
          type="button"
          onClick={handleResendOtp}
          className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand/80"
        >
          <RefreshCcw className="h-4 w-4" />
          Resend OTP
        </button>
      </motion.div>
    </motion.div>
  );
}
