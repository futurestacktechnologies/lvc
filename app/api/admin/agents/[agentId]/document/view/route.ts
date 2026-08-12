import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const AGENT_DOCUMENT_BUCKET =
  process.env.SUPABASE_AGENT_DOCUMENT_BUCKET || "agent-documents";

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminUser();

    const { agentId } = await context.params;

    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
      },
      select: {
        id: true,
        nicDlUrl: true,
        nicDlFileName: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: "Agent not found.",
        },
        { status: 404 },
      );
    }

    if (!agent.nicDlUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "No verification document has been uploaded.",
        },
        { status: 404 },
      );
    }

    const { data, error } = await supabaseAdmin.storage
      .from(AGENT_DOCUMENT_BUCKET)
      .createSignedUrl(agent.nicDlUrl, 60 * 5);

    if (error || !data?.signedUrl) {
      console.error("Failed to create agent document signed URL:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to open the verification document.",
        },
        { status: 500 },
      );
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Agent document view failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while opening the document.",
      },
      { status: 500 },
    );
  }
}
