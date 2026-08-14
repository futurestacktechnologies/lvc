-- AlterTable
ALTER TABLE "agent_commissions" ADD COLUMN     "payoutId" TEXT;

-- CreateIndex
CREATE INDEX "agent_commissions_payoutId_idx" ON "agent_commissions"("payoutId");

-- AddForeignKey
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "agent_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
