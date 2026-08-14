import crypto from "crypto";
import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = process.env.SUPABASE_AGENT_DOCUMENT_BUCKET || "agent-documents";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

function getExtension(fileName: string, contentType: string) {
  const originalExtension = fileName.split(".").pop()?.toLowerCase();

  if (
    originalExtension &&
    ["pdf", "jpg", "jpeg", "png", "webp"].includes(originalExtension)
  ) {
    return originalExtension === "jpeg" ? "jpg" : originalExtension;
  }

  switch (contentType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    // ---------------------------------------------------------
    // 1. ADMIN AUTHENTICATION
    // ---------------------------------------------------------

    await requireAdminUser();

    const { agentId } = await context.params;

    // ---------------------------------------------------------
    // 2. FIND AGENT + CURRENT DOCUMENT
    // ---------------------------------------------------------

    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
      },
      select: {
        id: true,
        nicDlUrl: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: "Agent not found.",
        },
        { status: 404 },
      );
    }

    // ---------------------------------------------------------
    // 3. READ UPLOADED FILE
    // ---------------------------------------------------------

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a document.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 4. VALIDATE FILE TYPE
    // ---------------------------------------------------------

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only PDF, JPEG, PNG, and WebP files are allowed.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 5. VALIDATE FILE SIZE
    // ---------------------------------------------------------

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "The selected document is empty.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Document size must not exceed 5 MB.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 6. CREATE NEW STORAGE PATH
    // ---------------------------------------------------------

    const extension = getExtension(file.name, file.type);

    const randomName = crypto.randomBytes(16).toString("hex");

    const newStoragePath = `agents/${agentId}/${Date.now()}-${randomName}.${extension}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Keep the old path before changing the database.
    const oldStoragePath = agent.nicDlUrl;

    // ---------------------------------------------------------
    // 7. UPLOAD NEW DOCUMENT FIRST
    // ---------------------------------------------------------

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(newStoragePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Agent document upload failed:", uploadError);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to upload the new document.",
        },
        { status: 500 },
      );
    }

    // ---------------------------------------------------------
    // 8. UPDATE DATABASE
    // ---------------------------------------------------------

    try {
      await prisma.agent.update({
        where: {
          id: agentId,
        },
        data: {
          nicDlUrl: newStoragePath,
          nicDlFileName: file.name,
          nicDlFileType: file.type,
          nicDlFileSize: file.size,
        },
      });
    } catch (databaseError) {
      console.error("Agent document database update failed:", databaseError);

      // Prisma failed.
      // Delete the NEW upload because the database
      // still points to the OLD document.
      const { error: cleanupError } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([newStoragePath]);

      if (cleanupError) {
        console.error(
          "Failed to clean up newly uploaded document:",
          cleanupError,
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to save the new document.",
        },
        { status: 500 },
      );
    }

    // ---------------------------------------------------------
    // 9. DELETE OLD DOCUMENT
    // ---------------------------------------------------------

    let oldDocumentDeleted = true;

    if (oldStoragePath && oldStoragePath !== newStoragePath) {
      const { error: deleteError } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([oldStoragePath]);

      if (deleteError) {
        oldDocumentDeleted = false;

        console.error("Failed to delete old agent document:", deleteError);
      }
    }

    // ---------------------------------------------------------
    // 10. RESPONSE
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      message: oldDocumentDeleted
        ? "Verification document replaced successfully."
        : "Verification document updated, but the previous document could not be removed.",
      document: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
      cleanup: {
        oldDocumentDeleted,
      },
    });
  } catch (error) {
    console.error("Admin agent document upload failed:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to perform this action.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while uploading the document.",
      },
      { status: 500 },
    );
  }
}
