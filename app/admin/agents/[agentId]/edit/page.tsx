import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import AgentForm from "@/components/admin/AgentForm";
import { Button } from "@/components/ui/button";

import { prisma } from "@/lib/prisma/client";

type EditAgentPageProps = {
  params: Promise<{
    agentId: string;
  }>;
};

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  const { agentId } = await params;

  const agent = await prisma.agent.findUnique({
    where: {
      id: agentId,
    },
    select: {
      id: true,
      name: true,
      mobile: true,
      address: true,
      promoCode: true,
      status: true,
      nicDlUrl: true,
      nicDlFileName: true,
      nicDlFileType: true,
      nicDlFileSize: true,
    },
  });

  if (!agent) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="mt-1 h-9 w-9 cursor-pointer rounded-xl"
          >
            <Link href={`/admin/agents/${agent.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-brand" />

              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Edit Agent
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Update the agent&apos;s information, referral settings, status,
              and verification document.
            </p>
          </div>
        </div>
      </div>

      <AgentForm
        mode="edit"
        agentId={agent.id}
        initialData={{
          name: agent.name,
          mobile: agent.mobile,
          address: agent.address,
          promoCode: agent.promoCode,
          status: agent.status,
          document:
            agent.nicDlUrl && agent.nicDlFileName
              ? {
                  url: `/api/admin/agents/${agent.id}/document/view`,
                  fileName: agent.nicDlFileName,
                  fileType: agent.nicDlFileType,
                  fileSize: agent.nicDlFileSize,
                }
              : null,
        }}
      />
    </div>
  );
}
