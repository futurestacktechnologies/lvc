import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const tokenHash = hashSessionToken(sessionToken);

    await prisma.userSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  const response = NextResponse.redirect(
    new URL("/?logout=success", request.url),
  );

  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}
