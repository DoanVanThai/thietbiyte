# Admin Performance Report

Ngày hoàn tất: 14/08/2026

## Changes

### Navigation (P0)

- Bật Astro `ClientRouter` riêng trong Admin với `fallback="swap"`; không có page fade.
- Sidebar giữ nguyên DOM qua route transition.
- Dashboard và CRM dùng chung `AdminLayout`, bỏ shell lồng/lặp.
- Active sidebar đổi ngay lúc click, không chờ server.
- Top progress bar chỉ xuất hiện nếu route chưa sẵn sàng sau 120 ms; nội dung cũ được giữ, không blank toàn màn hình.
- Toàn bộ script Admin quan trọng khởi tạo lại theo `astro:page-load`; listener global dùng `AbortController` để không nhân đôi khi quay lại route.
- Đăng xuất vẫn dùng document navigation vì đây là ranh giới auth, không phải internal Admin navigation.

### Prefetch strategy

- Priority A, tải sớm: Dashboard, Products, Consultation Leads.
- Priority B, hover: Categories, Brands, Specialties, Content.
- Priority C, tap/không tải sớm: Settings, Audit Logs, Users, Roles, PDF builder và các route ít dùng.
- `prefetchAll: false` tránh spam network.
- Dùng prefetch có sẵn của Astro: hover delay, URL deduplication và giảm prefetch trên slow connection/data saver.

### Data, cache và invalidation (P1)

- Notification đổi từ full quote list sang `count + latest 5` với minimum select.
- Notification cache 10 giây theo user/scope, promise deduplication và giới hạn 100 key.
- Mutation taxonomy, CRM và access chuyển từ `location.reload()` sang soft refresh bằng client router.
- Product/CRM filter được giữ trong URL; back/forward khôi phục search, filter, page và router đảm nhiệm scroll history.
- Không thêm TanStack Query vì project không dùng React và cache server/router hiện tại đã đủ cho P0–P2.

### Query và database (P2)

- Tạo Product List DTO riêng, không còn tải features/configurations/specifications/documents cho từng row.
- Product list dùng server pagination 50 row/request.
- Search name/model/SKU và filter category, brand, specialty, group, status, price mode, featured chạy ở server.
- Search debounce 280 ms; URL chỉ điều hướng sau khi người dùng ngừng gõ.
- Product editor chỉ fetch full detail khi mở đúng sản phẩm.
- Dashboard dùng compact 20-product search index + ba count query song song.
- CRM Consultation Leads/quotes dùng server pagination 50 row/request.
- Không thêm index mới vì các field filter chính đã có index phù hợp.

### Rendering và perceived performance (P3–P4)

- Giữ previous content trong khi route mới chuẩn bị, thay vì xóa table rồi bật spinner.
- Loading feedback cục bộ qua `aria-busy` trên main content và progress bar 3 px.
- Filter phản hồi ngay trên rows đang có; server result chuẩn thay thế sau debounce.
- Route code splitting vẫn hoạt động; PDF/Product/CRM là các chunk độc lập.

## Routes optimized

- `/admin`
- `/admin/san-pham`
- `/admin/du-lieu/category`
- `/admin/du-lieu/brand`
- `/admin/du-lieu/specialty`
- `/admin/crm/quotes`
- Các route CRM qua `CrmShell`
- `/admin/users`, `/admin/roles`, `/admin/permissions`
- `/admin/audit-logs`
- `/admin/cai-dat-noi-dung`
- `/admin/bao-gia` về navigation/lifecycle; catalog lớn còn ghi ở mục Remaining.

## Before / After

Số liệu DB chạy local PostgreSQL, bỏ lượt warm-up và lấy 5 lượt tiếp theo.

