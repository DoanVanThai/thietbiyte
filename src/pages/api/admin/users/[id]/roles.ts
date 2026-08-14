import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { canManageTargetUser } from "@/server/auth/admin-policy";
import { isSuperAdmin } from "@/server/auth/permissions";
import { audit } from "@/server/auth/service";
import { errorJson, isResponse, json, readJson, requestIp, requirePermission } from "@/server/auth/http";

export const PATCH: APIRoute = async (context) => {
  const actor = requirePermission(context, "user.manage"); if (isResponse(actor)) return actor;
  const target = await db.user.findUnique({ where: { id: context.params.id || "" }, include: { roles: true } });
  if (!target) return errorJson(404, "NOT_FOUND", "Không tìm thấy người dùng.");
  if (!canManageTargetUser(actor, target.roles.map(({ roleId }) => roleId))) return errorJson(403, "PROTECTED_SUPER_ADMIN", "Bạn không thể thay đổi Super Admin.");
  const body = await readJson<{ roleIds?: unknown }>(context.request);
  if (!Array.isArray(body?.roleIds) || !body.roleIds.length || !body.roleIds.every((value) => typeof value === "string")) return errorJson(400, "INVALID_INPUT", "Người dùng cần có ít nhất một vai trò hợp lệ.");
  if (body.roleIds.includes("super-admin") && !isSuperAdmin(actor)) return errorJson(403, "PROTECTED_SUPER_ADMIN", "Chỉ Super Admin được gán vai trò Super Admin.");
  const targetIsSuperAdmin = target.roles.some(({ roleId }) => roleId === "super-admin");
  if (targetIsSuperAdmin && !body.roleIds.includes("super-admin")) {
    if (actor.id === target.id) return errorJson(403, "SELF_PROTECTION", "Không thể tự gỡ quyền Super Admin của phiên hiện tại.");
    const superAdminCount = await db.userRole.count({ where: { roleId: "super-admin" } });
    if (superAdminCount <= 1) return errorJson(409, "LAST_SUPER_ADMIN", "Hệ thống phải luôn còn ít nhất một Super Admin.");
  }
  const roles = await db.role.findMany({ where: { id: { in: body.roleIds as string[] } }, select: { id: true } });
  if (roles.length !== body.roleIds.length) return errorJson(400, "INVALID_ROLE", "Có vai trò không tồn tại.");
  await db.$transaction([
    db.userRole.deleteMany({ where: { userId: target.id } }),
    db.userRole.createMany({ data: roles.map(({ id }) => ({ userId: target.id, roleId: id })) }),
    db.user.update({ where: { id: target.id }, data: { securityVersion: { increment: 1 } } }),
    db.session.deleteMany({ where: { userId: target.id } }),
  ]);
  await audit("rbac.role_assignment", actor.id, target.id, `user:${target.id}`, "success", { roleIds: body.roleIds }, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
  return json({ ok: true });
};
