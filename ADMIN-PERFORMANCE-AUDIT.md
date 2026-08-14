# Admin Performance Audit

Ngày audit: 14/08/2026  
Phạm vi: `/admin`, sản phẩm, taxonomy, CRM yêu cầu mới, phân quyền, audit log, nội dung website và báo giá PDF.

## Kết luận

Độ trễ cảm nhận chủ yếu không đến từ một API đơn lẻ mà từ kiến trúc điều hướng: mỗi link Admin tạo document navigation mới, shell bị dựng lại, script khởi tạo lại không nhất quán và mọi route đều chạy truy vấn báo giá đầy đủ cho chuông thông báo. Trang sản phẩm còn dùng cùng DTO chi tiết cho cả bảng danh sách nên tải toàn bộ gallery, features, configurations, specifications và documents của mọi sản phẩm.

Ưu tiên đúng là sửa navigation trước, sau đó thu gọn dữ liệu và phân trang. Không có React/TanStack Query trong project; thêm chúng chỉ để cache sẽ làm bundle và độ phức tạp tăng không cần thiết.

## Root causes

| Mức | Nguyên nhân | Bằng chứng | Tác động |
|---|---|---|---|
| P0 | Admin chưa có client router | Sidebar dùng link nội bộ nhưng layout không có `ClientRouter` | Shell trắng/đổi toàn bộ document khi chuyển module |
| P0 | Shell bị khai báo lặp | Dashboard và `CrmShell` tự dựng Sidebar/Topbar bên trong `bare` layout | Khó giữ cùng DOM instance, dễ lệch hành vi |
| P0 | Script chỉ khởi tạo một lần | Astro bundled scripts không tự chạy lại khi client navigation quay lại route | Filter/menu có nguy cơ mất tương tác |
| P1 | Topbar lấy toàn bộ quote | `AdminTopbar` gọi `crmViewQuotes`, gồm customer organization, assigned user, items và product | Truy vấn không cần thiết trên mọi route |
| P2 | Product list dùng giant DTO | `listAdminCatalog()` gọi `listAll()` với mọi relation | Payload và thời gian tăng theo độ sâu dữ liệu, không chỉ số row |
| P2 | List/filter chạy toàn bộ ở client | Bảng nhận toàn catalog rồi mới lọc và giả lập pagination | Không chịu được 1.000–10.000 bản ghi |
| P1 | Mutation reload route | Taxonomy, CRM và access dùng `location.reload()` | Mất state, dựng lại toàn Admin |
| P4 | Filter chưa nằm trong URL | Search/filter biến mất khi back | Trải nghiệm list → detail → back kém |
| P1 | Auth query ở từng request | Middleware xác minh session + role/permission từ DB | Là chi phí nền còn lại của mọi SSR navigation |

## Routing và layout

Kiến trúc trước audit:

```text
AdminLayout
└── từng page tự quyết định có dựng Sidebar/Topbar hay không
```

Kiến trúc sau tối ưu:

```text
AdminLayout + ClientRouter
├── Sidebar (persistent DOM)
├── Topbar
└── Main content (swap theo route)
```

Dashboard và CRM đã dùng chung một shell. Sidebar giữ DOM instance qua navigation. Topbar vẫn được server cập nhật theo route để breadcrumb và notification không bị cũ vô thời hạn; truy vấn notification đã được rút gọn và cache ngắn.

## Data và request audit

- Dashboard trước đây tải full product catalog chỉ để lấy count và tối đa vài mục search.
- Product table trước đây tải mọi quan hệ chi tiết; editor và list không có DTO riêng.
- Chuông notification trước đây tải toàn bộ danh sách quote, sau đó mới lọc `draft` trên server component.
- Taxonomy dùng versioned cache sẵn có trong content repository; không cần thêm một client cache mới.
- Các truy vấn độc lập của Dashboard metrics và product summary nay chạy song song bằng `Promise.all`.
- CRM quote list và product list đã có server pagination 50 row/request.

## Database audit

Index hiện có đã phù hợp với các filter chính:

- Product: `status`, `brandId`, `categoryId`, `type`, `featured`, `createdAt`, cùng composite status/type/featured.
- QuoteRequest: `status`, `customerId`, `assignedToId`, `createdAt`, composite status + createdAt và assigned + createdAt.
- Lead/Customer: có index cho trạng thái, người phụ trách, phone/email theo schema hiện tại.

Không thêm index mới theo cảm tính. Search hiện dùng `contains` trên name/model/SKU; với dữ liệu thực vượt đáng kể 10.000 row nên đo `EXPLAIN ANALYZE` trước khi cân nhắc PostgreSQL trigram index.

Migration `20260814000100_configuration_quote_images` đã được deploy để schema database khớp Prisma Client. Đây là migration thêm cột nullable, không xóa hay chuyển đổi dữ liệu.

## Bundle và rendering audit

- Code split theo route đã tồn tại và được giữ nguyên: Dashboard không tải Product Editor, CRM hay PDF builder.
- Icon dùng CSS đã generate theo tập icon thực tế, không có giant runtime icon registry.
- Thumbnail sản phẩm có kích thước khai báo và `loading="lazy"`.
- Không thêm page fade, virtualization, memoization hoặc framework state mới.
- Client router thêm runtime chung khoảng 14,8 KB uncompressed; đây là chi phí có chủ đích để loại full document navigation.

## Authentication

Session/permission được lấy một lần trong middleware cho mỗi request và tái sử dụng qua `Astro.locals` trong cây component. Chưa cache kết quả auth qua nhiều request vì đây là dữ liệu bảo mật: role bị thu hồi cần có hiệu lực ngay. Đây là bottleneck còn lại có chủ đích, không phải lỗi nhân bản trong component.

## Rủi ro và bottleneck còn lại

1. `/admin/bao-gia` vẫn cần catalog chi tiết để dựng mô tả/cấu hình cho mọi lựa chọn. Với hàng nghìn sản phẩm, bước tiếp theo nên là remote combobox + fetch detail theo `productId`; route này đã bị loại khỏi nhóm prefetch sớm để không ảnh hưởng Dashboard.
2. CRM `quotes` đã phân trang; các list CRM khác như leads/customers vẫn nên có endpoint pagination riêng trước khi dữ liệu thực đạt hàng nghìn row.
3. Các section legacy `noi-dung`, `du-an`, `tai-lieu`, `media` vẫn nằm chung trong HTML Dashboard. Nên tách thành route riêng khi bắt đầu dùng dữ liệu thật.
4. Không có browser runtime khả dụng trong môi trường audit, nên slow-network và rapid-click được xác minh bằng lifecycle/source tests và build, chưa có trace DevTools/Lighthouse có đăng nhập.
5. Chưa thêm SWR client cho product list. Astro giữ nội dung cũ trong lúc chuẩn bị route và prefetch response; mutation cần dữ liệu mới nên hiện dùng soft refresh có scope thay vì cache phức tạp.

## Tài liệu kỹ thuật tham chiếu

- [Astro view transitions và ClientRouter](https://docs.astro.build/en/guides/view-transitions/)
- [Astro prefetch configuration](https://docs.astro.build/en/reference/configuration-reference/)

