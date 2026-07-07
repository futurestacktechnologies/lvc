import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";
import { PAYMENT_PROOF_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPaymentsPage() {
  const admin = await requireAdminUser();

  const payments = await prisma.payment.findMany({
    where: {
      method: "BANK_TRANSFER",
      status: {
        in: ["PROOF_UPLOADED", "PENDING", "REJECTED", "VERIFIED"],
      },
    },
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      plan: true,
      userPackage: true,
      verifiedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const paymentsWithProofUrls = await Promise.all(
    payments.map(async (payment) => {
      let proofUrl: string | null = null;

      if (payment.paymentProofUrl) {
        const signedUrlResult = await supabaseAdmin.storage
          .from(PAYMENT_PROOF_BUCKET)
          .createSignedUrl(payment.paymentProofUrl, 60 * 10);

        proofUrl = signedUrlResult.data?.signedUrl || null;
      }

      return {
        ...payment,
        proofUrl,
      };
    }),
  );

  const pendingCount = payments.filter(
    (payment) => payment.status === "PROOF_UPLOADED",
  ).length;

  return (
    <main className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Admin Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Payment Verification
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Logged in as {admin.name}
            </p>
          </div>

          <Link href="/dashboard">
            <Button variant="outline">Customer Dashboard</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Pending Proofs
              </CardTitle>
              <ShieldCheck className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Waiting for admin review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Bank Transfers
              </CardTitle>
              <FileText className="h-5 w-5 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                All bank transfer payments
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Bank Transfer Payments</CardTitle>
          </CardHeader>

          <CardContent>
            {paymentsWithProofUrls.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-semibold text-foreground">
                  No payment proofs found
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Customer uploaded bank transfer proofs will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {paymentsWithProofUrls.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-border bg-background p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-semibold text-foreground">
                            {payment.paymentNumber}
                          </p>
                          <PaymentStatusBadge status={payment.status} />
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground">
                          Submitted by {payment.customer.name} •{" "}
                          {payment.customer.phone}
                        </p>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="text-xl font-bold text-foreground">
                          {payment.currency} {payment.amount.toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {payment.plan.name} — {payment.plan.requestCredits}{" "}
                          requests
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <InfoBox
                        label="Package No"
                        value={payment.userPackage?.packageNumber || "-"}
                      />

                      <InfoBox
                        label="Payment Method"
                        value={payment.method.replaceAll("_", " ")}
                      />

                      <InfoBox
                        label="Uploaded File"
                        value={payment.paymentProofFileName || "-"}
                      />
                    </div>

                    {payment.verifiedBy && (
                      <div className="mt-4 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                        Verified by {payment.verifiedBy.name}
                      </div>
                    )}

                    {payment.adminNote && (
                      <div className="mt-4 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
                        Admin note: {payment.adminNote}
                      </div>
                    )}

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                      {payment.proofUrl ? (
                        <a
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button variant="outline">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Payment Proof
                          </Button>
                        </a>
                      ) : (
                        <Button variant="outline" disabled>
                          Proof not available
                        </Button>
                      )}

                      {payment.status === "PROOF_UPLOADED" && (
                        <>
                          <form
                            action={`/api/admin/payments/${payment.id}/verify`}
                            method="POST"
                          >
                            <Button type="submit">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve Payment
                            </Button>
                          </form>

                          <form
                            action={`/api/admin/payments/${payment.id}/reject`}
                            method="POST"
                          >
                            <Button type="submit" variant="destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject Payment
                            </Button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ");

  if (status === "VERIFIED" || status === "PAID") {
    return <Badge className="bg-success text-white">{label}</Badge>;
  }

  if (status === "PROOF_UPLOADED") {
    return <Badge className="bg-warning text-white">{label}</Badge>;
  }

  if (status === "REJECTED" || status === "FAILED") {
    return <Badge variant="destructive">{label}</Badge>;
  }

  return <Badge variant="outline">{label}</Badge>;
}
