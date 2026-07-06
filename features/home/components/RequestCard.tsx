"use client"; // already client

import { ArrowRight, FileText, ShieldCheck } from "lucide-react";

import { APP } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download } from "lucide-react";

interface RequestCardProps {
  onSearchByLotClick?: () => void; // 👈 new prop
}

export default function RequestCard({ onSearchByLotClick }: RequestCardProps) {
  return (
    <Card className="border-border bg-card shadow-2xl shadow-slate-200/70">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">
            LKR {APP.reportPrice.toLocaleString()} / Request
          </Badge>

          <div className="rounded-full bg-success/10 p-2 text-success">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <CardTitle className="text-2xl tracking-tight">
          Request a Vehicle Report
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Enter the chassis number / VIN and submit your request. Our team will
          verify the details and deliver the requested report.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="chassis"
              placeholder="Enter Chassis Number or VIN"
              className="h-11 pl-11"
            />
          </div>
        </div>

        {/* Button */}
        <Button className="h-12 w-full text-base">
          Request Report
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <div className="flex flex-col gap-3 px-1 text-sm sm:flex-row sm:items-center sm:justify-between">
          <button className="inline-flex items-center gap-2 font-medium text-brand hover:text-indigo-700 transition-colors cursor-pointer">
            <FileText className="h-4 w-4" />
            Search by lot number
          </button>

          <button
            onClick={onSearchByLotClick}
            className="inline-flex items-center gap-2 font-medium text-brand hover:text-indigo-700 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            See report sample
          </button>
        </div>

        <div className="rounded-xl border border-border bg-muted p-4">
          <div className="flex gap-3">
            <div className="rounded-lg bg-card p-2 text-brand shadow-sm">
              <FileText className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                PDF delivery included
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Download from your account, or receive through email, chat, or
                WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
