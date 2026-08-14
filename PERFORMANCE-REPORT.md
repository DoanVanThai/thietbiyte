# PERFORMANCE REPORT — THIÊN LỘC GROUP

Ngày đo: 13/08/2026  
Stack: Astro 7.2.1, Node adapter standalone, Node.js 26, Prisma/PostgreSQL + SQLite transitional stores.

## 1. Phạm vi và phương pháp

- Build production bằng `npm run build`, chạy artifact bằng `node dist/server/entry.mjs` trên `127.0.0.1:4400`.
- TTFB được đo bằng 20 request `curl` tuần tự/route; số “warm” bỏ 3 request đầu. Đây là thời gian local server, không gồm DNS, TLS, CDN và mạng người dùng.
- Bundle/payload lấy trực tiếp từ `dist/client` sau build.
- SQLite được benchmark in-process 1.000 lần trên dữ liệu seed hiện tại. PostgreSQL production không có `DATABASE_URL`, vì vậy không có số `EXPLAIN ANALYZE` hợp lệ.
- Môi trường không có browser khả dụng và project chưa có RUM. Vì vậy không thể đo LCP, CLS, INP thật; báo cáo không thay bằng số ước lượng.

## 2. Baseline trước tối ưu

### Core Web Vitals

| Chỉ số | Before | Lý do |
|---|---:|---|
| LCP | Chưa đo được | Không có browser/RUM trong môi trường audit |
| CLS | Chưa đo được | Không có browser để quan sát layout frame |
| INP | Chưa đo được | Cần browser interaction hoặc field data |
| TTFB | Có, xem bảng dưới | Đo trực tiếp trên Node SSR local |

### TTFB và HTML baseline

| Route | Warm TTFB | HTML | Ghi chú |
|---|---:|---:|---|
| `/` | 1,48 ms | 48.935 B | SSR local |
| `/san-pham` | 2,14 ms | 101.773 B | 12 sản phẩm mock/current data |
| `/san-pham/he-thong-sieu-am-mau-sonoport-8` | Không hợp lệ | 21 B trước khi stream dừng | Route động dùng `getStaticPaths()` trong SSR, gây exception |
| `/tim-kiem` | 1,45 ms | 74.983 B | Search local index |
| `/dang-nhap` | 0,91 ms | 4.372 B | Form auth |
| `/admin` | 1,13 ms | 68.766 B | Artifact baseline chưa áp dụng auth redirect hiện tại |

### Bundle và asset baseline

| Nhóm | Before |
|---|---:|
| Toàn bộ `dist/client` | khoảng 5.524 KiB / 5,39 MiB |
| JavaScript | khoảng 116 KiB |
| CSS | khoảng 400 KiB |
| Font output | khoảng 996 KiB chưa tính TTF/SVG icon fallback |
| Ảnh nguồn WebP | 416.262 B |
| Phosphor output | SVG 2.996.371 B + TTF 488.636 B + WOFF 488.716 B + WOFF2 147.380 B |

Phosphor là bottleneck lớn nhất của artifact: package phát hành bốn định dạng font/icon dù browser hiện đại chỉ cần WOFF2. CSS icon đầy đủ cũng chiếm gần 100 KiB.

### Image baseline

Tất cả 6 ảnh nguồn đã là WebP, nhưng mỗi card/thumbnail vẫn tham chiếu ảnh 1.400–1.600 px:

| Ảnh | Kích thước nguồn | Payload |
|---|---:|---:|
| Hero ultrasound | 1.600 × 1.067 | 102.036 B |
| Endoscopy/surgery | 1.400 × 1.050 | 76.034 B |
| X-ray | 1.400 × 1.050 | 69.970 B |
| Laboratory | 1.400 × 1.050 | 39.162 B |
| Project placeholder | 1.400 × 934 | 52.696 B |
| Veterinary room | 1.400 × 934 | 76.364 B |

Hero homepage đã không lazy-load và có `fetchpriority="high"`. Một số hero/card có width-height không đúng tỷ lệ ảnh thật, tạo rủi ro CLS và crop không ổn định.

