# PHASE 16 — CONTENT + PROJECT + DOCUMENT CMS UI

Ngày hoàn thành: 13/08/2026

## Phạm vi đã triển khai

Phase 16 bổ sung bốn khu vực trong Admin shell:

- Nội dung: Blog, Kiến thức và Pages.
- Dự án: danh sách, form biên tập, quyền hiển thị và gallery.
- Thư viện tài liệu: bảng dữ liệu và filters.
- Thư viện media: grid/list, tìm kiếm, metadata, usage và chi tiết tài nguyên.

Route chính dùng query để giữ navigation Admin nhất quán:

- `/admin?section=noi-dung`
- `/admin?section=noi-dung&view=editor`
- `/admin?section=du-an`
- `/admin?section=du-an&view=editor`
- `/admin?section=tai-lieu`
- `/admin?section=media`

## Content và Articles

Articles table có đủ Title, Category, Author, Status, Published, Updated và Actions. Có:

- Tabs Tất cả, Blog, Kiến thức và Pages.
- Tìm theo tiêu đề.
- Filter danh mục và trạng thái.
- Empty state và visible count cập nhật theo filter.
- Row actions cho chỉnh sửa, nhân bản và xem trước.

## Article Editor

Editor ưu tiên cấu trúc nội dung, không mô phỏng Word. Phần nội dung dùng block canvas và thanh thêm khối gọn gồm:

- Heading, Paragraph, List, Image, Quote, Table, Link và Callout.
- Product Embed dùng dữ liệu catalogue thay vì nhập lặp.
- Block có affordance sắp xếp, focus state và vùng chỉnh sửa trực tiếp.

Form có Title, Slug, Excerpt, Cover, Content, Category, Tags, Related Products, Related Specialty, SEO và Status. Có autosave feedback, version history entry, preview và save state.

## Project và Gallery

Project editor có Project Name, Customer, Location, Products, Installation Date, Description, Images, Team, Public/Private và SEO.

Quy tắc privacy:

- Dự án mới mặc định là `Nội bộ`.
- Chuyển sang `Công khai` hiển thị cảnh báo dữ liệu khách hàng.
- Save bị chặn nếu chưa xác nhận quyền công khai dữ liệu.
- Chuyển visibility không tự động xuất bản dự án.

Gallery hỗ trợ upload queue, đổi thứ tự trái/phải, chọn cover, caption và alt cho từng ảnh.

## Document Library

Document table có Document, Type, Product, Access, Size, Updated và Actions. Filters hỗ trợ:

- Tìm tên tài liệu.
- Loại tài liệu.
- Sản phẩm.
- Quyền truy cập.

Access được phân biệt theo Công khai, Khách hàng, Đối tác và Nội bộ.

## Media Library

Media library có:

- Grid và List view.
- Tìm theo filename hoặc alt.
- Filter loại tài nguyên.
- Upload queue.
- Alt, Usage, kích thước và dung lượng.
- Dialog sửa metadata và liệt kê các vị trí đang dùng.

Kiến trúc UI thể hiện một thư viện tài nguyên dùng lại; editor và project chọn từ thư viện thay vì tạo bản sao mặc định.

## SEO Preview

SEO panel có title, description, character count và search-result preview. Preview ghi rõ đây chỉ là mô phỏng hiển thị và không phản ánh thứ hạng tìm kiếm.

## Taste audit

- Dùng product register: light, restrained, density cao và một accent chính.
- Không gradient text, glassmorphism, glow, card radius lớn hoặc motion trang trí.
- Không build toolbar định dạng kiểu Word; editor tập trung vào block có cấu trúc.
- Table, divider và whitespace được ưu tiên hơn card grid cho dữ liệu nghiệp vụ.
- Trạng thái màu chỉ dùng cho publish, access, warning và success.
- Sidebar, table, editor columns, filters, gallery và media library có responsive strategy.
- Mobile form controls dùng 16px; table có horizontal scroll và ẩn cột phụ có kiểm soát.
- Có focus-visible, native dialog, labels, live status, empty state và reduced-motion fallback.
- Impeccable detector: 0 findings trên các file Phase 16.

## Verification

- `npm run check`: đạt, 0 errors, 0 warnings, 0 hints.
- `npm run build`: đạt, 102 static pages.
- HTTP 200 cho 5 URL CMS chính được liệt kê ở trên.
- Source audit xác nhận không có gradient, backdrop blur hoặc radius card lớn.

## Giới hạn

- Dữ liệu và thao tác lưu/upload trong Phase 16 là frontend foundation; chưa kết nối CMS API, object storage, authz hoặc audit backend.
- Browser tích hợp không có phiên khả dụng trong môi trường hiện tại, vì vậy chưa thực hiện screenshot regression và keyboard traversal trên browser thật. Build, route, TypeScript, source và design detector đã được kiểm tra.

## Kết luận

Phase 16 hoàn thành đúng phạm vi và dừng tại đây. Chờ `RUN PHASE 17`.
