// "use client";

// import { CheckCircle2, Eye, Pencil, ShieldAlert, XCircle } from "lucide-react";
// import Link from "next/link";
// import ActionConfirmDialog from "@/components/common/ActionConfirmDialog";
// import AdminDataTable, {
//   type AdminDataTableColumn,
// } from "@/components/admin/AdminDataTable";

// import AgentTableControls from "@/components/admin/AgentTableControls";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";

// type AgentStatusValue = "ACTIVE" | "INACTIVE" | "BLOCKED";

// type AdminAgentRow = {
//   id: string;
//   name: string;
//   mobile: string;
//   address: string;
//   nicDlUrl: string | null;
//   nicDlFileName: string | null;
//   nicDlFileType: string | null;
//   nicDlFileSize: number | null;
//   promoCode: string;
//   status: AgentStatusValue;
//   createdAt: string;
//   customersCount: number;
// };

// type AdminAgentsTableProps = {
//   agents: AdminAgentRow[];
//   totalAgents: number;
//   currentPage: number;
//   pageSize: number;
// };

// export default function AdminAgentsTable({
//   agents,
//   totalAgents,
//   currentPage,
//   pageSize,
// }: AdminAgentsTableProps) {
//   const columns: AdminDataTableColumn<AdminAgentRow>[] = [
//     {
//       id: "agent",
//       header: "Agent",
//       cell: (agent) => (
//         <div className="flex flex-col">
//           <span className="font-medium text-foreground">{agent.name}</span>

//           <span className="text-xs text-muted-foreground">{agent.id}</span>
//         </div>
//       ),
//     },

//     {
//       id: "mobile",
//       header: "Mobile Number",
//       cell: (agent) => (
//         <a
//           href={`https://wa.me/${agent.mobile.replace(/\D/g, "")}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-sm font-medium text-muted-foreground transition hover:text-brand"
//         >
//           {agent.mobile}
//         </a>
//       ),
//     },

//     {
//       id: "promo",
//       header: "Promo Code",
//       cell: (agent) => (
//         <span className="rounded-xl bg-secondary px-3 py-1.5 font-mono text-xs font-semibold text-brand">
//           {agent.promoCode}
//         </span>
//       ),
//     },

//     {
//       id: "customers",
//       header: "Customers",
//       cell: (agent) => (
//         <div className="font-medium text-foreground">
//           {agent.customersCount}
//         </div>
//       ),
//     },

//     {
//       id: "document",
//       header: "NIC / DL",
//       cell: (agent) =>
//         agent.nicDlFileName ? (
//           <div className="flex items-center gap-2">
//             <CheckCircle2 className="h-4 w-4 text-success" />

//             <span className="max-w-32 truncate text-xs text-muted-foreground">
//               {agent.nicDlFileName}
//             </span>
//           </div>
//         ) : (
//           <Badge variant="outline">Not Uploaded</Badge>
//         ),
//     },

//     {
//       id: "status",
//       header: "Status",
//       cell: (agent) => <AgentStatusBadge status={agent.status} />,
//     },

//     {
//       id: "created",
//       header: "Created",
//       cell: (agent) => (
//         <span className="text-sm text-muted-foreground">
//           {new Date(agent.createdAt).toLocaleDateString("en-LK")}
//         </span>
//       ),
//     },
//   ];

//   return (
//     <AdminDataTable
//       rows={agents}
//       columns={columns}
//       totalRows={totalAgents}
//       currentPage={currentPage}
//       pageSize={pageSize}
//       controls={<AgentTableControls />}
//       emptyTitle="No agents match your filters"
//       emptyDescription="Try adjusting your search or status filter."
//       renderActions={(agent) => <AgentActions agent={agent} />}
//     />
//   );
// }

// function AgentActions({ agent }: { agent: AdminAgentRow }) {
//   if (agent.status === "ACTIVE") {
//     return (
//       <>
//         <Button size="sm" variant="outline" className="cursor-pointer">
//           <Link href={`/admin/agents/${agent.id}`}>
//             <Eye className="mr-1 h-3.5 w-3.5" />
//           </Link>
//         </Button>

//         <Button size="sm" variant="outline" className="cursor-pointer">
//           <Link href={`/admin/agents/${agent.id}/edit`}>
//             <Pencil className="mr-1 h-3.5 w-3.5" />
//           </Link>
//         </Button>

