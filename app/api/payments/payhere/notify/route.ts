import { prisma } from "@/lib/prisma/client";
import {
  formatPayHereAmount,
  generatePayHereNotificationHash,
  getPayHereConfig,
  safeCompareHash,
} from "@/lib/payhere";

export const runtime = "nodejs";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getStatusNote(statusCode: string, statusMessage: string) {
  if (statusCode === "0") {
    return `PayHere payment is pending. ${statusMessage}`;
  }

  if (statusCode === "-1") {
    return `PayHere payment was cancelled. ${statusMessage}`;
  }

  if (statusCode === "-2") {
    return `PayHere payment failed. ${statusMessage}`;
  }

  if (statusCode === "-3") {
    return `PayHere payment was charged back or refunded. ${statusMessage}`;
  }

  return `PayHere payment status: ${statusCode}. ${statusMessage}`;
}

function getFailedPackageStatus(paymentStatus: string) {
  if (paymentStatus === "PAID" || paymentStatus === "VERIFIED") {
    return null;
  }

  return "CANCELLED" as const;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const merchantId = getFormString(formData, "merchant_id");
    const orderId = getFormString(formData, "order_id");
    const paymentId = getFormString(formData, "payment_id");
    const payhereAmount = getFormString(formData, "payhere_amount");
    const payhereCurrency = getFormString(formData, "payhere_currency");
    const statusCode = getFormString(formData, "status_code");
    const md5sig = getFormString(formData, "md5sig");
    const method = getFormString(formData, "method");
    const statusMessage = getFormString(formData, "status_message");

    if (
      !merchantId ||
      !orderId ||
      !payhereAmount ||
      !payhereCurrency ||
      !statusCode ||
      !md5sig
    ) {
      return new Response("Missing required PayHere fields", { status: 400 });
    }

    const config = getPayHereConfig();

    if (merchantId !== config.merchantId) {
      return new Response("Invalid merchant", { status: 400 });
    }

    const localMd5sig = generatePayHereNotificationHash({
      merchantId,
      orderId,
      payhereAmount,
      payhereCurrency,
      statusCode,
      merchantSecret: config.merchantSecret,
    });

    if (!safeCompareHash(localMd5sig, md5sig)) {
      return new Response("Invalid signature", { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: {
        paymentNumber: orderId,
      },
      include: {
        userPackage: true,
        plan: true,
      },
    });

    if (!payment) {
      return new Response("Payment not found", { status: 404 });
    }

    const expectedAmount = formatPayHereAmount(payment.amount);

    if (
      expectedAmount !== payhereAmount ||
      payment.currency !== payhereCurrency
    ) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: "FAILED",
            gatewayRef: paymentId || null,
            adminNote: `PayHere amount/currency mismatch. Expected ${payment.currency} ${expectedAmount}, received ${payhereCurrency} ${payhereAmount}.`,
          },
        });

        if (
          payment.userPackageId &&
          payment.userPackage?.status === "PENDING_PAYMENT"
        ) {
          await tx.userPackage.update({
            where: {
              id: payment.userPackageId,
            },
            data: {
              status: "CANCELLED",
            },
          });
        }

        await tx.activityLog.create({
          data: {
            userId: payment.customerId,
            action: "PAYHERE_PAYMENT_FAILED",
            description: `${payment.paymentNumber} failed because PayHere amount or currency did not match.`,
          },
        });
      });

      return new Response("Amount mismatch", { status: 400 });
    }

    if (payment.status === "PAID" || payment.status === "VERIFIED") {
      return new Response("OK", { status: 200 });
    }

    if (statusCode === "2") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: "PAID",
            gatewayRef: paymentId || null,
            verifiedAt: new Date(),
            adminNote: `PayHere online payment completed automatically. Method: ${
              method || "N/A"
            }.`,
          },
        });

        if (payment.userPackageId) {
          await tx.userPackage.update({
            where: {
              id: payment.userPackageId,
            },
            data: {
              status: "ACTIVE",
              activatedAt: new Date(),
            },
          });
        }

        await tx.activityLog.create({
          data: {
            userId: payment.customerId,
            action: "PAYHERE_PAYMENT_PAID",
            description: `${payment.paymentNumber} was paid successfully through PayHere. Gateway payment ID: ${
              paymentId || "N/A"
            }.`,
          },
        });
      });

      return new Response("OK", { status: 200 });
    }

    if (statusCode === "0") {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "PENDING",
          gatewayRef: paymentId || null,
          adminNote: getStatusNote(statusCode, statusMessage),
        },
      });

      return new Response("OK", { status: 200 });
    }

    const nextPaymentStatus = statusCode === "-3" ? "REFUNDED" : "FAILED";
    const nextPackageStatus = getFailedPackageStatus(payment.status);

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: nextPaymentStatus,
          gatewayRef: paymentId || null,
          adminNote: getStatusNote(statusCode, statusMessage),
        },
      });

      if (
        nextPackageStatus &&
        payment.userPackageId &&
        payment.userPackage?.status === "PENDING_PAYMENT"
      ) {
        await tx.userPackage.update({
          where: {
            id: payment.userPackageId,
          },
          data: {
            status: nextPackageStatus,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: payment.customerId,
          action:
            nextPaymentStatus === "REFUNDED"
              ? "PAYHERE_PAYMENT_REFUNDED"
              : "PAYHERE_PAYMENT_FAILED",
          description: `${payment.paymentNumber} status changed to ${nextPaymentStatus}. ${getStatusNote(
            statusCode,
            statusMessage,
          )}`,
        },
      });
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("PayHere notification failed:", error);
    return new Response("PayHere notification failed", { status: 500 });
  }
}
