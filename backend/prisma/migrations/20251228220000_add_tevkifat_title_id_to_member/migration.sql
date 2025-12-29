-- AlterTable
ALTER TABLE "Member" ADD COLUMN "tevkifatTitleId" TEXT;

-- CreateIndex
CREATE INDEX "Member_tevkifatTitleId_idx" ON "Member"("tevkifatTitleId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_tevkifatTitleId_fkey" FOREIGN KEY ("tevkifatTitleId") REFERENCES "TevkifatTitle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
