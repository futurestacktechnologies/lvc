"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReportUploadFormProps = {
  requestId: string;
  requestNumber: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ReportUploadForm({
  requestId,
  requestNumber,
}: ReportUploadFormProps) {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState(`${requestNumber} Vehicle Report`);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      toast.error("Invalid file type", {
        description: "Only PDF files are allowed.",
      });

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", {
        description: "PDF file size must be less than 10MB.",
      });

      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  function removeFile() {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      toast.error("PDF file required", {
        description: "Please select a PDF report file to upload.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("file", selectedFile);

      const response = await fetch(
        `/api/admin/report-requests/${requestId}/reports/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Upload failed", {
          description: result.message || "Please try again.",
        });
        return;
      }

      toast.success("Report uploaded", {
        description: result.message || "PDF report uploaded successfully.",
      });

      removeFile();
      router.refresh();
    } catch {
      toast.error("Upload failed", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="report-title">Report title</Label>

        <Input
          id="report-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Vehicle report title"
          className="h-11 rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="report-file">PDF report file</Label>

        <label
          htmlFor="report-file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center transition hover:border-brand hover:bg-secondary/40"
        >
          <UploadCloud className="h-8 w-8 text-brand" />

          <p className="mt-3 text-sm font-semibold text-foreground">
            Click to upload PDF report
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            PDF only, maximum 10MB
          </p>
        </label>

        <input
          ref={fileInputRef}
          id="report-file"
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {selectedFile && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-brand">
                <FileUp className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={removeFile}
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full cursor-pointer rounded-2xl"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <FileUp className="mr-2 h-4 w-4" />
            Upload PDF Report
          </>
        )}
      </Button>
    </form>
  );
}
