-- Composite indexes match the public catalog and operational list ordering.
CREATE INDEX IF NOT EXISTS "Product_status_featured_featuredOrder_createdAt_idx"
ON "Product"("status", "featured", "featuredOrder", "createdAt");

CREATE INDEX IF NOT EXISTS "QuoteRequest_status_createdAt_idx"
ON "QuoteRequest"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "QuoteRequest_assignedToId_createdAt_idx"
ON "QuoteRequest"("assignedToId", "createdAt");

CREATE INDEX IF NOT EXISTS "Lead_status_createdAt_idx"
ON "Lead"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "Lead_assignedToId_createdAt_idx"
ON "Lead"("assignedToId", "createdAt");
