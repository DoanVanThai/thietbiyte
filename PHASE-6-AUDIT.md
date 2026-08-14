# PHASE 6 — SEARCH + COMPARE + FAVORITES UI AUDIT

Ngày hoàn thành: 13/08/2026

## Phạm vi

Phase 6 chỉ triển khai Global Search, Search Results, Product Compare và Favorites UI foundation. Không triển khai Authentication, User Portal hoặc Phase 7.

## Kết quả chính

- Global Search mở từ header, mobile search action hoặc `⌘ K` / `Ctrl K`.
- Search overlay hỗ trợ `↑`, `↓`, `Enter`, `Esc`, recent searches, active descendant và native dialog focus trap.
- Search index gồm Product, Model, Brand, Category, Specialty, Application, Specification và Knowledge.
- `/tim-kiem?q=...` hiển thị nhóm Sản phẩm, Danh mục, Thương hiệu và Bài viết; chuyên khoa được xếp trong nhóm Danh mục với nhãn riêng.
- Search Results chỉ hiển thị filter khi có từ 7 kết quả; query chỉ được highlight trong title/meta, không highlight toàn đoạn.
- Compare lưu theo session, giới hạn 4 sản phẩm và có compact tray dùng chung trên toàn website.
- `/so-sanh` dùng product-as-column/specification-as-row trên desktop; mobile chỉ hiển thị tối đa 2 sản phẩm mỗi lần.
- Favorites dùng cùng một affordance trên Product Card, Catalog Card, Search Result và Product Detail.
- Khi chưa đăng nhập, Save mở prompt nhẹ và giữ nguyên trang; khi hệ thống auth tương lai đặt `tlm-authenticated=true`, lưu diễn ra ngay.

## Search states

- Loading: skeleton theo hình dạng result row qua `?state=loading`.
- Empty: nêu rõ query, gợi ý kiểm tra model/tên hãng/xóa filter và CTA `Nhận tư vấn tìm thiết bị`.
- Error/offline: thông báo nguyên nhân, cách thử lại và kênh gọi tư vấn.
- Recent searches: lưu tối đa 5 từ khóa, có hành động xóa.
- Global offline notice: phản ánh `navigator.onLine` và thông báo khi kết nối được phục hồi.

## Compare states

- Empty: gợi ý 4 sản phẩm và link về catalog.
- 1 sản phẩm: toggle differences bị disabled; desktop và mobile vẫn đọc được.
- 2 sản phẩm: mobile hiển thị hai cột và specification groups theo chiều dọc.
- 3–4 sản phẩm: desktop mở rộng theo cột; mobile dùng selector ngang để đổi hai sản phẩm đang xem.
- Full: chặn sản phẩm thứ 5, disable Add Product và thông báo đã chọn tối đa.
- Missing specification: hiển thị `Chưa có dữ liệu` với treatment giảm cấp.
- Different category: hiển thị notice rằng một số thông số không đối chiếu trực tiếp.
- Differences: hàng có giá trị khác nhau được highlight nhẹ; `Chỉ xem điểm khác nhau` ẩn hàng giống nhau.

## Favorites states

- Logged out: native dialog giải thích lợi ích, có `Đăng nhập` và `Để sau`; không auto-redirect.
- Saved: `aria-pressed`, selected visual và toast `Đã lưu sản phẩm`.
- Unsaved: cập nhật lại label và toast.
- Error: storage failure có thông báo cụ thể và hướng thử lại.
- Storage contract được tách khỏi Authentication; Phase 6 không tạo form hoặc session đăng nhập.

## Mobile và readability audit

- Search overlay chuyển thành full-height surface dưới 600px.
- Touch target chính tối thiểu 44px.
- Compare không nhét 4 cột vào mobile; chỉ hai sản phẩm active.
- Specification group và label sticky theo chiều dọc trên mobile.
- Desktop table dùng semantic `table`, `th scope=col/row/colgroup`, sticky header và sticky criteria column.
- Compare tray thu gọn được trên màn hình nhỏ và có safe-area bottom padding.
- Density dùng divider, row và whitespace; không card hóa từng thông số.
- Action hierarchy: Add Product là secondary, `So sánh` là primary, remove là icon utility.

## Audit health score

| Dimension | Score | Finding |
| --- | ---: | --- |
| Accessibility | 3/4 | Native dialogs, labels, focus-visible, keyboard search and semantic table; browser traversal chưa chạy được |
| Performance | 4/4 | Static index nhỏ, lazy images, không thêm dependency, state update cục bộ |
| Responsive | 3/4 | Search và compare compose lại cho mobile; chưa có screenshot regression từ browser thật |
| Theming | 4/4 | Dùng tokens, Be Vietnam Pro và semantic state colors hiện có |
| Anti-patterns | 4/4 | Detector không phát hiện gradient text, glass, over-rounding, ghost card hoặc decorative grid |
| **Tổng** | **18/20** | **Excellent** |

## Verification

- `npm run build`: đạt.
- Astro diagnostics: 34 files, 0 errors, 0 warnings, 0 hints.
- Static generation: 46 pages, gồm `/tim-kiem` và `/so-sanh`.
- HTTP 200: search có kết quả, search không kết quả, compare, catalog và Product Detail.
- Search index: 12 sản phẩm, 10 danh mục, 6 thương hiệu có sản phẩm, 9 chuyên khoa và 4 bài viết.
- Compare dataset: 12 sản phẩm; mỗi sản phẩm có 8–29 specification rows để kiểm thử dữ liệu thiếu/dày.
- Impeccable detector: không có finding trên các file Phase 6.
- Source coverage xác nhận keyboard commands, 4-product limit, mobile selector, missing specification, loading/error/offline và favorite states.

## Giới hạn

- Browser điều khiển tích hợp không có browser session trong môi trường hiện tại, nên chưa thể chạy screenshot-based visual regression hoặc thao tác bàn phím/touch bằng browser thật. Build output, HTTP routes, semantic markup, responsive rules và state logic đã được kiểm tra tĩnh.
- Favorites chỉ là UI foundation. Việc xác thực và đồng bộ server thuộc phase sau; Phase 6 không triển khai Authentication.
- Search hiện chạy trên static catalog/content index trong trình duyệt; khi có backend, cần thay data source nhưng giữ nguyên interaction contract.
- Giá, ảnh và thông số vẫn là dữ liệu minh họa hiện có của catalog.

## Kết luận

Phase 6 hoàn thành đúng phạm vi. Dừng tại đây và chờ `RUN PHASE 7`.
