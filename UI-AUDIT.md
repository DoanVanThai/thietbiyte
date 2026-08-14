# THIÊN LỘC GROUP - UI Audit

## 1. Kết luận audit

Workspace được kiểm tra tại `/Users/doanvanthai/WebsiteCongTy` vào ngày 13/08/2026.

Đây là dự án mới, hiện chưa có frontend để đánh giá trực quan hoặc kiểm tra implementation. Workspace không có source code, `package.json`, cấu hình framework, Git metadata, route, layout, component, stylesheet, design token hay asset thương hiệu. Vì vậy:

- Không có UI hiện tại để chấm đạt hoặc không đạt.
- Không có file/component cụ thể nào có thể được kết luận là mang dấu hiệu AI-generated UI.
- Không có component hiện hữu để quyết định giữ hoặc redesign.
- Các mục route, token và component bên dưới được ghi là `Chưa có`, không được suy diễn từ dự án khác.
- Phần định hướng cho Phase 1 nằm trong `DESIGN-DIRECTION.md` và không phải mô tả implementation hiện tại.

Không sử dụng dữ liệu từ bất kỳ dự án nào khác trong audit này.

## 2. Phạm vi và phương pháp

Audit áp dụng hai bộ nguyên tắc:

1. `design-taste-frontend` và `redesign-existing-projects` từ Taste Skill, bản repository tại commit `e988add20dab0fa97d7a76781c48961c8184288e`.
2. Checklist Impeccable cho brand surface và product surface.

Các nguyên tắc đã được dùng thực tế để lập tiêu chí đánh giá:

- Đọc audience và bối cảnh sử dụng trước khi chọn thẩm mỹ.
- Tách Public Website theo brand/trust register khỏi User Portal và Admin theo product/task register.
- Audit trước khi đề xuất thay đổi; không bịa brand token, route hoặc component chưa tồn tại.
- Clarity > Decoration, Readability > Effects, Information > Marketing noise.
- Kiểm tra hierarchy, typography, spacing, density, layout, visual rhythm, component repetition, navigation, usability, responsive và content structure.
- Phát hiện các mẫu AI phổ biến như hero quá lớn, gradient, glow, glass, card grid lặp lại, badge/icon dư thừa, centered layout, CTA trùng ý định và motion không có mục đích.

Design read cho dự án:

> Website B2B thuộc lĩnh vực y tế và thú y, phục vụ quyết định mua sắm có rủi ro cao, cần ngôn ngữ clinical, technical và trust-first. Public Website ưu tiên tìm kiếm, so sánh và bằng chứng. Portal/Admin ưu tiên tốc độ thao tác và mật độ thông tin.

Mức định hướng dùng làm baseline cho Phase 1:

| Dial | Mức | Lý do |
|---|---:|---|
| Design variance | 4/10 | Có nhịp và phân cấp rõ nhưng không phá cách gây mất tin cậy |
| Motion intensity | 2/10 | Chỉ dùng motion cho feedback, trạng thái và điều hướng |
| Visual density | 6/10 | B2B technical cần nhiều thông tin nhưng vẫn phải quét nhanh |

## 3. Inventory frontend hiện tại

### 3.1 Nền tảng và cấu trúc

| Hạng mục | Hiện trạng | Bằng chứng |
|---|---|---|
| Framework | Chưa có | Không có `package.json` hoặc file cấu hình |
| Styling method | Chưa có | Không có CSS, Sass, Tailwind config hoặc CSS-in-JS |
| Build system | Chưa có | Không có Vite, Next.js, Nuxt, Astro hoặc Webpack config |
| Source directory | Chưa có | Workspace trống trước khi tạo hai tài liệu Phase 0 |
| Asset/brand directory | Chưa có | Không có logo, font, ảnh sản phẩm hoặc guideline |
| Test setup | Chưa có | Không có test config hoặc test file |
| Git repository | Chưa có | Không có `.git` trong workspace |

### 3.2 Routes

Không có route được implement. Sitemap ở mục 7 là sitemap UI đã xác nhận cho Phase 1, không phải route hiện hữu.

### 3.3 Layouts

| Surface | Layout hiện hữu |
|---|---|
| Public Website | Chưa có |
| User Portal | Chưa có |
| Admin | Chưa có |
| Authentication | Chưa có |