### Database/API baseline

`DATABASE_URL` không được cấu hình nên không thể đo PostgreSQL. SQLite seed hiện có:

| Query | Trung bình baseline | Số record |
|---|---:|---:|
| `getProducts(false)` warm | 0,0044 ms | 12 |
| `getSettings()` | 0,0030 ms | 7 setting |
| `listCrmQuotes()` | 0,0318 ms | 1 |
| `listCrmLeads()` | 0,0302 ms | 1 |
| `listCustomers()` | 0,0172 ms | 1 |

Baseline có N+1 ở portal quotes và CRM quotes, các list query không có `LIMIT/OFFSET`, cache SQLite dùng một version `public-content` chung và product update làm mất hiệu lực toàn bộ public content.

## 3. Thay đổi đã triển khai

### Images và LCP

- Tạo 24 biến thể WebP 320/640/960/1280 bằng Sharp.
- Tên biến thể chứa SHA-256 của ảnh nguồn và được xuất dưới `/_astro/media`; Node runtime trả `Cache-Control: public, max-age=31536000, immutable`.
- Thêm `ResponsiveImage.astro` và manifest build-time; áp dụng cho homepage hero, category strip, featured products, solutions, projects, Y tế, Thú y, specialty và product cards.
- Product Detail gallery có `srcset`, `sizes`, eager/high priority cho ảnh đầu; khi đổi thumbnail, script đồng bộ cả `src` và `srcset`.
- Hero LCP không lazy-load. Ảnh dưới fold vẫn lazy-load và `decoding="async"`.
- Sửa intrinsic dimensions sai ở Y tế/Thú y/specialty để giữ layout ổn định.

Payload hero theo candidate:

| Candidate | Before dùng ảnh gốc | After | Giảm |
|---|---:|---:|---:|
| 320 px | 102.036 B | 6.984 B | 93,2% |
| 640 px | 102.036 B | 19.324 B | 81,1% |
| 960 px | 102.036 B | 33.356 B | 67,3% |
| 1280 px | 102.036 B | 47.732 B | 53,2% |

Product/category card ở 320 px còn khoảng 5,3–9,4 KiB thay vì 39–76 KiB. Tổng image artifact tăng vì chứa nhiều candidate, nhưng browser chỉ tải candidate phù hợp viewport/DPR.

### Image upload pipeline

`/api/admin/upload` hiện:

- Chặn file ngoài allowlist và input trên 15 MiB.
- Chặn ảnh trên 40 triệu pixel.
- Auto-rotate theo metadata, không lưu ảnh raster gốc dung lượng lớn.
- Resize cạnh dài tối đa 2.000 px.
- Chuyển raster sang WebP quality 82.
- Sinh thumbnail 320/640/960/1280 WebP quality 78.
- Trả width/height, danh sách variant và placeholder WebP 32 px.
- PDF/DOC/DOCX giữ nguyên pipeline tài liệu, không xử lý như ảnh.

### Fonts và icons

- Be Vietnam Pro chỉ còn 400/500/600/700.
- Chỉ phát hành Vietnamese + Latin WOFF2; loại Latin Extended và WOFF fallback không cần cho target browser hiện tại.
- `font-display: swap` giữ text hiển thị trong khi font tải.
- CSS Phosphor được sinh tự động từ icon thật sự xuất hiện trong source: còn 170 rule thay vì toàn bộ package.
- Chỉ ship Phosphor WOFF2; bỏ SVG/TTF/WOFF fallback khỏi build.

After font output: 9 WOFF2, 282.972 B; trong đó Be Vietnam Pro là 135.592 B và Phosphor là 147.380 B.

### JavaScript, CSS, motion và third-party

- Không phát hiện analytics, map, chat widget hoặc tracking script blocking.
- Không có animation library nặng; motion hiện dùng Web Animations API với `transform + opacity` và tôn trọng `prefers-reduced-motion`.
- Search catalog debounce 180 ms. Search hiện chạy trên local index, không phát request theo mỗi ký tự nên không có stale network request cần hủy.
- JavaScript toàn build giảm từ khoảng 116 KiB xuống 107.413 B.
- CSS giảm từ khoảng 400 KiB xuống 320.367 B, chủ yếu nhờ cắt icon CSS/package fallback.

