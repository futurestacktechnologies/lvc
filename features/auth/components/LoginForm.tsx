"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, type Variants } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const formContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

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
    <motion.div
      initial={{
        opacity: 0,
        y: 25,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="rounded-[2rem] border border-border bg-card p-8 shadow-xl shadow-slate-200/70"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={formContainerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <p className="text-sm font-semibold text-brand">Welcome back</p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            Login with mobile number
          </h1>

          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Enter your registered mobile number. We&apos;ll send an OTP through
            to continue securely.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-5"
          variants={formContainerVariants}
        >
          <motion.div variants={itemVariants} className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="phone"
                type="tel"
                placeholder="+94 77 123 4567"
                className="h-12 pl-11 transition-shadow duration-200 focus:shadow-md focus:shadow-brand/10"
                {...register("phone")}
              />
            </div>

            {errors.phone && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium text-destructive"
              >
                {errors.phone.message}
              </motion.p>
            )}

            <Link
              href="/change-phone"
              className="block text-right text-sm font-semibold text-brand transition hover:text-brand/80"
            >
              Change phone number
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full cursor-pointer text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/20"
            >
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </Button>
          </motion.div>
        </motion.form>

        {/* Register */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand transition hover:text-brand/80"
          >
            Create account
          </Link>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
