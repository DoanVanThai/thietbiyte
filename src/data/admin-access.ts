export type UserStatus = "active" | "pending" | "disabled";

export interface AdminUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  organization: string;
  organizationType: string;
  roleIds: string[];
  status: UserStatus;
  lastLogin: string | null;
  createdAt: string;
  location: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissionIds: string[];
  updatedAt: string;
  protected?: boolean;
  immutable?: boolean;
  isDefault?: boolean;
}

export interface PermissionDefinition {
  id: string;
  label: string;
  description: string;
  sensitive?: boolean;
}

export interface PermissionGroup {
  id: string;
  label: string;
  description: string;
  permissions: PermissionDefinition[];
}

export const permissionGroups: PermissionGroup[] = [
  {
    id: "products",
    label: "Sản phẩm",
    description: "Danh mục, thông tin kỹ thuật và trạng thái xuất bản.",
    permissions: [
      { id: "product.view", label: "Xem sản phẩm", description: "Xem danh sách và chi tiết sản phẩm." },
      { id: "product.create", label: "Tạo sản phẩm", description: "Tạo bản ghi sản phẩm mới." },
      { id: "product.edit", label: "Sửa sản phẩm", description: "Chỉnh sửa nội dung và thông số." },
      { id: "product.delete", label: "Xóa sản phẩm", description: "Xóa sản phẩm khỏi hệ thống.", sensitive: true },
      { id: "product.publish", label: "Xuất bản sản phẩm", description: "Thay đổi trạng thái hiển thị công khai.", sensitive: true },
      { id: "category.view", label: "Xem danh mục", description: "Xem cấu trúc danh mục sản phẩm." },
      { id: "category.manage", label: "Quản lý danh mục", description: "Tạo và chỉnh sửa danh mục." },
      { id: "brand.view", label: "Xem thương hiệu", description: "Xem dữ liệu thương hiệu." },
      { id: "brand.manage", label: "Quản lý thương hiệu", description: "Tạo và chỉnh sửa thương hiệu." },
    ],
  },
  {
    id: "quotes",
    label: "Báo giá",
    description: "Tiếp nhận, phân công và xử lý yêu cầu báo giá.",
    permissions: [
      { id: "quote.view", label: "Xem báo giá", description: "Xem yêu cầu và báo giá được phép truy cập." },
      { id: "quote.edit", label: "Sửa báo giá", description: "Cập nhật nội dung và trạng thái báo giá." },
      { id: "quote.assign", label: "Phân công báo giá", description: "Giao báo giá cho nhân viên phụ trách.", sensitive: true },
    ],
  },
  {
    id: "leads",
    label: "Leads",
    description: "Cơ hội, ghi chú và hoạt động chăm sóc khách hàng.",
    permissions: [
      { id: "lead.view", label: "Xem lead", description: "Xem pipeline và lead được phân quyền." },
      { id: "lead.edit", label: "Cập nhật lead", description: "Cập nhật lead, activity, note và follow-up." },
      { id: "lead.assign", label: "Phân công lead", description: "Phân công lead cho nhân viên sales.", sensitive: true },
    ],
  },
  {
    id: "customers",
    label: "Khách hàng",
    description: "Hồ sơ cá nhân và tổ chức khách hàng.",
    permissions: [
      { id: "customer.view", label: "Xem khách hàng", description: "Xem hồ sơ khách hàng được phép truy cập." },
      { id: "customer.edit", label: "Sửa khách hàng", description: "Cập nhật thông tin hồ sơ khách hàng." },
    ],
  },
  {
    id: "users",
    label: "Người dùng",
    description: "Tài khoản nội bộ, khách hàng và trạng thái truy cập.",
    permissions: [
      { id: "user.view", label: "Xem người dùng", description: "Xem danh sách và hồ sơ người dùng." },
      { id: "user.manage", label: "Quản lý người dùng", description: "Tạo, sửa, vô hiệu hóa và gán vai trò.", sensitive: true },
      { id: "role.view", label: "Xem vai trò", description: "Xem vai trò và ma trận quyền." },
      { id: "role.manage", label: "Quản lý vai trò", description: "Tạo vai trò và thay đổi quyền.", sensitive: true },
    ],
  },
  {
    id: "content",
    label: "Nội dung",
    description: "Bài viết, kiến thức và nội dung website.",
    permissions: [
      { id: "article.view", label: "Xem bài viết", description: "Xem nội dung trong hệ thống quản trị." },
      { id: "article.manage", label: "Quản lý bài viết", description: "Tạo và chỉnh sửa nội dung." },
      { id: "article.publish", label: "Xuất bản bài viết", description: "Đưa nội dung lên website.", sensitive: true },
    ],
  },
  {
    id: "documents",
    label: "Tài liệu",
    description: "Catalogue, hướng dẫn và tài liệu hạn chế truy cập.",
    permissions: [
      { id: "document.view", label: "Xem tài liệu", description: "Xem tài liệu theo phạm vi được cấp." },
      { id: "document.manage", label: "Quản lý tài liệu", description: "Tải lên, phân loại và đặt access level.", sensitive: true },
    ],
  },
  {
    id: "projects",
    label: "Dự án",
    description: "Hồ sơ dự án và tiến độ triển khai.",
    permissions: [
      { id: "project.view", label: "Xem dự án", description: "Xem dự án được phân quyền." },
      { id: "project.edit", label: "Cập nhật dự án", description: "Cập nhật thông tin và tiến độ dự án." },
    ],
  },
  {
    id: "inventory",
    label: "Kho",
    description: "Tồn kho và luồng nhập xuất thiết bị.",
    permissions: [
      { id: "inventory.view", label: "Xem tồn kho", description: "Xem số lượng và trạng thái tồn kho." },
      { id: "inventory.manage", label: "Quản lý tồn kho", description: "Cập nhật nhập, xuất và điều chỉnh kho.", sensitive: true },
    ],
  },
  {
    id: "analytics",
    label: "Phân tích",
    description: "Báo cáo kinh doanh và hoạt động hệ thống.",
    permissions: [
      { id: "analytics.view", label: "Xem phân tích", description: "Xem dashboard và báo cáo được cấp." },
      { id: "analytics.export", label: "Xuất báo cáo", description: "Tải dữ liệu báo cáo ra khỏi hệ thống.", sensitive: true },
    ],
  },
  {
    id: "settings",
    label: "Cài đặt",
    description: "Cấu hình dùng chung và chính sách hệ thống.",
    permissions: [
      { id: "settings.view", label: "Xem cài đặt", description: "Xem cấu hình hệ thống." },
      { id: "settings.manage", label: "Quản lý cài đặt", description: "Thay đổi cấu hình toàn hệ thống.", sensitive: true },
      { id: "audit.view", label: "Xem audit log", description: "Xem lịch sử thao tác bảo mật." },
    ],
  },
];

