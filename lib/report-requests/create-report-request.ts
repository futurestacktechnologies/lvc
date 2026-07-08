import { z } from "zod";

import { prisma } from "@/lib/prisma/client";
import { ReportRequestStatus, UserPackageStatus } from "@/generated/prisma";

export const createReportRequestSchema = z
  .object({
    vehicleIdentifier: z.string().trim().optional().default(""),
    lotNumber: z.string().trim().optional().default(""),
    auctionDate: z.string().trim().optional().default(""),
    auctionPlatform: z.string().trim().optional().default(""),
  })
  .superRefine((data, ctx) => {
    const vehicleIdentifier = data.vehicleIdentifier.trim();
    const lotNumber = data.lotNumber.trim();
    const auctionDate = data.auctionDate.trim();
    const auctionPlatform = data.auctionPlatform.trim();

    const hasVehicleIdentifier = vehicleIdentifier.length > 0;
    const hasAuctionDetails =
      lotNumber.length > 0 ||
      auctionDate.length > 0 ||
      auctionPlatform.length > 0;

    if (!hasVehicleIdentifier && !hasAuctionDetails) {
      ctx.addIssue({
        code: "custom",
        message:
          "Please enter a chassis/VIN number or provide auction details.",
        path: ["vehicleIdentifier"],
      });

      return;
    }

    if (hasVehicleIdentifier && hasAuctionDetails) {
      ctx.addIssue({
        code: "custom",
        message:
          "Please use either chassis/VIN search or auction details search, not both.",
        path: ["vehicleIdentifier"],
      });

      return;
    }

    if (hasVehicleIdentifier) {
      const normalizedValue = vehicleIdentifier.replace(/\s/g, "");

      const isValidChassis =
        normalizedValue.length >= 8 && normalizedValue.length <= 16;

      const isValidVin = normalizedValue.length === 17;

      if (!isValidChassis && !isValidVin) {
        ctx.addIssue({
          code: "custom",
          message:
            "Chassis number must be 8-16 characters or VIN must be exactly 17 characters.",
          path: ["vehicleIdentifier"],
        });
      }
    }

    if (hasAuctionDetails) {
      if (!lotNumber) {
        ctx.addIssue({
          code: "custom",
          message: "Lot number is required.",
          path: ["lotNumber"],
        });
      }

      if (!auctionDate) {
        ctx.addIssue({
          code: "custom",
          message: "Auction date is required.",
          path: ["auctionDate"],
        });
      }

      if (!auctionPlatform) {
        ctx.addIssue({
          code: "custom",
          message: "Auction platform is required.",
          path: ["auctionPlatform"],
        });
      }
    }
  });

export type CreateReportRequestInput = z.infer<
  typeof createReportRequestSchema
>;

function generateReportRequestNumber() {
  const date = new Date();

  const datePart = date.toISOString().slice(0, 10).replaceAll("-", "");

  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `REQ-${datePart}-${randomPart}`;
}

export async function createReportRequestForUser({
  userId,
  input,
}: {
  userId: string;
  input: CreateReportRequestInput;
}) {
  const vehicleIdentifier = input.vehicleIdentifier.trim().replace(/\s/g, "");
  const lotNumber = input.lotNumber.trim();
  const auctionPlatform = input.auctionPlatform.trim();

  const hasVehicleIdentifier = vehicleIdentifier.length > 0;

  const auctionDate =
    input.auctionDate.trim().length > 0 ? new Date(input.auctionDate) : null;

  if (auctionDate && Number.isNaN(auctionDate.getTime())) {
    throw new Error("Invalid auction date.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const activePackage = await tx.userPackage.findFirst({
      where: {
        userId,
        status: UserPackageStatus.ACTIVE,
        remainingRequests: {
          gt: 0,
        },
      },
      orderBy: [
        {
          activatedAt: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      select: {
        id: true,
        remainingRequests: true,
      },
    });

    if (!activePackage) {
      throw new Error(
        "You do not have any active request credits. Please buy a package first.",
      );
    }

    const nextRemainingRequests = activePackage.remainingRequests - 1;

    await tx.userPackage.update({
      where: {
        id: activePackage.id,
      },
      data: {
        usedRequests: {
          increment: 1,
        },
        remainingRequests: {
          decrement: 1,
        },
        status:
          nextRemainingRequests <= 0
            ? UserPackageStatus.EXHAUSTED
            : UserPackageStatus.ACTIVE,
      },
    });

    const reportRequest = await tx.reportRequest.create({
      data: {
        requestNumber: generateReportRequestNumber(),
        customerId: userId,
        userPackageId: activePackage.id,

        vehicleIdentifier: hasVehicleIdentifier
          ? vehicleIdentifier.toUpperCase()
          : "",

        lotNumber: hasVehicleIdentifier ? null : lotNumber,
        auctionDate: hasVehicleIdentifier ? null : auctionDate,
        auctionPlatform: hasVehicleIdentifier ? null : auctionPlatform,

        status: ReportRequestStatus.NEW,
      },
    });

    await tx.activityLog.create({
      data: {
        userId,
        requestId: reportRequest.id,
        action: "REPORT_REQUEST_CREATED",
        description: `${reportRequest.requestNumber} created by customer.`,
      },
    });

    return reportRequest;
  });

  return result;
}
