import { CheckCircle2, ShieldAlert, UsersRound } from "lucide-react";

import { Prisma, AgentStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma/client";

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

  const [totalAgents, activeAgents, blockedAgents, referredCustomers] =
    await Promise.all([
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
    ]);

  const tableAgents = agents.map((agent) => ({
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
  }));

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
      </div>

      {/* STATISTICS */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="h-25 rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-row items-center justify-between space-y-0 px-6 pt-6">
        <span className="text-sm font-medium text-foreground">{title}</span>

        {icon}
      </div>

      <div className="px-6 pt-2 pb-6">
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}
