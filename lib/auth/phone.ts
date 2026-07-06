export function normalizePhone(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  if (cleaned.startsWith("0")) {
    return `+94${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith("94")) {
    return `+${cleaned}`;
  }

  return cleaned;
}
