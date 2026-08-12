import crypto from "crypto";
import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const AGENT_DOCUMENT_BUCKET =
  process.env.SUPABASE_AGENT_DOCUMENT_BUCKET || "agent-documents";

const allowedFileTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const maxFileSize = 5 * 1024 * 1024;

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

type RouteContext = {
  params: Promise<{
    agentId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    // --------------------------------------------------
    // 1. ADMIN AUTHENTICATION
    // --------------------------------------------------

    await requireAdminUser();

    const { agentId } = await context.params;

    // --------------------------------------------------
    // 2. FIND AGENT + CURRENT DOCUMENT
    // --------------------------------------------------

    const agent = await prisma.agent.findUnique({
      where: {
        id: agentId,
      },
      select: {
        id: true,
        nicDlUrl: true,
        nicDlFileName: true,
        nicDlFileType: true,
        nicDlFileSize: true,
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

    // Keep the old storage path before replacing it.
    const oldDocumentPath = agent.nicDlUrl;

    // --------------------------------------------------
    // 3. READ UPLOADED FILE
    // --------------------------------------------------

    const formData = await request.formData();
    const fileValue = formData.get("file");

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "NIC/DL document is required.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 4. VALIDATE FILE TYPE
    // --------------------------------------------------

    if (!allowedFileTypes.includes(fileValue.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload a PDF, JPG, PNG, or WebP file.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 5. VALIDATE FILE SIZE
    // --------------------------------------------------

    if (fileValue.size > maxFileSize) {
      return NextResponse.json(
        {
          success: false,
          message: "Document must be less than 5MB.",
        },
        { status: 400 },
      );
    }

    // --------------------------------------------------
    // 6. CREATE NEW STORAGE PATH
    // --------------------------------------------------

    const extension = getFileExtension(fileValue.name, fileValue.type);

    const randomName = crypto.randomBytes(8).toString("hex");

    const storagePath = `agents/${agentId}/${Date.now()}-${randomName}.${extension}`;

    const fileBuffer = Buffer.from(await fileValue.arrayBuffer());

    // --------------------------------------------------
    // 7. UPLOAD NEW DOCUMENT
    // --------------------------------------------------

    const uploadResult = await supabaseAdmin.storage
      .from(AGENT_DOCUMENT_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: fileValue.type,
        upsert: false,
      });

    if (uploadResult.error) {
      console.error("Agent document upload failed:", uploadResult.error);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to upload agent document.",
        },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // 8. UPDATE DATABASE
    // --------------------------------------------------

    let updatedAgent;

    try {
      updatedAgent = await prisma.agent.update({
        where: {
          id: agentId,
        },
        data: {
          nicDlUrl: storagePath,
          nicDlFileName: fileValue.name,
          nicDlFileType: fileValue.type,
          nicDlFileSize: fileValue.size,
        },
        select: {
          id: true,
          name: true,
          nicDlUrl: true,
          nicDlFileName: true,
          nicDlFileType: true,
          nicDlFileSize: true,
        },
      });
    } catch (databaseError) {
      // --------------------------------------------------
      // DATABASE UPDATE FAILED
      // --------------------------------------------------
      // Remove the newly uploaded file so we don't create
      // an orphaned file in Supabase.

      console.error("Agent document database update failed:", databaseError);

      const rollbackResult = await supabaseAdmin.storage
        .from(AGENT_DOCUMENT_BUCKET)
        .remove([storagePath]);

      if (rollbackResult.error) {
        console.error(
          "Failed to rollback newly uploaded agent document:",
          rollbackResult.error,
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to save the new agent document.",
        },
        { status: 500 },
      );
    }

    // --------------------------------------------------
    // 9. DELETE OLD DOCUMENT
    // --------------------------------------------------

    if (oldDocumentPath && oldDocumentPath !== storagePath) {
      const deleteResult = await supabaseAdmin.storage
        .from(AGENT_DOCUMENT_BUCKET)
        .remove([oldDocumentPath]);

      if (deleteResult.error) {
        // The replacement itself succeeded.
        // We only log the cleanup failure.
        console.error(
          "Failed to delete old agent document:",
          deleteResult.error,
          {
            agentId,
            oldDocumentPath,
          },
        );
      }
    }

    // --------------------------------------------------
    // 10. RETURN SUCCESS
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "Agent document uploaded successfully.",
      agent: updatedAgent,
    });
  } catch (error) {
    console.error("Agent document upload failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while uploading the document.",
      },
      { status: 500 },
    );
  }
}