const allPermissionIds = permissionGroups.flatMap((group) => group.permissions.map((permission) => permission.id));

const permissionsFor = (...prefixes: string[]) => allPermissionIds.filter((permission) => prefixes.some((prefix) => permission.startsWith(prefix)));

export const adminRoles: AdminRole[] = [
  { id: "super-admin", name: "Super Admin", description: "Toàn quyền hệ thống. Quyền được khóa và không thể sửa bởi vai trò thấp hơn.", userCount: 2, permissionIds: allPermissionIds, updatedAt: "12/08/2026", protected: true, immutable: true, isDefault: true },
  { id: "admin", name: "Admin", description: "Quản trị vận hành, người dùng và cấu hình trong phạm vi được giao.", userCount: 4, permissionIds: allPermissionIds.filter((id) => id !== "settings.manage"), updatedAt: "10/08/2026", protected: true, isDefault: true },
  { id: "product-manager", name: "Product Manager", description: "Quản lý sản phẩm, tài liệu và dữ liệu kỹ thuật.", userCount: 6, permissionIds: [...permissionsFor("product.", "document."), "analytics.view"], updatedAt: "08/08/2026", isDefault: true },
  { id: "content-editor", name: "Content Editor", description: "Biên tập và xuất bản nội dung website.", userCount: 5, permissionIds: [...permissionsFor("article."), "product.view", "document.view"], updatedAt: "05/08/2026", isDefault: true },
  { id: "sales-manager", name: "Sales Manager", description: "Quản lý báo giá, CRM, khách hàng và đội ngũ sales.", userCount: 3, permissionIds: [...permissionsFor("quote.", "lead.", "customer."), "user.view", "analytics.view"], updatedAt: "11/08/2026", isDefault: true },
  { id: "sales-staff", name: "Sales Staff", description: "Xử lý báo giá, cơ hội và khách hàng được phân công.", userCount: 18, permissionIds: ["quote.view", "quote.edit", "lead.view", "lead.edit", "customer.view", "customer.edit", "product.view", "document.view"], updatedAt: "01/08/2026", isDefault: true },
  { id: "technical-staff", name: "Technical Staff", description: "Truy cập hồ sơ kỹ thuật, dự án và tài liệu thiết bị.", userCount: 9, permissionIds: ["product.view", "product.edit", "document.view", "document.manage", "project.view", "project.edit", "inventory.view"], updatedAt: "07/08/2026", isDefault: true },
  { id: "warehouse", name: "Warehouse", description: "Theo dõi và cập nhật luồng nhập xuất kho.", userCount: 7, permissionIds: ["product.view", "inventory.view", "inventory.manage", "document.view"], updatedAt: "02/08/2026", isDefault: true },
  { id: "accountant", name: "Accountant", description: "Theo dõi báo giá và báo cáo phục vụ kế toán.", userCount: 4, permissionIds: ["quote.view", "customer.view", "analytics.view", "analytics.export"], updatedAt: "06/08/2026", isDefault: true },
  { id: "customer", name: "Customer", description: "Truy cập tài khoản và tài liệu dành cho khách hàng.", userCount: 248, permissionIds: ["product.view", "document.view"], updatedAt: "30/07/2026", protected: true, isDefault: true },
  { id: "project-consultant", name: "Tư vấn dự án", description: "Vai trò tùy chỉnh cho nhóm tư vấn và triển khai dự án.", userCount: 3, permissionIds: ["project.view", "project.edit", "quote.view", "lead.view", "customer.view", "product.view"], updatedAt: "09/08/2026" },
];

