/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `payment_plans` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `payment_plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment_plans" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payment_plans_code_key" ON "payment_plans"("code");
