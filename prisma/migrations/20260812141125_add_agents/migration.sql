-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "agentId" TEXT;

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "nicDlUrl" TEXT,
    "nicDlFileName" TEXT,
    "nicDlFileType" TEXT,
    "nicDlFileSize" INTEGER,
    "promoCode" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_promoCode_key" ON "agents"("promoCode");

-- CreateIndex
CREATE INDEX "agents_mobile_idx" ON "agents"("mobile");

-- CreateIndex
CREATE INDEX "agents_status_idx" ON "agents"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