### 3.4 Shared components

Không có shared component. Chưa có Header, Footer, Navigation, Search, Button, Form, Product card, Table, Modal, Toast, Breadcrumb hoặc Pagination.

### 3.5 Page components

Không có page component. Chưa thể đánh giá page-level composition, heading order, content density, empty/loading/error state hoặc conversion flow.

### 3.6 Design tokens và visual language

| Thuộc tính | Hiện trạng |
|---|---|
| Typography | Chưa có font family, scale, weight, line-height hoặc line-length rule |
| Colors | Chưa có brand palette, semantic color hoặc contrast baseline |
| Spacing | Chưa có spacing scale hoặc container rule |
| Radius | Chưa có radius scale |
| Shadows | Chưa có shadow/elevation rule |
| Icons | Chưa có icon family hoặc stroke rule |
| Animation | Chưa có duration, easing hoặc reduced-motion rule |
| Responsive | Chưa có breakpoint, grid, mobile navigation hoặc table behavior |
| Z-index | Chưa có layer scale |

## 4. Audit theo tiêu chí thiết kế

Các mục sau ở trạng thái `Không thể chấm`, thay vì mặc định cho điểm tốt hoặc xấu.

| Tiêu chí | Trạng thái hiện tại | Điều kiện cần kiểm tra khi có UI |
|---|---|---|
| Hierarchy | Không thể chấm | Mỗi trang có một H1; task chính, dữ liệu chính và CTA chính được nhận biết trong 3-5 giây |
| Typography | Không thể chấm | Hỗ trợ tiếng Việt, body tối thiểu 16px trên Public, line-height dễ đọc, prose tối đa 65-75ch |
| Spacing | Không thể chấm | Có scale nhất quán và khoảng cách theo quan hệ nội dung, không lặp một `py` cho mọi section |
| Density | Không thể chấm | Public dễ quét; Portal/Admin đủ dày cho người dùng chuyên nghiệp |
| Layout | Không thể chấm | Container ổn định, grid theo nội dung, không mặc định 3 card ở mọi section |
| Visual rhythm | Không thể chấm | Xen kẽ vùng thông tin, hình ảnh, danh sách và bằng chứng; không dùng một nhịp section đồng đều |
| Component repetition | Không thể chấm | Pattern dùng chung có hệ thống nhưng không biến mọi nội dung thành card/badge |
| Navigation | Không thể chấm | Sitemap rộng phải được nhóm, có search, breadcrumb và active state |
| Usability | Không thể chấm | Luồng tìm sản phẩm, đọc thông số, yêu cầu báo giá và hỗ trợ kỹ thuật rõ ràng |
| Responsive | Không thể chấm | Không overflow, target tối thiểu 44x44px, bảng có chiến lược mobile rõ ràng |
| Content structure | Không thể chấm | Thông tin kỹ thuật, chứng từ, ứng dụng và dịch vụ sau bán hàng được ưu tiên hơn marketing copy |

## 5. Audit dấu hiệu AI-generated UI

### 5.1 Kết luận

Không có UI hoặc source file để kiểm tra. Do đó không có finding nào được gán cho file/component cụ thể. Trạng thái này không có nghĩa là dự án đã pass; chỉ có nghĩa là chưa có implementation để audit.

| Dấu hiệu cần tìm | Kết quả hiện tại | File/component có vấn đề |
|---|---|---|
| Heading quá lớn | Chưa thể kiểm tra | Không có |
| Gradient text | Chưa thể kiểm tra | Không có |
| Gradient background trang trí | Chưa thể kiểm tra | Không có |
| Glowing blur | Chưa thể kiểm tra | Không có |
| Glassmorphism | Chưa thể kiểm tra | Không có |
| `rounded-3xl` lặp lại | Chưa thể kiểm tra | Không có |
| Card ở mọi section | Chưa thể kiểm tra | Không có |
| Badge ở mọi nơi | Chưa thể kiểm tra | Không có |
| Icon trong mọi heading | Chưa thể kiểm tra | Không có |
| Mọi section đều 3 card | Chưa thể kiểm tra | Không có |
| Quá nhiều centered layout | Chưa thể kiểm tra | Không có |
| `shadow-xl` | Chưa thể kiểm tra | Không có |
| Fade-up hàng loạt | Chưa thể kiểm tra | Không có |
| Section spacing giống nhau | Chưa thể kiểm tra | Không có |
| CTA lặp lại quá nhiều | Chưa thể kiểm tra | Không có |
| SaaS template pattern | Chưa thể kiểm tra | Không có |
| Thiếu tính y tế | Chưa thể kiểm tra | Không có |
| Quá trẻ hoặc quá startup | Chưa thể kiểm tra | Không có |

