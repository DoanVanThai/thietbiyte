# PHASE 15 — CRM + LEADS + QUOTES UI AUDIT

Ngày hoàn thành: 13/08/2026

## Phạm vi

Phase 15 triển khai CRM UI foundation cho đội Sales: Leads, Customers, Quotes, Activities, Follow-ups và Pipeline. Không triển khai API, gửi báo giá thật, đồng bộ email/Zalo, lưu file hoặc User Portal.

Toàn bộ nội dung hiện tại là dữ liệu minh họa có chủ đích. Các thao tác ghi dùng feedback mô phỏng để sẵn sàng kết nối backend ở phase tích hợp.

## Design read

CRM được thiết kế theo hướng desktop-first, nhanh và có mật độ thông tin vừa phải cho tác vụ vận hành hằng ngày.

- Design variance: 2/10.
- Motion intensity: 1/10.
- Visual density: 7/10 trên desktop, 5/10 trên mobile.
- Giữ Be Vietnam Pro, token màu và nhịp spacing của Admin foundation.
- Không dùng decorative dashboard, gradient, glass, card shadow lớn hoặc modal cho mọi tác vụ.
- Kanban là một view của Pipeline; Table View luôn có sẵn để quét dữ liệu.

## Routes

### Danh sách và vận hành

- `/admin/crm`
- `/admin/crm/pipeline`
- `/admin/crm/customers`
- `/admin/crm/quotes`
- `/admin/crm/activities`
- `/admin/crm/follow-ups`

### Tạo và chi tiết

- `/admin/crm/leads/new`
- `/admin/crm/leads/[id]`
- `/admin/crm/customers/[id]`
- `/admin/crm/quotes/[id]`

Build hiện tạo 24 trang CRM tĩnh từ dữ liệu mẫu: 8 lead detail, 4 customer profile, 5 quote detail và 7 route danh sách/tác vụ.

## CRM navigation

Secondary navigation trong CRM có đủ:

- Leads.
- Customers.
- Quotes.
- Activities.
- Follow-ups.
- Pipeline.

Admin sidebar vẫn là navigation cấp cao. CRM navigation là thanh cấp hai có overflow ngang trên viewport hẹp để không ép label xuống nhiều dòng.

## Leads

Leads table có đủ Lead, Organization, Phone, Product Interest, Source, Assigned Sales, Status, Last Contact, Next Follow-up và Created. Lead name là entry point chính; phone dùng `tel:` và row action có accessible label.

Bộ lọc gồm:

- Search theo tên, đơn vị, điện thoại và sản phẩm quan tâm.
- Sales.
- Status.
- Source.
- Product.
- Ngày tạo từ.
- Customer Type.

Kết quả cập nhật tại chỗ, có live count, empty state và thao tác xóa bộ lọc. Export được thể hiện như UI foundation và không tạo file giả khi chưa có API.

## Pipeline

Pipeline có đủ New, Contacted, Qualified, Quote Sent, Negotiating, Won và Lost.

- Kanban dùng column ngang, mỗi card chỉ giữ customer, organization, product interest, sales và next follow-up.
- Status color chỉ xuất hiện ở dot/badge nhỏ, không tô toàn bộ card.
- Table View là lựa chọn ngang hàng, không bị giấu sau một workflow riêng.
- Summary strip là shortcut vận hành theo trạng thái, không phải decorative dashboard.
- Lead quá hạn dùng semantic overdue state và không phụ thuộc chỉ vào màu.

## Lead detail

Header hiển thị Customer, Organization, Contact, Assigned Sales và Status. Main area có Product interests, Quotes, Activities, Notes, Documents và Follow-up; side information giữ metadata có ích nhưng không lặp lại toàn bộ nội dung chính.

Add note và follow-up dùng inline panel thay vì modal. Trên mobile có action bar cho Call, Update status, Add note và Follow-up.

## Activity timeline và follow-up

Activity UI hỗ trợ Call, Email, Zalo, Meeting, Quote, Note và Status Change. Timeline dùng một trục trung tính với icon; màu chỉ dành cho visibility và state cần chú ý.

Follow-up có Date, Time, Type, Note, Assigned person và state. Overdue được ghi rõ bằng text `Quá hạn`, màu danger và ngày giờ; không chỉ dùng màu. Staff có thể đánh dấu hoàn tất ngay từ danh sách.

## Quotes

Quotes table có Quote ID, Customer, Organization, Products, Value, Sales, Status, Created và Updated.

Quote detail có:

- Customer và organization.
- Products, model, quantity, unit price và tổng giá trị dự kiến.
- Customer requirement.
- Attachments.
- Status.
- Internal notes.
- Assigned Sales.
- History.

Send action bị khóa khi quote còn ở review. UI yêu cầu staff kiểm tra dữ liệu customer-visible và attachment visibility trước khi gửi.

## Internal vs Customer

Hai phạm vi được tách bằng semantic label và icon, không chỉ bằng màu:

- `Customer-visible` / `Khách hàng thấy` dùng eye icon.
- `Internal-only` / `Nội bộ` dùng lock icon và warning copy.

Internal notes nằm trong section riêng, có nền và border khác nhẹ, kèm cảnh báo không hiển thị trên báo giá hoặc User Portal. Attachment và activity đều mang visibility label riêng. Phase này không tạo hay thay đổi User Portal.

