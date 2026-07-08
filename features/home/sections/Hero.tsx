"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Container from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Clock,
  Download,
  FileText,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

const stats = [
  {
    icon: ShieldCheck,
    value: "100%",
    label: "Manual Verification",
    text: "Every record checked by our team",
  },
  {
    icon: Clock,
    value: "24h",
    label: "Fast Delivery",
    text: "Receive reports quickly online",
  },
  {
    icon: FileText,
    value: "PDF",
    label: "Professional Report",
    text: "Delivered to your account securely",
  },
  {
    icon: LockKeyhole,
    value: "Secure",
    label: "Data Protection",
    text: "Your request details stay safe",
  },
];

interface HeroProps {
  onSearchByLotClick?: () => void; // 👈 new prop
}

export default function Hero({}: HeroProps) {
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<"chassis" | "auction">(
    "chassis",
  );

  const [vehicleIdentifier, setVehicleIdentifier] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [auctionDate, setAuctionDate] = useState("");
  const [auctionPlatform, setAuctionPlatform] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVehicleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hasVehicleIdentifier = vehicleIdentifier.trim().length > 0;

    if (searchMode === "chassis") {
      if (!hasVehicleIdentifier) {
        toast.error("Chassis/VIN required", {
          description: "Please enter chassis number or VIN.",
        });
        return;
      }
    }

    if (searchMode === "auction") {
      if (!lotNumber.trim()) {
        toast.error("Lot number required", {
          description: "Please enter the auction lot number.",
        });
        return;
      }

      if (!auctionDate.trim()) {
        toast.error("Auction date required", {
          description: "Please select the auction date.",
        });
        return;
      }

      if (!auctionPlatform.trim()) {
        toast.error("Auction platform required", {
          description: "Please enter auction platform.",
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/report-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleIdentifier: searchMode === "chassis" ? vehicleIdentifier : "",
          lotNumber: searchMode === "auction" ? lotNumber : "",
          auctionDate: searchMode === "auction" ? auctionDate : "",
          auctionPlatform: searchMode === "auction" ? auctionPlatform : "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.code === "UNAUTHENTICATED") {
          toast.error("Login required", {
            description: "Please login before submitting a report request.",
          });

          router.push("/login");
          return;
        }

        toast.error("Request failed", {
          description: result.message || "Please check your vehicle details.",
        });

        return;
      }

      toast.success("Request submitted", {
        description: result.message,
      });

      router.push("/dashboard/report-requests");
      router.refresh();
    } catch {
      toast.error("Request failed", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background with gradient and glow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50/50 via-background to-background" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />

      <Container className="pt-8 lg:pt-12 pb-12 lg:pb-16">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Japan Vehicle History Reports
            </div>

            <h1 className="mt-7 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              Get{" "}
              <span className="bg-gradient-to-r from-brand to-indigo-400 bg-clip-text text-transparent">
                Authentic
              </span>{" "}
              Japanese Vehicle History Reports
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Enter your chassis number, complete the payment, and our team will
              manually verify the vehicle details before delivering a
              professional PDF report to your account.
            </p>

            {/* Search Card with glass effect */}
            <div className="mt-8 max-w-2xl rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-2xl shadow-slate-200/60 backdrop-blur-sm">
              <form onSubmit={handleVehicleSearch} className="space-y-4">
                <div className="flex rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchMode("chassis");
                      setLotNumber("");
                      setAuctionDate("");
                      setAuctionPlatform("");
                    }}
                    className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                      searchMode === "chassis"
                        ? "bg-white text-brand shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Chassis / VIN
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchMode("auction");
                      setVehicleIdentifier("");
                    }}
                    className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition cursor-pointer ${
                      searchMode === "auction"
                        ? "bg-white text-brand shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Lot / Auction
                  </button>
                </div>

                {searchMode === "chassis" ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                      <Input
                        value={vehicleIdentifier}
                        onChange={(event) =>
                          setVehicleIdentifier(event.target.value)
                        }
                        placeholder="Enter Chassis Number or VIN"
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 text-base shadow-none focus:ring-2 focus:ring-brand/50"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-14 rounded-2xl bg-brand px-7 text-base font-semibold shadow-lg shadow-brand/30 transition-all duration-300 hover:bg-brand/90 hover:shadow-brand/40 cursor-pointer"
                    >
                      {isSubmitting ? "Submitting..." : "Check Report"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        value={lotNumber}
                        onChange={(event) => setLotNumber(event.target.value)}
                        placeholder="Enter Lot Number"
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/80 text-base shadow-none focus:ring-2 focus:ring-brand/50"
                      />

                      <Input
                        type="date"
                        value={auctionDate}
                        onChange={(event) => setAuctionDate(event.target.value)}
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/80 text-base shadow-none focus:ring-2 focus:ring-brand/50"
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        value={auctionPlatform}
                        onChange={(event) =>
                          setAuctionPlatform(event.target.value)
                        }
                        placeholder="Auction Platform: USS Tokyo, TAA, JU, CAA"
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/80 text-base shadow-none focus:ring-2 focus:ring-brand/50"
                      />

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-14 rounded-2xl bg-brand px-7 text-base font-semibold shadow-lg shadow-brand/30 transition-all duration-300 hover:bg-brand/90 hover:shadow-brand/40 cursor-pointer"
                      >
                        {isSubmitting ? "Submitting..." : "Check Report"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </form>

              <div className="mt-4 flex flex-col gap-3 px-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <button className="inline-flex items-center gap-2 font-medium text-brand hover:text-indigo-700 transition-colors cursor-pointer">
                  <Download className="h-4 w-4" />
                  See report sample
                </button>
              </div>
            </div>

            {/* Mini Cards */}
            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-brand">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-950">
                      Manual Verification
                    </p>
                    <p className="text-sm text-slate-500">
                      Experts verify every record
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-950">
                      Quick Delivery
                    </p>
                    <p className="text-sm text-slate-500">
                      Get your PDF report fast
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual - unchanged */}
          <div className="relative hidden min-h-[520px] lg:block">
            {/* Main Report Card */}
            <div className="absolute left-0 top-8 w-[560px] rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/50">
              <Image
                src="/bg-hero.jpg"
                alt="Vehicle report preview"
                width={560}
                height={520}
                className="w-full rounded-[1.5rem]"
                priority
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-sm md:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-2xl p-3 lg:border-r lg:border-slate-100 lg:last:border-r-0"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-brand">
                      {item.value}
                    </p>
                    <p className="font-semibold text-slate-950">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