### 5.2 Guardrail bắt buộc cho lần audit tiếp theo

- Không gradient text, neon glow hoặc glass panel trang trí.
- Không hero centered chỉ có headline, hai CTA và gradient blob.
- Không dùng 3 card đồng dạng làm cấu trúc mặc định.
- Không dùng card nếu divider, table, list hoặc whitespace thể hiện quan hệ tốt hơn.
- Không lặp eyebrow uppercase trên mọi section; tối đa 1 eyebrow cho mỗi 3 section.
- Không icon hóa mọi heading; icon chỉ dùng cho action, category hoặc trạng thái có ý nghĩa.
- Không badge hóa metadata thông thường. Badge chỉ dành cho trạng thái, chứng nhận hoặc taxonomy cần quét nhanh.
- Không dùng radius lớn hơn 16px cho card/section; pill chỉ dành cho tag hoặc control phù hợp.
- Không dùng wide soft shadow cùng border trên cùng một component.
- Không fade-up toàn trang. Content phải hiển thị mặc định và motion phải có mục đích.
- Không đặt nhiều CTA đồng nghĩa như “Liên hệ”, “Nhận tư vấn”, “Trao đổi ngay” trên cùng một trang mà không phân vai rõ.
- Không tạo UI giống ecommerce đại trà: sale badge, flash sale, giá đỏ, bộ đếm giả hoặc visual cạnh tranh giá.

## 6. Nhóm người dùng và nhu cầu chính

| Nhóm | Công việc chính | Thông tin phải nhìn thấy sớm | Rủi ro UI cần tránh |
|---|---|---|---|
| Bác sĩ | Chọn thiết bị phù hợp chuyên môn | Ứng dụng, chỉ định, thông số, hãng, hỗ trợ | Marketing che khuất dữ liệu kỹ thuật |
| Chủ phòng khám | So sánh giải pháp và chi phí sở hữu | Cấu hình, phạm vi đầu tư, bảo hành, đào tạo | CTA bán hàng gây áp lực, thiếu bằng chứng |
| Bệnh viện | Đánh giá năng lực cung ứng | Hồ sơ, dự án, chứng từ, quy trình, dịch vụ | Nội dung chung chung, thiếu tài liệu tải về |
| Bộ phận mua sắm | Lập shortlist và yêu cầu báo giá | SKU/model, xuất xứ, tiêu chuẩn, tình trạng cung ứng | Thông số khó lọc hoặc không thể so sánh |
| Kỹ thuật viên | Vận hành và bảo trì | Manual, hướng dẫn, lịch bảo trì, kênh hỗ trợ | Nội dung kỹ thuật bị đặt sau marketing |
| Phòng xét nghiệm | Chọn thiết bị/hóa chất tương thích | Phương pháp, công suất, mẫu, reagent, QC | Taxonomy không theo workflow xét nghiệm |
| Phòng khám thú y | Tìm thiết bị theo quy mô và loài | Ứng dụng thú y, cấu hình, đào tạo | Trộn nội dung y tế người và thú y |
| Bệnh viện thú y | Xây dựng giải pháp nhiều khoa | Chẩn đoán, phẫu thuật, xét nghiệm, nội trú | Không có luồng giải pháp tổng thể |
| Đại lý | Tra cứu danh mục và hỗ trợ bán hàng | Catalogue, chính sách, tài liệu, đầu mối | Public và tài liệu đối tác lẫn lộn |
| Nhân viên Sales | Tìm nhanh sản phẩm và tài liệu | Search, filter, share link, brochure, lead context | Navigation sâu, dữ liệu không chuẩn hóa |
| Admin | Quản trị nội dung và dữ liệu | Trạng thái, validation, audit trail, bulk action | UI trang trí, thao tác không nhất quán |

## 7. Sitemap UI Public đã xác nhận

Sitemap sau được xác nhận là phạm vi Public Website:

