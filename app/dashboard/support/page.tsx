import SupportChatBox from "@/components/dashboard/SupportChatBox";

export default function CustomerSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Customer Support</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Live Chat
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Contact our support team for payment help, report questions, or
          account support.
        </p>
      </div>

      <SupportChatBox />
    </div>
  );
}