export const adminUsers: AdminUser[] = [
  { id: "u001", name: "Nguyễn Minh Anh", initials: "MA", email: "minhanh@thienlocgroup.com", phone: "0901 234 567", organization: "THIÊN LỘC GROUP", organizationType: "Nội bộ", roleIds: ["super-admin"], status: "active", lastLogin: "13/08/2026, 09:42", createdAt: "15/01/2024", location: "TP. Hồ Chí Minh" },
  { id: "u002", name: "Trần Quốc Huy", initials: "QH", email: "quochuy@thienlocgroup.com", phone: "0902 345 678", organization: "THIÊN LỘC GROUP", organizationType: "Nội bộ", roleIds: ["admin"], status: "active", lastLogin: "13/08/2026, 08:15", createdAt: "22/02/2024", location: "Hà Nội" },
  { id: "u003", name: "Lê Thanh Hà", initials: "TH", email: "thanhha@thienlocgroup.com", phone: "0903 456 789", organization: "THIÊN LỘC GROUP", organizationType: "Nội bộ", roleIds: ["sales-manager"], status: "active", lastLogin: "12/08/2026, 17:28", createdAt: "03/03/2024", location: "Đà Nẵng" },
  { id: "u004", name: "Phạm Gia Bảo", initials: "GB", email: "giabao@thienlocgroup.com", phone: "0904 567 890", organization: "THIÊN LỘC GROUP", organizationType: "Nội bộ", roleIds: ["product-manager"], status: "active", lastLogin: "12/08/2026, 15:09", createdAt: "18/04/2024", location: "TP. Hồ Chí Minh" },
  { id: "u005", name: "Vũ Khánh Linh", initials: "KL", email: "khanhlinh@thienlocgroup.com", phone: "0905 678 901", organization: "THIÊN LỘC GROUP", organizationType: "Nội bộ", roleIds: ["content-editor"], status: "pending", lastLogin: null, createdAt: "11/08/2026", location: "Hà Nội" },
  { id: "u006", name: "Đỗ Hoàng Nam", initials: "HN", email: "hoangnam@thienlocgroup.com", phone: "0906 789 012", organization: "THIÊN LỘC GROUP", organizationType: "Nội bộ", roleIds: ["technical-staff"], status: "disabled", lastLogin: "05/08/2026, 11:20", createdAt: "08/05/2024", location: "Cần Thơ" },
  { id: "u007", name: "BS. Nguyễn Hải Yến", initials: "HY", email: "haiyen@phongkhamminhtam.vn", phone: "0907 890 123", organization: "Phòng khám Minh Tâm", organizationType: "Phòng khám", roleIds: ["customer"], status: "active", lastLogin: "10/08/2026, 14:36", createdAt: "17/06/2026", location: "Bình Dương" },
  { id: "u008", name: "Công ty Thiết bị An Phú", initials: "AP", email: "muasam@anphumed.vn", phone: "0908 901 234", organization: "An Phú Medical", organizationType: "Đại lý", roleIds: ["customer"], status: "active", lastLogin: "09/08/2026, 10:04", createdAt: "02/07/2026", location: "Đồng Nai" },
];

export const getAdminRole = (id: string) => adminRoles.find((role) => role.id === id);
export const getAdminUser = (id: string) => adminUsers.find((user) => user.id === id);
export const roleName = (id: string) => getAdminRole(id)?.name || id;

export const recentUserActivity = [
  { time: "13/08/2026, 09:42", action: "Đăng nhập thành công", context: "Chrome trên macOS", actor: "Người dùng" },
  { time: "12/08/2026, 16:18", action: "Cập nhật sản phẩm", context: "SonoPort 8", actor: "Nguyễn Minh Anh" },
  { time: "12/08/2026, 10:05", action: "Phê duyệt vai trò", context: "Product Manager", actor: "Nguyễn Minh Anh" },
  { time: "11/08/2026, 14:22", action: "Tải tài liệu", context: "Catalogue thiết bị", actor: "Người dùng" },
];

export const userSessions = [
  { device: "Chrome trên macOS", location: "TP. Hồ Chí Minh", lastActive: "Đang hoạt động", current: true },
  { device: "Safari trên iPhone", location: "TP. Hồ Chí Minh", lastActive: "12/08/2026, 20:14", current: false },
];