//         <ActionConfirmDialog
//           title="Block this agent?"
//           description={`Are you sure you want to block ${agent.name}? This agent will no longer be active.`}
//           confirmLabel="Yes, Block Agent"
//           confirmVariant="destructive"
//           actionUrl={`/api/admin/agents/${agent.id}/status`}
//           hiddenFields={{
//             status: "BLOCKED",
//           }}
//           successTitle="Agent blocked"
//           successDescription={`${agent.name} has been blocked successfully.`}
//           errorTitle="Block failed"
//           icon={<ShieldAlert className="h-6 w-6" />}
//           trigger={
//             <Button
//               type="button"
//               size="sm"
//               variant="outline"
//               className="cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
//             >
//               <XCircle className="mr-1 h-3.5 w-3.5" />
//               Block
//             </Button>
//           }
//         />
//       </>
//     );
//   }

//   return (
//     <>
//       <Button
//         type="button"
//         size="sm"
//         variant="outline"
//         className="cursor-pointer"
//       >
//         <Link href={`/admin/agents/${agent.id}`}>
//           <Eye className="mr-1 h-3.5 w-3.5" />
//         </Link>
//       </Button>

//       <Button size="sm" variant="outline" className="cursor-pointer">
//         <Link href={`/admin/agents/${agent.id}/edit`}>
//           <Pencil className="mr-1 h-3.5 w-3.5" />
//         </Link>
//       </Button>

//       <ActionConfirmDialog
//         title="Activate this agent?"
//         description={`Are you sure you want to activate ${agent.name}?`}
//         confirmLabel="Yes, Activate Agent"
//         confirmVariant="default"
//         actionUrl={`/api/admin/agents/${agent.id}/status`}
//         hiddenFields={{
//           status: "ACTIVE",
//         }}
//         successTitle="Agent activated"
//         successDescription={`${agent.name} has been activated successfully.`}
//         errorTitle="Activation failed"
//         icon={<CheckCircle2 className="h-6 w-6" />}
//         trigger={
//           <Button
//             type="button"
//             size="sm"
//             variant="outline"
//             className="cursor-pointer border-success text-success hover:bg-success/10"
//           >
//             <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
//             Activate
//           </Button>
//         }
//       />
//     </>
//   );
// }

// function AgentStatusBadge({ status }: { status: AgentStatusValue }) {
//   if (status === "ACTIVE") {
//     return (
//       <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
//         ACTIVE
//       </Badge>
//     );
//   }

//   if (status === "BLOCKED") {
//     return (
//       <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
//         BLOCKED
//       </Badge>
//     );
//   }

//   return (
//     <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
//       INACTIVE
//     </Badge>
//   );
// }

"use client";

import { CheckCircle2, Eye, Pencil, ShieldAlert, XCircle } from "lucide-react";
import Link from "next/link";
import ActionConfirmDialog from "@/components/common/ActionConfirmDialog";
import AdminDataTable, {
  type AdminDataTableColumn,
} from "@/components/admin/AdminDataTable";

import AgentTableControls from "@/components/admin/AgentTableControls";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AgentStatusValue = "ACTIVE" | "INACTIVE" | "BLOCKED";

type AdminAgentRow = {
  id: string;
  name: string;
  mobile: string;
  address: string;
  nicDlUrl: string | null;
  nicDlFileName: string | null;
  nicDlFileType: string | null;
  nicDlFileSize: number | null;
  promoCode: string;
  status: AgentStatusValue;
  createdAt: string;
  customersCount: number;

  totalPayments: number;
  commission: number;
};

type AdminAgentsTableProps = {
  agents: AdminAgentRow[];
  totalAgents: number;
  currentPage: number;
  pageSize: number;
};

