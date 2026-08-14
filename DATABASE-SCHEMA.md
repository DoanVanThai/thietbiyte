# Database Schema — Phase 21

## Stack

- PostgreSQL
- Prisma ORM 7 with the PostgreSQL driver adapter
- Astro Node server output
- Zod validation at every new write boundary

The canonical schema is [`prisma/schema.prisma`](prisma/schema.prisma). UI components do not query Prisma directly. Requests pass through API/server routes, services, and repositories. The application uses Astro's Node server adapter so database queries stay server-side.

## Main domains

### Access foundation

`User`, `Role`, `Permission`, `UserRole`, and `RolePermission` are retained from the existing authentication work. Phase 21 does not change login or authorization behavior.

### Product catalog

`Product` belongs to one `Brand` and one `Category`. It can belong to many `Specialty` and `Application` records through explicit junction models. Product media, features, configuration rows, documents, and specification groups are normalized child records.

`Category` uses a self relation (`parentId`) for arbitrary parent/child depth. Seed data creates top-level `Y tế` and `Thú y` roots and nests existing catalog categories below them.

Product deletion in the application is archival (`status = ARCHIVED`). Product relations use restrictive or cascading foreign keys according to ownership. A referenced product is not physically deleted from a quote.

### Quotes and CRM

`QuoteRequest` belongs to a `Customer`, contains normalized `QuoteRequestItem` records, and may create a `Lead`. The public quote detail link uses a cryptographically random token whose SHA-256 hash is stored as `publicAccessHash`; the raw token is never persisted.

`Customer` may link to a portal `User` and/or an `Organization`. `Lead` and `CRMActivity` prepare the CRM model without implementing the full Phase 22 workflow.

### Content and operations

`Project`, `Article`, `SiteSetting`, and `AuditLog` provide the production data foundation. Public contact and identity values are represented by `SiteSetting`; transition defaults remain until the database is configured and seeded.

## Index strategy

The schema indexes public lookup and admin filtering fields: slugs, status, product type, featured, brand/category foreign keys, and creation dates. Relation tables index their reverse lookup keys and ordered children use compound parent/sort indexes.

## Data access boundaries

- `src/server/repositories/*`: database queries only
- `src/server/services/*`: validation, transactions, fallback policy, output mapping
- `src/server/validation/*`: Zod server input schemas
- `src/pages/api/*`: HTTP parsing and response codes

## Commands

```bash
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
```

Production deployment applies checked-in SQL with `npm run db:deploy`.

The full database integration test requires a local/test `DATABASE_URL` and runs with `npm run test:database`. It creates isolated product and quote fixtures, verifies their normalized relations and public quote token, then removes those fixtures.
