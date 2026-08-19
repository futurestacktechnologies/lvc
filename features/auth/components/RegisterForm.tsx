"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Phone, Tag, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

const ease = [0.22, 1, 0.36, 1] as const;

export default function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  async function onSubmit(data: RegisterInput) {
    const response = await fetch("/api/auth/register/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      toast.error("Registration failed", {
        description: result.message || "Please check your details.",
      });
      return;
    }

    sessionStorage.setItem(
      "jrp_pending_auth",
      JSON.stringify({
        name: data.name,
        phone: data.phone,
        type: "signup",
      }),
    );

    toast.success("OTP sent", {
      description: result.devOtp
        ? `Development OTP: ${result.devOtp}`
        : "OTP sent through WhatsApp and SMS.",
    });

    router.push("/verify-otp?type=signup");
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.08,
          ease,
        }}
      >
        <p className="text-sm font-semibold text-brand">Create account</p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Start your journey
        </h1>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Create an account using your name and mobile number. We&apos;ll verify
          your number using OTP.
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
              delayChildren: 0.18,
            },
          },
        }}
      >
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
          className="space-y-2"
        >
          <Label htmlFor="name">Full name</Label>

          <div className="relative">
            <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="name"
              placeholder="Your full name"
              className="h-12 pl-11 transition-all duration-200 focus:ring-2 focus:ring-brand/20"
              {...register("name")}
            />
          </div>

          {errors.name && (
            <p className="text-sm font-medium text-destructive">
              {errors.name.message}
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
          className="space-y-2"
        >
          <Label htmlFor="phone">Mobile number</Label>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="phone"
              type="tel"
              placeholder="+94 77 123 4567"
              className="h-12 pl-11 transition-all duration-200 focus:ring-2 focus:ring-brand/20"
              {...register("phone")}
            />
          </div>

          {errors.phone && (
            <p className="text-sm font-medium text-destructive">
              {errors.phone.message}
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
          className="space-y-2"
        >
          <Label htmlFor="promoCode">
            Promo Code <span className="text-muted-foreground">(Optional)</span>
          </Label>

          <div className="relative">
            <Tag className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="promoCode"
              placeholder="Enter Promo Code if you have one"
              className="h-12 pl-11 uppercase transition-all duration-200 focus:ring-2 focus:ring-brand/20"
              {...register("promoCode")}
            />
          </div>

          {errors.promoCode && (
            <p className="text-sm font-medium text-destructive">
              {errors.promoCode.message}
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
            className="h-12 w-full cursor-pointer text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/20"
          >
            {isSubmitting ? "Sending OTP..." : "Create Account"}
          </Button>
        </motion.div>
      </motion.form>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.55,
        }}
        className="mt-6 text-center text-sm text-muted-foreground"
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand transition hover:text-brand/80"
        >
          Login
        </Link>
      </motion.p>
    </motion.div>
  );
}
