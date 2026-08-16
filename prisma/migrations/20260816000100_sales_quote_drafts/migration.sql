CREATE TYPE "SalesQuoteStatus" AS ENUM ('DRAFT', 'EXPORTED', 'ARCHIVED');

CREATE TABLE "SalesQuote" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "quoteDate" DATE NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerOrganization" TEXT,
    "total" DECIMAL(15,2) NOT NULL,
    "status" "SalesQuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "lastExportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesQuote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SalesQuoteRevision" (
    "id" TEXT NOT NULL,
    "salesQuoteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesQuoteRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalesQuote_quoteNumber_key" ON "SalesQuote"("quoteNumber");
CREATE INDEX "SalesQuote_updatedAt_idx" ON "SalesQuote"("updatedAt");
CREATE INDEX "SalesQuote_status_updatedAt_idx" ON "SalesQuote"("status", "updatedAt");
CREATE INDEX "SalesQuote_createdById_updatedAt_idx" ON "SalesQuote"("createdById", "updatedAt");
CREATE UNIQUE INDEX "SalesQuoteRevision_salesQuoteId_version_key" ON "SalesQuoteRevision"("salesQuoteId", "version");
CREATE INDEX "SalesQuoteRevision_salesQuoteId_createdAt_idx" ON "SalesQuoteRevision"("salesQuoteId", "createdAt");
CREATE INDEX "SalesQuoteRevision_createdById_createdAt_idx" ON "SalesQuoteRevision"("createdById", "createdAt");

ALTER TABLE "SalesQuote" ADD CONSTRAINT "SalesQuote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesQuoteRevision" ADD CONSTRAINT "SalesQuoteRevision_salesQuoteId_fkey" FOREIGN KEY ("salesQuoteId") REFERENCES "SalesQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesQuoteRevision" ADD CONSTRAINT "SalesQuoteRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