## Customer profile

Customer profile có Contact, Organization, Type, Quotes, Products, Activities, Notes, Documents và Sales Owner. Profile dùng cùng activity timeline và visibility language với lead/quote để giảm học lại UI.

## Responsive

| Vùng hiển thị | Hành vi |
| --- | --- |
| Desktop | Table đầy đủ, filter nhiều cột, detail main + side, Pipeline Kanban hoặc Table |
| Tablet | Filter và summary co về ít cột; detail chuyển một cột; table vẫn cuộn ngang khi cần |
| Mobile | Table list chuyển thành task cards; CRM nav và Kanban cuộn ngang; ưu tiên Call, Status, Note và Follow-up |

Mobile action chính có touch target tối thiểu 44px. Metadata CRM dùng cỡ 13px trở lên sau vòng readability audit; không thu nhỏ bảng để cố nhét tất cả column vào màn hình.

## States

- Filter empty cho Leads, Customers và Quotes.
- Kanban empty theo từng status.
- Empty quote/activity/document list.
- Follow-up overdue và completed.
- Quote review, sent, accepted, draft và expired.
- Inline save loading qua `disabled` và `aria-busy`.
- Toast feedback cho cập nhật trạng thái, ghi chú, follow-up, export và action chưa kết nối API.

## Accessibility

- Mỗi route có đúng một H1 trong output đã kiểm tra.
- Table có caption ẩn và header column rõ.
- Icon-only actions có accessible label.
- View switch dùng `aria-pressed`.
- Result count dùng `aria-live`.
- Form dùng label thật; required field dùng validation native.
- Status, overdue và visibility đều có text, không phụ thuộc chỉ vào màu.
- Focus-visible và reduced-motion kế thừa Admin/Design System.
- Loại bỏ tab stop dư trên Kanban card; chỉ link và action thật nhận focus.

## Final Taste audit

- **Speed:** entry point và action thường dùng ở đúng nơi; không thêm dashboard trung gian.
- **Table readability:** header yên tĩnh, numeric value dùng tabular numbers, row hover nhẹ, mobile không ép table thành cột quá hẹp.
- **Action hierarchy:** primary action giới hạn ở Add lead hoặc workflow chính; export/view switch/status action là secondary.
- **Compare density:** Pipeline summary, Kanban và Table tách vai trò, tránh một màn hình vừa là dashboard vừa là spreadsheet.
- **Color:** palette trung tính; màu chỉ nhấn primary, overdue, success và visibility.
- **Modal use:** không có modal trong CRM Phase 15; quick create dùng inline form hoặc page.
- **Mobile:** giữ tác vụ xem lead, gọi, đổi status, thêm note và follow-up trong tầm tay.

Impeccable detector không phát hiện anti-pattern trong Admin shell và toàn bộ components, pages, behavior/styles thuộc CRM sau vòng hardening.

## Files

### Data và shell

- `src/data/crm.ts`
- `src/components/CrmShell.astro`
- `src/components/CrmNav.astro`
- `src/components/CrmStatus.astro`
- `src/components/ActivityTimeline.astro`

### Pages

- `src/pages/admin/crm/index.astro`
- `src/pages/admin/crm/pipeline.astro`
- `src/pages/admin/crm/leads/new.astro`
- `src/pages/admin/crm/leads/[id].astro`
- `src/pages/admin/crm/customers/index.astro`
- `src/pages/admin/crm/customers/[id].astro`
- `src/pages/admin/crm/quotes/index.astro`
- `src/pages/admin/crm/quotes/[id].astro`
- `src/pages/admin/crm/activities.astro`
- `src/pages/admin/crm/follow-ups.astro`

### Behavior và styles

- `src/scripts/crm.ts`
- `src/styles/crm.css`
- `src/layouts/AdminLayout.astro`
- `src/components/AdminSidebar.astro`
- `src/components/AdminTopbar.astro`
- `src/scripts/admin.ts`

## Verification

- `npm run build`: đạt; Astro check 86 files, 0 errors, 0 warnings, 0 hints.
- Static build: đạt; 102 pages tổng cộng, trong đó 24 pages CRM.
- HTTP smoke test: 200 cho 10 route đại diện gồm list, create và dynamic detail.
- H1 audit: mỗi route đại diện có đúng một H1.
- Internal link audit: 24 CRM HTML files, 24 CRM links duy nhất, 0 link thiếu target.
- Impeccable detector: 0 findings trong phạm vi CRM và Admin shell liên quan.

## Giới hạn

- Browser tích hợp không có session khả dụng trong môi trường hiện tại nên chưa chạy được screenshot regression, pointer interaction, keyboard traversal toàn luồng hoặc đo viewport bằng browser thật. Responsive và keyboard semantics đã được kiểm tra ở source/output, nhưng vẫn nên chạy một vòng QA thật trên Chrome/Safari trước khi release.
- Search/filter, view switch, panel và feedback chạy client-side; create/update/export/upload/send chưa ghi dữ liệu thật.
- Permission, audit log bất biến, email/Zalo delivery, document storage và bảo vệ internal-only phải tiếp tục được backend enforce; UI label không phải security boundary.

## Kết luận

Phase 15 hoàn thành đúng phạm vi. Dừng tại đây và chờ `RUN PHASE 16`.
