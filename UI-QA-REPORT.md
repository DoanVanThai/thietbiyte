# UI QA Report — Phase 20

**Ngày kiểm tra:** 13/08/2026  
**Trạng thái:** **UI code sẵn sàng cho staging; chưa sẵn sàng phát hành production.**  
**Release blockers:** database/auth production chưa được cấu hình trong môi trường kiểm thử, CRM còn dùng dữ liệu và action demo, chưa có kiểm thử trình duyệt thật, chưa có lint và automated test thực thi.

## Routes Tested

- Production server được build và chạy bằng Astro Node standalone tại local.
- Automated HTTP crawl kiểm tra 52 đường dẫn HTML liên kết duy nhất và 205 URL/state variants trong toàn bộ lượt QA. Kết quả cuối: 50 route trả `200`, `/404` trả đúng `404`, `/admin` trả đúng `302` về login; không còn link public nội bộ hỏng.
- Public: `/`, `/san-pham`, `/y-te`, `/thu-y`, `/tim-kiem`, `/so-sanh`, `/yeu-cau-bao-gia`, `/yeu-cau-bao-gia/chi-tiet`.
- Product detail: 11 sản phẩm đang publish thuộc siêu âm, X-quang, xét nghiệm, nội soi, monitor, gây mê và thú y đều trả `200`. Sản phẩm dao mổ điện `SUR-07` đang ở trạng thái unavailable/archived nên trả `404` theo publish policy.
- Taxonomy: 10 category routes, 7 brand routes và 11 specialty routes. Hai route thiếu trước đó (`/chuyen-khoa/nha-khoa`, `/chuyen-khoa/phuc-hoi-chuc-nang`) đã được sửa và trả `200`.
- Auth: `/dang-nhap`, `/dang-ky`, `/quen-mat-khau`, `/dat-lai-mat-khau`, `/xac-minh-email`, cùng các query state required, expired, locked, unverified, success và error.
- User Portal: guest và expired session được xác nhận redirect đúng về login. Authenticated portal chưa thể runtime-test do thiếu database production.
- Admin, RBAC, CRM, CMS: guest và expired session được xác nhận redirect đúng; private APIs trả `401`. Authenticated routes chưa thể runtime-test do thiếu database production.
- Contact, Knowledge và Projects hiện là các section `/#contact`, `/#knowledge`, `/#projects`; không có route riêng.
- API smoke test: products/product detail/site settings trả `200`; admin/CRM/portal guest trả `401`; cross-site unsafe request trả `403`; quote creation khi thiếu database trả `503` rõ ràng.
- Not Found: `/404` và URL không tồn tại trả đúng HTTP `404` với giao diện điều hướng phục hồi.

## Components Tested

- Header desktop/mobile, mega menu, global search dialog, mobile navigation dialog.
- Footer, breadcrumb, CTA, buttons, inputs, selects, textareas, status badges và pagination.
- Catalog cards, filter sidebar/drawer, mobile filter actions, compare tray và compare picker.
- Product gallery, zoom dialog, content navigation, features, configurations, specifications, documents, related products và sticky mobile CTA.
- Quote form, product picker, upload progress, validation, submit error và success state.
- Auth forms và các state unverified, locked, expired, loading, success.
- Portal dashboard, favorites, compare, quotes, documents, profile, security, mobile drawer và dialogs (source/state audit; authenticated runtime blocked).
- Admin sidebar/topbar, dashboard, tables, editors, CMS/media dialogs, users, roles, permissions và CRM layouts (source/state audit; authenticated runtime blocked).

## Responsive Results

- CSS/layout audit đã bao phủ các target 375, 390, 430, 768, 1024, 1280, 1440 và 1920 px bằng breakpoint, fluid sizing và structural review.
- Mobile không chỉ đổi sang `flex-column`: catalog dùng filter drawer và sticky action; portal/CRM/admin tables có responsive columns hoặc card/list alternative; admin editor thay đổi density và action priority; product detail có sticky CTA và scrollable content navigation.
- Dialog/drawer dùng viewport-bounded width, `100dvh`/`100svh`, internal scrolling và safe-area padding. Table wrappers có controlled overflow hoặc mobile transformation.
- Touch targets có coarse-pointer rules; form fields dùng 16 px trên mobile để tránh iOS zoom.
- Không thể xác nhận trực quan horizontal overflow, crop, sticky overlap và drawer scrolling tại từng kích thước vì môi trường không có browser session. Đây là release blocker cho final visual sign-off.

## Accessibility Results

- Generated public HTML có đúng một H1 trên mỗi route được crawl.
- Không phát hiện duplicate `id`, ARIA reference bị thiếu, ảnh thiếu `alt`, ảnh thiếu intrinsic dimensions hoặc link `target="_blank"` thiếu `rel` trong generated HTML cuối.
- Form controls có label; validation/error regions dùng `aria-live`, `aria-describedby` và `aria-errormessage` phù hợp.
- Có skip link/main landmark, focus-visible styles, reduced-motion rules, forced-colors support và coarse-pointer adaptations.
- Hidden alternate portal/admin/quote states đã đổi từ H1 sang H2 để giữ heading hierarchy ổn định.
- Chưa chạy axe, screen reader, keyboard-only end-to-end hoặc VoiceOver/NVDA; cần thực hiện trước production.

## Browser Results

- Production SSR đã được smoke-test qua HTTP với Node.js v26.
- Chrome: chưa kiểm thử trực quan — không có browser session trong môi trường.
- Safari: chưa kiểm thử trực quan — không có Safari session. Cần ưu tiên dialog, `:has()`, dynamic viewport units, sticky actions và `allow-discrete` fallback.
- Edge: chưa kiểm thử trực quan — không có browser session.
- Firefox: chưa kiểm thử trực quan — không có browser session.
- Browser-control runtime trả về danh sách browser rỗng; không dùng kết quả giả lập để thay thế browser sign-off.

