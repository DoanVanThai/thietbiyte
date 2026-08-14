# PHASE 4 — PRODUCT CATALOG UI AUDIT

Ngày hoàn thành: 13/08/2026

## Phạm vi

Phase 4 chỉ triển khai giao diện Product Catalog, Category, Brand, Specialty, Search và Filter. Không triển khai Product Detail, User Portal, Admin hoặc Phase 5.

## Design direction đã giữ

Phase này tiếp tục Design System của Thiên Lộc Group, không tạo ngôn ngữ giao diện mới.

- Visual direction: clinical, professional, technical, trustworthy, B2B.
- Design dials: variance 4/10, motion 2/10, density 7/10.
- Ưu tiên ảnh sản phẩm, tên thiết bị, hãng/model và thông số; phần trang trí được giữ ở mức tối thiểu.
- Listing header nhỏ gọn, không dùng giant hero.
- Filter dùng cấu trúc quen thuộc, có phân nhóm, thu gọn, tìm trong hãng và xem thêm.
- Không dùng gradient, glassmorphism, glow, shadow lớn, radius quá khổ hoặc animation fade-up hàng loạt.
- Không dùng card cho mọi khối nội dung. Context navigation, filter, active filters, knowledge links và pagination có cấu trúc thị giác riêng.
- Motion chỉ dùng cho phản hồi tương tác và skeleton; tôn trọng `prefers-reduced-motion`.
- Mọi nội dung mẫu chưa được Admin cung cấp đều được ghi rõ là minh họa, không tạo claim về hãng.

## Routes

- `/san-pham`
- `/y-te`
- `/thu-y`
- `/tim-kiem`
- `/danh-muc/[slug]`
- `/thuong-hieu/[slug]`
- `/chuyen-khoa/[slug]`

Static build hiện tạo 33 trang, gồm 10 danh mục, 7 thương hiệu và 11 chuyên khoa.

## Components

### Foundation mới

- `src/data/catalog.ts`: dữ liệu UI mẫu, cấu hình route, filter options và catalog navigation.
- `src/components/CatalogPage.astro`: shell dùng chung cho mọi listing route và toàn bộ URL state.
- `src/components/CatalogFilters.astro`: filter rail desktop và nội dung dùng lại trong mobile drawer.
- `src/components/CatalogToolbar.astro`: số kết quả, active filters, sort, view mode và trạng thái compare.
- `src/components/CatalogProductCard.astro`: product card/grid row và các trạng thái sản phẩm.
- `src/components/CatalogPagination.astro`: phân trang rõ ràng, không dùng infinite scroll.
- `src/components/CatalogSkeleton.astro`: loading state bám đúng cấu trúc product card.
- `src/components/Breadcrumb.astro`: breadcrumb semantic dùng chung.
- `src/styles/catalog.css`: layout, density, state và responsive riêng của catalog trên token sẵn có.

### Components tiếp tục dùng chung

- `BaseLayout.astro`
- `Header.astro`
- `Footer.astro`
- `SearchBox.astro`
- Global typography, semantic colors, spacing, radius, shadow và focus tokens trong `global.css`.

## Product and search behavior

- Tìm theo tên, model, hãng, danh mục, chuyên khoa và ứng dụng.
- Search có label hiển thị, clear, loading, empty results và query lưu trong URL.
- Filter state được đồng bộ vào URL để giữ được ngữ cảnh khi phân trang hoặc chia sẻ liên kết.
- Active filters nhỏ gọn, xóa riêng từng filter hoặc xóa tất cả.
- Desktop dùng filter rail 260px; mobile dùng native dialog drawer có Apply và Reset.
- Sort hỗ trợ Nổi bật, Mới nhất và Tên A–Z. Hai lựa chọn theo giá được disable và ghi rõ khi catalog chưa có giá public đáng tin cậy.
- Grid và list view dùng cùng một nguồn dữ liệu. List view ưu tiên quét nhanh thông số.
- Pagination 6 sản phẩm mỗi trang; không dùng infinite scroll.
- Save và Compare có trạng thái `aria-pressed`, lưu trong `sessionStorage`; compare giới hạn 4 sản phẩm.
- Product Detail chưa thuộc phạm vi Phase 4, nên CTA chi tiết chỉ thông báo trạng thái thay vì tạo route giả.

## Product card states

- Default
- Hover
- Saved
- Compare selected
- Unavailable
- Contact price
- Request consultation
- Loading skeleton
- Empty results

## Accessibility

