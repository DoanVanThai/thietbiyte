CREATE TABLE "ProductSlugHistory" (
    "oldSlug" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductSlugHistory_pkey" PRIMARY KEY ("oldSlug")
);

CREATE INDEX "ProductSlugHistory_productId_idx" ON "ProductSlugHistory"("productId");

ALTER TABLE "ProductSlugHistory"
ADD CONSTRAINT "ProductSlugHistory_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
