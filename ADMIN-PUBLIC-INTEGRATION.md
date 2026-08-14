# Phase 23 — Admin ↔ Public Integration

Ngày hoàn tất: 13/08/2026

## Kết quả

Admin và Public hiện dùng cùng lớp service/repository cho dữ liệu sản phẩm. Khi có `DATABASE_URL`, sản phẩm được đọc/ghi bằng Prisma + PostgreSQL; môi trường không có PostgreSQL dùng kho SQLite tại `CONTENT_DB_PATH` (mặc định `.data/thien-loc-content.sqlite`) với cùng trạng thái publish. Astro chạy SSR bằng `@astrojs/node`, vì vậy nội dung không còn bị đóng cứng trong static build.

## Integrated entities

- Product: create, edit, duplicate, autosave, draft, staff preview, publish, unpublish và archive.
- Product fields: name, slug, SKU, model, brand, category, type, origin, manufacturing year, warranty, short/long description, price, price mode, featured và SEO.
- Product media: upload file thật, xóa, kéo/keyboard reorder, đặt cover, sửa alt; Public gallery dùng đúng thứ tự đã lưu.
- Features, configuration và specification groups: lưu theo thứ tự, giữ đầy đủ mọi row; Public render theo hierarchy và tự ẩn section rỗng.
- Product documents: Catalogue, Datasheet, Manual, Certificate, Warranty và Other; Public chỉ hiện `PUBLIC`, hoặc `REGISTERED` khi đã đăng nhập. Tài liệu staff/admin không lộ ra Public.
- Category, Brand, Specialty: màn quản trị tại `/admin/du-lieu/category`, `/admin/du-lieu/brand`, `/admin/du-lieu/specialty`; có tên, slug, ảnh/logo, mô tả, parent/type, sort order và trạng thái. Xóa trong UI là soft-disable để không phá quan hệ sản phẩm.
- Homepage: Hero, CTA, Solutions, Projects, Knowledge, Trust và Reasons có editor; Featured Products, Categories, Brands và Specialties tự lấy từ dữ liệu quản trị.
- Site settings: Company, Logo, Hotline, Email, Address, Zalo và Facebook dùng chung cho Header, Footer, CTA liên hệ và các trang hỗ trợ.
- Public discovery: catalog, product detail, search, compare, Y tế, Thú y, brand/category/specialty route, quote picker, favorite portal và dashboard Admin dùng product service thay cho mảng sản phẩm tĩnh.

## Removed hardcoded data

- Loại bỏ import trực tiếp `catalogProducts` khỏi các public page/component nghiệp vụ.
- Loại bỏ danh sách sản phẩm tĩnh khỏi search, compare, quote picker, portal favorites, Y tế/Thú y và Admin dashboard.
- Loại bỏ hotline/email hardcode khỏi các trang Public; giá trị mặc định chỉ còn một lần trong settings repository để bootstrap hệ thống mới.
- Homepage brands, specialties, featured products và category strip lấy từ repository.
- Product editor không còn cắt mất features, configuration items, specification groups hoặc applications bằng `slice()` trước khi lưu.
- Các fallback vô nghĩa như `0đ`, `undefined`, `null` không được render; ảnh thiếu dùng placeholder, giá thiếu dùng “Liên hệ”, section không có dữ liệu được ẩn.

## Cache strategy

- Public response vẫn cache ở edge: `s-maxage=30` (`/api/site-settings`: 60 giây), `stale-while-revalidate=120`.
- Mỗi resource có version riêng: `products`, `taxonomy`, `content`, `settings`.
- Ghi dữ liệu tăng đúng version, xóa in-process cache liên quan và trả `ETag`, `Surrogate-Key`, `X-Content-Version` trên Public response.
- PostgreSQL product writes cũng chạm product content version, nên CDN có thể purge theo surrogate key. TTL ngắn là fallback khi hạ tầng deploy chưa nối purge hook.
- Admin, auth, CRM, portal và quote response luôn `private, no-store`; không tắt cache toàn website.

## Publish workflow

1. Product mới được lưu ở `DRAFT`; Public catalog/search/detail không đọc draft.
2. Staff có quyền có thể preview draft bằng URL `?preview=<product-id>`. Customer/guest không được preview.
3. `Publish` lưu toàn bộ payload trước, sau đó chuyển `PUBLISHED`; không còn lỗi chỉ đổi status mà bỏ mất nội dung edit.
4. Autosave giữ nguyên trạng thái hiện tại; nút “Lưu nháp” mới chủ động unpublish.
5. `ARCHIVED` bị loại khỏi Public nhưng còn trong Admin để audit/recovery.
6. Slug là unique. Khi đổi slug, slug cũ được ghi vào history và redirect `301` sang URL mới nếu sản phẩm vẫn published.

## Database and deployment

- Migration mới: `prisma/migrations/20260813000400_product_slug_history/migration.sql`.
- Production cần chạy `npm run db:deploy` trước khi khởi động phiên bản mới.
- Nếu dùng SQLite content store trong production, đặt `CONTENT_DB_PATH` trên persistent volume; không đặt trên filesystem tạm của serverless runtime.
- Upload hiện lưu dưới `public/uploads`. Production nhiều instance nên thay storage directory bằng shared/object storage trong bước hạ tầng, giữ nguyên URL contract của CMS.

## Remaining static content

Các dữ liệu sau vẫn static có chủ ý vì là cấu trúc/editorial fallback, không phải bản ghi nghiệp vụ đang được quản trị:

- Nhãn điều hướng, tên section, UX copy, icon mapping và nội dung empty/error state.
- `src/data/catalog.ts` chỉ còn làm bootstrap seed/type compatibility cho database mới; Public không đọc trực tiếp danh sách này.
- `src/data/homepage.ts` là seed/fallback khi content block chưa từng được lưu. Sau lần lưu đầu, Homepage đọc content store.
- Một số editorial group/solution copy chuyên sâu của landing Y tế/Thú y và FAQ mẫu vẫn là nội dung tĩnh. Product, brand, category, specialty và contact data trong các trang đó đã lấy từ database.

## Tests

Kịch bản `tests/server/admin-public-integration.test.ts` kiểm chứng:

1. Admin tạo Product A ở draft → không có trong Public.
2. Publish → có trong Catalog và Search, Product Detail đúng.
3. Sửa specification từ `100 W` thành `120 W` → Public Detail nhận giá trị mới.
4. Đổi slug → slug cũ resolve sang slug mới.
5. Unpublish → biến mất khỏi Catalog và Search.

Kết quả cuối:

- `npm run check`: 0 errors, 0 warnings, 0 hints.
- `npm run test:server`: 17/17 tests pass.
- `npm run build`: SSR production build thành công.
- Smoke test bản build: Homepage `200`, Product API `200`, Product Detail `200`; route Admin chưa đăng nhập redirect `302` đúng sang login; cache/version headers có mặt.