### Server, pagination và database

- Public product API có server pagination và trả metadata `{ page, pageSize, total, totalPages }`; `pageSize` bị chặn tối đa 100.
- Admin product API hỗ trợ `page`, `pageSize`, `q` và không còn mặc định trả toàn bộ record.
- Prisma public catalog chỉ select relation cần cho card, giới hạn tối đa 100; detail mới tải full configuration/specification/document relations.
- User/Admin và các SQLite CRM list có pagination mặc định 50, tối đa 100.
- Bỏ N+1 ở portal/CRM quote items bằng query `IN (...)` và group in-memory: số query cố định thay vì tăng theo số quote.
- Thêm composite indexes khớp filter/sort cho product, quote, lead, customer, activity, follow-up, session, document và audit.
- Thêm migration `20260813000200_phase26_performance_indexes` cho PostgreSQL.

Với 12 record SQLite hiện tại, bounded query có overhead nhỏ nhưng hành vi scale tốt hơn:

| Query after | Trung bình | Đặc tính |
|---|---:|---|
| `getProducts(false)` warm | 0,0054 ms | Cache hit |
| `getProductsPage()` | 0,1575 ms | Count + page, bounded |
| `getSettings()` warm | 0,0045 ms | Resource cache |
| `getEntities()` warm | 0,0040 ms | Resource cache |
| `listCrmQuotes()` | 0,0508 ms | 2 query cố định thay cho N+1 |
| `listCrmLeads()` | 0,0523 ms | Paginated, indexed |

Chênh lệch microsecond trên seed 1–12 record không có ý nghĩa người dùng; thay đổi quan trọng là query count và số row đã được chặn khi dữ liệu tăng.

### Cache và revalidation

- Public list/home: edge TTL 30 giây, SWR 600 giây.
- Product detail/API detail: edge TTL 60 giây, SWR 600 giây.
- Site settings: edge TTL 300 giây, SWR 600 giây.
- Auth, Portal, Admin và private API: `private, no-store`.
- Cache version tách thành `products`, `taxonomy`, `content`, `settings`.
- Product update chỉ tăng product version; settings/content/taxonomy không bị clear theo.
- Response public có ETag, content version và surrogate keys theo đúng resource để CDN có thể purge hẹp.
- Hashed CSS/JS/font/responsive image nhận cache 1 năm immutable.

## 4. After

### Core Web Vitals

| Chỉ số | After | Kết luận |
|---|---:|---|
| LCP | Chưa đo được | LCP image đã được ưu tiên và giảm 53–93% tùy candidate; cần browser/RUM để xác nhận thời gian |
| CLS | Chưa đo được | Intrinsic dimensions và skeleton geometry đã được giữ/sửa; cần browser trace để xác nhận |
| INP | Chưa đo được | JS nhỏ, interaction local/debounced; cần field data |
| TTFB | 0,88–3,29 ms warm trên route chính | Node SSR local, chưa tính CDN/network; dao động theo tải máy đo |

### TTFB after

| Route | Warm TTFB | HTML/JSON | Trạng thái |
|---|---:|---:|---|
| `/` | 2,31 ms | 56.529 B | 200 |
| `/san-pham` | 3,29 ms | 106.214 B | 200 |
| Product Detail | 2,14 ms | 54.584 B | 200, đã hết stream error |
| `/tim-kiem` | 2,01 ms | 73.872 B | 200 |
| `/dang-nhap` | 1,21 ms | 4.373 B | 200 |
| `/y-te` | 2,37 ms | 49.566 B | 200 |
| `/thu-y` | 1,99 ms | 57.434 B | 200 |
| `/api/products` | 1,24 ms | 9.611 B | 200, paginated |
| `/api/site-settings` | 1,13 ms | 168 B | 200 |
| `/admin` | 0,88 ms | 0 B | 302 khi chưa đăng nhập, đúng policy |