- Semantic heading, breadcrumb navigation, form label, fieldset/legend, button và dialog.
- Focus visible thống nhất với Design System.
- Touch target tối thiểu 44px tại các action quan trọng trên màn hình cảm ứng.
- Không dùng placeholder thay label.
- Search result count dùng live region.
- Save/Compare dùng `aria-pressed`; drawer có accessible name.
- Skeleton được ẩn khỏi accessibility tree và trạng thái loading có thông báo riêng.
- Có hỗ trợ bàn phím cho form, sort, view mode, dialog và pagination.
- Tôn trọng reduced motion.

## Responsive audit

| Viewport | Hành vi chính |
| --- | --- |
| 375px | 1 cột sản phẩm, drawer toàn chiều rộng, active filters cuộn cục bộ, control cao tối thiểu 44px |
| 390px | 1 cột, tên dài được wrap, search và CTA không gây tràn ngang |
| 768px | 2 cột sản phẩm, filter drawer, context navigation 2 cột |
| 1024px | filter rail desktop, 2 cột sản phẩm, toolbar đầy đủ |
| 1280px | filter rail và 3 cột sản phẩm trong container giới hạn |
| 1440px | 3 cột, tăng khoảng thở ngoài container thay vì kéo card quá rộng |
| 1920px | giữ max-width 1280px để bảo toàn density và độ dài dòng |

Các breakpoint triển khai là 1180px, 900px và 680px. Chúng bao phủ các viewport yêu cầu mà không tạo CSS riêng tùy hứng cho từng thiết bị.

## Taste audit cuối

- **Hierarchy:** breadcrumb → H1/description → context navigation → search → filter/results → related knowledge.
- **Typography:** H1 listing cố định ở 30–36px theo viewport; product name nổi bật hơn metadata; không có text 12px cho dữ liệu quan trọng.
- **Spacing:** dùng spacing tokens và thay đổi rhythm theo chức năng, không áp cùng một section padding cho mọi khối.
- **Density:** filter và result tools đủ dày cho nghiệp vụ B2B nhưng vẫn có khoảng trắng để quét nhanh.
- **Card repetition:** chỉ product result dùng card pattern; không bọc mọi section trong card.
- **Image prominence:** ảnh chiếm vùng trên rõ ràng ở grid và cột đầu ở list.
- **Navigation:** Y tế và Thú y dùng context navigation có phân cấp; Thú y chỉ có cue nhẹ bằng nội dung, không chuyển sang phong cách pet shop.
- **Usability:** progressive disclosure, URL state, filter drawer, no-results recovery, pagination và price-sort guard.
- **Responsive:** sidebar không rơi xuống cuối trang; drawer và product grid thay đổi đúng vai trò theo viewport.

## Verification

- `npm run build`: đạt.
- Astro diagnostics: 25 files, 0 errors, 0 warnings, 0 hints.
- Static generation: 33 pages.
- Internal link scan: 2.232 internal links, 0 missing targets.
- Representative route HTTP checks: `/`, `/san-pham`, `/y-te`, `/thu-y`, `/danh-muc/may-sieu-am`, `/thuong-hieu/chison`, `/thuong-hieu/wondfo`, `/chuyen-khoa/san-phu-khoa`, `/tim-kiem?q=Mindray` đều trả HTTP 200.
- Source anti-pattern scan: không có gradient, glassmorphism, backdrop blur, `shadow-xl`, `shadow-2xl`, `rounded-2xl`, `rounded-3xl`, em dash/en dash hoặc font-size 12px trong `src`.

## Giới hạn và phần chờ dữ liệu thật

- Phiên điều khiển browser tích hợp không khả dụng trong môi trường hiện tại, nên chưa có screenshot render trực tiếp tại bảy viewport. Responsive rules và static output đã được audit; cần chạy thêm visual regression khi browser session sẵn sàng.
- Image generation cho mockup catalog gặp lỗi kết nối dịch vụ sau hai lần thử. Không có asset tạo dở hoặc asset thay thế ngoài phạm vi được thêm vào project.
- Tên sản phẩm, model, logo, xuất xứ, giá, trạng thái kho, tài liệu và nội dung liên quan cần được thay bằng dữ liệu thật từ Admin/backend.
- Autocomplete có foundation trong search state nhưng chưa nối backend suggestion API.
- Compare detail, Product Detail, User Portal và Admin cố ý chưa triển khai.

## Kết luận

Phase 4 hoàn thành đúng phạm vi. Dừng tại đây và chờ `RUN PHASE 5`.
