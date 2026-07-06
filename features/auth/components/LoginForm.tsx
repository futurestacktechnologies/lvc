"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export default function LoginForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    const response = await fetch("/api/auth/login/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      toast.error("Login failed", {
        description: result.message || "Please check your mobile number.",
      });
      return;
    }

    sessionStorage.setItem(
      "jrp_pending_auth",
      JSON.stringify({
        phone: data.phone,
        type: "login",
      }),
    );

    toast.success("OTP sent", {
      description: result.devOtp
        ? `Development OTP: ${result.devOtp}`
        : "OTP sent through WhatsApp and SMS.",
    });

    router.push("/verify-otp?type=login");
  }

  return (
    <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl shadow-slate-200/70">
      <div>
        <p className="text-sm font-semibold text-brand">Welcome back</p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Login with mobile number
        </h1>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Enter your registered mobile number. We&apos;ll send an OTP through to
          continue securely.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile number</Label>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="phone"
              type="tel"
              placeholder="+94 77 123 4567"
              className="h-12 pl-11"
              {...register("phone")}
            />
          </div>

          {errors.phone && (
            <p className="text-sm font-medium text-destructive">
              {errors.phone.message}
            </p>
          )}

          <Link
            href="/change-phone"
            className="block text-right font-semibold text-brand text-sm transition hover:text-brand/80"
          >
            Change phone number
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full text-base"
        >
          {isSubmitting ? "Sending OTP..." : "Send OTP"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand transition hover:text-brand/80"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