## Bugs Fixed

- Thêm canonical, robots, Open Graph, Twitter metadata, social image và giới hạn SEO description.
- Thêm trang 404 thực với HTTP status đúng và `noindex`.
- Sửa nhiều H1 trong các alternate UI state của portal, quote và admin.
- Sửa hai specialty route public bị 404.
- Sửa fallback merge làm product detail mất gallery, feature, configuration, specification và document khi production DB chưa có dữ liệu section.
- Sửa TypeScript contracts cho CRM detail records và ProductDetail fallback.
- Xóa các `getStaticPaths()` bị bỏ qua sau khi chuyển sang SSR; dynamic admin routes tra params an toàn và fallback về 404.
- Thay Zod API deprecated để `astro check` sạch hoàn toàn.
- Bổ sung `type` cho dialog buttons, `rel="noopener noreferrer"`, intrinsic image dimensions và disabled state cho admin buttons.
- Chuyển upload progress animation từ `width` sang `transform`; loại layout transition không cần thiết. Impeccable detector cuối trả 0 finding.
- Loại link `href="#"` giả trong media usage, tên bệnh viện giả trong editor và public address placeholder.
- Footer và Admin topbar được sửa link/nội dung placeholder không phù hợp.

## Known Issues

- **Đã xử lý trong Phase 21 — Database:** local PostgreSQL `DATABASE_URL` đã được cấu hình, migration/seed đồng bộ và product/quote API đã được kiểm thử end-to-end. Auth/RBAC browser sign-off vẫn là phạm vi riêng.
- **P0 — CRM integration:** CRM pages vẫn render từ `src/data/crm.ts`; nhiều action dùng `data-demo-action`/`data-demo-form`. CRM APIs hiện dùng workflow SQLite auth khác với Prisma session middleware, nên cần hợp nhất auth/data path trước production.
- **P0 — Production content:** catalog/CRM vẫn có dữ liệu được ghi rõ là “minh họa”; cần thay bằng sản phẩm, model, hồ sơ, tài liệu và khách hàng đã xác thực. Hotline, email, Zalo và thông tin doanh nghiệp cần owner xác nhận.
- **P1 — Browser QA:** chưa có visual regression hoặc manual sign-off ở 8 viewport và 4 browser yêu cầu.
- **P1 — Automated QA:** server suite hiện có 17 test và database integration có 1 test. Chưa có axe, visual regression hoặc browser E2E suite đầy đủ.
- **P1 — Edge fixtures:** code hỗ trợ section trống, một/nhiều ảnh, không giá, không document và long text; fixture 10 ảnh/100 specifications chưa được xác nhận trực quan trong browser.
- **P2 — Content routes:** Contact, Knowledge và Projects là homepage sections, không phải standalone pages. Giữ nguyên vì Phase 20 không cho thêm feature mới.

## Performance Notes

- Production output khoảng 3.6 MB; public image assets khoảng 1.0 MB.
- 24 responsive WebP variants được generate; ảnh nguồn lớn nhất khoảng 100 KB. Hero preload/eager, ảnh bên dưới lazy-load và có width/height để giảm CLS.
- Client assets lớn nhất: Phosphor WOFF2 khoảng 144 KB, CSS chunk lớn nhất khoảng 48 KB, page JS chunk lớn nhất khoảng 24 KB.
- Be Vietnam Pro dùng local WOFF2 với `font-display: swap`; không có bundle-heavy client UI framework.
- Product list có pagination service; catalog/CRM server repositories đã có page size limit. Cần đo Lighthouse/Web Vitals trên hạ tầng production thật.

## Remaining Production Tasks

1. **P0:** cấp PostgreSQL production secret/backup policy, thay dữ liệu seed bằng dữ liệu đã duyệt, vô hiệu hóa demo users và xác minh session lifecycle trên staging.
2. **P0:** hợp nhất CRM vào cùng Prisma auth/RBAC/data layer; thay mọi demo action và static CRM fixture bằng API thật hoặc disabled/empty state rõ ràng.
3. **P0:** import và duyệt dữ liệu sản phẩm/taxonomy/document chính thức; xác minh toàn bộ thông tin liên hệ và doanh nghiệp.
4. **P1:** chạy Chrome, Safari, Edge và Firefox ở 375/390/430/768/1024/1280/1440/1920; lưu visual regression evidence.
5. **P1:** thêm lint, unit/integration tests, E2E auth/RBAC, axe, keyboard và screen-reader checks.
6. **P1:** cấu hình email verification/reset, upload storage, monitoring/error tracking, backup và secret management.
7. **P2:** đo Lighthouse/Web Vitals và cân nhắc subset icon font nếu performance budget yêu cầu.

## Final Verification

- `npm run build`: **PASS** — 0 errors, 0 warnings, 0 hints.
- `npm run check`: **PASS** — TypeScript/Astro diagnostics sạch.
- Broken imports/routes: **PASS** cho production build và public linked-route crawl.
- Impeccable detector: **PASS** — 0 findings.
- `npm run test:server`: **NOT EFFECTIVE** — 0 tests discovered.
- `npm run lint`: **NOT CONFIGURED**.

**Production readiness verdict:** **NO-GO** cho production hiện tại. Sau khi xử lý ba P0 và hoàn tất browser/accessibility sign-off, UI có thể chuyển từ staging candidate sang production candidate.
