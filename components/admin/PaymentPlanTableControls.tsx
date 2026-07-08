"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Filter,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "inactive";

export default function PaymentPlanTableControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = (searchParams.get("status") as StatusFilter) || "all";
  const currentSearch = searchParams.get("q") || "";

  const [searchValue, setSearchValue] = useState(currentSearch);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusDropdownRef = useRef<HTMLDetailsElement | null>(null);

  const hasActiveFilter = currentStatus !== "all" || currentSearch !== "";

  function buildUrl({
    status = currentStatus,
    q = currentSearch,
  }: {
    status?: StatusFilter;
    q?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    if (status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }

    params.delete("page");

    const queryString = params.toString();

    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  function updateSearch(value: string) {
    setSearchValue(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      router.replace(
        buildUrl({
          status: currentStatus,
          q: value,
        }),
        {
          scroll: false,
        },
      );
    }, 250);
  }

  function updateStatus(status: StatusFilter) {
    statusDropdownRef.current?.removeAttribute("open");

    router.push(
      buildUrl({
        status,
        q: searchValue,
      }),
      {
        scroll: false,
      },
    );
  }

  function clearSearch() {
    setSearchValue("");

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    router.replace(
      buildUrl({
        status: currentStatus,
        q: "",
      }),
      {
        scroll: false,
      },
    );
  }

  function clearAll() {
    setSearchValue("");

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.delete("q");
    params.delete("page");

    const queryString = params.toString();

    router.push(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  const statusLabel =
    currentStatus === "active"
      ? "Active"
      : currentStatus === "inactive"
        ? "Inactive"
        : "Status";

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="w-full xl:max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={searchValue}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search plan, code, currency..."
            className="h-11 rounded-2xl pl-10 pr-10"
          />

          {searchValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <details ref={statusDropdownRef} className="relative">
          <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-2xl border border-border bg-background px-4 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted [&::-webkit-details-marker]:hidden">
            <Filter className="h-4 w-4 text-brand" />
            {statusLabel}
            {currentStatus !== "all" && (
              <span className="h-2 w-2 rounded-full bg-brand" />
            )}
          </summary>

          <div className="absolute right-0 z-30 mt-2 w-52 rounded-2xl border border-border bg-card p-2 shadow-xl">
            {[
              {
                value: "all" as const,
                label: "All Status",
                icon: <Filter className="h-4 w-4" />,
              },
              {
                value: "active" as const,
                label: "Active",
                icon: <CheckCircle2 className="h-4 w-4" />,
              },
              {
                value: "inactive" as const,
                label: "Inactive",
                icon: <XCircle className="h-4 w-4" />,
              },
            ].map((option) => {
              const isActive = currentStatus === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateStatus(option.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      option.value === "active" &&
                        "bg-emerald-50 text-emerald-600",
                      option.value === "inactive" && "bg-rose-50 text-rose-600",
                      option.value === "all" && "bg-muted text-brand",
                    )}
                  >
                    {option.icon}
                  </span>

                  {option.label}
                </button>
              );
            })}
          </div>
        </details>

        {hasActiveFilter && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="h-10 rounded-2xl text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
