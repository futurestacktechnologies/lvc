import { CheckCircle2, ShieldAlert, UsersRound, Wallet } from "lucide-react";
import Link from "next/link";
import { Prisma, AgentStatus, AgentCommissionStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma/client";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminAgentsTable from "@/components/admin/AdminAgentsTable";

function parseFilters(searchParams: {
  status?: string;
  q?: string;
  page?: string;
  pageSize?: string;
}) {
  const status = searchParams.status || "all";
  const searchQuery = searchParams.q?.trim() || "";

  const requestedPage = Number(searchParams.page || "1");

  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const requestedPageSize = Number(searchParams.pageSize || "5");

  const pageSize = [5, 10, 20].includes(requestedPageSize)
    ? requestedPageSize
    : 5;

  let statusFilter: AgentStatus[] = [
    AgentStatus.ACTIVE,
    AgentStatus.INACTIVE,
    AgentStatus.BLOCKED,
  ];

  if (status === "active") {
    statusFilter = [AgentStatus.ACTIVE];
  } else if (status === "inactive") {
    statusFilter = [AgentStatus.INACTIVE];
  } else if (status === "blocked") {
    statusFilter = [AgentStatus.BLOCKED];
  }

  return {
    statusFilter,
    searchQuery,
    page,
    pageSize,
  };
}

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const params = await searchParams;

  const { statusFilter, searchQuery, page, pageSize } = parseFilters(params);

  const where: Prisma.AgentWhereInput = {
    status: {
      in: statusFilter,
    },

    ...(searchQuery
      ? {
          OR: [
            {
              name: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              mobile: {
                contains: searchQuery,
              },
            },
            {
              promoCode: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const filteredAgentsCount = await prisma.agent.count({
    where,
  });

  const totalPages = Math.max(Math.ceil(filteredAgentsCount / pageSize), 1);

  const currentPage = Math.min(page, totalPages);

  const skip = (currentPage - 1) * pageSize;

  const agents = await prisma.agent.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      mobile: true,
      address: true,
      nicDlUrl: true,
      nicDlFileName: true,
      nicDlFileType: true,
      nicDlFileSize: true,
      promoCode: true,
      status: true,
      createdAt: true,

      _count: {
        select: {
          customers: true,
        },
      },
    },
  });

  /*
   * --------------------------------------------------------------------------
   * COMMISSION CALCULATION
   * --------------------------------------------------------------------------
   *
   * Agent commission = 5% of PAID payments made by referred customers.
   *
   * AgentCommission is the source of truth for commission records.
   */

  const agentIds = agents.map((agent) => agent.id);

  const commissionTotals =
    agentIds.length > 0
      ? await prisma.agentCommission.groupBy({
          by: ["agentId"],
          where: {
            agentId: {
              in: agentIds,
            },
            status: {
              in: [AgentCommissionStatus.PENDING, AgentCommissionStatus.PAID],
            },
          },
          _sum: {
            paymentAmount: true,
            commissionAmount: true,
          },
        })
      : [];

  const commissionMap = new Map<
    string,
    {
      totalPayments: number;
      commission: number;
    }
  >(
    commissionTotals.map((item) => [
      item.agentId,
      {
        totalPayments: item._sum.paymentAmount ?? 0,
        commission: item._sum.commissionAmount ?? 0,
      },
    ]),
  );

  /*
   * --------------------------------------------------------------------------
   * GLOBAL STATISTICS
   * --------------------------------------------------------------------------
   */

  const [
    totalAgents,
    activeAgents,
    blockedAgents,
    referredCustomers,
    totalCommissionSummary,
  ] = await Promise.all([
    prisma.agent.count(),

    prisma.agent.count({
      where: {
        status: AgentStatus.ACTIVE,
      },
    }),

    prisma.agent.count({
      where: {
        status: AgentStatus.BLOCKED,
      },
    }),

    prisma.user.count({
      where: {
        agentId: {
          not: null,
        },
      },
    }),

    prisma.agentCommission.aggregate({
      where: {
        status: {
          in: [AgentCommissionStatus.PENDING, AgentCommissionStatus.PAID],
        },
      },
      _sum: {
        commissionAmount: true,
      },
    }),
  ]);

  const totalAgentCommission =
    totalCommissionSummary._sum.commissionAmount ?? 0;

  const tableAgents = agents.map((agent) => {
    const commissionData = commissionMap.get(agent.id);

    return {
      id: agent.id,
      name: agent.name,
      mobile: agent.mobile,
      address: agent.address,
      nicDlUrl: agent.nicDlUrl,
      nicDlFileName: agent.nicDlFileName,
      nicDlFileType: agent.nicDlFileType,
      nicDlFileSize: agent.nicDlFileSize,
      promoCode: agent.promoCode,
      status: agent.status,
      createdAt: agent.createdAt.toISOString(),
      customersCount: agent._count.customers,

      totalPayments: commissionData?.totalPayments ?? 0,
      commission: commissionData?.commission ?? 0,
    };
  });

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Agent Details
          </h1>

          <span className="text-sm text-muted-foreground">
            Manage agents, referral codes, verification documents, and customer
            referrals
          </span>
        </div>

        <Link href="/admin/agents/new">
          <Button
            type="button"
            variant="default"
            size="default"
            className="h-10 cursor-pointer rounded-xl px-4"
          >
            <PlusCircle className="h-4 w-4" />
            Create Agent
          </Button>
        </Link>
      </div>

      {/* STATISTICS */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Agents"
          value={totalAgents}
          icon={<UsersRound className="h-5 w-5 text-brand" />}
        />

        <StatCard
          title="Active Agents"
          value={activeAgents}
          icon={<CheckCircle2 className="h-5 w-5 text-brand" />}
        />

        <StatCard
          title="Blocked Agents"
          value={blockedAgents}
          icon={<ShieldAlert className="h-5 w-5 text-brand" />}
        />

        <StatCard
          title="Referred Customers"
          value={referredCustomers}
          icon={<UsersRound className="h-5 w-5 text-brand" />}
        />

        <StatCard
          title="Total Commission"
          value={`LKR ${totalAgentCommission.toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<Wallet className="h-5 w-5 text-brand" />}
        />
      </div>

      {/* TABLE */}
      <AdminAgentsTable
        agents={tableAgents}
        totalAgents={filteredAgentsCount}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1 bg-brand/70 opacity-0 transition group-hover:opacity-100" />

      <div className="flex items-center justify-between px-6 pt-6">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
          {icon}
        </div>
      </div>

      <div className="px-6 pb-6 pt-4">
        <div className="truncate text-2xl font-bold tracking-tight text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}
