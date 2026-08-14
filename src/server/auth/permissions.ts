export const PERMISSIONS = [
  "product.view", "product.create", "product.edit", "product.delete", "product.publish",
  "category.view", "category.manage", "brand.view", "brand.manage",
  "quote.view", "quote.edit", "quote.assign",
  "lead.view", "lead.edit", "lead.assign",
  "customer.view", "customer.edit",
  "article.view", "article.manage", "article.publish",
  "document.view", "document.manage",
  "user.view", "user.manage", "role.view", "role.manage",
  "settings.view", "settings.manage", "audit.view",
  "project.view", "project.edit", "inventory.view", "inventory.manage", "analytics.view", "analytics.export",
] as const;

export type Permission = typeof PERMISSIONS[number];

export const DEFAULT_ROLE_IDS = [
  "super-admin", "admin", "product-manager", "content-editor", "sales-manager",
  "sales-staff", "technical-staff", "customer", "warehouse", "accountant",
] as const;

export type AuthPrincipal = {
  id: string;
  email: string;
  name: string;
  status: "PENDING" | "ACTIVE" | "DISABLED";
  roleIds: string[];
  permissions: Permission[];
  sessionId: string;
};

export const isPermission = (value: string): value is Permission => (PERMISSIONS as readonly string[]).includes(value);
export const can = (principal: Pick<AuthPrincipal, "permissions"> | null | undefined, permission: Permission) => Boolean(principal?.permissions.includes(permission));
export const canAny = (principal: Pick<AuthPrincipal, "permissions"> | null | undefined, permissions: Permission[]) => permissions.some((permission) => can(principal, permission));
export const isSuperAdmin = (principal: Pick<AuthPrincipal, "roleIds"> | null | undefined) => Boolean(principal?.roleIds.includes("super-admin"));
export const isCustomer = (principal: Pick<AuthPrincipal, "roleIds"> | null | undefined) => Boolean(principal?.roleIds.includes("customer"));
export const isStaff = (principal: Pick<AuthPrincipal, "roleIds"> | null | undefined) => Boolean(principal && principal.roleIds.some((role) => role !== "customer"));
export const isCustomerOnly = (principal: Pick<AuthPrincipal, "roleIds"> | null | undefined) => isCustomer(principal) && !isStaff(principal);

export const ROUTE_PERMISSIONS: Array<{ prefix: string; permission: Permission }> = [
  { prefix: "/admin/noi-dung", permission: "article.view" },
  { prefix: "/admin/tai-lieu", permission: "document.view" },
  { prefix: "/admin/media", permission: "document.view" },
  { prefix: "/admin/san-pham", permission: "product.view" },
  { prefix: "/admin/du-lieu/brand", permission: "brand.view" },
  { prefix: "/admin/du-lieu/specialty", permission: "category.view" },
  { prefix: "/admin/du-lieu/category", permission: "category.view" },
  { prefix: "/admin/cai-dat-noi-dung", permission: "settings.view" },
  { prefix: "/admin/audit-logs", permission: "audit.view" },
  { prefix: "/admin/bao-gia", permission: "quote.edit" },
  { prefix: "/admin/crm/quotes", permission: "quote.view" },
  { prefix: "/admin/crm/customers", permission: "customer.view" },
  { prefix: "/admin/crm", permission: "lead.view" },
  { prefix: "/admin/users", permission: "user.view" },
  { prefix: "/admin/roles", permission: "role.view" },
  { prefix: "/admin/permissions", permission: "role.view" },
];
