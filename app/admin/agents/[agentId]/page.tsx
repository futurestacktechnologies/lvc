import type React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { prisma } from "@/lib/prisma/client";
import { AgentStatus } from "@/generated/prisma";

type AgentDetailsPageProps = {
  params: Promise<{
    agentId: string;
  }>;
};

export default async function AgentDetailsPage({
  params,
}: AgentDetailsPageProps) {
  const { agentId } = await params;

  const agent = await prisma.agent.findUnique({
    where: {
      id: agentId,
    },
    include: {
      customers: {
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          phoneVerified: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          customers: true,
        },
      },
    },
  });

  if (!agent) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="mt-1 h-9 w-9 cursor-pointer rounded-xl"
          >
            <Link href="/admin/agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <UserRound className="h-5 w-5 text-brand" />

              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Agent Details
              </h1>

              <AgentStatusBadge status={agent.status} />
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              View agent information, verification documents, and referred
              customers.
            </p>
          </div>
        </div>

        {/* EDIT BUTTON */}
        <Button className="cursor-pointer rounded-xl">
          <Link href={`/admin/agents/${agent.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Agent
          </Link>
        </Button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Customers"
          value={agent._count.customers}
          icon={<UsersRound className="h-5 w-5 text-brand" />}
        />

        <SummaryCard
          title="Status"
          value={agent.status}
          icon={
            agent.status === AgentStatus.ACTIVE ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-warning" />
            )
          }
        />

        <SummaryCard
          title="Promo Code"
          value={agent.promoCode}
          icon={<span className="font-mono text-brand">%</span>}
        />

        <SummaryCard
          title="Created"
          value={agent.createdAt.toLocaleDateString("en-LK")}
          icon={<FileText className="h-5 w-5 text-brand" />}
        />
      </div>

      {/* AGENT INFORMATION */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>

          <p className="text-sm text-muted-foreground">
            Basic information and referral details for this agent.
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <InfoItem
              icon={<UserRound className="h-4 w-4" />}
              label="Agent Name"
              value={agent.name}
            />

            <InfoItem
              icon={<Phone className="h-4 w-4" />}
              label="Mobile Number"
              value={agent.mobile}
              href={`https://wa.me/${agent.mobile.replace(/\D/g, "")}`}
            />

            <InfoItem
              icon={<MapPin className="h-4 w-4" />}
              label="Address"
              value={agent.address}
            />

            <InfoItem
              icon={<span className="font-mono text-xs">%</span>}
              label="Promo Code"
              value={agent.promoCode}
              mono
            />

            <InfoItem
              icon={<FileText className="h-4 w-4" />}
              label="Created"
              value={agent.createdAt.toLocaleString("en-LK")}
            />

            <InfoItem
              icon={<FileText className="h-4 w-4" />}
              label="Last Updated"
              value={agent.updatedAt.toLocaleString("en-LK")}
            />
          </div>
        </CardContent>
      </Card>

      {/* VERIFICATION DOCUMENT */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Document</CardTitle>

          <p className="text-sm text-muted-foreground">
            Agent NIC or Driving Licence document.
          </p>
        </CardHeader>

        <CardContent>
          {agent.nicDlUrl && agent.nicDlFileName ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <FileText className="h-5 w-5 text-brand" />
                </div>

                <div>
                  <p className="text-sm font-semibold">{agent.nicDlFileName}</p>

                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {agent.nicDlFileType && <span>{agent.nicDlFileType}</span>}

                    {agent.nicDlFileSize && (
                      <>
                        <span>•</span>

                        <span>
                          {(agent.nicDlFileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button variant="outline" className="cursor-pointer rounded-xl">
                <Link
                  href={`/api/admin/agents/${agent.id}/document/view`}
                  target="_blank"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Document
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-semibold">
                No verification document uploaded
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Upload the agent&apos;s NIC or Driving Licence from the edit
                page.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* REFERRED CUSTOMERS */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Referred Customers</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Customers registered using this agent&apos;s referral code.
              </p>
            </div>

            <Badge variant="secondary">
              {agent._count.customers} Customers
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {agent.customers.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-muted/40">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold">
                      Customer
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">Phone</th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Phone Verified
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Registered
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {agent.customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {customer.name}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {customer.id}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <a
                          href={`https://wa.me/${customer.phone.replace(
                            /\D/g,
                            "",
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-muted-foreground transition hover:text-brand"
                        >
                          {customer.phone}
                        </a>
                      </td>

                      <td className="px-4 py-4">
                        <Badge variant="outline">{customer.status}</Badge>
                      </td>

                      <td className="px-4 py-4">
                        {customer.phoneVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not Verified
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-muted-foreground">
                        {customer.createdAt.toLocaleDateString("en-LK")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-semibold">
                No referred customers yet
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Customers using this agent&apos;s promo code will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-6 pt-6">
        <span className="text-sm font-medium text-foreground">{title}</span>

        {icon}
      </div>

      <div className="px-6 pb-6 pt-2">
        <div className="truncate text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  href,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-brand">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>

        <p
          className={`mt-1 break-words text-sm font-semibold text-foreground ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl transition hover:bg-muted/50"
    >
      {content}
    </a>
  );
}

function AgentStatusBadge({ status }: { status: AgentStatus }) {
  if (status === AgentStatus.ACTIVE) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        ACTIVE
      </Badge>
    );
  }

  if (status === AgentStatus.BLOCKED) {
    return (
      <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
        BLOCKED
      </Badge>
    );
  }

  return (
    <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
      INACTIVE
    </Badge>
  );
}
