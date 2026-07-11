import { FileText, ImageIcon } from "lucide-react";

type MessageAttachmentProps = {
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  signedUrl: string | null;
  isMine?: boolean;
};

function formatFileSize(size?: number | null) {
  if (!size) return "";

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(fileType?: string | null) {
  return Boolean(fileType?.startsWith("image/"));
}

export default function MessageAttachment({
  fileName,
  fileType,
  fileSize,
  signedUrl,
  isMine = false,
}: MessageAttachmentProps) {
  if (!fileName || !signedUrl) {
    return null;
  }

  const imageAttachment = isImage(fileType);

  return (
    <div
      className={`mt-3 overflow-hidden rounded-xl border ${
        isMine
          ? "border-primary-foreground/25 bg-primary-foreground/10"
          : "border-border bg-muted/40"
      }`}
    >
      {imageAttachment ? (
        <a href={signedUrl} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signedUrl}
            alt={fileName}
            className="max-h-64 w-full object-cover"
          />
        </a>
      ) : null}

      <a
        href={signedUrl}
        target="_blank"
        rel="noreferrer"
        className={`flex items-center gap-3 px-3 py-3 text-xs transition ${
          isMine
            ? "text-primary-foreground hover:bg-primary-foreground/10"
            : "text-foreground hover:bg-muted"
        }`}
      >
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            isMine ? "bg-primary-foreground/15" : "bg-background"
          }`}
        >
          {imageAttachment ? (
            <ImageIcon className="size-4" />
          ) : (
            <FileText className="size-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{fileName}</p>
          <p
            className={`mt-0.5 ${
              isMine ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}
          >
            {fileType || "Attachment"} {formatFileSize(fileSize)}
          </p>
        </div>

        <span className="shrink-0 font-medium">Open</span>
      </a>
    </div>
  );
}
