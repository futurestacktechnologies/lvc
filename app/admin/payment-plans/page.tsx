import { CheckCircle2, CreditCard, PackageCheck, XCircle } from "lucide-react";

import { prisma } from "@/lib/prisma/client";
import AdminPaymentPlansTable from "@/components/admin/AdminPaymentPlansTable";
import PaymentPlanFormDialog from "@/components/admin/PaymentPlanFormDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Prisma } from "@/generated/prisma";

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

  let activeFilter: boolean | undefined;

  if (status === "active") {
    activeFilter = true;
  } else if (status === "inactive") {
    activeFilter = false;
  }

  return {
    activeFilter,
    searchQuery,
    page,
    pageSize,
  };
}

export default async function AdminPaymentPlansPage({
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
  const { activeFilter, searchQuery, page, pageSize } = parseFilters(params);

  const where: Prisma.PaymentPlanWhereInput = {
    ...(typeof activeFilter === "boolean"
      ? {
          isActive: activeFilter,
        }
      : {}),
    ...(searchQuery
      ? {
          OR: [
            {
              code: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              currency: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const filteredPlansCount = await prisma.paymentPlan.count({
    where,
  });

  const totalPages = Math.max(Math.ceil(filteredPlansCount / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const plans = await prisma.paymentPlan.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      price: true,
      currency: true,
      requestCredits: true,
      isActive: true,
      sortOrder: true,
      createdAt: true,
      _count: {
        select: {
          purchases: true,
          payments: true,
        },
      },
    },
  });

  const [totalPlans, activePlans, inactivePlans, totalPurchases] =
    await Promise.all([
      prisma.paymentPlan.count(),
      prisma.paymentPlan.count({
        where: {
          isActive: true,
        },
      }),
      prisma.paymentPlan.count({
        where: {
          isActive: false,
        },
      }),
      prisma.userPackage.count(),
    ]);

  const tablePlans = plans.map((plan) => ({
    id: plan.id,
    code: plan.code,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    requestCredits: plan.requestCredits,
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
    purchasesCount: plan._count.purchases,
    paymentsCount: plan._count.payments,
    createdAt: plan.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Payment Plans
          </h1>
          <span className="text-sm text-muted-foreground">
            Manage report request package pricing and credits
          </span>
        </div>

        <PaymentPlanFormDialog mode="create" />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CreditCard className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlans}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Inactive Plans
            </CardTitle>
            <XCircle className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactivePlans}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Package Purchases
            </CardTitle>
            <PackageCheck className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
          </CardContent>
        </Card>
      </div>

      <AdminPaymentPlansTable
        plans={tablePlans}
        totalPlans={filteredPlansCount}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}
