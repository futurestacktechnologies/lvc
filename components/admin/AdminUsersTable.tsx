"use client";

import { CheckCircle2, ShieldAlert, Trash2, XCircle } from "lucide-react";

import ActionConfirmDialog from "@/components/common/ActionConfirmDialog";
import AdminDataTable, {
  type AdminDataTableColumn,
} from "@/components/admin/AdminDataTable";
import UserTableControls from "@/components/admin/UserTableControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type UserRoleValue = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
type UserStatusValue = "ACTIVE" | "INACTIVE" | "BLOCKED";

type AdminUserRow = {
  id: string;
  name: string;
  phone: string;
  role: UserRoleValue;
  status: UserStatusValue;
  phoneVerified: boolean;
  createdAt: string;
  requestsCount: number;
  packagesCount: number;
};

type AdminUsersTableProps = {
  users: AdminUserRow[];
  totalUsers: number;
  currentPage: number;
  pageSize: number;
};

export default function AdminUsersTable({
  users,
  totalUsers,
  currentPage,
  pageSize,
}: AdminUsersTableProps) {
  const columns: AdminDataTableColumn<AdminUserRow>[] = [
    {
      id: "user",
      header: "User",
      cell: (user) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.id}</span>
        </div>
      ),
    },
    {
      id: "phone",
      header: "Mobile Number",
      cell: (user) => (
        <a
          href={`https://wa.me/${user.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-muted-foreground transition hover:text-brand"
        >
          {user.phone}
        </a>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (user) => <RoleBadge role={user.role} />,
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => <UserStatusBadge status={user.status} />,
    },
    {
      id: "verified",
      header: "Verified",
      cell: (user) =>
        user.phoneVerified ? (
          <Badge className="bg-success text-white">Verified</Badge>
        ) : (
          <Badge variant="outline">Not Verified</Badge>
        ),
    },
    {
      id: "requests",
      header: "Requests",
      cell: (user) => user.requestsCount,
    },
    {
      id: "packages",
      header: "Packages",
      cell: (user) => user.packagesCount,
    },
    {
      id: "created",
      header: "Created",
      cell: (user) => (
        <span className="text-sm text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString("en-LK")}
        </span>
      ),
    },
  ];

  return (
    <AdminDataTable
      rows={users}
      columns={columns}
      totalRows={totalUsers}
      currentPage={currentPage}
      pageSize={pageSize}
      controls={<UserTableControls />}
      enableSelection
      emptyTitle="No users match your filters"
      emptyDescription="Try adjusting your filter criteria."
      bulkDelete={{
        actionUrl: "/api/admin/users/delete",
        hiddenFieldName: "userIds",
        title: "Delete selected users?",
        description: (selectedCount) =>
          `Are you sure you want to delete ${selectedCount} selected user${
            selectedCount !== 1 ? "s" : ""
          }? This action cannot be undone.`,
        confirmLabel: "Yes, Delete",
        successTitle: "Users deleted",
        successDescription: "Selected users have been deleted successfully.",
        errorTitle: "Delete failed",
      }}
      renderActions={(user, isSelected) =>
        isSelected ? (
          <ActionConfirmDialog
            title="Delete this user?"
            description={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
            confirmLabel="Yes, Delete"
            confirmVariant="destructive"
            actionUrl="/api/admin/users/delete"
            hiddenFields={{
              userIds: JSON.stringify([user.id]),
            }}
            successTitle="User deleted"
            successDescription={`${user.name} has been deleted successfully.`}
            errorTitle="Delete failed"
            icon={<Trash2 className="h-6 w-6" />}
            trigger={
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        ) : user.status === "ACTIVE" ? (
          <ActionConfirmDialog
            title="Block this user?"
            description={`Are you sure you want to block ${user.name}? This user will not be able to access the account until activated again.`}
            confirmLabel="Yes, Block User"
            confirmVariant="destructive"
            actionUrl={`/api/admin/users/${user.id}/status`}
            hiddenFields={{
              status: "BLOCKED",
            }}
            successTitle="User blocked"
            successDescription={`${user.name} has been blocked successfully.`}
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
        ) : (
          <ActionConfirmDialog
            title="Activate this user?"
            description={`Are you sure you want to activate ${user.name}? This user will be able to access the account again.`}
            confirmLabel="Yes, Activate User"
            confirmVariant="default"
            actionUrl={`/api/admin/users/${user.id}/status`}
            hiddenFields={{
              status: "ACTIVE",
            }}
            successTitle="User activated"
            successDescription={`${user.name} has been activated successfully.`}
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
        )
      }
    />
  );
}

function RoleBadge({ role }: { role: UserRoleValue }) {
  if (role === "SUPER_ADMIN") {
    return <Badge className="bg-brand text-white">SUPER ADMIN</Badge>;
  }

  if (role === "ADMIN") {
    return (
      <Badge className="bg-secondary text-secondary-foreground">ADMIN</Badge>
    );
  }

  return <Badge variant="outline">CUSTOMER</Badge>;
}

function UserStatusBadge({ status }: { status: UserStatusValue }) {
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

  if (status === "INACTIVE") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-1 ring-amber-500/30 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
        INACTIVE
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
}
