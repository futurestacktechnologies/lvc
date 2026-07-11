type SendOtpSmsArgs = {
  phone: string;
  otp: string;
  purpose: "LOGIN" | "SIGNUP";
};

function formatNotifyPhone(phone: string) {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = `94${digits.slice(1)}`;
  }

  return digits;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing.`);
  }

  return value;
}

export async function sendOtpSms({ phone, otp }: SendOtpSmsArgs) {
  const userId = getRequiredEnv("NOTIFY_LK_USER_ID");
  const apiKey = getRequiredEnv("NOTIFY_LK_API_KEY");
  const senderId = getRequiredEnv("NOTIFY_LK_SENDER_ID");

  const to = formatNotifyPhone(phone);

  const message = `Your Enfield Nexus verification code is ${otp}. It expires in 5 minutes. Do not share this code.`;

  const formData = new URLSearchParams({
    user_id: userId,
    api_key: apiKey,
    sender_id: senderId,
    to,
    message,
  });

  const response = await fetch("https://app.notify.lk/api/v1/send", {
    method: "POST",
    body: formData,
  });

  const responseText = await response.text();

  let result: { status?: string; message?: string } | null = null;

  try {
    result = JSON.parse(responseText);
  } catch {
    result = null;
  }

  if (!response.ok || result?.status === "error") {
    console.error("Notify.lk SMS failed:", responseText);

    throw new Error(
      result?.message || "Failed to send OTP SMS. Please try again.",
    );
  }

  return {
    success: true,
    to,
  };
}
