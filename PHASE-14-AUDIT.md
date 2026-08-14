# PHASE 14 - ADMIN USERS + ROLES + PERMISSIONS UI AUDIT

Ngày hoàn thành: 13/08/2026

## Phạm vi

Phase 14 triển khai giao diện quản lý người dùng, vai trò và quyền trong Admin hiện có. Không triển khai backend authorization hoặc Phase 15.

## Design read

Đây là công cụ nội bộ dành cho quản trị viên, sales, sản phẩm và kỹ thuật. Giao diện ưu tiên scan nhanh, mật độ hợp lý và phân nhóm nghiệp vụ rõ ràng.

- Design variance: 2/10.
- Motion intensity: 1/10.
- Visual density: 8/10.
- Giữ nguyên Admin shell, Be Vietnam Pro, semantic tokens, spacing, radius, button và icon language hiện có.
- Bảng, row, divider và disclosure được dùng thay cho card grid lặp lại.

## Routes

- `/admin/users`
- `/admin/users/[id]`
- `/admin/roles`
- `/admin/roles/[id]`
- `/admin/permissions`

Static build tạo 8 user detail routes và 11 role editor routes.

## Users

User table gồm:

- User.
- Email.
- Organization.
- Role.
- Status.
- Last Login.
- Created.
- Actions.

Search tìm theo tên, email và tổ chức. Filter hỗ trợ vai trò, trạng thái và loại tổ chức. Empty state hướng dẫn thay từ khóa hoặc xóa bộ lọc.

Actions được hiển thị trực tiếp trong hàng thay vì dropdown nằm trong vùng `overflow`, tránh menu bị cắt khi bảng cuộn ngang.

## Default roles

Đủ 10 vai trò mặc định:

1. Super Admin.
2. Admin.
3. Product Manager.
4. Content Editor.
5. Sales Manager.
6. Sales Staff.
7. Technical Staff.
8. Warehouse.
9. Accountant.
10. Customer.

Một vai trò tùy chỉnh `Tư vấn dự án` được thêm để thể hiện delete-role flow mà không cho phép xóa role mặc định.

## User detail

Mỗi user detail có:

- Profile và thông tin liên hệ.
- Organization và organization type.
- Roles và status.
- Recent activity.
- Sessions nếu có dữ liệu.
- Audit activity.
- Edit, remove Admin, disable user và session revocation actions theo ngữ cảnh.

Super Admin có notice bảo vệ và không render action vô hiệu hóa.

## Role management

Role table gồm Role, Users, Permissions, Updated và Actions.

Role editor gồm:

- Role Name.
- Description.
- Permission count.
- 11 permission groups có thể mở/thu gọn.
- Select group và Clear group.
- Expand all và Collapse all.
- Sensitive permission indicator.

30 permissions được nhóm theo Products, Quotes, CRM, Customers, Users, Content, Documents, Projects, Inventory, Analytics và Settings. Không có danh sách 100 checkbox phẳng.

## Permission matrix

- Permission là cột sticky bên trái.
- Role headers sticky phía trên trong từng nhóm.
- So sánh Super Admin, Admin, Sales Manager, Product Manager và Technical Staff.
- Mỗi permission group dùng native disclosure để collapse.
- Select và Clear được áp dụng theo từng role trong từng group.
- Container cuộn cục bộ trên viewport hẹp, không làm tràn toàn page.

## Safety UX

Native dialog tùy biến được dùng thay cho `window.confirm` trong các flow:

- Disable user.
- Remove Admin.
- Delete custom role.
- End session.
- End other sessions.

Dialog mô tả đối tượng, tác động và điều kiện backend cần xác nhận. Default role và protected role hiển thị action khóa thay vì cho xóa.

## Super Admin

- Toàn bộ permission checkbox trong Super Admin role editor bị disabled.
- Cột Super Admin trong matrix bị disabled và hiển thị lock icon.
- User detail của Super Admin nêu rõ vai trò thấp hơn không được gỡ quyền hoặc vô hiệu hóa tài khoản.
- UI không cung cấp cơ chế mở khóa giả.

## Backend compatibility

