import { FileText, ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/prisma/client";
import { PAYMENT_PROOF_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminPaymentsTable from "@/components/admin/AdminPaymentsTable";
import { PaymentMethod, PaymentStatus, Prisma } from "@/generated/prisma";

function parseFilters(searchParams: {
  method?: string;
  status?: string;
  q?: string;
  page?: string;
  pageSize?: string;
}) {
  const method = searchParams.method || "all";
  const status = searchParams.status || "all";
  const searchQuery = searchParams.q?.trim() || "";

  const requestedPage = Number(searchParams.page || "1");
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const requestedPageSize = Number(searchParams.pageSize || "5");
  const pageSize = [5, 10, 20].includes(requestedPageSize)
    ? requestedPageSize
    : 5;

  let methodFilter: PaymentMethod[] = [];
  let statusFilter: PaymentStatus[] = [];

  if (method === "bank") {
    methodFilter = [PaymentMethod.BANK_TRANSFER];
  } else if (method === "card") {
    methodFilter = [PaymentMethod.ONLINE_GATEWAY];
  } else {
    methodFilter = [PaymentMethod.BANK_TRANSFER, PaymentMethod.ONLINE_GATEWAY];
  }

  if (status === "pending") {
    statusFilter = [PaymentStatus.PROOF_UPLOADED, PaymentStatus.PENDING];
  } else if (status === "accepted") {
    statusFilter = [PaymentStatus.VERIFIED, PaymentStatus.PAID];
  } else if (status === "rejected") {
    statusFilter = [PaymentStatus.REJECTED, PaymentStatus.FAILED];
  } else {
    statusFilter = [
      PaymentStatus.PROOF_UPLOADED,
      PaymentStatus.PENDING,
      PaymentStatus.REJECTED,
      PaymentStatus.VERIFIED,
      PaymentStatus.PAID,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
    ];
  }

  return {
    methodFilter,
    statusFilter,
    searchQuery,
    page,
    pageSize,
  };
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    method?: string;
    status?: string;
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const params = await searchParams;
  const { methodFilter, statusFilter, searchQuery, page, pageSize } =
    parseFilters(params);

  const where: Prisma.PaymentWhereInput = {
    method: {
      in: methodFilter,
    },
    status: {
      in: statusFilter,
    },
    ...(searchQuery
      ? {
          OR: [
            {
              paymentNumber: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              customer: {
                is: {
                  name: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
              },
            },
            {
              customer: {
                is: {
                  phone: {
                    contains: searchQuery,
                  },
                },
              },
            },
            {
              plan: {
                is: {
                  name: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const filteredPaymentsCount = await prisma.payment.count({
    where,
  });

  const totalPages = Math.max(Math.ceil(filteredPaymentsCount / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const payments = await prisma.payment.findMany({
    where,
    skip,
    take: pageSize,
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

  const [totalPayments, pendingCount] = await Promise.all([
    prisma.payment.count({
      where: {
        method: {
          in: [PaymentMethod.BANK_TRANSFER, PaymentMethod.ONLINE_GATEWAY],
        },
      },
    }),
    prisma.payment.count({
      where: {
        method: {
          in: [PaymentMethod.BANK_TRANSFER, PaymentMethod.ONLINE_GATEWAY],
        },
        status: {
          in: [PaymentStatus.PROOF_UPLOADED, PaymentStatus.PENDING],
        },
      },
    }),
  ]);

  const tablePayments = paymentsWithProofUrls.map((payment) => ({
    id: payment.id,
    paymentNumber: payment.paymentNumber,
    customerName: payment.customer.name,
    customerPhone: payment.customer.phone,
    planName: payment.plan.name,
    requestCredits: payment.plan.requestCredits,
    method: payment.method,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    proofUrl: payment.proofUrl,
    verifiedByName: payment.verifiedBy?.name || null,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Manage Payments
          </h1>
          <span className="text-sm text-muted-foreground">
            Track, verify, and manage all customer payments seamlessly.
          </span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <ShieldCheck className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card className="h-25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <FileText className="h-5 w-5 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
          </CardContent>
        </Card>
      </div>

      <AdminPaymentsTable
        payments={tablePayments}
        totalPayments={filteredPaymentsCount}
        currentPage={currentPage}
        pageSize={pageSize}
      />
    </div>
  );
}
