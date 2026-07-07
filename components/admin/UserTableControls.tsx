"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Filter,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | "admin" | "customer";
type StatusFilter = "all" | "active" | "blocked";

export default function UserTableControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRole = (searchParams.get("role") as RoleFilter) || "all";
  const currentStatus = (searchParams.get("status") as StatusFilter) || "all";
  const currentSearch = searchParams.get("q") || "";

  const [searchValue, setSearchValue] = useState(currentSearch);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusDropdownRef = useRef<HTMLDetailsElement | null>(null);

  const hasActiveFilter =
    currentRole !== "all" || currentStatus !== "all" || currentSearch !== "";

  function buildUrl({
    role = currentRole,
    status = currentStatus,
    q = currentSearch,
  }: {
    role?: RoleFilter;
    status?: StatusFilter;
    q?: string;
  }) {
    const params = new URLSearchParams();

    if (role !== "all") params.set("role", role);
    if (status !== "all") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());

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
          role: currentRole,
          status: currentStatus,
          q: value,
        }),
        {
          scroll: false,
        },
      );
    }, 250);
  }

  function updateRole(role: RoleFilter) {
    router.push(
      buildUrl({
        role,
        status: currentStatus,
        q: searchValue,
      }),
      {
        scroll: false,
      },
    );
  }

  function updateStatus(status: StatusFilter) {
    statusDropdownRef.current?.removeAttribute("open");

    router.push(
      buildUrl({
        role: currentRole,
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
        role: currentRole,
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

    router.push(pathname, {
      scroll: false,
    });
  }

  const statusLabel =
    currentStatus === "active"
      ? "Active"
      : currentStatus === "blocked"
        ? "Blocked"
        : "Status";

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="w-full xl:max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={searchValue}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search name or mobile number..."
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
        <div className="flex rounded-2xl border border-border bg-muted/50 p-1 shadow-sm">
          {[
            {
              value: "all" as const,
              label: "All",
              icon: <UsersRound className="h-3.5 w-3.5" />,
            },
            {
              value: "admin" as const,
              label: "Admins",
              icon: <ShieldCheck className="h-3.5 w-3.5" />,
            },
            {
              value: "customer" as const,
              label: "Customers",
              icon: <UserRound className="h-3.5 w-3.5" />,
            },
          ].map((option) => {
            const isActive = currentRole === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateRole(option.value)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-background hover:text-foreground",
                )}
              >
                {option.icon}
                {option.label}
              </button>
            );
          })}
        </div>

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
                icon: <CheckCircle className="h-4 w-4" />,
              },
              {
                value: "blocked" as const,
                label: "Blocked",
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
                      option.value === "blocked" && "bg-rose-50 text-rose-600",
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
            className="h-10 rounded-2xl text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
