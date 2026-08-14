"use client";

import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Save,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type AgentStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

type ExistingDocument = {
  url: string;
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
} | null;

type AgentFormProps = {
  mode: "create" | "edit";
  agentId?: string;
  initialData?: {
    name: string;
    mobile: string;
    address: string;
    promoCode: string;
    status: AgentStatus;
    document: ExistingDocument;
  };
};

export default function AgentForm({
  mode,
  agentId,
  initialData,
}: AgentFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [mobile, setMobile] = useState(initialData?.mobile || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [promoCode, setPromoCode] = useState(initialData?.promoCode || "");
  const [status, setStatus] = useState<AgentStatus>(
    initialData?.status || "ACTIVE",
  );

  const [document, setDocument] = useState<File | null>(null);
  const existingDocument = initialData?.document || null;

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  function handleDocumentChange(event: React.ChangeEvent<HTMLInputElement>) {
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
      toast.error("Invalid document", {
        description: "Please upload a PDF, JPG, PNG or WebP file.",
      });

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", {
        description: "NIC/DL document must be smaller than 5MB.",
      });

      event.target.value = "";
      return;
    }

    setDocument(file);
  }

  function removeSelectedDocument() {
    setDocument(null);
  }

  async function uploadDocument(id: string) {
    if (!document) {
      return true;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();

      formData.append("file", document);

      const response = await fetch(`/api/admin/agents/${id}/document`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to upload document.");
      }

      return true;
    } catch (error) {
      console.error(error);

      toast.error("Document upload failed", {
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while uploading the document.",
      });

      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Agent name required");
      return;
    }

    if (!mobile.trim()) {
      toast.error("Mobile number required");
      return;
    }

    if (!address.trim()) {
      toast.error("Address required");
      return;
    }

    if (!promoCode.trim()) {
      toast.error("Promo code required");
      return;
    }

    try {
      setIsSaving(true);

      const url =
        mode === "create"
          ? "/api/admin/agents"
          : `/api/admin/agents/${agentId}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          address: address.trim(),
          promoCode: promoCode.trim().toUpperCase(),
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save agent.");
      }

      const savedAgentId = mode === "create" ? result.agent.id : agentId;

      if (document && savedAgentId) {
        const uploaded = await uploadDocument(savedAgentId);

        if (!uploaded) {
          return;
        }
      }

      toast.success(
        mode === "create"
          ? "Agent created successfully"
          : "Agent updated successfully",
      );

      router.push("/admin/agents");
      router.refresh();
    } catch (error) {
      console.error(error);

      toast.error("Unable to save agent", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const isBusy = isSaving || isUploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Agent Information */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>

          <p className="text-sm text-muted-foreground">
            Enter the agent&apos;s basic information and referral settings.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent Name</Label>

              <Input
                id="agent-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter agent name"
                disabled={isBusy}
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-mobile">Mobile Number</Label>

              <Input
                id="agent-mobile"
                type="tel"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                placeholder="0771234567"
                disabled={isBusy}
                className="h-11 rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-address">Address</Label>

            <textarea
              id="agent-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Enter agent address"
              rows={4}
              disabled={isBusy}
              className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agent-promo-code">Promo Code</Label>

              <Input
                id="agent-promo-code"
                value={promoCode}
                onChange={(event) =>
                  setPromoCode(event.target.value.toUpperCase())
                }
                placeholder="TEST100"
                disabled={isBusy}
                className="h-11 rounded-2xl font-mono uppercase"
              />

              <p className="text-xs text-muted-foreground">
                Customers can use this code during registration.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-status">Status</Label>

              <select
                id="agent-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as AgentStatus)
                }
                disabled={isBusy}
                className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Document */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Document</CardTitle>

          <p className="text-sm text-muted-foreground">
            Upload the agent&apos;s NIC or Driving Licence.
          </p>
        </CardHeader>

        <CardContent>
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6">
            {existingDocument && !document ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                    <FileText className="h-5 w-5 text-brand" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      {existingDocument.fileName}
                    </p>

                    {existingDocument.fileSize && (
                      <p className="text-xs text-muted-foreground">
                        {(existingDocument.fileSize / 1024 / 1024).toFixed(2)}{" "}
                        MB
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={existingDocument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer rounded-xl h-10 px-4"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </Button>
                  </a>
                  <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium transition hover:bg-muted">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Replace
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={handleDocumentChange}
                      disabled={isBusy}
                    />
                  </label>
                </div>
              </div>
            ) : document ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                    <FileText className="h-5 w-5 text-brand" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">{document.name}</p>

                    <p className="text-xs text-muted-foreground">
                      {(document.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={removeSelectedDocument}
                  disabled={isBusy}
                  className="h-9 w-9 cursor-pointer rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                  <UploadCloud className="h-6 w-6 text-brand" />
                </div>

                <p className="mt-4 text-sm font-semibold">
                  Upload NIC / Driving Licence
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, JPG, PNG or WebP · Maximum 5MB
                </p>

                <span className="mt-4 inline-flex h-9 items-center rounded-xl border border-border bg-background px-4 text-xs font-medium">
                  Choose Document
                </span>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handleDocumentChange}
                  disabled={isBusy}
                />
              </label>
            )}
          </div>

          {document && (
            <div className="mt-4">
              <Badge className="bg-secondary text-secondary-foreground">
                New document selected
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => router.push("/admin/agents")}
          className="cursor-pointer rounded-2xl h-10 px-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isBusy}
          className="cursor-pointer rounded-2xl h-10 px-4"
        >
          {isBusy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}

          {mode === "create" ? "Create Agent" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
