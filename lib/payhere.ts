import crypto from "crypto";

export type PayHereMode = "sandbox" | "live";

function md5(value: string) {
  return crypto.createHash("md5").update(value).digest("hex").toUpperCase();
}

export function formatPayHereAmount(amount: number) {
  return amount.toFixed(2);
}

export function getPayHereConfig() {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const notifyUrl = process.env.PAYHERE_NOTIFY_URL;
  const mode = (process.env.PAYHERE_MODE || "sandbox") as PayHereMode;

  if (!merchantId) {
    throw new Error("PAYHERE_MERCHANT_ID is missing.");
  }

  if (!merchantSecret) {
    throw new Error("PAYHERE_MERCHANT_SECRET is missing.");
  }

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is missing.");
  }

  if (!notifyUrl) {
    throw new Error("PAYHERE_NOTIFY_URL is missing.");
  }

  return {
    merchantId,
    merchantSecret,
    appUrl: appUrl.replace(/\/+$/, ""),
    notifyUrl,
    mode,
    checkoutUrl:
      mode === "live"
        ? "https://www.payhere.lk/pay/checkout"
        : "https://sandbox.payhere.lk/pay/checkout",
  };
}

export function generatePayHereCheckoutHash({
  merchantId,
  orderId,
  amount,
  currency,
  merchantSecret,
}: {
  merchantId: string;
  orderId: string;
  amount: number;
  currency: string;
  merchantSecret: string;
}) {
  const formattedAmount = formatPayHereAmount(amount);
  const hashedSecret = md5(merchantSecret);

  return md5(
    `${merchantId}${orderId}${formattedAmount}${currency}${hashedSecret}`,
  );
}

export function generatePayHereNotificationHash({
  merchantId,
  orderId,
  payhereAmount,
  payhereCurrency,
  statusCode,
  merchantSecret,
}: {
  merchantId: string;
  orderId: string;
  payhereAmount: string;
  payhereCurrency: string;
  statusCode: string;
  merchantSecret: string;
}) {
  const hashedSecret = md5(merchantSecret);

  return md5(
    `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashedSecret}`,
  );
}

export function safeCompareHash(valueA: string, valueB: string) {
  const bufferA = Buffer.from(valueA.toUpperCase());
  const bufferB = Buffer.from(valueB.toUpperCase());

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}
