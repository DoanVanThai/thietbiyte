import { db } from "@/server/db";
import type { AdminRole, AdminUser, UserStatus } from "@/data/admin-access";

const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });
const dateTime = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });
const statusMap = { ACTIVE: "active", PENDING: "pending", DISABLED: "disabled" } as const;
const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(-2).join("").toLocaleUpperCase("vi");

const mapRole = (role: any): AdminRole => ({
  id: role.id, name: role.name, description: role.description, protected: role.protected, immutable: role.immutable, isDefault: role.isDefault,
  userCount: role._count?.users || 0, permissionIds: role.permissions.map((link: any) => link.permissionId), updatedAt: date.format(role.updatedAt),
});
const mapUser = (user: any): AdminUser => ({
  id: user.id, name: user.name, initials: initials(user.name), email: user.email, phone: user.phone || "", organization: user.organization || "",
  organizationType: user.organizationType || "Chưa cập nhật", roleIds: user.roles.map((link: any) => link.roleId), status: statusMap[user.status as keyof typeof statusMap] as UserStatus,
  lastLogin: user.lastLoginAt ? dateTime.format(user.lastLoginAt) : null, createdAt: date.format(user.createdAt), location: user.province || "Chưa cập nhật",
});

export async function getRolesForAdmin() {
  const roles = await db.role.findMany({ include: { permissions: true, _count: { select: { users: true } } }, orderBy: [{ immutable: "desc" }, { name: "asc" }] });
  return roles.map(mapRole);
}
export async function getRoleForAdmin(id: string) {
  const role = await db.role.findUnique({ where: { id }, include: { permissions: true, _count: { select: { users: true } } } });
  return role ? mapRole(role) : null;
}
export async function getUsersForAdmin(page = 1, pageSize = 50) {
  const take = Math.min(100, Math.max(1, Math.trunc(pageSize)));
  const users = await db.user.findMany({ include: { roles: true }, orderBy: { createdAt: "desc" }, take, skip: (Math.max(1, Math.trunc(page)) - 1) * take });
  return users.map(mapUser);
}
export async function getUserForAdmin(id: string) {
  const user = await db.user.findUnique({ where: { id }, include: { roles: true } });
  return user ? mapUser(user) : null;
}
export async function getUserSecurityData(id: string, currentSessionId: string) {
  const [sessions, events] = await Promise.all([
    db.session.findMany({ where: { userId: id, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } }),
    db.auditLog.findMany({ where: { OR: [{ actorId: id }, { subjectId: id }] }, include: { actor: { select: { name: true } } }, take: 20, orderBy: { createdAt: "desc" } }),
  ]);
  return {
    sessions: sessions.map((session) => ({ id: session.id, device: session.userAgent || "Trình duyệt không xác định", location: "Vị trí được ẩn", lastActive: dateTime.format(session.lastSeenAt), current: session.id === currentSessionId })),
    events: events.map((event) => ({ time: dateTime.format(event.createdAt), action: event.action, context: event.resource || "Bảo mật", actor: event.actor?.name || "Hệ thống" })),
  };
}

export async function getAuditEventsForAdmin(limit = 100) {
  const take = Math.min(250, Math.max(1, Math.trunc(limit)));
  const events = await db.auditLog.findMany({
    take,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { id: true, name: true, email: true } } },
  });
  return events.map((event) => ({
    id: event.id,
    action: event.action,
    actor: event.actor?.name || "Hệ thống",
    actorEmail: event.actor?.email || "",
    actorId: event.actorId || "",
    subjectId: event.subjectId || "",
    resource: event.resource || "Hệ thống",
    outcome: event.outcome,
    ipFingerprint: event.ipHash ? event.ipHash.slice(0, 12) : "Không ghi nhận",
    metadata: event.metadata ? JSON.stringify(event.metadata, null, 2) : "",
    createdAt: event.createdAt.toISOString(),
    createdLabel: dateTime.format(event.createdAt),
  }));
}
