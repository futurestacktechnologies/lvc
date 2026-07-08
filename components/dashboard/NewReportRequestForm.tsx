"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CarFront, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewReportRequestForm() {
  const router = useRouter();

  const [vehicleIdentifier, setVehicleIdentifier] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [auctionPlatform, setAuctionPlatform] = useState("");
  const [auctionDate, setAuctionDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!vehicleIdentifier.trim()) {
      toast.error("Vehicle identifier required", {
        description: "Please enter chassis number, VIN, or vehicle identifier.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/report-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleIdentifier,
          lotNumber,
          auctionPlatform,
          auctionDate,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Request failed", {
          description: result.message || "Please try again.",
        });
        return;
      }

      toast.success("Report request submitted", {
        description: result.message || "Your request has been submitted.",
      });

      router.push("/dashboard");
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-brand">
            <CarFront className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold text-foreground">
              Vehicle report request
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Enter the vehicle details you want the admin team to check. One
              request credit will be used after submitting.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicleIdentifier">
          Vehicle identifier / Chassis / VIN
        </Label>

        <Input
          id="vehicleIdentifier"
          value={vehicleIdentifier}
          onChange={(event) => setVehicleIdentifier(event.target.value)}
          placeholder="Example: ZVW30-1234567"
          className="h-12 rounded-2xl"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lotNumber">Lot number</Label>

          <Input
            id="lotNumber"
            value={lotNumber}
            onChange={(event) => setLotNumber(event.target.value)}
            placeholder="Example: 3021"
            className="h-12 rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="auctionDate">Auction date</Label>

          <Input
            id="auctionDate"
            type="date"
            value={auctionDate}
            onChange={(event) => setAuctionDate(event.target.value)}
            className="h-12 rounded-2xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="auctionPlatform">Auction platform</Label>

        <Input
          id="auctionPlatform"
          value={auctionPlatform}
          onChange={(event) => setAuctionPlatform(event.target.value)}
          placeholder="Example: USS Tokyo, TAA, JU, CAA"
          className="h-12 rounded-2xl"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full cursor-pointer rounded-2xl text-base"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Submit Report Request
          </>
        )}
      </Button>
    </form>
  );
}