1. Trang chủ
2. Sản phẩm
3. Y tế
4. Thú y
5. Danh mục
6. Chuyên khoa
7. Thương hiệu
8. Giải pháp
9. Dự án
10. Dịch vụ kỹ thuật
11. Tin tức
12. Kiến thức
13. Giới thiệu
14. Liên hệ
15. Tìm kiếm
16. Đăng nhập

Đây là sitemap nội dung, không phải danh sách 16 item đặt ngang trên header. Cấu trúc navigation đề xuất được mô tả trong `DESIGN-DIRECTION.md`.

## 8. Component cần giữ, redesign và tạo mới

### Cần giữ

Không có component hiện hữu để giữ.

Khi có asset thương hiệu, cần ưu tiên bảo toàn trước khi redesign:

- Logo/wordmark chính thức.
- Màu thương hiệu đã đăng ký hoặc dùng nhất quán.
- Nội dung pháp lý, chứng nhận và hồ sơ năng lực đã được phê duyệt.
- URL/slugs, analytics event và cấu trúc SEO nếu chúng được tạo trước Phase 1.

### Cần redesign

Không có component hiện hữu để redesign.

### Cần thiết kế mới trong Phase 1

Danh sách này là backlog kiến trúc, không phải phạm vi triển khai của Phase 0:

- Public shell: utility bar, header, desktop mega navigation, mobile navigation, footer.
- Search system: global search, suggestion, result, filter, no-result state.
- Product discovery: category navigation, filter, sort, product result item, comparison shortlist.
- Product detail: gallery, identity, technical specification, document download, related product, quote request.
- Trust components: certificate list, brand list, project evidence, service commitment.
- Content components: article card/list, article body, author/reviewer metadata, related content.
- Conversion components: quote form, consultation form, technical support entry.
- Portal shell và Admin shell tách biệt khỏi Public shell.
- Product UI primitives: button, field, select, combobox, table, tabs, status, pagination, empty/loading/error state.

## 9. Rủi ro và dữ liệu còn thiếu trước Phase 1

### P0 - Ngăn thiết kế đúng thương hiệu

- Chưa có logo, brand guideline hoặc màu thương hiệu chính thức.
- Chưa có source content, catalogue sản phẩm, taxonomy, thông số hoặc tài liệu kỹ thuật.
- Chưa xác định ranh giới chức năng User Portal và Admin.

### P1 - Ảnh hưởng trực tiếp đến kiến trúc UI

- Chưa xác định CTA kinh doanh chính: yêu cầu báo giá, đặt lịch tư vấn, gọi hotline hay gửi danh sách sản phẩm.
- Chưa xác định người dùng có được xem giá công khai hay chỉ nhận báo giá.
- Chưa xác định bộ lọc sản phẩm theo ngành, chuyên khoa, hãng và thông số.
- Chưa có yêu cầu accessibility chính thức; baseline đề xuất là WCAG 2.2 AA.
- Chưa có yêu cầu ngôn ngữ; cần xác nhận chỉ tiếng Việt hay song ngữ Việt/Anh.

### P2 - Ảnh hưởng đến chất lượng hình ảnh và bằng chứng

- Chưa có ảnh sản phẩm chuẩn nền, ảnh lắp đặt thực tế, logo hãng và ảnh dự án.
- Chưa có danh sách chứng nhận, giấy phép, chính sách bảo hành và SLA kỹ thuật.
- Chưa có content owner/reviewer cho bài kiến thức y tế và thú y.

## 10. Điều kiện hoàn thành audit tiếp theo

Sau khi Phase 1 có implementation, audit lại tối thiểu ở các viewport 360, 768, 1024 và 1440px, với các trạng thái light, keyboard-only và reduced motion. Lần audit đó phải:

- Lập inventory route và component từ source thực.
- Ghi file và line cụ thể cho từng finding.
- Kiểm tra contrast, focus, heading, landmark, label, alt text và target size.
- Kiểm tra overflow, navigation collapse, filter, table và form trên mobile.
- Kiểm tra image sizing, LCP, CLS, bundle và motion performance.
- Đếm cơ học các pattern lặp: card, badge, eyebrow, centered section, CTA và reveal animation.
- So sánh mức độ dùng chung giữa Public, Portal và Admin để tránh coupling sai register.

