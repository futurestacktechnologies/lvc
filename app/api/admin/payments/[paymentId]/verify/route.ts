// // import { NextResponse } from "next/server";

// // import { requireAdminUser } from "@/lib/auth/admin";
// // import { prisma } from "@/lib/prisma/client";
// // import { PaymentStatus, UserPackageStatus } from "@/generated/prisma";

// // export const runtime = "nodejs";

// // type RouteContext = {
// //   params: Promise<{
// //     paymentId: string;
// //   }>;
// // };

// // export async function POST(_request: Request, context: RouteContext) {
// //   try {
// //     const admin = await requireAdminUser();
// //     const { paymentId } = await context.params;

// //     const payment = await prisma.payment.findUnique({
// //       where: {
// //         id: paymentId,
// //       },
// //       select: {
// //         id: true,
// //         paymentNumber: true,
// //         status: true,
// //         userPackageId: true,
// //       },
// //     });

// //     if (!payment) {
// //       return NextResponse.json(
// //         {
// //           success: false,
// //           message: "Payment not found.",
// //         },
// //         { status: 404 },
// //       );
// //     }

// //     if (payment.status !== PaymentStatus.PROOF_UPLOADED) {
// //       return NextResponse.json(
// //         {
// //           success: false,
// //           message: "Only uploaded payment proofs can be approved.",
// //         },
// //         { status: 400 },
// //       );
// //     }

// //     if (!payment.userPackageId) {
// //       return NextResponse.json(
// //         {
// //           success: false,
// //           message: "This payment is not connected to a package.",
// //         },
// //         { status: 400 },
// //       );
// //     }

// //     const userPackageId = payment.userPackageId;

// //     await prisma.$transaction([
// //       prisma.payment.update({
// //         where: {
// //           id: payment.id,
// //         },
// //         data: {
// //           status: PaymentStatus.VERIFIED,
// //           verifiedById: admin.id,
// //           verifiedAt: new Date(),
// //         },
// //       }),

// //       prisma.userPackage.update({
// //         where: {
// //           id: userPackageId,
// //         },
// //         data: {
// //           status: UserPackageStatus.ACTIVE,
// //           activatedAt: new Date(),
// //         },
// //       }),
// //     ]);

// //     return NextResponse.json({
// //       success: true,
// //       message: `${payment.paymentNumber} has been approved successfully.`,
// //     });
// //   } catch (error) {
// //     console.error("Payment approval failed:", error);

// //     return NextResponse.json(
// //       {
// //         success: false,
// //         message: "Something went wrong while approving the payment.",
// //       },
// //       { status: 500 },
// //     );
// //   }
// // }

// import { NextResponse } from "next/server";

// import { requireAdminUser } from "@/lib/auth/admin";
// import { prisma } from "@/lib/prisma/client";
// import {
//   PaymentStatus,
//   UserPackageStatus,
//   AgentCommissionStatus,
// } from "@/generated/prisma";

// export const runtime = "nodejs";

// const AGENT_COMMISSION_RATE = 5;

// type RouteContext = {
//   params: Promise<{
//     paymentId: string;
//   }>;
// };

// export async function POST(_request: Request, context: RouteContext) {
//   try {
//     const admin = await requireAdminUser();
//     const { paymentId } = await context.params;

//     const payment = await prisma.payment.findUnique({
//       where: {
//         id: paymentId,
//       },
//       select: {
//         id: true,
//         paymentNumber: true,
//         status: true,
//         userPackageId: true,
//         customerId: true,
//         amount: true,

//         customer: {
//           select: {
//             id: true,
//             agentId: true,
//           },
//         },
//       },
//     });

//     if (!payment) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Payment not found.",
//         },
//         { status: 404 },
//       );
//     }

//     if (payment.status !== PaymentStatus.PROOF_UPLOADED) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Only uploaded payment proofs can be approved.",
//         },
//         { status: 400 },
//       );
//     }

//     if (!payment.userPackageId) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "This payment is not connected to a package.",
//         },
//         { status: 400 },
//       );
//     }

//     const userPackageId = payment.userPackageId;

