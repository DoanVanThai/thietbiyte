# Data Migration — Phase 21

## Audit result

Before Phase 21 the application was Astro static output with no production database. Data was distributed across:

- `src/data/catalog.ts` and `src/data/product-details.ts`: 12 products and technical detail
- `src/data/homepage.ts`, `medical.ts`, and `search.ts`: public navigation/content
- `src/data/crm.ts`: demonstration CRM leads, quotes, customers, and activity
- `src/data/admin-access.ts`: demonstration users, roles, and permissions
- arrays inside `src/pages/admin/index.astro`: articles, documents, projects, and media
- legacy SQLite stores in `src/lib/content-repository.ts` and `src/lib/workflow/db.ts`
- browser storage for favorites/compare and the former quote prototype

Authentication/RBAC files appeared concurrently during implementation and were preserved. Phase 21 does not extend their workflow.

## Implemented migration path

1. PostgreSQL/Prisma is now the canonical production target.
2. The idempotent development seed imports the existing 12 catalog products, categories, brands, specialties, applications, product details, and public site settings.
3. Public product catalog/detail, medical/veterinary pages, compare, quote picker, Admin product list, and portal product relations now use the product service.
4. Quote submission writes PostgreSQL `Customer`, `Organization`, `QuoteRequest`, items/documents, and `Lead` in one transaction when `DATABASE_URL` exists.
5. Existing content SQLite repositories remain an explicit transition fallback for public editorial/product reads. Quote writes require PostgreSQL and return a clear service error when the database is not configured; a quote is never silently stored in a different backend.

## Migration and rollback

The checked-in migrations are:

- `20260813000100_phase21_production_foundation`: initial normalized PostgreSQL schema and quote sequence
- `20260813000200_phase26_performance_indexes`: idempotent composite indexes for catalog/operations
- `20260813000300_quote_crm_workflow`: compatibility marker because workflow tables are already present in the foundation migration
- `20260813000400_product_slug_history`: safe public redirects after product slug changes

It is an initial schema migration for a new PostgreSQL database. No command in Phase 21 drops the existing SQLite stores or browser data. To roll back an application deployment, redeploy the previous app version; preserve the PostgreSQL database and use a forward corrective migration rather than manually dropping production tables.

## Mock data removed from active production flows

- Public product listing/detail can read PostgreSQL.
- `/y-te`, `/thu-y`, compare, quote picker, Admin product list, and portal favorite-product mapping use the product service.
- Quote creation and guest detail can use PostgreSQL with server validation and access-token protection.
- Public taxonomy and site-setting services can read PostgreSQL.

## Remaining hardcoded/transition data

- Homepage editorial blocks, medical solution copy, Admin CMS examples, and some CRM UI screens still use existing content/SQLite repositories.
- The legacy `Quote`, `Document`, SQLite workflow, and SQLite content models are retained for backward compatibility while production data is migrated and verified.
- Header/Footer contact values still need a later template-wide setting injection; the canonical SiteSetting API/service now exists.
- Favorites/compare interaction state remains browser-based; user-linked favorite records are modeled in PostgreSQL.

These items are intentionally not deleted in bulk. Remove them per flow only after production data parity is confirmed.

## Verification checklist

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
npm run test:server
npm run test:database
npm run check
npm run build
```

Database migration, seed, and database integration tests require a reachable PostgreSQL `DATABASE_URL`. The seed is idempotent. `.env` and generated Prisma output are ignored; `.env.example` contains placeholders only.
