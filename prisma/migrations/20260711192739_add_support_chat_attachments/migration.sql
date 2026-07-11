-- AlterTable
ALTER TABLE "support_messages" ADD COLUMN     "attachmentFileName" TEXT,
ADD COLUMN     "attachmentFileSize" INTEGER,
ADD COLUMN     "attachmentFileType" TEXT;
