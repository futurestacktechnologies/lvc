import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma/client";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashSessionToken(sessionToken);

  const session = await prisma.userSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          phoneVerified: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.user.status !== "ACTIVE") {
    return null;
  }

  return session.user;
}
