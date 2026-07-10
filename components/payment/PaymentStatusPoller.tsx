"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PaymentStatusResponse = {
  success: boolean;
  message?: string;
  payment?: {
    paymentNumber: string;
    status: string;
    method: string;
    amount: number;
    currency: string;
    gatewayRef: string | null;
    adminNote: string | null;
    verifiedAt: string | null;
    createdAt: string;
  };
  package?: {
    packageNumber: string;
    status: string;
    totalRequests: number;
    remainingRequests: number;
    activatedAt: string | null;
  } | null;
  plan?: {
    name: string;
    requestCredits: number;
  };
  state?: {
    isSuccessful: boolean;
    isFailed: boolean;
    isFinal: boolean;
  };
};

type PaymentStatusPollerProps = {
  paymentNumber?: string | null;
};

const maxAttempts = 40;

export default function PaymentStatusPoller({
  paymentNumber,
}: PaymentStatusPollerProps) {
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(paymentNumber));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const paymentStatus = data?.payment?.status;
  const packageStatus = data?.package?.status;

  const displayState = useMemo(() => {
    if (!paymentNumber) {
      return {
        title: "Payment reference missing",
        description:
          "We could not find the payment reference in the URL. Please check your dashboard or contact support.",
        icon: AlertTriangle,
        iconClassName: "bg-amber-100 text-amber-700",
        badgeClassName: "bg-amber-100 text-amber-700",
        badgeLabel: "Action Needed",
      };
    }

    if (errorMessage) {
      return {
        title: "Unable to check status",
        description: errorMessage,
        icon: AlertTriangle,
        iconClassName: "bg-amber-100 text-amber-700",
        badgeClassName: "bg-amber-100 text-amber-700",
        badgeLabel: "Retry",
      };
    }

    if (data?.state?.isSuccessful) {
      return {
        title: "Payment confirmed",
        description:
          "Your online payment has been confirmed. Your package credits are now available in your dashboard.",
        icon: CheckCircle2,
        iconClassName: "bg-emerald-100 text-emerald-700",
        badgeClassName: "bg-emerald-100 text-emerald-700",
        badgeLabel: "Paid",
      };
    }

    if (paymentStatus === "REFUNDED") {
      return {
        title: "Payment refunded",
        description:
          "This payment was marked as refunded. Please contact support if you need help with this payment.",
        icon: XCircle,
        iconClassName: "bg-red-100 text-red-700",
        badgeClassName: "bg-red-100 text-red-700",
        badgeLabel: "Refunded",
      };
    }

    if (data?.state?.isFailed) {
      return {
        title: "Payment not completed",
        description:
          data.payment?.adminNote ||
          "PayHere did not confirm this payment. Please try again or contact support.",
        icon: XCircle,
        iconClassName: "bg-red-100 text-red-700",
        badgeClassName: "bg-red-100 text-red-700",
        badgeLabel: "Failed",
      };
    }

    if (attempts >= maxAttempts) {
      return {
        title: "Still waiting for confirmation",
        description:
          "PayHere has not confirmed the payment yet. This can happen if the callback is delayed. Please refresh or check your dashboard later.",
        icon: Clock,
        iconClassName: "bg-amber-100 text-amber-700",
        badgeClassName: "bg-amber-100 text-amber-700",
        badgeLabel: "Processing",
      };
    }

    return {
      title: "Checking payment confirmation",
      description:
        "We are waiting for PayHere to send the secure payment confirmation to our system.",
      icon: Clock,
      iconClassName: "bg-blue-100 text-blue-700",
      badgeClassName: "bg-blue-100 text-blue-700",
      badgeLabel: "Processing",
    };
  }, [attempts, data, errorMessage, paymentNumber, paymentStatus]);

  const fetchStatus = useCallback(
    async (manual = false): Promise<PaymentStatusResponse | null> => {
      if (!paymentNumber) return null;

      try {
        if (manual) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setErrorMessage(null);

        const response = await fetch(
          `/api/payments/status?paymentNumber=${encodeURIComponent(
            paymentNumber,
          )}`,
          {
            cache: "no-store",
          },
        );

        const result = (await response.json()) as PaymentStatusResponse;

        if (!response.ok || !result.success) {
          setErrorMessage(result.message || "Unable to check payment status.");
          return null;
        }

        setData(result);
        return result;
      } catch (error) {
        console.error(error);
        setErrorMessage("Something went wrong while checking payment status.");
        return null;
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [paymentNumber],
  );

  useEffect(() => {
    if (!paymentNumber) return;

    let cancelled = false;
    let timeoutId: number | undefined;

    async function pollStatus(currentAttempt: number) {
      if (cancelled) return;

      const result = await fetchStatus(false);

      if (cancelled) return;

      const nextAttempt = currentAttempt + 1;
      const isFinal = Boolean(result?.state?.isFinal);

      setAttempts(nextAttempt);

      if (!isFinal && nextAttempt < maxAttempts) {
        timeoutId = window.setTimeout(() => {
          pollStatus(nextAttempt);
        }, 3000);
      }
    }

    pollStatus(0);

    return () => {
      cancelled = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [fetchStatus, paymentNumber]);

  const Icon = displayState.icon;

  return (
    <Card className="mx-auto max-w-2xl rounded-3xl border-0 shadow-xl shadow-slate-200/70">
      <CardContent className="p-6 sm:p-8">
        <div className="text-center">
          <div
            className={cn(
              "mx-auto flex h-16 w-16 items-center justify-center rounded-3xl",
              displayState.iconClassName,
            )}
          >
            {isLoading && !data ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Icon className="h-8 w-8" />
            )}
          </div>

          <Badge
            className={cn(
              "mt-5 border-0 px-3 py-1",
              displayState.badgeClassName,
            )}
          >
            {displayState.badgeLabel}
          </Badge>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
            {displayState.title}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
            {displayState.description}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-slate-50/80 p-5 dark:bg-slate-800/50">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatusDetail
              label="Payment Number"
              value={paymentNumber || "Not available"}
            />
            <StatusDetail label="Payment Status" value={paymentStatus || "-"} />
            <StatusDetail label="Package Status" value={packageStatus || "-"} />
            <StatusDetail
              label="Package"
              value={data?.plan?.name || "Checking..."}
            />
          </div>

          {data?.package && (
            <div className="mt-5 rounded-2xl bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Available Credits
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {data.package.remainingRequests}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total Credits
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {data.package.totalRequests}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchStatus(true)}
            disabled={!paymentNumber || isRefreshing}
            className="flex-1 rounded-2xl"
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Status
          </Button>

          <Link href="/dashboard" className="flex-1">
            <Button className="w-full rounded-2xl">Go to Dashboard</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
