import type { Permission } from "./permissions";

export const permissionCatalog: Array<{ id: Permission; label: string; description: string; sensitive?: boolean }> = [
  { id: "product.view", label: "Xem sản phẩm", description: "Xem danh sách và chi tiết sản phẩm." },
  { id: "product.create", label: "Tạo sản phẩm", description: "Tạo sản phẩm mới." },
  { id: "product.edit", label: "Sửa sản phẩm", description: "Chỉnh sửa nội dung và thông số." },
  { id: "product.delete", label: "Xóa sản phẩm", description: "Xóa sản phẩm khỏi hệ thống.", sensitive: true },
  { id: "product.publish", label: "Xuất bản sản phẩm", description: "Thay đổi trạng thái công khai.", sensitive: true },
  { id: "category.view", label: "Xem danh mục", description: "Xem cấu trúc danh mục." },
  { id: "category.manage", label: "Quản lý danh mục", description: "Tạo và sửa danh mục." },
  { id: "brand.view", label: "Xem thương hiệu", description: "Xem dữ liệu thương hiệu." },
  { id: "brand.manage", label: "Quản lý thương hiệu", description: "Tạo và sửa thương hiệu." },
  { id: "quote.view", label: "Xem báo giá", description: "Xem yêu cầu báo giá trong phạm vi." },
  { id: "quote.edit", label: "Sửa báo giá", description: "Cập nhật báo giá và trạng thái." },
  { id: "quote.assign", label: "Phân công báo giá", description: "Giao báo giá cho nhân viên.", sensitive: true },
  { id: "lead.view", label: "Xem lead", description: "Xem lead trong phạm vi được giao." },
  { id: "lead.edit", label: "Sửa lead", description: "Cập nhật lead và hoạt động." },
  { id: "lead.assign", label: "Phân công lead", description: "Giao lead cho nhân viên.", sensitive: true },
  { id: "customer.view", label: "Xem khách hàng", description: "Xem hồ sơ khách hàng trong phạm vi." },
  { id: "customer.edit", label: "Sửa khách hàng", description: "Cập nhật hồ sơ khách hàng." },
  { id: "article.view", label: "Xem bài viết", description: "Xem nội dung quản trị." },
  { id: "article.manage", label: "Quản lý bài viết", description: "Tạo và chỉnh sửa bài viết." },
  { id: "article.publish", label: "Xuất bản bài viết", description: "Đưa bài viết lên website.", sensitive: true },
  { id: "document.view", label: "Xem tài liệu", description: "Xem tài liệu theo access level." },
  { id: "document.manage", label: "Quản lý tài liệu", description: "Tải lên và đặt quyền truy cập.", sensitive: true },
  { id: "user.view", label: "Xem người dùng", description: "Xem danh sách và hồ sơ người dùng." },
  { id: "user.manage", label: "Quản lý người dùng", description: "Sửa, vô hiệu hóa và gán vai trò.", sensitive: true },
  { id: "role.view", label: "Xem vai trò", description: "Xem vai trò và ma trận quyền." },
  { id: "role.manage", label: "Quản lý vai trò", description: "Tạo vai trò và thay đổi quyền.", sensitive: true },
  { id: "settings.view", label: "Xem cài đặt", description: "Xem cấu hình hệ thống." },
  { id: "settings.manage", label: "Quản lý cài đặt", description: "Thay đổi cấu hình hệ thống.", sensitive: true },
  { id: "audit.view", label: "Xem audit log", description: "Xem lịch sử thao tác bảo mật." },
  { id: "project.view", label: "Xem dự án", description: "Xem dự án được phân quyền." },
  { id: "project.edit", label: "Cập nhật dự án", description: "Cập nhật thông tin dự án." },
  { id: "inventory.view", label: "Xem tồn kho", description: "Xem trạng thái tồn kho." },
  { id: "inventory.manage", label: "Quản lý tồn kho", description: "Cập nhật luồng nhập xuất.", sensitive: true },
  { id: "analytics.view", label: "Xem phân tích", description: "Xem dashboard và báo cáo." },
  { id: "analytics.export", label: "Xuất báo cáo", description: "Xuất dữ liệu báo cáo.", sensitive: true },
];

const everyPermission = permissionCatalog.map(({ id }) => id);
const matching = (...prefixes: string[]) => everyPermission.filter((id) => prefixes.some((prefix) => id.startsWith(prefix)));

export const defaultRoles = [
  { id: "super-admin", name: "Super Admin", description: "Toàn quyền hệ thống; quyền được khóa.", protected: true, immutable: true, permissions: everyPermission },
  { id: "admin", name: "Admin", description: "Quản trị vận hành trong phạm vi được giao.", protected: true, permissions: everyPermission.filter((id) => id !== "settings.manage") },
  { id: "product-manager", name: "Product Manager", description: "Quản lý sản phẩm, phân loại và tài liệu kỹ thuật.", permissions: [...matching("product.", "category.", "brand.", "document."), "analytics.view"] },
  { id: "content-editor", name: "Content Editor", description: "Biên tập và xuất bản nội dung website.", permissions: [...matching("article."), "product.view", "document.view"] },
  { id: "sales-manager", name: "Sales Manager", description: "Quản lý báo giá, CRM và đội ngũ sales.", permissions: [...matching("quote.", "lead.", "customer."), "product.view", "document.view", "user.view", "analytics.view"] },
  { id: "sales-staff", name: "Sales Staff", description: "Xử lý lead, báo giá và khách hàng được giao.", permissions: ["quote.view", "quote.edit", "lead.view", "lead.edit", "customer.view", "customer.edit", "product.view", "document.view"] },
  { id: "technical-staff", name: "Technical Staff", description: "Quản lý dữ liệu kỹ thuật, dự án và tài liệu.", permissions: ["product.view", "product.edit", "document.view", "document.manage", "project.view", "project.edit", "inventory.view"] },
  { id: "customer", name: "Customer", description: "Truy cập dữ liệu của chính khách hàng.", protected: true, permissions: ["product.view", "document.view"] },
  { id: "warehouse", name: "Warehouse", description: "Theo dõi và cập nhật kho.", permissions: ["product.view", "inventory.view", "inventory.manage", "document.view"] },
  { id: "accountant", name: "Accountant", description: "Xem báo giá và báo cáo kế toán.", permissions: ["quote.view", "customer.view", "analytics.view", "analytics.export"] },
] satisfies Array<{ id: string; name: string; description: string; protected?: boolean; immutable?: boolean; permissions: Permission[] }>;