export default function AdminAgentsTable({
  agents,
  totalAgents,
  currentPage,
  pageSize,
}: AdminAgentsTableProps) {
  const columns: AdminDataTableColumn<AdminAgentRow>[] = [
    {
      id: "agent",
      header: "Agent",
      cell: (agent) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{agent.name}</span>

          <span className="text-xs text-muted-foreground">{agent.id}</span>
        </div>
      ),
    },

    {
      id: "mobile",
      header: "Mobile Number",
      cell: (agent) => (
        <a
          href={`https://wa.me/${agent.mobile.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-muted-foreground transition hover:text-brand"
        >
          {agent.mobile}
        </a>
      ),
    },

    {
      id: "promo",
      header: "Promo Code",
      cell: (agent) => (
        <span className="rounded-xl bg-secondary px-3 py-1.5 font-mono text-xs font-semibold text-brand">
          {agent.promoCode}
        </span>
      ),
    },

    {
      id: "customers",
      header: "Customers",
      cell: (agent) => (
        <div className="font-medium text-foreground">
          {agent.customersCount}
        </div>
      ),
    },

    {
      id: "payments",
      header: "Paid Amount",
      cell: (agent) => (
        <span className="whitespace-nowrap text-sm font-medium text-foreground">
          LKR{" "}
          {agent.totalPayments.toLocaleString("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },

    {
      id: "commission",
      header: "Commission",
      cell: (agent) => (
        <div className="flex flex-col">
          <span className="whitespace-nowrap font-semibold text-brand">
            LKR{" "}
            {agent.commission.toLocaleString("en-LK", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>

          <span className="text-xs text-muted-foreground">5% commission</span>
        </div>
      ),
    },

    {
      id: "document",
      header: "NIC / DL",
      cell: (agent) =>
        agent.nicDlFileName ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />

            <span className="max-w-32 truncate text-xs text-muted-foreground">
              {agent.nicDlFileName}
            </span>
          </div>
        ) : (
          <Badge variant="outline">Not Uploaded</Badge>
        ),
    },

    {
      id: "status",
      header: "Status",
      cell: (agent) => <AgentStatusBadge status={agent.status} />,
    },

    {
      id: "created",
      header: "Created",
      cell: (agent) => (
        <span className="text-sm text-muted-foreground">
          {new Date(agent.createdAt).toLocaleDateString("en-LK")}
        </span>
      ),
    },
  ];

  return (
    <AdminDataTable
      rows={agents}
      columns={columns}
      totalRows={totalAgents}
      currentPage={currentPage}
      pageSize={pageSize}
      controls={<AgentTableControls />}
      emptyTitle="No agents match your filters"
      emptyDescription="Try adjusting your search or status filter."
      renderActions={(agent) => <AgentActions agent={agent} />}
    />
  );
}

function AgentActions({ agent }: { agent: AdminAgentRow }) {
  if (agent.status === "ACTIVE") {
    return (
      <>
        <Button size="sm" variant="outline" className="cursor-pointer">
          <Link href={`/admin/agents/${agent.id}`}>
            <Eye className="mr-1 h-3.5 w-3.5" />
          </Link>
        </Button>

        <Button size="sm" variant="outline" className="cursor-pointer">
          <Link href={`/admin/agents/${agent.id}/edit`}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
          </Link>
        </Button>

        <ActionConfirmDialog
          title="Block this agent?"
          description={`Are you sure you want to block ${agent.name}? This agent will no longer be active.`}
          confirmLabel="Yes, Block Agent"
          confirmVariant="destructive"
          actionUrl={`/api/admin/agents/${agent.id}/status`}
          hiddenFields={{
            status: "BLOCKED",
          }}
          successTitle="Agent blocked"
          successDescription={`${agent.name} has been blocked successfully.`}
          errorTitle="Block failed"
          icon={<ShieldAlert className="h-6 w-6" />}
          trigger={
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
            >
              <XCircle className="mr-1 h-3.5 w-3.5" />
              Block
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="cursor-pointer"
      >
        <Link href={`/admin/agents/${agent.id}`}>
          <Eye className="mr-1 h-3.5 w-3.5" />
        </Link>
      </Button>

      <Button size="sm" variant="outline" className="cursor-pointer">
        <Link href={`/admin/agents/${agent.id}/edit`}>
          <Pencil className="mr-1 h-3.5 w-3.5" />
        </Link>
      </Button>

      <ActionConfirmDialog
        title="Activate this agent?"
        description={`Are you sure you want to activate ${agent.name}?`}
        confirmLabel="Yes, Activate Agent"
        confirmVariant="default"
        actionUrl={`/api/admin/agents/${agent.id}/status`}
        hiddenFields={{
          status: "ACTIVE",
        }}
        successTitle="Agent activated"
        successDescription={`${agent.name} has been activated successfully.`}
        errorTitle="Activation failed"
        icon={<CheckCircle2 className="h-6 w-6" />}
        trigger={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="cursor-pointer border-success text-success hover:bg-success/10"
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            Activate
          </Button>
        }
      />
    </>
  );
}

function AgentStatusBadge({ status }: { status: AgentStatusValue }) {
  if (status === "ACTIVE") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/30 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
        ACTIVE
      </Badge>
    );
  }

  if (status === "BLOCKED") {
    return (
      <Badge className="border-rose-200 bg-rose-50 text-rose-700 ring-1 ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
        BLOCKED
      </Badge>
    );
  }

  return (
    <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
      INACTIVE
    </Badge>
  );
}
