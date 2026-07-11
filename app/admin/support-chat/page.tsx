import AdminSupportChat from "@/components/admin/AdminSupportChat";

export default function AdminSupportChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Support Center</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Live Support Chat
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          View customer conversations, reply to support questions, and close
          resolved chats.
        </p>
      </div>

      <AdminSupportChat />
    </div>
  );
}