### Bundle after

| Nhóm | After | So với baseline |
|---|---:|---:|
| Toàn bộ `dist/client` | 1.703.494 B / 1,62 MiB | giảm khoảng 69,9% |
| JavaScript | 107.413 B | giảm khoảng 7–10% |
| CSS | 320.367 B | giảm khoảng 20% |
| WOFF2 | 282.972 B | chỉ 9 file cần thiết |
| WebP source + candidates | 992.742 B | nhiều candidate build-time; runtime tải một candidate |

Route asset raw, chưa gzip/Brotli:

| Route | CSS | JS |
|---|---:|---:|
| Homepage | 86.230 B | 9.916 B |
| Catalog | 104.933 B | 18.280 B |
| Product Detail | 129.716 B | 9.916 B |
| Search | 79.265 B | 9.916 B |
| Login | 49.702 B | 6.936 B |

## 5. Regression test

- `npm run build`: pass, 0 errors, 0 warnings, 0 hints.
- `npm run test:server`: 17/17 tests pass.
- Homepage, Catalog, Product Detail, Search, Login, Y tế, Thú y: HTTP 200 trên production artifact.
- Product API, Product Detail API, Site Settings API: HTTP 200.
- Product API `pageSize=5`: trả 5 item, tổng 11, 3 trang.
- Product slug không tồn tại: HTTP 404 thay vì stream exception.
- Admin và Admin Users khi chưa đăng nhập: HTTP 302 về login; Admin API: HTTP 401/no-store.
- Không thể kiểm thử phiên Admin đã đăng nhập hoặc chạy `EXPLAIN ANALYZE` PostgreSQL vì môi trường không có database/session production.

## 6. Bottleneck còn lại

1. Chưa có dữ liệu LCP/CLS/INP thật. Sau deploy cần RUM (ít nhất route + device class + p75) và một browser lab run cố định ở 375/768/1440.
2. Chưa đo PostgreSQL production. Cần chạy migration rồi `EXPLAIN (ANALYZE, BUFFERS)` với dữ liệu gần production cho product listing, search, CRM leads/quotes và admin users.
3. Phosphor WOFF2 147.380 B vẫn là asset frontend đơn lớn nhất. Bước tiếp theo hợp lý là thay icon critical bằng SVG sprite/subset font, không thay toàn bộ UI một lần.
4. Product Detail và Catalog còn 100–130 KiB CSS raw. Có thể tách tiếp CSS theo component/route sau khi có coverage từ browser.
5. HTML/API hiện trông chờ reverse proxy/CDN để Brotli/Gzip. Node standalone local không nén response động.
6. Catalog hiện có 11 public products nên client-side filter không tạo vấn đề; data/API đã paginated và public query bị cap 100. Khi vượt ngưỡng này, cần chuyển toàn bộ filter/sort URL sang server endpoint để giữ kết quả đầy đủ giữa các page, thay vì tăng cap.
7. Surrogate keys đã sẵn sàng nhưng chưa có provider-specific purge hook. Nếu triển khai Cloudflare/Vercel/NGINX cần nối hook admin publish vào purge key tương ứng.

## 7. Files chính

- Asset pipeline: `scripts/generate-responsive-images.mjs`, `scripts/generate-icon-css.mjs`.
- Image UI: `src/components/ResponsiveImage.astro`, `src/components/ProductGallery.astro`, homepage/Y tế/Thú y/specialty/product card components.
- Font/icon: `src/styles/fonts.css`, `src/styles/icons.css`.
- Upload: `src/pages/api/admin/upload.ts`.
- Product pagination: `src/server/repositories/product-repository.ts`, `src/server/services/product-service.ts`, public/admin product APIs.
- Cache: `src/middleware.ts`, `src/lib/content-repository.ts`.
- Database: `src/lib/workflow/db.ts`, `src/lib/workflow/repository.ts`, `prisma/schema.prisma`, Phase 26 migration.
