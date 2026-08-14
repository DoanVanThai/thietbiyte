ALTER TABLE "ProductImage"
ADD COLUMN "quoteEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "quoteCaption" TEXT,
ADD COLUMN "quoteAfterText" TEXT;
