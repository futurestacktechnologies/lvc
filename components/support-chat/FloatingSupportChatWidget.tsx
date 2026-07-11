"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  MessageCircle,
  Minus,
  Paperclip,
  Send,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import MessageAttachment from "@/components/support-chat/MessageAttachment";

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
    hour: "2-digit",
    minute: "2-digit",
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

function shouldHideWidget(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api")
  );
}

export default function FloatingSupportChatWidget() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentUserId = conversation?.customer?.id;
  const isConversationClosed = conversation?.status === "CLOSED";

  const fetchConversation = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/support-chat", {
        cache: "no-store",
      });

      if (response.status === 401) {
        setIsUnauthorized(true);
        setConversation(null);
        return;
      }

      const result = (await response.json()) as SupportChatResponse;

      if (!response.ok || !result.success) {
        setErrorMessage(result.message || "Unable to load support chat.");
        return;
      }

      if (isStartingNewChat && result.conversation?.status === "CLOSED") {
        setErrorMessage("");
        return;
      }

      setIsUnauthorized(false);
      setConversation(result.conversation);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while loading support chat.");
    } finally {
      setIsLoading(false);
    }
  }, [isStartingNewChat]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const run = () => {
      if (!cancelled) {
        void fetchConversation();
      }
    };

    const timeoutId = window.setTimeout(run, 0);
    const intervalId = window.setInterval(run, 3000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchConversation, isOpen]);

  useEffect(() => {
    const container = chatScrollRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation?.messages?.length, isOpen]);

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

  function handleStartNewChat() {
    setIsStartingNewChat(true);
    setConversation(null);
    setMessage("");
    clearSelectedFile();
    setErrorMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if ((!cleanMessage && !selectedFile) || isSending || isUnauthorized) {
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
      await fetchConversation();
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong while sending your message.");
    } finally {
      setIsSending(false);
    }
  }

  if (shouldHideWidget(pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-4 flex h-[620px] w-[calc(100vw-40px)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:w-[390px]">
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary-foreground/15">
                <MessageCircle className="size-5" />
              </div>

              <div>
                <h3 className="text-sm font-semibold">Live Support</h3>
                <p className="text-xs text-primary-foreground/75">
                  {getStatusLabel(conversation?.status)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-9 p-0 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                <Minus className="size-4" />
              </Button>
            </div>
          </div>

          <div
            ref={chatScrollRef}
            className="min-h-0 flex-1 overflow-y-auto bg-muted/20 px-4 py-4"
          >
            {isLoading && !conversation && !isUnauthorized ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading chat...
                </div>
              </div>
            ) : isUnauthorized ? (
              <div className="flex h-full items-center justify-center text-center">
                <div className="max-w-xs">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-background">
                    <MessageCircle className="size-5 text-muted-foreground" />
                  </div>

                  <h4 className="mt-4 text-sm font-semibold text-foreground">
                    Login to chat with support
                  </h4>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Please login to your account to start a support
                    conversation.
                  </p>

                  <Link
                    href="/login"
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                  >
                    Login Now
                  </Link>
                </div>
              </div>
            ) : !conversation ? (
              <div className="flex h-full items-center justify-center text-center">
                <div className="max-w-xs">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-background">
                    <MessageCircle className="size-5 text-muted-foreground" />
                  </div>

                  <h4 className="mt-4 text-sm font-semibold text-foreground">
                    Start a new chat
                  </h4>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Type your message below and our team will reply soon.
                  </p>
                </div>
              </div>
            ) : conversation.messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-sm text-muted-foreground">
                  No messages yet. Send your first message.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversation.messages.map((chatMessage) => {
                  const isMine = chatMessage.senderId === currentUserId;

                  return (
                    <div
                      key={chatMessage.id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[86%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                          isMine
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-background text-foreground"
                        }`}
                      >
                        {!isMine && (
                          <p className="mb-1 text-[11px] font-semibold text-muted-foreground">
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
                          className={`mt-1 text-right text-[10px] ${
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
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="border-t border-border bg-background px-3 py-3"
          >
            {isConversationClosed ? (
              <div className="rounded-2xl border border-border bg-muted/40 px-3 py-3">
                <h4 className="text-xs font-semibold text-foreground">
                  This conversation is closed
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start a new chat if you need more help.
                </p>

                <Button
                  type="button"
                  size="sm"
                  className="mt-3 rounded-xl cursor-pointer"
                  onClick={handleStartNewChat}
                >
                  Start New Chat
                </Button>
              </div>
            ) : !isUnauthorized ? (
              <div className="space-y-2">
                {selectedFile && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSelectedFile}
                      className="size-8 shrink-0 p-0 cursor-pointer"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-end gap-2">
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
                    size="sm"
                    className="h-10 w-10 shrink-0 rounded-xl p-0 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" />
                  </Button>

                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Type message..."
                    rows={1}
                    maxLength={1000}
                    className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-xs outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />

                  <Button
                    type="submit"
                    size="sm"
                    disabled={(!message.trim() && !selectedFile) || isSending}
                    className="h-10 w-10 shrink-0 rounded-xl p-0 cursor-pointer"
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      )}

      <Button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="size-14 rounded-full shadow-2xl cursor-pointer"
      >
        {isOpen ? (
          <X className="size-6" />
        ) : (
          <MessageCircle className="size-6" />
        )}
      </Button>
    </div>
  );
}