//     /*
//      * Calculate agent commission.
//      *
//      * Example:
//      * Payment = LKR 10,000
//      * Commission = 10,000 × 5 / 100
//      * Commission = LKR 500
//      */
//     const commissionAmount = Math.floor(
//       (payment.amount * AGENT_COMMISSION_RATE) / 100,
//     );

//     await prisma.$transaction(async (tx) => {
//       /*
//        * 1. Verify the payment
//        */
//       await tx.payment.update({
//         where: {
//           id: payment.id,
//         },
//         data: {
//           status: PaymentStatus.VERIFIED,
//           verifiedById: admin.id,
//           verifiedAt: new Date(),
//         },
//       });

//       /*
//        * 2. Activate the package
//        */
//       await tx.userPackage.update({
//         where: {
//           id: userPackageId,
//         },
//         data: {
//           status: UserPackageStatus.ACTIVE,
//           activatedAt: new Date(),
//         },
//       });

//       /*
//        * 3. Create agent commission
//        *
//        * Only customers referred by an agent
//        * receive an agent commission.
//        */
//       if (payment.customer.agentId && commissionAmount > 0) {
//         /*
//          * Because paymentId is unique in AgentCommission,
//          * we also check before creating the commission.
//          */
//         const existingCommission = await tx.agentCommission.findUnique({
//           where: {
//             paymentId: payment.id,
//           },
//           select: {
//             id: true,
//           },
//         });

//         if (!existingCommission) {
//           await tx.agentCommission.create({
//             data: {
//               agentId: payment.customer.agentId,
//               customerId: payment.customerId,
//               paymentId: payment.id,

//               paymentAmount: payment.amount,
//               commissionRate: AGENT_COMMISSION_RATE,
//               commissionAmount,

//               status: AgentCommissionStatus.PENDING,
//             },
//           });
//         }
//       }
//     });

//     return NextResponse.json({
//       success: true,
//       message: `${payment.paymentNumber} has been approved successfully.`,
//       commission:
//         payment.customer.agentId && commissionAmount > 0
//           ? {
//               rate: AGENT_COMMISSION_RATE,
//               amount: commissionAmount,
//             }
//           : null,
//     });
//   } catch (error) {
//     console.error("Payment approval failed:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message: "Something went wrong while approving the payment.",
//       },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";
import {
  AgentCommissionStatus,
  PaymentStatus,
  UserPackageStatus,
} from "@/generated/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    paymentId: string;
  }>;
};

const COMMISSION_RATE = 0.05;

export async function POST(_request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { paymentId } = await context.params;

    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        status: true,
        userPackageId: true,

        customer: {
          select: {
            id: true,
            agentId: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found.",
        },
        { status: 404 },
      );
    }

    if (payment.status !== PaymentStatus.PROOF_UPLOADED) {
      return NextResponse.json(
        {
          success: false,
          message: "Only uploaded payment proofs can be approved.",
        },
        { status: 400 },
      );
    }

    if (!payment.userPackageId) {
      return NextResponse.json(
        {
          success: false,
          message: "This payment is not connected to a package.",
        },
        { status: 400 },
      );
    }

    const userPackageId = payment.userPackageId;

    const commissionAmount = Math.round(payment.amount * COMMISSION_RATE);

    await prisma.$transaction(async (tx) => {
      // 1. Verify payment
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.VERIFIED,
          verifiedById: admin.id,
          verifiedAt: new Date(),
        },
      });

      // 2. Activate customer package
      await tx.userPackage.update({
        where: {
          id: userPackageId,
        },
        data: {
          status: UserPackageStatus.ACTIVE,
          activatedAt: new Date(),
        },
      });

      // 3. Create agent commission if customer was referred
      if (payment.customer.agentId) {
        await tx.agentCommission.create({
          data: {
            agentId: payment.customer.agentId,
            customerId: payment.customer.id,
            paymentId: payment.id,

            paymentAmount: payment.amount,
            commissionRate: COMMISSION_RATE,
            commissionAmount,

            status: AgentCommissionStatus.PENDING,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `${payment.paymentNumber} has been approved successfully.`,
    });
  } catch (error) {
    console.error("Payment approval failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while approving the payment.",
      },
      { status: 500 },
    );
  }
}
