# QUOTE + CRM WORKFLOW — Thiên Lộc Group

## Trạng thái

Phase 24 đã được nối với PostgreSQL và hệ thống session/permission thật. Phạm vi dừng ở workflow bán thiết bị y tế; không mở rộng thành ERP.

## Quote flow

1. Khách đi vào form `/yeu-cau-bao-gia` từ Product Detail, Compare, Favorites, Solution hoặc Global CTA.
2. Guest gửi họ tên, điện thoại, email, đơn vị, loại khách hàng, tỉnh/thành, nhu cầu, ghi chú và một hoặc nhiều sản phẩm.
3. Server kiểm tra lại toàn bộ payload, sản phẩm đang published và số lượng từng item.
4. Quote, QuoteItems, customer-visible update đầu tiên, Lead, CRM activity, notification outbox và audit log được tạo trong một transaction.
5. Public number có dạng `QT-YYYY-000001`; database ID không được dùng làm mã công khai.
6. Guest nhận access token ngẫu nhiên, chỉ lưu hash trong database, để xem `/yeu-cau-bao-gia/chi-tiet` mà không cần đăng nhập.

Các nguồn hiện được ghi nhận qua trường `source`, gồm Product Detail, Compare, Favorites, Solution và Global CTA.

## Attachment

- Tối đa 3 tệp, 10 MB/tệp.
- Chấp nhận PDF, Word, Excel, JPEG và PNG.
- Kiểm tra extension, MIME, dung lượng và magic bytes.
- Chặn PE, ELF, Mach-O, universal binary và script có shebang dù bị đổi đuôi.
- Tệp được lưu ngoài `public/`, tên lưu ngẫu nhiên, quyền file `0600`; database chỉ giữ private locator.
- Portal chỉ truy vấn tài liệu có access `CUSTOMER`.

## Customer linking

Thứ tự dedupe:

1. Một email khớp chính xác, không phân biệt hoa thường.
2. Nếu email không cho kết quả duy nhất: phone + organization khớp chính xác.
3. Nếu có nhiều hồ sơ gần giống: tạo hồ sơ riêng và gắn cờ cần staff review; không tự merge.

Khách đăng nhập gửi quote có thể link Customer profile với User. Quote gửi bằng email của Customer đã link sẽ xuất hiện trong Portal mà không tạo Customer trùng.

## Lead flow và sales assignment

- Mỗi quote web tạo một Lead phù hợp với mã `LD-YYYY-000001`.
- Pipeline: `NEW → CONTACTED → QUALIFIED → QUOTE_SENT → NEGOTIATING → WON/LOST`.
- Quote: `RECEIVED → CONSULTING → QUOTE_SENT → NEGOTIATING → COMPLETED/CANCELLED`.
- Sales Manager có thể assign từ Lead hoặc Quote. Assignment được đồng bộ giữa Lead và Quote liên quan.
- Sales Staff chỉ thấy Lead/Quote được assign cho chính mình.
- Sales có thể ghi Call, Email, Zalo, Meeting, Quote, Note, Status Change; tạo và hoàn thành follow-up; thêm internal note.
- Follow-up lưu date/time/type/note/assignee và được phân loại Upcoming, Today, Overdue, Done.

## CRM UI

Các trang Phase 15 sau đã dùng database thật:

- Lead Table và Pipeline
- Lead Detail: assign, status, activity, follow-up, internal note
- Quotes và Quote Detail: assign, status, đánh dấu đã gửi, internal note
- Customers và Customer Detail
- Activities
- Follow-ups

UI giữ desktop-first, bảng cho dữ liệu dày; mobile ưu tiên Call, Status, Note và Follow-up. Nội dung `Customer-visible` và `Internal-only` có nhãn, cảnh báo và endpoint tách biệt.

## Portal integration

Customer đăng nhập xem được:

- Quote Number
- Ngày tạo
- Sản phẩm, model, số lượng và ghi chú item
- Trạng thái customer-friendly
- Customer-visible updates
- Customer-visible attachments

Portal và public quote DTO không trả internal note, staff activity, cost, margin, assignee discussion, access hash hoặc database relation ID. Timeline khách hàng chỉ dùng: Đã tiếp nhận, Đang tư vấn, Đã gửi báo giá, Đang trao đổi, Hoàn tất.

## Notification foundation

Outbox hỗ trợ các event:

- `QUOTE_RECEIVED`
- `LEAD_CREATED`
- `QUOTE_ASSIGNED`
- `QUOTE_STATUS_CHANGED`
- `FOLLOW_UP_DUE`

Khi chưa cấu hình email/SMS, event được lưu `channel=UNCONFIGURED`, `status=PENDING`. Hệ thống không hiển thị hoặc ghi nhận giả rằng thông báo đã được gửi.

## Permissions

Các API và route CRM enforce:

- `quote.view`, `quote.edit`, `quote.assign`
- `lead.view`, `lead.edit`, `lead.assign`
- `customer.view`, `customer.edit`

Sales Manager có quyền assign. Sales Staff có view/edit trong phạm vi được giao nhưng không có `quote.assign` hoặc `lead.assign`. Customer Portal dùng guard riêng và luôn scope theo `customer.userId` của session.

## API chính

- `POST /api/quotes`
- `GET /api/quotes/:number?access=...`
- `GET /api/portal/quotes`
- `GET /api/portal/quotes/:id`
- `GET/PATCH /api/crm/leads/:id`
- `POST /api/crm/leads/:id/activities`
- `POST /api/crm/leads/:id/follow-ups`
- `POST /api/crm/leads/:id/notes`
- `GET/PATCH /api/crm/quotes/:id`
- `POST /api/crm/quotes/:id/notes`
- `GET /api/crm/customers`, `/activities`, `/follow-ups`, `/sales`

## Tests

Đã chạy thành công:

- `npm run check`: 0 error, 0 warning, 0 hint.
- `npm run build`: server build hoàn tất.
- `npm run test:server`: 21/21 pass.
- PostgreSQL integration test: 1/1 pass.
- Migration deploy và production seed trên PostgreSQL sạch.
- Guest multipart quote → Quote + Lead + access token.
- Multi-product quote và per-item quantity/note.
- Customer dedupe bằng email: `exact-email`.
- Sales Manager assign; Sales Staff chỉ thấy record được giao.
- Sales Staff bị từ chối 403 khi thử assign.
- Activity customer-visible, follow-up, lead status và quote status update.
- Customer login xem quote; API/HTML không lộ internal note.
- File executable giả đuôi PDF bị từ chối 422.
- Public quote detail, Lead Detail, Quote Detail và Portal đều trả 200.

Browser visual runner không có phiên khả dụng trong môi trường kiểm thử. Responsive được audit ở cấu trúc/CSS và các page state đã được xác nhận qua server-rendered HTML; nên chạy thêm visual smoke test trên thiết bị thật hoặc CI browser trước khi phát hành production.

## Vận hành

Biến môi trường bắt buộc: `DATABASE_URL`. Tùy chọn: `QUOTE_UPLOAD_DIR`. Chạy deploy bằng `npm run db:deploy`, seed bằng `npm run db:seed`, sau đó `npm run build`.
