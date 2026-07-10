import Link from "next/link";
import { XCircle } from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentCancelPage() {
  return (
    <MainLayout>
      <main className="bg-gradient-to-b from-slate-50/80 to-white px-4 py-16">
        <Card className="mx-auto max-w-xl rounded-3xl border-0 shadow-xl shadow-slate-200/70">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-700">
              <XCircle className="h-8 w-8" />
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
              Payment Cancelled
            </h1>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Your online payment was cancelled or not completed. No credits
              were added to your account.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/payment-plans" className="flex-1">
                <Button className="w-full rounded-2xl">Try Again</Button>
              </Link>

              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full rounded-2xl">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </MainLayout>
  );
}
