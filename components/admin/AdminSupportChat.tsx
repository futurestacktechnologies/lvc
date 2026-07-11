"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  User,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type UserRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";

type ConversationStatus =
  | "OPEN"
  | "WAITING_ADMIN"
  | "WAITING_CUSTOMER"
  | "CLOSED";

type ChatUser = {
  id: string;
  name: string;
  phone: string;
  role?: UserRole;
};

type SupportMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  attachmentUrl: string | null;
  isReadByCustomer: boolean;
  isReadByAdmin: boolean;
  createdAt: string;
  sender: ChatUser;
};

type ConversationListItem = {
  id: string;
  conversationNumber: string;
  customerId: string;
  assignedAdminId: string | null;
  subject: string | null;
  status: ConversationStatus;
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
  messages: {
    id: string;
    message: string;
    createdAt: string;
    senderId: string;
    sender: {
      id: string;
      name: string;
      role: UserRole;
    };
  }[];
  _count: {
    messages: number;
  };
};

type SupportConversation = {
  id: string;
  conversationNumber: string;
  customerId: string;
  assignedAdminId: string | null;
  subject: string | null;
  status: ConversationStatus;
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

type ConversationListResponse = {
  success: boolean;
  message?: string;
  conversations: ConversationListItem[];
};

type ConversationResponse = {
  success: boolean;
  message?: string;
  conversation: SupportConversation;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusLabel(status: ConversationStatus) {
  const labels: Record<ConversationStatus, string> = {
    OPEN: "Open",
    WAITING_ADMIN: "Waiting Admin",
    WAITING_CUSTOMER: "Waiting Customer",
    CLOSED: "Closed",
  };

  return labels[status];
}

function getStatusClass(status: ConversationStatus) {
  const classes: Record<ConversationStatus, string> = {
    OPEN: "border-blue-200 bg-blue-50 text-blue-700",
    WAITING_ADMIN: "border-orange-200 bg-orange-50 text-orange-700",
    WAITING_CUSTOMER: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CLOSED: "border-muted bg-muted text-muted-foreground",
  };

  return classes[status];
}

function getLastMessage(conversation: ConversationListItem) {
  return conversation.messages[0]?.message || "No messages yet.";
}

export default function AdminSupportChat() {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>("");
  const [selectedConversation, setSelectedConversation] =
    useState<SupportConversation | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/support-chat", {
        cache: "no-store",
      });

      const result = (await response.json()) as ConversationListResponse;

      if (!response.ok || !result.success) {
        setErrorMessage(
          result.message || "Unable to load support conversations.",
        );
        return;
      }

      setConversations(result.conversations);
      setErrorMessage("");

      if (!selectedConversationId && result.conversations.length > 0) {
        setIsConversationLoading(true);
        setSelectedConversationId(result.conversations[0].id);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while loading conversations.");
    } finally {
      setIsListLoading(false);
    }
  }, [selectedConversationId]);

  const fetchSelectedConversation = useCallback(
    async (conversationId: string) => {
      try {
        const response = await fetch(
          `/api/admin/support-chat/${conversationId}`,
          {
            cache: "no-store",
          },
        );

        const result = (await response.json()) as ConversationResponse;

        if (!response.ok || !result.success) {
          setErrorMessage(result.message || "Unable to load conversation.");
          return;
        }

        setSelectedConversation(result.conversation);
        setErrorMessage("");
      } catch (error) {
        console.error(error);
        setErrorMessage("Something went wrong while loading conversation.");
      } finally {
        setIsConversationLoading(false);
      }
    },
    [],
  );

  function handleSelectConversation(conversationId: string) {
    if (conversationId === selectedConversationId) {
      return;
    }

    setSelectedConversationId(conversationId);
    setSelectedConversation(null);
    setIsConversationLoading(true);
  }

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (!cancelled) {
        void fetchConversations();
      }
    };

    const timeoutId = window.setTimeout(run, 0);
    const intervalId = window.setInterval(run, 3000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    let cancelled = false;

    const run = () => {
      if (!cancelled) {
        void fetchSelectedConversation(selectedConversationId);
      }
    };

    const timeoutId = window.setTimeout(run, 0);
    const intervalId = window.setInterval(run, 3000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchSelectedConversation, selectedConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages?.length]);

  async function handleSendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = replyMessage.trim();

    if (!selectedConversationId || !cleanMessage || isSending) {
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/admin/support-chat/${selectedConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: cleanMessage,
          }),
        },
      );

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        setErrorMessage(result.message || "Unable to send reply.");
        return;
      }

      setReplyMessage("");
      await fetchSelectedConversation(selectedConversationId);
      await fetchConversations();
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while sending reply.");
    } finally {
      setIsSending(false);
    }
  }

  async function updateConversationStatus(status: ConversationStatus) {
    if (!selectedConversationId || isUpdatingStatus) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/admin/support-chat/${selectedConversationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        setErrorMessage(result.message || "Unable to update status.");
        return;
      }

      await fetchSelectedConversation(selectedConversationId);
      await fetchConversations();
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while updating status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const isClosed = selectedConversation?.status === "CLOSED";

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="grid min-h-[720px] overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:grid-cols-[380px_1fr]">
        <aside className="border-b border-border bg-muted/20 lg:border-b-0 lg:border-r">
          <div className="border-b border-border bg-background px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Conversations
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Customer support messages
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                size="sm"
                onClick={() => {
                  setIsListLoading(true);
                  fetchConversations();
                }}
                disabled={isListLoading}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          <div className="h-[300px] overflow-y-auto lg:h-[655px]">
            {isListLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading...
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <div>
                  <MessageCircle className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    No conversations yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Customer messages will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((conversation) => {
                  const isSelected = conversation.id === selectedConversationId;
                  const unreadCount = conversation._count.messages;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={`w-full px-5 py-4 text-left transition hover:bg-muted/70 ${
                        isSelected ? "bg-muted" : "bg-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {conversation.customer.name}
                            </p>

                            {unreadCount > 0 && (
                              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                                {unreadCount}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {conversation.customer.phone}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClass(
                            conversation.status,
                          )}`}
                        >
                          {getStatusLabel(conversation.status)}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                        {getLastMessage(conversation)}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                        <span>{conversation.conversationNumber}</span>
                        <span>
                          {formatShortTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-[720px] flex-col">
          {!selectedConversationId ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div>
                <MessageCircle className="mx-auto size-10 text-muted-foreground" />
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  Select a conversation
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a customer conversation from the left side to reply.
                </p>
              </div>
            </div>
          ) : isConversationLoading && !selectedConversation ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading conversation...
              </div>
            </div>
          ) : selectedConversation ? (
            <>
              <div className="border-b border-border bg-background px-5 py-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <User className="size-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-foreground">
                          {selectedConversation.customer.name}
                        </h2>

                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(
                            selectedConversation.status,
                          )}`}
                        >
                          {getStatusLabel(selectedConversation.status)}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{selectedConversation.customer.phone}</span>
                        <span>{selectedConversation.conversationNumber}</span>
                        <span>
                          Last:{" "}
                          {formatShortTime(selectedConversation.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedConversation.status === "CLOSED" ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        size="sm"
                        onClick={() => updateConversationStatus("OPEN")}
                        disabled={isUpdatingStatus}
                      >
                        <CheckCircle2 className="mr-2 size-4" />
                        Reopen
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          size="sm"
                          onClick={() =>
                            updateConversationStatus("WAITING_CUSTOMER")
                          }
                          disabled={isUpdatingStatus}
                        >
                          <Clock className="mr-2 size-4" />
                          Waiting Customer
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="cursor-pointer"
                          size="sm"
                          onClick={() => updateConversationStatus("CLOSED")}
                          disabled={isUpdatingStatus}
                        >
                          <XCircle className="mr-2 size-4" />
                          Close
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                {selectedConversation.messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">
                      No messages in this conversation yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedConversation.messages.map((chatMessage) => {
                      const isAdmin =
                        chatMessage.sender.role === "ADMIN" ||
                        chatMessage.sender.role === "SUPER_ADMIN";

                      return (
                        <div
                          key={chatMessage.id}
                          className={`flex ${
                            isAdmin ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[70%] ${
                              isAdmin
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-background text-foreground"
                            }`}
                          >
                            <p
                              className={`mb-1 text-xs font-semibold ${
                                isAdmin
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {chatMessage.sender.name}{" "}
                              {isAdmin ? "(Admin)" : "(Customer)"}
                            </p>

                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {chatMessage.message}
                            </p>

                            <p
                              className={`mt-2 text-right text-[11px] ${
                                isAdmin
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatDateTime(chatMessage.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSendReply}
                className="border-t border-border bg-background px-4 py-4 sm:px-6"
              >
                {isClosed ? (
                  <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    This conversation is closed. Reopen it to send a reply.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <textarea
                        value={replyMessage}
                        onChange={(event) =>
                          setReplyMessage(event.target.value)
                        }
                        placeholder="Type admin reply..."
                        rows={2}
                        maxLength={1000}
                        className="min-h-12 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                      />

                      <Button
                        type="submit"
                        disabled={!replyMessage.trim() || isSending}
                        className="h-12 rounded-2xl px-6 cursor-pointer"
                      >
                        {isSending ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 size-4" />
                        )}
                        Send Reply
                      </Button>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Do not ask customers for OTP, password, or card details.
                    </p>
                  </>
                )}
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <p className="text-sm text-muted-foreground">
                Conversation not found or unable to load.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
