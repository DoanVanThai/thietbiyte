# Authentication & RBAC — THIÊN LỘC GROUP

## Trạng thái triển khai

Phase 22 dùng authentication thật trên PostgreSQL/Prisma và Astro SSR. Session, role, permission, token xác minh/reset, audit log và dữ liệu sở hữu của Customer đều được kiểm tra ở server. UI chỉ là lớp phản hồi và ẩn thao tác; API vẫn tự kiểm tra quyền độc lập.

Nguồn policy chính:

- `src/server/auth/permissions.ts`: permission, principal, `can()`, phân biệt Customer/Staff và route policy.
- `src/server/auth/catalog.ts`: permission catalog và quyền mặc định của từng role.
- `src/server/auth/http.ts`: guard API trả `401` hoặc `403`.
- `src/server/auth/admin-policy.ts`: policy bảo vệ role và Super Admin.
- `src/server/auth/service.ts`: đăng nhập, session, token một lần và audit.
- `src/middleware.ts`: nạp session, chặn trang, same-origin check cho mutation API.

## Chuẩn bị môi trường

Sao chép `.env.example` thành `.env` và cấu hình:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/thienlocmedical
AUTH_PEPPER=a-long-random-production-secret
EMAIL_DELIVERY_WEBHOOK_URL=https://mailer.example.com/auth-email
EMAIL_DELIVERY_WEBHOOK_SECRET=a-webhook-bearer-secret
SEED_DEMO_PASSWORD=
```

`AUTH_PEPPER` dùng để hash thông tin mạng trong audit/session; không thay thế password hash. `EMAIL_DELIVERY_WEBHOOK_URL` là bắt buộc ở production. Webhook nhận JSON:

```json
{ "to": "user@example.com", "type": "verify", "url": "https://..." }
```

Khởi tạo:

```bash
npm install
npm run db:generate
npm run db:deploy
npm run db:seed
```

Nếu đặt `SEED_DEMO_PASSWORD`, các tài khoản seed mới có thể đăng nhập bằng giá trị đó. Nếu để trống, seed tạo mật khẩu ngẫu nhiên và không in mật khẩu ra log; hãy dùng luồng reset hoặc tạo tài khoản theo quy trình vận hành. Không dùng mật khẩu seed chung ở production.

## Authentication flows

### Register và xác minh email

`POST /api/auth/register` validate dữ liệu và password ở server, hash bằng `scrypt` với salt ngẫu nhiên, tạo user `PENDING`, gán role `customer`, phát token xác minh 24 giờ và gửi email. Response khi email đã tồn tại vẫn đi theo trạng thái chung để hạn chế dò tài khoản.

`GET /api/auth/verify-email?token=...` chỉ chấp nhận token chưa dùng, đúng mục đích và chưa hết hạn. Token được đánh dấu dùng một lần trước khi kích hoạt tài khoản. `POST /api/auth/resend-verification` có response chung và rate limit.

### Login, session và logout

`POST /api/auth/login` trả cùng lỗi credentials cho email không tồn tại hoặc mật khẩu sai, thực hiện dummy password verification để giảm chênh lệch timing, và rate limit theo IP + email hash.

Cookie session:

- Tên: `tlm_session`.
- Chỉ lưu raw token ở cookie; database chỉ lưu SHA-256 digest.
- `HttpOnly`, `SameSite=Lax`, `Secure` ở production, `Path=/`.
- Thời hạn 8 giờ, hoặc 30 ngày khi chọn “Ghi nhớ đăng nhập”.
- Session bị vô hiệu nếu user bị disable, hết hạn, hoặc `securityVersion` không khớp.

`POST /api/auth/logout` xóa session ở database và cookie. Đổi mật khẩu thu hồi các phiên khác; reset password thu hồi toàn bộ phiên; đổi role/trạng thái thu hồi toàn bộ phiên của user.

### Forgot và reset password

`POST /api/auth/forgot-password` luôn dùng nội dung phản hồi chung, bất kể email có tồn tại hay không. Reset token có 32 byte entropy, database chỉ lưu digest, hết hạn sau 30 phút và dùng một lần.

`POST /api/auth/reset-password` kiểm tra policy password, token, cập nhật password hash, tăng `securityVersion` và xóa session. UI có đủ trạng thái sent, expired, success và lỗi server.

Password policy hiện tại: 10–128 ký tự, có chữ, số và ký tự đặc biệt. Không ghi password hoặc reset/session token vào log. Development URL chỉ xuất hiện trong JSON khi không chạy production.

## Route và API protection

- Public website: mọi người truy cập.
- `/tai-khoan`: chỉ principal có duy nhất phạm vi Customer; Guest được chuyển tới login, Staff bị chuyển tới trang không có quyền.
- `/admin/**`: chỉ Staff; module tiếp tục kiểm tra permission cụ thể.
- `/api/admin/**` và `/api/crm/**`: từng handler gọi `requirePermission()`; không dựa vào việc nút đã bị ẩn.
- Mutation API từ cross-site bị middleware từ chối dựa trên `Origin` và `Sec-Fetch-Site`. Cookie `SameSite=Lax` là lớp bổ sung.

Sidebar và các thao tác quan trọng ở Product, User, Role và Permission UI dùng cùng principal để ẩn/disable action không hợp lệ. Server vẫn là nguồn quyết định cuối cùng.

## Customer ownership và chống IDOR

Portal không nhận `userId` từ client để quyết định ownership:

- Profile/password/favorites luôn dùng `context.locals.auth.id`.
- Quote detail query bằng cả quote id/number và quan hệ `customer.userId = actor.id`.
- Quote list lọc theo Customer liên kết với user đang đăng nhập.
- Document chỉ trả file `PUBLIC`, `REGISTERED`, hoặc grant dành riêng cho user.

Nếu client gửi ID của user khác, ID đó bị bỏ qua. Không có API Portal nào cho phép Customer chọn owner tùy ý.

## Quản lý role/user

Admin UI `/admin/roles`, `/admin/permissions`, `/admin/users/:id` đọc và ghi database thật.

- `role.view`: xem role và ma trận.
- `role.manage`: tạo/sửa role và gán permission.
- `user.view`: xem user.
- `user.manage`: gán role và đổi trạng thái.

Role immutable, đặc biệt `super-admin`, không sửa permission qua API thông thường. Role mặc định/protected không xóa được. Role đang có user cũng không xóa được.

Chỉ Super Admin được gán role Super Admin. Role thấp hơn không thể sửa hoặc disable Super Admin. Hệ thống chặn Super Admin tự gỡ role của chính phiên hiện tại và chặn gỡ Super Admin cuối cùng.

## Audit log

Các event được ghi vào `AuditLog`: login thành công/thất bại, logout, register, email verified, password reset/change, user status change, role create/delete, permission change và role assignment. IP chỉ lưu dưới dạng hash có pepper. API `/api/admin/audit` yêu cầu `audit.view`.

## Tương thích Phase 21 CRM

CRM Phase 21 vẫn có workflow store hiện hữu để giữ dữ liệu nghiệp vụ. `src/lib/workflow/principal-bridge.ts` ánh xạ principal PostgreSQL đã xác thực sang actor/assignee của repository cũ. Session và permission SQLite cũ đã bị loại khỏi request path; mọi `/api/crm/**` dùng session/RBAC trung tâm trước khi đọc hoặc ghi workflow store.

## Kiểm thử và vận hành

```bash
npm run test:server
npm run check
npm run build
```

Test server bao gồm Guest/Customer/Staff boundaries, direct API guards, role matrix, immutable role, Super Admin protection, permission validation, password hash/policy và token digest.

Trước production:

1. Chạy migration trên database staging rồi production bằng `npm run db:deploy`.
2. Cấu hình mail webhook và kiểm thử verify/reset end-to-end.
3. Đổi `AUTH_PEPPER`, không dùng giá trị mẫu.
4. Không đặt `SEED_DEMO_PASSWORD` dùng chung ở production; vô hiệu hóa/xóa tài khoản demo nếu không cần.
5. Dùng rate-limit store dùng chung (Redis/gateway) khi chạy nhiều Node instance; limiter trong process hiện phù hợp single-instance.
6. Thiết lập HTTPS, backup database, retention cho audit log và cảnh báo các đợt login thất bại.

