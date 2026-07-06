"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "OLD_PHONE" | "OLD_OTP" | "NEW_PHONE" | "NEW_OTP" | "DONE";

export default function ChangePhoneForm() {
  const [step, setStep] = useState<Step>("OLD_PHONE");

  function handleOldPhoneSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    toast.success("OTP sent to old phone", {
      description: "Verify your old mobile number first.",
    });

    setStep("OLD_OTP");
  }

  function handleOldOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    toast.success("Old phone verified", {
      description: "Now enter your new mobile number.",
    });

    setStep("NEW_PHONE");
  }

  function handleNewPhoneSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    toast.success("OTP sent to new phone", {
      description: "Verify your new mobile number.",
    });

    setStep("NEW_OTP");
  }

  function handleNewOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    toast.success("Phone number changed", {
      description: "Your mobile number has been updated successfully.",
    });

    setStep("DONE");
  }

  return (
    <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl shadow-slate-200/70">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

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

      {step === "OLD_PHONE" && (
        <form onSubmit={handleOldPhoneSubmit} className="mt-8 space-y-5">
          <PhoneField
            id="oldPhone"
            label="Old mobile number"
            placeholder="+94 77 123 4567"
          />

          <Button className="h-12 w-full text-base">
            Send OTP to Old Phone
          </Button>
        </form>
      )}

      {step === "OLD_OTP" && (
        <form onSubmit={handleOldOtpSubmit} className="mt-8 space-y-5">
          <OtpField label="OTP sent to old phone" />

          <Button className="h-12 w-full text-base">Verify Old Phone</Button>
        </form>
      )}

      {step === "NEW_PHONE" && (
        <form onSubmit={handleNewPhoneSubmit} className="mt-8 space-y-5">
          <PhoneField
            id="newPhone"
            label="New mobile number"
            placeholder="+94 76 987 6543"
          />

          <Button className="h-12 w-full text-base">
            Send OTP to New Phone
          </Button>
        </form>
      )}

      {step === "NEW_OTP" && (
        <form onSubmit={handleNewOtpSubmit} className="mt-8 space-y-5">
          <OtpField label="OTP sent to new phone" />

          <Button className="h-12 w-full text-base">
            Verify & Update Phone
          </Button>
        </form>
      )}

      {step === "DONE" && (
        <div className="mt-8 rounded-2xl border border-border bg-muted p-5">
          <p className="font-semibold text-foreground">
            Phone number updated successfully.
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            You can now login using your new mobile number.
          </p>

          <Link href="/login">
            <Button className="mt-5 h-12 w-full text-base">Go to Login</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function PhoneField({
  id,
  label,
  placeholder,
}: {
  id: string;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

        <Input
          id={id}
          type="tel"
          placeholder={placeholder}
          className="h-12 pl-11"
        />
      </div>
    </div>
  );
}

function OtpField({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Input
            key={index}
            inputMode="numeric"
            maxLength={1}
            className="h-12 text-center text-lg font-bold"
          />
        ))}
      </div>
    </div>
  );
}
