import { CheckCircle2, ShieldAlert, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Prisma, UserRole, UserStatus } from "@/generated/prisma";
import AdminUsersTable from "@/components/admin/AdminUsersTable";

function parseFilters(searchParams: {
  role?: string;
  status?: string;
  q?: string;
  page?: string;
  pageSize?: string;
}) {
  const role = searchParams.role || "all";
  const status = searchParams.status || "all";
  const searchQuery = searchParams.q?.trim() || "";

  const requestedPage = Number(searchParams.page || "1");
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const requestedPageSize = Number(searchParams.pageSize || "5");
  const pageSize = [5, 10, 20].includes(requestedPageSize)
    ? requestedPageSize
    : 5;

  let roleFilter: UserRole[] = [];
  let statusFilter: UserStatus[] = [];

  if (role === "admin") {
    roleFilter = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
  } else if (role === "customer") {
    roleFilter = [UserRole.CUSTOMER];
  } else {
    roleFilter = [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN];
  }

  if (status === "active") {
    statusFilter = [UserStatus.ACTIVE];
  } else if (status === "blocked") {
    statusFilter = [UserStatus.BLOCKED];
  } else {
    statusFilter = [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.BLOCKED];
  }

  return {
    roleFilter,
    statusFilter,
    searchQuery,
    page,
    pageSize,
  };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    status?: string;
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const params = await searchParams;
  const { roleFilter, statusFilter, searchQuery, page, pageSize } =
    parseFilters(params);

  const where: Prisma.UserWhereInput = {
    role: {
      in: roleFilter,
    },
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
              phone: {
                contains: searchQuery,
              },
            },
          ],
        }
      : {}),
  };

  const filteredUsersCount = await prisma.user.count({
    where,
  });

  const totalPages = Math.max(Math.ceil(filteredUsersCount / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const users = await prisma.user.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      phoneVerified: true,
      createdAt: true,
      _count: {
        select: {
          requests: true,
          packages: true,
          payments: true,
        },
      },
    },
  });

  const [totalUsers, activeUsers, blockedUsers, customerUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.user.count({
        where: {
          status: UserStatus.BLOCKED,
        },
      }),
      prisma.user.count({
        where: {
          role: UserRole.CUSTOMER,
        },
      }),
    ]);

  const tableUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt.toISOString(),
    requestsCount: user._count.requests,
    packagesCount: user._count.packages,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            User Details
          </h1>
          <span className="text-sm text-muted-foreground">
            Manage customer and admin account status
          </span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersRound className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
            <ShieldAlert className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedUsers}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <UsersRound className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerUsers}</div>
          </CardContent>
        </Card>
      </div>

      <AdminUsersTable
        users={tableUsers}
        totalUsers={filteredUsersCount}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}
