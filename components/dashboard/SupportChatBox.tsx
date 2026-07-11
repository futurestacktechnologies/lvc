"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import MessageAttachment from "@/components/support-chat/MessageAttachment";
import { Button } from "@/components/ui/button";

type SupportUser = {
  id: string;
  name: string;
  phone: string;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
};

type SupportMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  attachmentUrl: string | null;
  attachmentFileName: string | null;
  attachmentFileType: string | null;
  attachmentFileSize: number | null;
  attachmentSignedUrl: string | null;
  isReadByCustomer: boolean;
  isReadByAdmin: boolean;
  createdAt: string;
  sender: SupportUser;
};

type SupportConversation = {
  id: string;
  conversationNumber: string;
  customerId: string;
  assignedAdminId: string | null;
  subject: string | null;
  status: "OPEN" | "WAITING_ADMIN" | "WAITING_CUSTOMER" | "CLOSED";
  lastMessageAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  assignedAdmin: {
    id: string;
    name: string;
    phone: string;
  } | null;
  messages: SupportMessage[];
};

type SupportChatResponse = {
  success: boolean;
  message?: string;
  conversation: SupportConversation | null;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status?: SupportConversation["status"]) {
  if (!status) return "New chat";

  const labels: Record<SupportConversation["status"], string> = {
    OPEN: "Open",
    WAITING_ADMIN: "Waiting for admin",
    WAITING_CUSTOMER: "Waiting for your reply",
    CLOSED: "Closed",
  };

  return labels[status];
}

export default function SupportChatBox() {
  const [conversation, setConversation] = useState<SupportConversation | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = conversation?.customer?.id;
  const isConversationClosed = conversation?.status === "CLOSED";

  const fetchConversation = useCallback(
    async (showLoader = false) => {
      try {
        if (showLoader) {
          setIsLoading(true);
        }

        const response = await fetch("/api/support-chat", {
          cache: "no-store",
        });

        const result = (await response.json()) as SupportChatResponse;

        if (!response.ok || !result.success) {
          setErrorMessage(result.message || "Unable to load support chat.");
          return;
        }

        if (isStartingNewChat && result.conversation?.status === "CLOSED") {
          setErrorMessage("");
          return;
        }

        setConversation(result.conversation);
        setErrorMessage("");
      } catch (error) {
        console.error(error);
        setErrorMessage("Something went wrong while loading support chat.");
      } finally {
        setIsLoading(false);
      }
    },
    [isStartingNewChat],
  );

  useEffect(() => {
    const firstLoadTimeoutId = window.setTimeout(() => {
      void fetchConversation(false);
    }, 0);

    const intervalId = window.setInterval(() => {
      void fetchConversation(false);
    }, 3000);

    return () => {
      window.clearTimeout(firstLoadTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages?.length]);

  function handleStartNewChat() {
    setIsStartingNewChat(true);
    setConversation(null);
    setMessage("");
    clearSelectedFile();
    setErrorMessage("");
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Please upload a PDF, JPG, PNG, or WebP file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Attachment must be less than 5MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");
  }

  function clearSelectedFile() {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if ((!cleanMessage && !selectedFile) || isSending) {
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage("");

      const formData = new FormData();
      formData.append("message", cleanMessage);

      if (selectedFile) {
        formData.append("attachment", selectedFile);
      }

      const response = await fetch("/api/support-chat/messages", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        setErrorMessage(result.message || "Unable to send message.");
        return;
      }

      setMessage("");
      clearSelectedFile();
      setIsStartingNewChat(false);
      await fetchConversation(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while sending your message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/40 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <MessageCircle className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Live Support Chat
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Send your question to our support team. We will reply as soon as
                possible.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              {getStatusLabel(conversation?.status)}
            </span>

            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              size="sm"
              onClick={() => fetchConversation(true)}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="h-[560px] overflow-y-auto px-4 py-5 sm:px-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading chat...
            </div>
          </div>
        ) : !conversation ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-sm">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
                <ShieldCheck className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                Start a new support chat
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Type your message below and our admin team will receive it.
              </p>
            </div>
          </div>
        ) : conversation.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Send your first message below.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.messages.map((chatMessage) => {
              const isMine = chatMessage.senderId === currentUserId;

              return (
                <div
                  key={chatMessage.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[70%] ${
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-foreground"
                    }`}
                  >
                    {!isMine && (
                      <p className="mb-1 text-xs font-semibold text-muted-foreground">
                        {chatMessage.sender.name}
                      </p>
                    )}

                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {chatMessage.message}
                    </p>

                    <MessageAttachment
                      fileName={chatMessage.attachmentFileName}
                      fileType={chatMessage.attachmentFileType}
                      fileSize={chatMessage.attachmentFileSize}
                      signedUrl={chatMessage.attachmentSignedUrl}
                      isMine={isMine}
                    />

                    <p
                      className={`mt-2 text-right text-[11px] ${
                        isMine
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(chatMessage.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="border-t border-destructive/20 bg-destructive/10 px-5 py-3 text-sm text-destructive sm:px-6">
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="border-t border-border bg-background px-4 py-4 sm:px-6"
      >
        {isConversationClosed ? (
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
            <h3 className="text-sm font-semibold text-foreground">
              This conversation is closed
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This support chat has been closed by our admin team. You can start
              a new chat if you need more help.
            </p>

            <Button
              type="button"
              className="mt-4 rounded-2xl cursor-pointer"
              onClick={handleStartNewChat}
            >
              <MessageCircle className="mr-2 size-4" />
              Start New Chat
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {selectedFile && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelectedFile}
                    className="shrink-0 cursor-pointer"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl px-4 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="mr-2 size-4" />
                  Attach
                </Button>

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={
                    conversation
                      ? "Type your message..."
                      : "Type your message to start a new chat..."
                  }
                  rows={2}
                  maxLength={1000}
                  className="min-h-12 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                />

                <Button
                  type="submit"
                  disabled={(!message.trim() && !selectedFile) || isSending}
                  className="h-12 rounded-2xl px-6 cursor-pointer"
                >
                  {isSending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 size-4" />
                  )}
                  {conversation ? "Send" : "Start Chat"}
                </Button>
              </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Please do not share card details, OTP codes, or passwords in chat.
            </p>
          </>
        )}
      </form>
    </div>
  );
}
