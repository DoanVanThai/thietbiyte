import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { canModifyRole, validatePermissionIds } from "@/server/auth/admin-policy";
import { PERMISSIONS } from "@/server/auth/permissions";
import { audit } from "@/server/auth/service";
import { errorJson, isResponse, json, readJson, requestIp, requirePermission } from "@/server/auth/http";

export const PATCH: APIRoute = async (context) => {
  const actor = requirePermission(context, "role.manage"); if (isResponse(actor)) return actor;
  const role = await db.role.findUnique({ where: { id: context.params.id || "" } });
  if (!role) return errorJson(404, "NOT_FOUND", "Không tìm thấy vai trò.");
  if (!canModifyRole(actor, role)) return errorJson(403, "PROTECTED_ROLE", "Vai trò này được hệ thống bảo vệ.");
  const body = await readJson<{ name?: string; description?: string; permissionIds?: unknown }>(context.request);
  if (!body || !validatePermissionIds(body.permissionIds, PERMISSIONS)) return errorJson(400, "INVALID_INPUT", "Danh sách permission không hợp lệ.");
  const updated = await db.$transaction(async (transaction) => {
    await transaction.rolePermission.deleteMany({ where: { roleId: role.id } });
    return transaction.role.update({ where: { id: role.id }, data: { name: body.name?.trim() || role.name, description: body.description?.trim() ?? role.description, permissions: { create: (body.permissionIds as string[]).map((permissionId) => ({ permissionId })) } } });
  });
  await audit("rbac.permissions_changed", actor.id, null, `role:${role.id}`, "success", { permissionIds: body.permissionIds }, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
  return json({ ok: true, role: updated });
};

export const DELETE: APIRoute = async (context) => {
  const actor = requirePermission(context, "role.manage"); if (isResponse(actor)) return actor;
  const role = await db.role.findUnique({ where: { id: context.params.id || "" }, include: { _count: { select: { users: true } } } });
  if (!role) return errorJson(404, "NOT_FOUND", "Không tìm thấy vai trò.");
  if (role.protected || role.isDefault || !canModifyRole(actor, role)) return errorJson(403, "PROTECTED_ROLE", "Vai trò mặc định hoặc được bảo vệ không thể xóa.");
  if (role._count.users) return errorJson(409, "ROLE_IN_USE", "Vai trò đang được gán cho người dùng.");
  await db.role.delete({ where: { id: role.id } });
  await audit("rbac.role_deleted", actor.id, null, `role:${role.id}`, "success", {}, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
  return json({ ok: true });
};

