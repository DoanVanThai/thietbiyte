# PUBLIC UI REGRESSION AUDIT

Ngày kiểm tra: 13/08/2026

## Phạm vi

Audit và sửa toàn bộ public website hiện có:

- Homepage.
- Header, navigation và footer dùng chung.
- Product Catalog.
- Y tế và Thú y catalog.
- Category, Brand và Specialty pages.
- Search, Filter, Sort, Grid/List, Empty và Loading states.
- Toàn bộ 12 Product Detail pages.

Không triển khai Phase 6, User Portal hoặc Admin.

## Vấn đề từ screenshot

Ảnh người dùng cung cấp cho thấy ba lỗi layout chính trên catalog:

1. Context navigation dùng lưới năm cột dù `/san-pham` chỉ có bốn mục, tạo cột trống và đường border kéo dài.
2. Search catalog bị giới hạn 960px trong container 1280px nên không cùng trục phải với navigation và results.
3. Header dùng cột logo và gap quá rộng, làm search lệch xa khỏi wordmark.

Các lỗi này đã được sửa ở shared CSS và component, không vá riêng route `/san-pham`.

## Systemic fixes

### Shared shell

- Header desktop đổi từ cột logo 210px/gap 32px thành 180px/gap 24px.
- Header 821–1100px dùng cột 156px và gap 16px để tránh search bị ép.
- Mobile menu giảm shadow xuống token nhẹ của Design System.
- Container vẫn giới hạn 1280px để không kéo giãn giao diện trên 1440/1920px.

### Catalog family

- Context navigation nhận số cột theo dữ liệu:
  - `/san-pham`: 4 mục / 4 cột.
  - `/y-te`: 10 mục / 5 cột.
  - `/thu-y`: 9 mục / 3 cột.
- Tablet dùng hai cột cho Y tế và ba cột cho Thú y; mobile chuyển thành horizontal navigation có scroll cục bộ.
- Search catalog chiếm toàn container và dùng input wrapper riêng, nên icon/clear không phụ thuộc chiều rộng button.
- Search button có cột ổn định 132px trên desktop, full-width trên mobile.
- Sort desktop giới hạn 206px, mobile 180px; option dài không còn kéo toolbar lệch.
- Mobile toolbar không còn absolute positioning:
  - Hàng 1: Filter và Sort.
  - Hàng 2: Result count và View mode.
  - Hàng 3: Active filters.
- Breakpoint product grid 3→2 cột chuyển tại 1240px để tránh card hẹp ở vùng 1180–1240px.

### Homepage

- Header alignment dùng shared grid mới.
- Bảy solution items không còn tạo hàng cuối một card lẻ: item cuối dùng full-width editorial row trên desktop.
- Tablet trả solution item cuối về grid hai cột bình thường để giữ số hàng cân.
- Knowledge section có bốn article items, tạo lưới 2×2 cân bằng.
- Category mosaic, product row, brand grid, medical list và specialty list đã được giữ vì số lượng dữ liệu đang khớp cấu trúc grid.

### Product Detail family

- Hero chuyển sang một cột tại 960px thay vì giữ split đến 820px.
- Quick information dùng số cột theo số trường dữ liệu; sản phẩm chỉ có một thông tin không còn chiếm 1/4 chiều rộng.
- Overview không giữ cột ảnh rỗng khi sản phẩm không có ảnh thứ hai.
- Feature list ba mục cho item cuối span full-width có giới hạn dòng; bốn mục vẫn là lưới 2×2.
- Application list dùng một, hai hoặc ba cột theo lượng dữ liệu thật.
- Specification table vẫn chuyển thành label/value stack ở dưới 600px.
- Mobile sticky CTA và safe-area padding được giữ nguyên.

## Responsive geometry

Catalog product widths sau sửa, chưa tính border:

| Viewport | Container | Filter | Product grid | Card width xấp xỉ |
| --- | ---: | ---: | ---: | ---: |
| 375 | 343px | Drawer | 1 cột | 343px |
| 390 | 358px | Drawer | 1 cột | 358px |
| 768 | 728px | Drawer | 2 cột | 354px |
| 1024 | 976px | 260px | 2 cột | 332px |
| 1280 | 1232px | 260px | 3 cột | 300px |
| 1440 | 1280px | 260px | 3 cột | 316px |
| 1920 | 1280px | 260px | 3 cột | 316px |

Product Detail tại 1024px giữ split khoảng 453/491px. Từ 960px trở xuống gallery và information chuyển thành một cột.

## Accessibility and token verification

- Foreground/background contrast: 15.95:1.
- Muted/background contrast: 7.75:1.
- Primary/surface contrast: 7.11:1.
- Primary foreground/primary contrast: 6.81:1.
- Tất cả đều vượt WCAG AA cho body text.
- 45 pages đều có đúng một H1.
- Không có duplicate ID.
- Tất cả pages có `main#main-content`.
- Không có image thiếu alt, width hoặc height.
- Không có empty link hoặc broken internal target.
- 12 Product Detail pages đều có một Product JSON-LD.

## Taste and anti-pattern audit

- Không có gradient, glassmorphism, backdrop blur hoặc glow.
- Không có `shadow-xl`, `shadow-2xl`, radius 2xl/3xl hoặc shadow blur lớn.
- Không có 12px technical text.
- Không có zero-price pattern.
- Không có giant listing hero.
- Context navigation, search, results và sidebar nay cùng trục container.
- Product cards chỉ dùng ở catalog/related products; technical sections tiếp tục dùng divider và spacing.
- Homepage solution row cuối là editorial composition, không thêm card giả để lấp chỗ trống.

## Automated verification

- `npm run build`: đạt.
- Astro diagnostics: 0 errors, 0 warnings, 0 hints.
- Static pages: 45.
- HTTP routes checked: 45/45 trả 200.
- Internal links: không có target thiếu.
- Source scan: không có TODO/FIXME, console debug, Phase 4 detail interceptor hoặc route query cũ.
- Impeccable detector: không phát hiện anti-pattern tự động.

## Audit health score

| Dimension | Score | Ghi chú |
| --- | ---: | --- |
| Accessibility | 3/4 | Static semantics và contrast đạt; chưa chạy keyboard path trong browser session |
| Performance | 4/4 | Static Astro, ảnh có kích thước, lazy loading dưới fold, motion nhẹ |
| Responsive | 3/4 | Source geometry và breakpoint đã kiểm tra; thiếu screenshot regression sau sửa |
| Theming | 4/4 | Semantic tokens và một light theme thống nhất |
| Anti-patterns | 3/4 | Không có Taste anti-pattern; vẫn cần fresh-eye visual review trên browser thật |
| **Tổng** | **17/20** | **Good, visual verification pending** |

## Giới hạn kiểm thử

Browser điều khiển tích hợp báo không có browser session, nên không thể chụp screenshot sau sửa hoặc chạy keyboard/pointer interaction trực tiếp. Không dùng browser automation khác để giả lập kết quả. Cần mở lại các viewport trên browser thật khi session khả dụng:

- 375, 390, 768, 1024, 1280, 1440 và 1920px.
- Homepage, `/san-pham`, `/y-te`, `/thu-y`, `/tim-kiem`.
- Một category, brand, specialty.
- SonoPort 8, một sản phẩm fallback y tế và một sản phẩm thú y.
- Loading, empty, active filters, list mode, saved và compare states.

## Kết luận

Các lỗi mất cân đối trong screenshot và các biến thể cùng nguyên nhân đã được sửa ở shared UI system. Chưa triển khai Phase 6.
