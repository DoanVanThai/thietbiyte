# PHASE 5 — PRODUCT DETAIL UI AUDIT

Ngày hoàn thành: 13/08/2026

## Phạm vi

Phase 5 chỉ triển khai Product Detail UI cho THIÊN LỘC GROUP. Không triển khai Phase 6, User Portal, Admin hoặc backend gửi báo giá.

## Design read

Product Detail được đọc như một tài liệu kỹ thuật B2B cho bác sĩ, kỹ thuật viên và bộ phận mua sắm. Giao diện cần giúp người dùng nhận diện thiết bị, đối chiếu cấu hình, đọc thông số dài và chuyển sang yêu cầu báo giá mà không bị marketing noise cản trở.

- Design variance: 4/10.
- Motion intensity: 2/10.
- Visual density: 7/10.
- Giữ nguyên Be Vietnam Pro, semantic color tokens, spacing, radius, focus và button language từ Design System hiện có.
- Không tạo palette hoặc component language mới.

## Routes và data model

Route động mới:

- `/san-pham/[slug]`

Static build tạo Product Detail cho toàn bộ 12 sản phẩm hiện có trong catalog.

`src/data/product-details.ts` hỗ trợ:

- `SHOW_PRICE`, `CONTACT`, `REQUEST_QUOTE`.
- Gallery image/video tùy dữ liệu.
- Manufacturing year, condition và availability tùy chọn.
- Overview, features, configurations và specification groups.
- Applications, documents access state, warranty và FAQ.
- Schema dùng chung cho siêu âm, X-quang, xét nghiệm, nội soi, dao mổ điện và thiết bị thú y.
- Trường không có dữ liệu không render.
- Restricted document bị lọc khỏi public UI.

SonoPort 8 có bộ dữ liệu dài để kiểm thử layout. Nội dung được đánh dấu minh họa và không được xem là claim kỹ thuật hoặc chính sách chính thức.

## Components

### Components mới

- `ProductDetailPage.astro`: composition tổng thể, section navigation, CTA, structured content và interactive state.
- `ProductGallery.astro`: ảnh chính, thumbnail, previous/next, zoom dialog và video conditional.
- `ProductSpecifications.astro`: specification groups, table, expand, collapse và copy.
- `product-detail.css`: responsive composition và technical content styles.

### Components tiếp tục dùng chung

- `BaseLayout.astro`
- `Header.astro`
- `Footer.astro`
- `Breadcrumb.astro`
- `CatalogProductCard.astro`
- Semantic tokens trong `global.css`

`CatalogProductCard` được mở rộng với heading level tùy ngữ cảnh và link thẳng sang Product Detail. Catalog không còn chặn CTA bằng thông báo Phase 4.

## Information hierarchy

1. Semantic breadcrumb.
2. Product gallery 45% và product information 55% trên desktop.
3. Category, descriptor, một H1, full product name và brand/model/origin.
4. Price state và hai CTA chính.
5. Quick information dạng dải compact.
6. Sticky content navigation.
7. Overview, features, configuration, specifications, applications, documents, warranty và FAQ.
8. Related products.

Hero không có card bọc toàn khối. H1 được giới hạn 48px trên desktop và có wrap cho model dài.

## Gallery audit

- Main image giữ aspect ratio 4:3.
- Thumbnail là button thực, có `aria-pressed`.
- Previous, next và zoom đều dùng Phosphor icons với accessible name.
- Zoom dùng native dialog.
- Video chỉ render khi dataset có video; không có placeholder video trên SonoPort 8.
- Ảnh đầu tiên eager/fetch priority; ảnh thumbnail và ảnh dưới fold lazy-load.
- Mọi ảnh có alt mô tả và được ghi rõ là minh họa khi phù hợp.

## CTA audit

- Primary: Nhận báo giá.
- Secondary: Gọi tư vấn.
- Zalo, Save và Compare ở hàng action nhẹ hơn.
- Không có năm primary buttons cạnh tranh.
- Không render `0đ` hoặc `0₫` khi giá không tồn tại.
- `CONTACT` hiển thị “Liên hệ để nhận giá”.
- Mobile sticky CTA gồm Gọi, Zalo và Nhận báo giá; content có bottom padding theo safe-area nên không bị che.
- Save và Compare dùng chung session storage key với Catalog; compare giới hạn bốn sản phẩm.

## Technical content audit

### Configuration

- Tách máy chính, đầu dò, phụ kiện và option mua thêm.
- Dùng structured list thay vì raw HTML.
- Không dùng bốn card lớn hoặc icon cho mọi dòng.

### Specifications