- UI chỉ tạo access-management contract và interaction states.
- Backend vẫn phải kiểm tra authorization trên từng request.
- Backend phải chặn privilege escalation, bảo vệ Super Admin và last-admin rules.
- Role/user changes cần audit log phía server.
- Delete role phải kiểm tra user dependency hoặc role replacement.
- Session revocation phải dùng session/token store thực tế.
- Ẩn nút hoặc disabled checkbox không được xem là security enforcement.

## Responsive audit

| Viewport | Hành vi |
| --- | --- |
| Desktop | Admin sidebar hiện có, table đầy đủ, role editor hai cột, permission matrix sticky |
| Dưới 1180px | Filter bar chuyển ba cột, search chiếm hàng riêng |
| Dưới 900px | Dùng mobile Admin drawer hiện có; user detail và role information chuyển một cột |
| Dưới 680px | Header/action xếp dọc, summary 2 cột, form và permission options một cột, table/matrix cuộn cục bộ |

Permission matrix không ép năm role columns vào chiều rộng mobile. Người dùng cuộn ngang trong matrix và vẫn giữ cột Permission sticky để duy trì ngữ cảnh.

## Accessibility

- Mỗi route có một H1.
- Tables có caption, `scope=col` và `scope=row` phù hợp.
- Filter có label thật.
- Icon-only action có accessible label và title.
- Matrix checkbox có label chứa role và permission.
- Dialog liên kết title và description bằng ARIA.
- Toast dùng live region.
- Native details/summary hỗ trợ keyboard cho group collapse.
- Focus style và reduced motion kế thừa Design System/Admin shell.
- Nội dung quan trọng trong Phase 14 từ 13px trở lên.

## Final Taste audit

- **Density:** bảng dùng row 48-56px, metadata compact và action giảm cấp.
- **Grouping:** 30 permissions chia 11 nhóm nghiệp vụ.
- **Scanability:** sticky table headers, sticky permission column, role/status treatment nhất quán.
- **Card repetition:** chỉ main surface dùng container; detail và permission content dùng divider/disclosure.
- **Hierarchy:** page title, filters, result metadata, table và destructive actions có độ ưu tiên rõ.
- **Navigation:** Users, Roles và Matrix là ba route thật trong System navigation.
- **Safety:** không dùng browser confirm, không cho xóa default/protected role và khóa Super Admin.
- **Anti-template:** không gradient, glass, glow, giant heading, decorative animation hoặc card soup.

## Files

### Data

- `src/data/admin-access.ts`

### Layout và navigation

- `src/layouts/AdminAccessLayout.astro`
- `src/components/AdminSidebar.astro`

### Pages

- `src/pages/admin/users/index.astro`
- `src/pages/admin/users/[id].astro`
- `src/pages/admin/roles/index.astro`
- `src/pages/admin/roles/[id].astro`
- `src/pages/admin/permissions.astro`

### Behavior và styles

- `src/scripts/admin-access.ts`
- `src/scripts/admin.ts`
- `src/styles/admin-access.css`

## Verification

- `npm run check`: đạt, 86 files, 0 errors, 0 warnings, 0 hints.
- `npm run build`: đạt, 102 static pages.
- HTTP 200: Users, Super Admin user detail, Admin user detail, Roles, Super Admin role editor, Sales Staff role editor và Permission Matrix.
- Markup: 8 user rows, 4 filter controls, 11 role editor links, 11 permission groups và 30 permission checkboxes.
- Permission Matrix: 11 collapsible groups và năm role columns trong mỗi group.
- Impeccable detector: 0 findings trên các file Phase 14.

## Giới hạn

- Browser tích hợp không có session khả dụng, nên chưa chạy screenshot regression, keyboard traversal hoặc thao tác dialog/matrix bằng browser thật.
- Dữ liệu người dùng, vai trò, activity và session hiện là dữ liệu minh họa cho UI contract.
- Các thao tác tạo, lưu, xóa, gán role và thu hồi session chưa gửi request tới backend.

## Kết luận

Phase 14 hoàn thành đúng phạm vi. Dừng tại đây và chờ `RUN PHASE 15`.
