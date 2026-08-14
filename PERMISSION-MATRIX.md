# Permission Matrix — THIÊN LỘC GROUP

## Quy ước

- `view`: đọc dữ liệu trong phạm vi được phép.
- `create`, `edit`, `manage`, `publish`, `delete`, `assign`, `export`: quyền ghi hoặc quyền nhạy cảm riêng biệt.
- Có permission không đồng nghĩa được đọc mọi bản ghi. Sales Staff vẫn bị giới hạn theo assignment; Customer luôn bị giới hạn theo ownership.
- `SUPER_ADMIN` là role immutable. `WAREHOUSE` và `ACCOUNTANT` đã có trong kiến trúc để mở rộng sau.

## Permission catalog

| Module | Permission |
|---|---|
| Product | `product.view`, `product.create`, `product.edit`, `product.delete`, `product.publish` |
| Category | `category.view`, `category.manage` |
| Brand | `brand.view`, `brand.manage` |
| Quote | `quote.view`, `quote.edit`, `quote.assign` |
| Lead | `lead.view`, `lead.edit`, `lead.assign` |
| Customer | `customer.view`, `customer.edit` |
| Article | `article.view`, `article.manage`, `article.publish` |
| Document | `document.view`, `document.manage` |
| User | `user.view`, `user.manage` |
| Role | `role.view`, `role.manage` |
| Settings | `settings.view`, `settings.manage` |
| Audit | `audit.view` |
| Project | `project.view`, `project.edit` |
| Inventory | `inventory.view`, `inventory.manage` |
| Analytics | `analytics.view`, `analytics.export` |

## Role mặc định

| Role | Phạm vi |
|---|---|
| `SUPER_ADMIN` | Tất cả permission. Role và permission immutable qua UI/API thông thường. |
| `ADMIN` | Tất cả permission trừ `settings.manage`. |
| `PRODUCT_MANAGER` | Toàn bộ Product, Category, Brand, Document; thêm `analytics.view`. |
| `CONTENT_EDITOR` | Toàn bộ Article; `product.view`, `document.view`. |
| `SALES_MANAGER` | Toàn bộ Quote, Lead, Customer; `product.view`, `document.view`, `user.view`, `analytics.view`. |
| `SALES_STAFF` | `quote.view/edit`, `lead.view/edit`, `customer.view/edit`, `product.view`, `document.view`; chỉ record được phân công. |
| `TECHNICAL_STAFF` | `product.view/edit`, `document.view/manage`, `project.view/edit`, `inventory.view`. |
| `CUSTOMER` | `product.view`, `document.view`; portal áp ownership riêng, không được vào Admin. |
| `WAREHOUSE` | `product.view`, `inventory.view/manage`, `document.view`. Role chuẩn bị cho mở rộng. |
| `ACCOUNTANT` | `quote.view`, `customer.view`, `analytics.view/export`. Role chuẩn bị cho mở rộng. |

## Ma trận chức năng

| Khu vực / thao tác | Guest | Customer | Sales Staff | Sales Manager | Product Manager | Content Editor | Technical | Admin | Super Admin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Website public | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Customer Portal | — | Own data | — | — | — | — | — | — | — |
| Admin shell | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Xem sản phẩm Admin | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tạo/sửa/publish sản phẩm | — | — | — | — | ✓ | — | Edit only | ✓ | ✓ |
| Xóa sản phẩm | — | — | — | — | ✓ | — | — | ✓ | ✓ |
| Xem/sửa Quote | — | Own | Assigned | All | — | — | — | ✓ | ✓ |
| Phân công Quote | — | — | — | ✓ | — | — | — | ✓ | ✓ |
| Xem/sửa Lead/Customer | — | Own portal data | Assigned | All | — | — | — | ✓ | ✓ |
| Phân công Lead | — | — | — | ✓ | — | — | — | ✓ | ✓ |
| Quản lý bài viết | — | — | — | — | — | ✓ | — | ✓ | ✓ |
| Quản lý tài liệu | — | Granted | View | View | ✓ | View | ✓ | ✓ | ✓ |
| Xem User | — | — | — | ✓ | — | — | — | ✓ | ✓ |
| Gán Role / đổi trạng thái User | — | — | — | — | — | — | — | ✓ | ✓ |
| Xem Role/Permission | — | — | — | — | — | — | — | ✓ | ✓ |
| Sửa Role/Permission | — | — | — | — | — | — | — | ✓ | ✓ |
| Xem Audit | — | — | — | — | — | — | — | ✓ | ✓ |
| Sửa Settings | — | — | — | — | — | — | — | — | ✓ |

## Route/API enforcement matrix

| Target | Guard server |
|---|---|
| `/tai-khoan` và `/api/portal/**` | Authenticated Customer-only principal; query theo `actor.id`. |
| `/admin/san-pham` và `/api/admin/products/**` | `product.view/create/edit/publish/delete` theo action. |
| `/admin/du-lieu/**` và taxonomy API | `category.view/manage` hoặc `brand.view/manage`. |
| `/admin/crm/**` và `/api/crm/leads/**` | `lead.view/edit/assign` + assigned scope cho Sales Staff. |
| Quote CRM APIs | `quote.view/edit/assign` + assigned scope cho Sales Staff. |
| `/admin/users/**` | `user.view`; mutation cần `user.manage`. |
| `/admin/roles/**`, `/admin/permissions` | `role.view`; mutation cần `role.manage`. |
| `/api/admin/audit` | `audit.view`. |
| Settings/content/upload APIs | `settings.*`, `article.*`, `document.manage` tương ứng. |

## Test matrix tối thiểu

Các case tự động nằm trong `tests/server/rbac-matrix.test.ts`:

1. Guest gọi API protected → `401`.
2. Customer vào Admin hoặc gọi staff mutation → `403`.
3. Staff vào Portal → `403`.
4. Sales Staff sửa lead được giao, không có `lead.assign`.
5. Sales Manager có `lead.assign`/`quote.assign`, không có `user.manage`.
6. Product Manager quản lý Product/Category/Brand/Document, không có CRM/User.
7. Admin quản lý User/Role nhưng không có `settings.manage`.
8. Super Admin có toàn bộ permission nhưng role immutable vẫn không sửa qua endpoint thường.
9. Permission lạ bị reject.
10. Direct API guard quyết định độc lập với trạng thái nút trên UI.