| Chỉ số | Before | After | Kết quả |
|---|---:|---:|---:|
| Product list query, 12 row | 33,31 ms avg; 144,41 ms max | 3,38 ms avg; 3,92 ms max | ~89,9% nhanh hơn theo avg |
| Product list serialized payload | 62.738 bytes | 20.632 bytes | giảm ~67,1% |
| Product search `Sono` | tải full catalog rồi lọc client | 3,08 ms avg; 1 row/2.070 bytes | server-filtered |
| Product compound filter | tải full catalog rồi lọc client | 3,03 ms avg; 7 row | server-filtered |
| Topbar notification | full quote view: 6,71 ms avg; 18,31 ms max | 1,46 ms avg; 2,21 ms max | ~78,2% nhanh hơn theo avg |
| Product rows gửi xuống client | toàn bộ dataset | tối đa 50 | giữ nguyên tại 100/1.000/10.000 row |
| CRM quote rows gửi xuống client | toàn bộ dataset | tối đa 50 | bounded response |
| Internal mutation refresh | full document reload | client soft refresh | giữ shell và state URL |
| Sidebar active feedback | sau navigation | ngay khi click | mục tiêu <100 ms về cảm nhận |

### Bundle comparison

| Chunk/style | Before | After | Ghi chú |
|---|---:|---:|---|
| AdminLayout JS | 15.956 B | 18.532 B | thêm lifecycle/progress/navigation hooks |
| ClientRouter + prefetch runtime | 0 B | 14.821 B | chi phí chung để loại full document reload |
| Product route JS | 23.257 B | 26.404 B | thêm URL state, debounce, lifecycle cleanup |
| CRM shell JS | 7.004 B | 7.584 B | thêm soft refresh/re-init |
| AdminLayout CSS | 54.298 B | 55.571 B | thêm progress indicator |

Bundle tăng nhỏ có chủ đích. Lợi ích là các lần chuyển route không dựng lại document/CSS/font/script; route-specific chunks vẫn chỉ tải khi cần.

## Requests reduced

- Bỏ full quote relation query khỏi mọi Topbar render.
- Dashboard không còn full product relation query.
- Product list không còn N nhóm relation chi tiết trên từng row.
- Prefetch deduplicate cùng URL; Priority C không được prefetch lúc shell render.
- Mutation không tạo full browser reload và không tải lại static assets.

## Cache strategy

| Dữ liệu | Chiến lược |
|---|---|
| Route thường dùng | Astro route prefetch, dedupe, adaptive network |
| Category/brand/specialty/content/settings | versioned server cache hiện có; mutation tăng version/invalidate đúng resource |
| Notification | TTL 10 giây, cache theo actor scope, tối đa 100 key |
| Product list | dữ liệu mới theo request; route giữ previous content trong lúc fetch |
| Auth/permission | không cache qua request để tránh quyền bị thu hồi nhưng còn hiệu lực |

## Data-size verification

Automated test giả lập total 10, 100, 1.000 và 10.000 records trên repository. Trong mọi trường hợp query vẫn có `take: 50`, `skip` theo page và response không vượt 50 rows. Đây là kiểm tra kiến trúc bounded response; chưa seed 10.000 bản ghi vào database production/local.

## Verification

- `astro check`: 240 files, 0 error, 0 warning.
- `npm run build`: thành công với Astro 7.2.1 SSR/Node standalone.
- `npm run test:server`: 29 tests pass, 0 fail.
- Migration schema: 5/5 migration đã áp dụng.
- Thêm regression tests cho client navigation, prefetch tiers, compact notification, soft refresh và bounded product listing.

## Remaining bottlenecks

1. PDF builder cần remote product search + detail-on-demand trước khi catalog đạt hàng nghìn sản phẩm.
2. Leads/customers CRM cần server pagination tương tự quotes khi dữ liệu thật tăng.
3. Các section content/project/document/media legacy nên tách khỏi HTML Dashboard.
4. Cần chạy browser trace có session đăng nhập để chốt navigation timing trên slow 3G, rapid-click race và cache-hit lần hai.
5. Chỉ thêm trigram/full-text search index sau khi có dữ liệu lớn và `EXPLAIN ANALYZE` chứng minh sequential scan là bottleneck.

