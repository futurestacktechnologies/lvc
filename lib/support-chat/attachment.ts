import crypto from "crypto";

import { SUPPORT_CHAT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";

const allowedFileTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const maxFileSize = 5 * 1024 * 1024;

export type UploadedSupportAttachment = {
  attachmentUrl: string;
  attachmentFileName: string;
  attachmentFileType: string;
  attachmentFileSize: number;
};

function getFileExtension(fileName: string, fileType: string) {
  const extensionFromName = fileName.split(".").pop();

  if (extensionFromName && extensionFromName.length <= 5) {
    return extensionFromName.toLowerCase();
  }

  if (fileType === "application/pdf") return "pdf";
  if (fileType === "image/jpeg") return "jpg";
  if (fileType === "image/png") return "png";
  if (fileType === "image/webp") return "webp";

  return "bin";
}

export async function uploadSupportAttachment({
  file,
  userId,
  conversationId,
}: {
  file: File;
  userId: string;
  conversationId: string;
}): Promise<UploadedSupportAttachment> {
  if (!allowedFileTypes.includes(file.type)) {
    throw new Error("Please upload a PDF, JPG, PNG, or WebP file.");
  }

  if (file.size > maxFileSize) {
    throw new Error("Attachment must be less than 5MB.");
  }

  const fileExtension = getFileExtension(file.name, file.type);
  const randomName = crypto.randomBytes(8).toString("hex");
  const storagePath = `${conversationId}/${userId}/${Date.now()}-${randomName}.${fileExtension}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await supabaseAdmin.storage
    .from(SUPPORT_CHAT_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadResult.error) {
    console.error("Support attachment upload failed:", uploadResult.error);
    throw new Error("Failed to upload attachment.");
  }

  return {
    attachmentUrl: storagePath,
    attachmentFileName: file.name,
    attachmentFileType: file.type,
    attachmentFileSize: file.size,
  };
}

export async function createSupportAttachmentSignedUrl(path: string) {
  const result = await supabaseAdmin.storage
    .from(SUPPORT_CHAT_BUCKET)
    .createSignedUrl(path, 60 * 10);

  if (result.error) {
    console.error("Support attachment signed URL failed:", result.error);
    return null;
  }

  return result.data.signedUrl;
}
