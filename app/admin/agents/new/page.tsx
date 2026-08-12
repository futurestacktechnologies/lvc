import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import AgentForm from "@/components/admin/AgentForm";

export default function NewAgentPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="mt-1 h-9 w-9 cursor-pointer rounded-xl"
          >
            <Link href="/admin/agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand" />

              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Add Agent
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Create a new agent and configure their referral details.
            </p>
          </div>
        </div>
      </div>

      <AgentForm mode="create" />
    </div>
  );
}