- Có tám nhóm và 30 dòng dữ liệu trên SonoPort 8.
- Table dùng cột “Thông số” và “Giá trị”, semantic `th` và `scope`.
- Có Mở tất cả, Thu gọn và Sao chép thông số.
- `table-layout: fixed`, wrap tại từ dài và giá trị dài.
- Trên màn hình nhỏ hơn 600px, mỗi row chuyển thành cặp label/value theo chiều dọc, không yêu cầu kéo ngang.

### Documents

- Document row có PDF icon, tên, format/dung lượng, access state và action.
- Public document chưa có file hiển thị “Chờ cập nhật file”, không tạo dead download.
- Login-required document chuyển sang trang đăng nhập.
- Restricted document không được đưa vào public markup.

### Warranty

- Các trường period, coverage, installation và technical support đều optional.
- UI chỉ render trường có dữ liệu.
- Nội dung minh họa được ghi rõ, không tự biến thành chính sách chính thức.

## SEO và accessibility

- Mỗi Product Detail có đúng một H1.
- Breadcrumb dùng navigation semantic.
- Heading hierarchy theo H1, section H2 và item H3.
- Product JSON-LD gồm Product, Brand, model, category, image và additional properties.
- Main image có width/height để giảm layout shift.
- Controls có accessible name, focus style, touch target và keyboard behavior.
- Sticky navigation dùng anchor thật và IntersectionObserver để phản ánh section đang đọc.
- Reduced motion được giữ cho icon transitions.
- Không dùng placeholder thay label.

## Responsive matrix

| Viewport | Kết quả thiết kế |
| --- | --- |
| 375px | Hero một cột, CTA full-width, spec row dạng dọc, related một cột, mobile sticky CTA có safe-area |
| 390px | Model dài wrap, thumbnail cuộn cục bộ, document action xuống dòng, không tràn ngang |
| 768px | Hero một cột, sticky section tabs cuộn ngang, bảng fixed-layout có wrap, CTA bottom |
| 1024px | Hero 48/52, quick information hai cột, related hai cột |
| 1280px | Hero 45/55, content width 1120px, related bốn cột |
| 1440px | Giữ container 1280px để bảo toàn line length và density |
| 1920px | Không kéo giãn bảng hoặc prose; khoảng trống nằm ngoài container |

Breakpoints được dùng theo composition: 1100px, 820px và 600px. Không tạo rule riêng tùy hứng cho từng thiết bị.

## Final Taste audit

- **Readability:** body 16px, technical metadata tối thiểu 13px, prose tối đa khoảng 68–72ch.
- **Technical hierarchy:** identity, price, configuration và specifications có vai trò thị giác riêng.
- **Unnecessary cards:** hero, features, configurations, documents, warranty và FAQ dùng borders/spacing; card chỉ giữ cho related products.
- **CTA:** một primary, một secondary, utility actions giảm cấp rõ ràng.
- **Tables:** semantic, grouped, collapsible, copyable và mobile-safe.
- **Spacing:** hero, editorial overview, data sections và related products có rhythm khác nhau.
- **Image composition:** gallery chiếm gần nửa hero, controls không che vùng ảnh quan trọng quá mức.
- **Responsive:** layout được compose lại, không chỉ thu nhỏ desktop.
- **Anti-template:** không gradient, glass, glow, giant heading, excessive badge, rounded card lớn hoặc fade-up hàng loạt.

## Verification

- `npm run build`: đạt.
- Astro diagnostics: 30 files, 0 errors, 0 warnings, 0 hints.
- Static generation: 45 pages, gồm 12 Product Detail routes.
- HTTP 200: SonoPort 8, sản phẩm xét nghiệm, sản phẩm thú y và catalog.
- Internal link scan: 2.749 internal links, 0 missing targets.
- SonoPort 8 markup: 1 H1, 8 specification groups, 30 spec rows, 2 document rows, 4 related products và 1 Product JSON-LD.
- SonoPort 8 không có video element vì dataset không có video.
- Source scan: không có gradient, glassmorphism, backdrop blur, shadow/radius quá khổ, 12px text, em dash/en dash hoặc zero-price pattern trong Phase 5 source.

## Giới hạn

- Browser điều khiển tích hợp không có browser session trong môi trường hiện tại. Vì vậy chưa có screenshot-based visual regression tại bảy viewport; static output, responsive rules và markup đã được audit.
- Catalogue PDF và tài liệu kỹ thuật chưa có file thật nên UI không tạo link tải giả.
- Nội dung kỹ thuật, ảnh, giá, tồn kho, chính sách và tài liệu phải được thay bằng dữ liệu đã duyệt từ Admin/backend.
- Yêu cầu báo giá hiện dùng email và hotline hiện có; chưa có workflow backend hoặc CRM.

## Kết luận

Phase 5 hoàn thành đúng phạm vi. Dừng tại đây và chờ `RUN PHASE 6`.
