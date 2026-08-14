"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AgentPayoutButtonProps = {
  agentId: string;
  agentName: string;
  pendingAmount: number;
};

export default function AgentPayoutButton({
  agentId,
  agentName,
  pendingAmount,
}: AgentPayoutButtonProps) {
  const [open, setOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePayout() {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/agents/${agentId}/payout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentReference,
          note,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payout failed.");
      }

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(error instanceof Error ? error.message : "Payout failed.");
    } finally {
      setLoading(false);
    }
  }

  if (pendingAmount <= 0) {
    return (
      <Button variant="outline" disabled className="rounded-xl">
        <CheckCircle2 className="mr-2 h-4 w-4" />
        All Paid
      </Button>
    );
  }

  return (
    <>
      <Button
        className="cursor-pointer rounded-xl"
        onClick={() => setOpen(true)}
      >
        Pay Commission
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Agent Commission</DialogTitle>

            <DialogDescription>
              You are about to pay the pending commission to {agentName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Pending Commission
              </p>

              <p className="mt-1 text-2xl font-bold text-brand">
                LKR{" "}
                {pendingAmount.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Reference</label>

              <Input
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="e.g. TXN123456"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>

              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional payout note"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button onClick={handlePayout} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
