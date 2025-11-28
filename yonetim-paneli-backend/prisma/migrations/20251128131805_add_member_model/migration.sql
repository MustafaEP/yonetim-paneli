-- CreateTable
CREATE TABLE "Member" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL,
    "registrationNo" TEXT,
    "nationalId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "province" TEXT,
    "district" TEXT,
    "institution" TEXT,
    "motherName" TEXT,
    "fatherName" TEXT,
    "birthPlace" TEXT,
    "gender" TEXT,
    "educationStatus" TEXT,
    "phoneNumber" TEXT,
    "registrationDate" DATETIME,
    "ledgerNo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_nationalId_key" ON "Member"("nationalId");
