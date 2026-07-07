import crypto from "crypto";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma/client";
import { PAYMENT_PROOF_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const allowedFileTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const maxFileSize = 5 * 1024 * 1024;

function createReference(prefix: string) {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to continue.",
        },
        { status: 401 },
      );
    }

    const formData = await request.formData();

    const planCode = formData.get("planCode");
    const paymentProof = formData.get("paymentProof");

    if (typeof planCode !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Payment plan is required.",
        },
        { status: 400 },
      );
    }

    if (!(paymentProof instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment proof file is required.",
        },
        { status: 400 },
      );
    }

    if (!allowedFileTypes.includes(paymentProof.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload a PDF, JPG, PNG, or WebP file.",
        },
        { status: 400 },
      );
    }

    if (paymentProof.size > maxFileSize) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment proof must be less than 5MB.",
        },
        { status: 400 },
      );
    }

    const plan = await prisma.paymentPlan.findUnique({
      where: {
        code: planCode,
      },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected payment plan is not available.",
        },
        { status: 404 },
      );
    }

    const paymentNumber = createReference("PAY");
    const packageNumber = createReference("PKG");
    const fileExtension = getFileExtension(
      paymentProof.name,
      paymentProof.type,
    );

    const storagePath = `${user.id}/${paymentNumber}.${fileExtension}`;

    const fileBuffer = Buffer.from(await paymentProof.arrayBuffer());

    const uploadResult = await supabaseAdmin.storage
      .from(PAYMENT_PROOF_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: paymentProof.type,
        upsert: false,
      });

    if (uploadResult.error) {
      console.error("Supabase upload failed:", uploadResult.error);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to upload payment proof.",
        },
        { status: 500 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const userPackage = await tx.userPackage.create({
        data: {
          packageNumber,
          userId: user.id,
          planId: plan.id,
          totalRequests: plan.requestCredits,
          usedRequests: 0,
          remainingRequests: plan.requestCredits,
          status: "PENDING_PAYMENT",
        },
      });

      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          customerId: user.id,
          planId: plan.id,
          userPackageId: userPackage.id,
          amount: plan.price,
          currency: plan.currency,
          method: "BANK_TRANSFER",
          status: "PROOF_UPLOADED",
          paymentProofUrl: storagePath,
          paymentProofFileName: paymentProof.name,
          paymentProofFileType: paymentProof.type,
          paymentProofFileSize: paymentProof.size,
        },
      });

      return {
        userPackage,
        payment,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Payment proof uploaded successfully.",
      payment: {
        id: result.payment.id,
        paymentNumber: result.payment.paymentNumber,
        status: result.payment.status,
      },
      package: {
        id: result.userPackage.id,
        packageNumber: result.userPackage.packageNumber,
        status: result.userPackage.status,
      },
    });
  } catch (error) {
    console.error("Bank transfer payment failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while submitting payment proof.",
      },
      { status: 500 },
    );
  }
}
