"use client";

import { CalendarDays, RotateCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CommissionRange =
  | "all"
  | "this-month"
  | "last-month"
  | "last-3-months"
  | "custom";

type AgentCommissionFiltersProps = {
  range: CommissionRange;
  from?: string;
  to?: string;
};

export default function AgentCommissionFilters({
  range,
  from,
  to,
}: AgentCommissionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");

  function updateRange(nextRange: CommissionRange) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("commissionRange", nextRange);

    if (nextRange !== "custom") {
      params.delete("from");
      params.delete("to");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.set("commissionRange", "custom");
    params.set("from", customFrom);
    params.set("to", customTo);

    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("commissionRange");
    params.delete("from");
    params.delete("to");

    router.push(
      params.toString() ? `${pathname}?${params.toString()}` : pathname,
    );
  }

  const filterButtons: {
    value: CommissionRange;
    label: string;
  }[] = [
    {
      value: "all",
      label: "All Time",
    },
    {
      value: "this-month",
      label: "This Month",
    },
    {
      value: "last-month",
      label: "Last Month",
    },
    {
      value: "last-3-months",
      label: "Last 3 Months",
    },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-brand">
            <CalendarDays className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              Commission Period
            </p>

            <p className="text-xs text-muted-foreground">
              Filter commission earnings by date
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterButtons.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={range === item.value ? "default" : "outline"}
              className="cursor-pointer rounded-xl"
              onClick={() => updateRange(item.value)}
            >
              {item.label}
            </Button>
          ))}

          <Button
            type="button"
            size="sm"
            variant={range === "custom" ? "default" : "outline"}
            className="cursor-pointer rounded-xl"
            onClick={() => updateRange("custom")}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Custom
          </Button>

          {range !== "all" && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="cursor-pointer rounded-xl"
              onClick={clearFilters}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {range === "custom" && (
        <div className="flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-end">
          <div className="w-full space-y-2 md:max-w-[220px]">
            <label className="text-xs font-medium text-muted-foreground">
              From
            </label>

            <Input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="w-full space-y-2 md:max-w-[220px]">
            <label className="text-xs font-medium text-muted-foreground">
              To
            </label>

            <Input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="rounded-xl"
            />
          </div>

          <Button
            type="button"
            className="cursor-pointer rounded-xl"
            onClick={applyCustomRange}
            disabled={!customFrom || !customTo}
          >
            Apply Date Range
          </Button>
        </div>
      )}
    </div>
  );
}
