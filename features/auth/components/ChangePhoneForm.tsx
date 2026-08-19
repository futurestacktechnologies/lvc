"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "OLD_PHONE" | "OLD_OTP" | "NEW_PHONE" | "NEW_OTP" | "DONE";

const ease = [0.22, 1, 0.36, 1] as const;

const stepOrder: Step[] = [
  "OLD_PHONE",
  "OLD_OTP",
  "NEW_PHONE",
  "NEW_OTP",
  "DONE",
];

export default function ChangePhoneForm() {
  const [step, setStep] = useState<Step>("OLD_PHONE");

  const [oldPhone, setOldPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [oldOtp, setOldOtp] = useState("");
  const [newOtp, setNewOtp] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resendType, setResendType] = useState<"OLD" | "NEW" | null>(null);

  const currentStepIndex = stepOrder.indexOf(step);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  function startResendCountdown(type: "OLD" | "NEW") {
    setResendType(type);
    setResendSeconds(60);
  }

  async function handleResendOtp() {
    if (resendSeconds > 0 || isSubmitting || !resendType) {
      return;
    }

    const phone = resendType === "OLD" ? oldPhone : newPhone;

    if (!phone.trim()) {
      toast.error("Mobile number required", {
        description: "Please enter a mobile number first.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint =
        resendType === "OLD"
          ? "/api/auth/change-phone/start-old"
          : "/api/auth/change-phone/start-new";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Failed to resend OTP", {
          description: result.message || "Please try again.",
        });

        return;
      }

      if (resendType === "OLD") {
        setOldOtp("");
      } else {
        setNewOtp("");
      }

      startResendCountdown(resendType);

      toast.success("New OTP sent", {
        description: result.devOtp
          ? `Development OTP: ${result.devOtp}`
          : `A new verification code was sent to your ${
              resendType === "OLD" ? "old" : "new"
            } mobile number.`,
      });
    } catch (error) {
      console.error("Resend OTP failed:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOldPhoneSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!oldPhone.trim()) {
      toast.error("Mobile number required", {
        description: "Please enter your old mobile number.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-phone/start-old", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: oldPhone,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Failed to send OTP", {
          description: result.message || "Please try again.",
        });
        return;
      }

      toast.success("OTP sent", {
        description: result.devOtp
          ? `Development OTP: ${result.devOtp}`
          : "OTP sent to your old mobile number.",
      });

      setOldOtp("");
      startResendCountdown("OLD");
      setStep("OLD_OTP");
    } catch (error) {
      console.error("Start old phone change failed:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOldOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (oldOtp.length !== 5) {
      toast.error("Invalid OTP", {
        description: "Please enter the 5-digit OTP.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-phone/verify-old", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp: oldOtp,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("OTP verification failed", {
          description: result.message || "Please enter the correct OTP.",
        });
        return;
      }

      toast.success("Old phone verified", {
        description: "Now enter your new mobile number.",
      });

      setOldOtp("");
      setStep("NEW_PHONE");
    } catch (error) {
      console.error("Verify old phone failed:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNewPhoneSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newPhone.trim()) {
      toast.error("Mobile number required", {
        description: "Please enter your new mobile number.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-phone/start-new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: newPhone,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Failed to send OTP", {
          description: result.message || "Please try again.",
        });
        return;
      }

      toast.success("OTP sent", {
        description: result.devOtp
          ? `Development OTP: ${result.devOtp}`
          : "OTP sent to your new mobile number.",
      });

      setNewOtp("");
      startResendCountdown("NEW");
      setStep("NEW_OTP");
    } catch (error) {
      console.error("Start new phone change failed:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNewOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newOtp.length !== 5) {
      toast.error("Invalid OTP", {
        description: "Please enter the 5-digit OTP.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-phone/verify-new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: newPhone,
          otp: newOtp,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("OTP verification failed", {
          description: result.message || "Please try again.",
        });
        return;
      }

      toast.success("Phone number changed", {
        description: "Your mobile number has been updated successfully.",
      });

      setNewOtp("");
      setStep("DONE");
    } catch (error) {
      console.error("Verify new phone failed:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.16,
          ease,
        }}
      >
        <p className="mt-6 text-sm font-semibold text-brand">
          Change mobile number
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Secure phone number update
        </h1>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          To protect your account, we first verify your old phone number, then
          verify your new phone number.
        </p>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.9 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.25,
          ease,
        }}
        className="mt-7"
      >
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Step {Math.min(currentStepIndex + 1, 4)} of 4</span>

          <span>
            {step === "OLD_PHONE" && "Verify old number"}
            {step === "OLD_OTP" && "Verify old OTP"}
            {step === "NEW_PHONE" && "Enter new number"}
            {step === "NEW_OTP" && "Verify new OTP"}
            {step === "DONE" && "Completed"}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={false}
            animate={{
              width:
                step === "DONE"
                  ? "100%"
                  : `${((currentStepIndex + 1) / 4) * 100}%`,
            }}
            transition={{
              duration: 0.45,
              ease,
            }}
          />
        </div>
      </motion.div>

      <div className="relative mt-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* OLD PHONE */}
          {step === "OLD_PHONE" && (
            <StepContainer key="old-phone">
              <form onSubmit={handleOldPhoneSubmit} className="space-y-5">
                <PhoneField
                  id="oldPhone"
                  label="Old mobile number"
                  placeholder="+94 77 123 4567"
                  value={oldPhone}
                  onChange={setOldPhone}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full cursor-pointer text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/20"
                >
                  {isSubmitting ? "Sending OTP..." : "Send OTP to Old Phone"}
                </Button>
              </form>
            </StepContainer>
          )}

          {/* OLD OTP */}
          {step === "OLD_OTP" && (
            <StepContainer key="old-otp">
              <form onSubmit={handleOldOtpSubmit} className="space-y-5">
                <OtpField
                  label="Verify your old mobile number"
                  phone={oldPhone}
                  value={oldOtp}
                  onChange={setOldOtp}
                  disabled={isSubmitting}
                />

                <ResendOtp
                  seconds={resendType === "OLD" ? resendSeconds : 0}
                  disabled={isSubmitting}
                  onResend={handleResendOtp}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer h-12 w-full text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/20"
                >
                  {isSubmitting ? "Verifying..." : "Verify Old Phone"}
                </Button>
              </form>
            </StepContainer>
          )}

          {/* NEW PHONE */}
          {step === "NEW_PHONE" && (
            <StepContainer key="new-phone">
              <form onSubmit={handleNewPhoneSubmit} className="space-y-5">
                <PhoneField
                  id="newPhone"
                  label="New mobile number"
                  placeholder="+94 76 987 6543"
                  value={newPhone}
                  onChange={setNewPhone}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer h-12 w-full text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/20"
                >
                  {isSubmitting ? "Sending OTP..." : "Send OTP to New Phone"}
                </Button>
              </form>
            </StepContainer>
          )}

          {/* NEW OTP */}
          {step === "NEW_OTP" && (
            <StepContainer key="new-otp">
              <form onSubmit={handleNewOtpSubmit} className="space-y-5">
                <OtpField
                  label="Verify your new mobile number"
                  phone={newPhone}
                  value={newOtp}
                  onChange={setNewOtp}
                  disabled={isSubmitting}
                />

                <ResendOtp
                  seconds={resendType === "NEW" ? resendSeconds : 0}
                  disabled={isSubmitting}
                  onResend={handleResendOtp}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer h-12 w-full text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/20"
                >
                  {isSubmitting ? "Updating..." : "Verify & Update Phone"}
                </Button>
              </form>
            </StepContainer>
          )}

          {/* DONE */}
          {step === "DONE" && (
            <StepContainer key="done">
              <div className="rounded-2xl border border-border bg-muted p-5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.45,
                    ease,
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success"
                >
                  <Phone className="h-5 w-5" />
                </motion.div>

                <p className="mt-4 font-semibold text-foreground">
                  Phone number updated successfully.
                </p>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  You can now login using your new mobile number.
                </p>

                <Link href="/login" className="block">
                  <Button className="cursor-pointer mt-5 h-12 w-full text-base">
                    Go to Login
                  </Button>
                </Link>
              </div>
            </StepContainer>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StepContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

function PhoneField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease,
      }}
      className="space-y-2"
    >
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

        <Input
          id={id}
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 pl-11 transition-all duration-200 focus:ring-2 focus:ring-brand/20"
        />
      </div>
    </motion.div>
  );
}

function OtpField({
  label,
  phone,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  phone?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function focusInput(index: number) {
    if (index >= 0 && index < 5) {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    }
  }

  function handleChange(index: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");

    // Handle OTP paste/autofill
    if (digits.length > 1) {
      const otp = digits.slice(0, 5);

      onChange(otp);

      requestAnimationFrame(() => {
        focusInput(Math.min(otp.length, 4));
      });

      return;
    }

    const digit = digits.slice(0, 1);

    const nextValue = value.padEnd(5, " ").split("");

    nextValue[index] = digit;

    const otp = nextValue.join("").replace(/ /g, "").slice(0, 5);

    onChange(otp);

    if (digit && index < 4) {
      requestAnimationFrame(() => {
        focusInput(index + 1);
      });
    }
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace") {
      if (value[index]) {
        const nextValue = value.split("");

        nextValue[index] = "";

        onChange(nextValue.join(""));

        return;
      }

      if (index > 0) {
        const nextValue = value.split("");

        nextValue[index - 1] = "";

        onChange(nextValue.join(""));

        requestAnimationFrame(() => {
          focusInput(index - 1);
        });
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();

      focusInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < 4) {
      event.preventDefault();

      focusInput(index + 1);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 5);

    if (!pasted) return;

    onChange(pasted);

    requestAnimationFrame(() => {
      focusInput(Math.min(pasted.length, 4));
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease,
      }}
      className="space-y-3"
    >
      <div>
        <Label>{label}</Label>

        {phone && (
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a 5-digit verification code to{" "}
            <span className="font-medium text-foreground">{phone}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{
              opacity: 0,
              scale: 0.85,
              y: 8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.3,
              delay: index * 0.04,
              ease,
            }}
          >
            <Input
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={value[index] || ""}
              disabled={disabled}
              aria-label={`OTP digit ${index + 1}`}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              className="h-12 text-center text-lg font-bold transition-all duration-200 focus:ring-2 focus:ring-brand/20 sm:h-14 sm:text-xl"
            />
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Enter the 5-digit code sent to your mobile number.
      </p>
    </motion.div>
  );
}

function ResendOtp({
  seconds,
  disabled,
  onResend,
}: {
  seconds: number;
  disabled: boolean;
  onResend: () => void;
}) {
  const canResend = seconds === 0 && !disabled;

  return (
    <div className="flex items-center justify-center pt-1 text-sm">
      {seconds > 0 ? (
        <p className="text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <span className="font-medium text-foreground">
            Resend in {seconds}s
          </span>
        </p>
      ) : (
        <p className="text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={!canResend}
            className="cursor-pointer font-semibold text-brand transition-colors hover:text-brand/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resend OTP
          </button>
        </p>
      )}
    </div>
  );
}
