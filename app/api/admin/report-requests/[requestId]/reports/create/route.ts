import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";

import { requireAdminUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma/client";
import { REPORT_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";
import { ReportRequestStatus } from "@/generated/prisma";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_ACCIDENT_PHOTOS = 6;

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

type PdfImageInput = {
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
  caption: string;
};

type PdfData = {
  requestNumber: string;
  customerName: string;
  customerPhone: string;
  vehicleIdentifier: string;
  lotNumber: string | null;
  auctionDate: Date | null;
  auctionPlatform: string | null;

  reportTitle: string;
  vehicleMake: string;
  vehicleModel: string;
  modelYear: string;
  mileage: string;
  color: string;
  auctionGrade: string;

  originalJapanPrice: string;
  sriLankaEstimatedPrice: string;
  sriLankaMarketAverageValuation: string;
  valuationNotes: string;

  conditionSummary: string;
  notes: string;

  auctionSheetImage: PdfImageInput | null;
  accidentPhotos: PdfImageInput[];
};

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function sanitizePdfText(value: string) {
  return value.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function wrapText(text: string, maxLength: number) {
  const words = sanitizePdfText(text || "Not provided").split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length > maxLength) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);

  return lines.length > 0 ? lines : ["Not provided"];
}

function isImageFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function validateImageFile(file: File, label: string) {
  const isJpg = file.type === "image/jpeg" || /\.(jpg|jpeg)$/i.test(file.name);
  const isPng = file.type === "image/png" || /\.png$/i.test(file.name);

  if (!isJpg && !isPng) {
    return `${label} must be a JPG or PNG image.`;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return `${label} must be less than 5MB.`;
  }

  return null;
}

async function toPdfImageInput(file: File, caption: string) {
  return {
    fileName: file.name,
    contentType: file.type,
    bytes: new Uint8Array(await file.arrayBuffer()),
    caption,
  };
}

async function createPdfBuffer(data: PdfData) {
  const pdfDoc = await PDFDocument.create();

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([595.28, 841.89]);

  const margin = 50;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const contentWidth = pageWidth - margin * 2;

  let y = pageHeight - margin;

  function addNewPageIfNeeded(requiredSpace = 80) {
    if (y < margin + requiredSpace) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = pageHeight - margin;
    }
  }

  function drawHeader() {
    page.drawRectangle({
      x: 0,
      y: pageHeight - 105,
      width: pageWidth,
      height: 105,
      color: rgb(0.05, 0.16, 0.32),
    });

    page.drawText(sanitizePdfText(data.reportTitle), {
      x: margin,
      y: pageHeight - 55,
      size: 22,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Request Number: ${data.requestNumber}`, {
      x: margin,
      y: pageHeight - 78,
      size: 10,
      font: regularFont,
      color: rgb(0.85, 0.9, 1),
    });

    page.drawText(`Generated Date: ${new Date().toLocaleDateString("en-LK")}`, {
      x: margin,
      y: pageHeight - 92,
      size: 10,
      font: regularFont,
      color: rgb(0.85, 0.9, 1),
    });

    y = pageHeight - 135;
  }

  function drawSectionTitle(title: string) {
    addNewPageIfNeeded(60);

    y -= 10;

    page.drawText(sanitizePdfText(title), {
      x: margin,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.05, 0.08, 0.12),
    });

    y -= 18;

    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + contentWidth, y },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });

    y -= 18;
  }

  function drawRow(label: string, value: string | null | undefined) {
    addNewPageIfNeeded(35);

    page.drawText(sanitizePdfText(label), {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.12, 0.12, 0.12),
    });

    page.drawText(sanitizePdfText(value || "Not provided"), {
      x: margin + 190,
      y,
      size: 10,
      font: regularFont,
      color: rgb(0.12, 0.12, 0.12),
    });

    y -= 18;
  }

  function drawParagraph(text: string) {
    const lines = wrapText(text, 88);

    lines.forEach((line) => {
      addNewPageIfNeeded(25);

      page.drawText(line, {
        x: margin,
        y,
        size: 10,
        font: regularFont,
        color: rgb(0.12, 0.12, 0.12),
      });

      y -= 15;
    });

    y -= 8;
  }

  async function embedImage(imageInput: PdfImageInput) {
    const isPng =
      imageInput.contentType === "image/png" ||
      /\.png$/i.test(imageInput.fileName);

    return isPng
      ? pdfDoc.embedPng(imageInput.bytes)
      : pdfDoc.embedJpg(imageInput.bytes);
  }

  function drawImageBox(image: PDFImage, caption: string) {
    const maxImageWidth = contentWidth;
    const maxImageHeight = 380;

    const scale = Math.min(
      maxImageWidth / image.width,
      maxImageHeight / image.height,
    );

    const imageWidth = image.width * scale;
    const imageHeight = image.height * scale;

    addNewPageIfNeeded(imageHeight + 70);

    page.drawText(sanitizePdfText(caption), {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.12, 0.12, 0.12),
    });

    y -= 18;

    const imageX = margin + (contentWidth - imageWidth) / 2;
    const imageY = y - imageHeight;

    page.drawRectangle({
      x: imageX - 4,
      y: imageY - 4,
      width: imageWidth + 8,
      height: imageHeight + 8,
      borderWidth: 1,
      borderColor: rgb(0.82, 0.82, 0.82),
    });

    page.drawImage(image, {
      x: imageX,
      y: imageY,
      width: imageWidth,
      height: imageHeight,
    });

    y -= imageHeight + 28;
  }

  async function drawAuctionSheet() {
    if (!data.auctionSheetImage) return;

    drawSectionTitle("Auction Sheet");

    const image = await embedImage(data.auctionSheetImage);

    drawImageBox(image, data.auctionSheetImage.caption);
  }

  async function drawAccidentPhotos() {
    if (data.accidentPhotos.length === 0) return;

    drawSectionTitle("Accident / Damage Photos");

    const cardGap = 16;
    const cardWidth = (contentWidth - cardGap) / 2;
    const cardHeight = 195;
    const imageMaxHeight = 135;

    for (let index = 0; index < data.accidentPhotos.length; index += 1) {
      const input = data.accidentPhotos[index];
      const image = await embedImage(input);

      const column = index % 2;

      if (column === 0) {
        addNewPageIfNeeded(cardHeight + 30);
      }

      const x = margin + column * (cardWidth + cardGap);
      const topY = y;

      page.drawRectangle({
        x,
        y: topY - cardHeight,
        width: cardWidth,
        height: cardHeight,
        borderWidth: 1,
        borderColor: rgb(0.84, 0.84, 0.84),
      });

      page.drawText(sanitizePdfText(input.caption), {
        x: x + 10,
        y: topY - 20,
        size: 9,
        font: boldFont,
        color: rgb(0.12, 0.12, 0.12),
      });

      const scale = Math.min(
        (cardWidth - 20) / image.width,
        imageMaxHeight / image.height,
      );

      const imageWidth = image.width * scale;
      const imageHeight = image.height * scale;

      page.drawImage(image, {
        x: x + (cardWidth - imageWidth) / 2,
        y: topY - 40 - imageHeight,
        width: imageWidth,
        height: imageHeight,
      });

      if (column === 1 || index === data.accidentPhotos.length - 1) {
        y -= cardHeight + 16;
      }
    }
  }

  drawHeader();

  drawSectionTitle("Customer Details");
  drawRow("Customer Name", data.customerName);
  drawRow("Mobile Number", data.customerPhone);

  drawSectionTitle("Vehicle Request Details");
  drawRow("Vehicle Identifier / VIN / Chassis", data.vehicleIdentifier);
  drawRow("Lot Number", data.lotNumber);
  drawRow("Auction Platform", data.auctionPlatform);
  drawRow(
    "Auction Date",
    data.auctionDate ? data.auctionDate.toLocaleDateString("en-LK") : null,
  );

  drawSectionTitle("Vehicle Report Details");
  drawRow("Vehicle Make", data.vehicleMake);
  drawRow("Vehicle Model", data.vehicleModel);
  drawRow("Model Year", data.modelYear);
  drawRow("Mileage", data.mileage);
  drawRow("Color", data.color);
  drawRow("Auction Grade", data.auctionGrade);

  drawSectionTitle("Price & Market Valuation");
  drawRow("Original Price in Japan", data.originalJapanPrice);
  drawRow("Estimated Price in Sri Lanka", data.sriLankaEstimatedPrice);
  drawRow(
    "Sri Lankan Market Average Valuation",
    data.sriLankaMarketAverageValuation,
  );

  drawSectionTitle("Valuation Notes");
  drawParagraph(data.valuationNotes);

  drawSectionTitle("Condition Summary");
  drawParagraph(data.conditionSummary);

  drawSectionTitle("Additional Notes");
  drawParagraph(data.notes);

  await drawAuctionSheet();
  await drawAccidentPhotos();

  addNewPageIfNeeded(60);

  page.drawText(
    "This report was generated by the admin team based on the provided vehicle, auction, price and market valuation information.",
    {
      x: margin,
      y: margin,
      size: 8,
      font: regularFont,
      color: rgb(0.45, 0.45, 0.45),
    },
  );

  const pdfBytes = await pdfDoc.save();

  return Buffer.from(pdfBytes);
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { requestId } = await context.params;

    const formData = await request.formData();

    const reportTitle = getText(formData, "reportTitle");
    const vehicleMake = getText(formData, "vehicleMake");
    const vehicleModel = getText(formData, "vehicleModel");
    const modelYear = getText(formData, "modelYear");
    const mileage = getText(formData, "mileage");
    const color = getText(formData, "color");
    const auctionGrade = getText(formData, "auctionGrade");

    const originalJapanPrice = getText(formData, "originalJapanPrice");
    const sriLankaEstimatedPrice = getText(formData, "sriLankaEstimatedPrice");
    const sriLankaMarketAverageValuation = getText(
      formData,
      "sriLankaMarketAverageValuation",
    );
    const valuationNotes = getText(formData, "valuationNotes");

    const conditionSummary = getText(formData, "conditionSummary");
    const notes = getText(formData, "notes");

    if (!reportTitle) {
      return NextResponse.json(
        {
          success: false,
          message: "Report title is required.",
        },
        { status: 400 },
      );
    }

    const auctionSheetFileValue = formData.get("auctionSheetImage");
    const accidentPhotoValues = formData.getAll("accidentPhotos");

    let auctionSheetImage: PdfImageInput | null = null;
    const accidentPhotos: PdfImageInput[] = [];

    if (isImageFile(auctionSheetFileValue)) {
      const error = validateImageFile(auctionSheetFileValue, "Auction sheet");

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message: error,
          },
          { status: 400 },
        );
      }

      auctionSheetImage = await toPdfImageInput(
        auctionSheetFileValue,
        "Auction sheet image",
      );
    }

    const imageFiles = accidentPhotoValues.filter(isImageFile);

    if (imageFiles.length > MAX_ACCIDENT_PHOTOS) {
      return NextResponse.json(
        {
          success: false,
          message: `You can upload maximum ${MAX_ACCIDENT_PHOTOS} accident photos.`,
        },
        { status: 400 },
      );
    }

    for (let index = 0; index < imageFiles.length; index += 1) {
      const file = imageFiles[index];
      const error = validateImageFile(file, `Accident photo ${index + 1}`);

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message: error,
          },
          { status: 400 },
        );
      }

      accidentPhotos.push(
        await toPdfImageInput(file, `Accident / damage photo ${index + 1}`),
      );
    }

    const reportRequest = await prisma.reportRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!reportRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Report request not found.",
        },
        { status: 404 },
      );
    }

    if (
      reportRequest.status === ReportRequestStatus.REJECTED ||
      reportRequest.status === ReportRequestStatus.CANCELLED ||
      reportRequest.status === ReportRequestStatus.DELIVERED
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot create report for this request status.",
        },
        { status: 400 },
      );
    }

    let pdfBuffer: Buffer;

    try {
      pdfBuffer = await createPdfBuffer({
        requestNumber: reportRequest.requestNumber,
        customerName: reportRequest.customer.name,
        customerPhone: reportRequest.customer.phone,
        vehicleIdentifier: reportRequest.vehicleIdentifier,
        lotNumber: reportRequest.lotNumber,
        auctionDate: reportRequest.auctionDate,
        auctionPlatform: reportRequest.auctionPlatform,

        reportTitle,
        vehicleMake,
        vehicleModel,
        modelYear,
        mileage,
        color,
        auctionGrade,

        originalJapanPrice,
        sriLankaEstimatedPrice,
        sriLankaMarketAverageValuation,
        valuationNotes,

        conditionSummary,
        notes,

        auctionSheetImage,
        accidentPhotos,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);

      return NextResponse.json(
        {
          success: false,
          message:
            "Could not generate PDF. Please make sure all uploaded images are JPG or PNG files.",
        },
        { status: 400 },
      );
    }

    const safeRequestNumber = reportRequest.requestNumber
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase();

    const fileName = `${safeRequestNumber}-created-report-${Date.now()}.pdf`;

    const filePath = `${reportRequest.customerId}/${reportRequest.id}/${fileName}`;

    const uploadResult = await supabaseAdmin.storage
      .from(REPORT_BUCKET)
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadResult.error) {
      return NextResponse.json(
        {
          success: false,
          message: uploadResult.error.message || "PDF creation failed.",
        },
        { status: 500 },
      );
    }

    await prisma.$transaction([
      prisma.report.create({
        data: {
          requestId: reportRequest.id,
          customerId: reportRequest.customerId,
          title: reportTitle,
          fileUrl: filePath,
          fileName,
          fileSize: pdfBuffer.length,
          uploadedById: admin.id,
        },
      }),

      prisma.activityLog.create({
        data: {
          userId: admin.id,
          requestId: reportRequest.id,
          action: "REPORT_CREATED",
          description: `${reportTitle} was created for ${reportRequest.requestNumber}.`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message:
        "PDF report created successfully. You can review it before delivering to the customer.",
    });
  } catch (error) {
    console.error("Create report failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating the report.",
      },
      { status: 500 },
    );
  }
}
