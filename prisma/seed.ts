import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in .env");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Deactivate old package codes if they exist
  await prisma.paymentPlan.updateMany({
    where: {
      code: {
        in: ["BUSINESS_20", "ENTERPRISE_50"],
      },
    },
    data: {
      isActive: false,
    },
  });

  const plans = [
    {
      code: "STARTER_1",
      name: "Starter Pack",
      price: 2500,
      currency: "LKR",
      requestCredits: 1,
      sortOrder: 1,
    },
    {
      code: "VALUE_10",
      name: "Value Pack",
      price: 10000,
      currency: "LKR",
      requestCredits: 10,
      sortOrder: 2,
    },
    {
      code: "BUSINESS_30",
      name: "Business Pack",
      price: 20000,
      currency: "LKR",
      requestCredits: 30,
      sortOrder: 3,
    },
    {
      code: "ENTERPRISE_100",
      name: "Enterprise Pack",
      price: 50000,
      currency: "LKR",
      requestCredits: 100,
      sortOrder: 4,
    },
  ];

  for (const plan of plans) {
    await prisma.paymentPlan.upsert({
      where: {
        code: plan.code,
      },
      update: {
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        requestCredits: plan.requestCredits,
        isActive: true,
        sortOrder: plan.sortOrder,
      },
      create: plan,
    });
  }

  console.log("Payment plans seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
