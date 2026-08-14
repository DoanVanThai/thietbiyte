import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { canManageTargetUser } from "@/server/auth/admin-policy";
import { audit } from "@/server/auth/service";
import { errorJson, isResponse, json, readJson, requestIp, requirePermission } from "@/server/auth/http";

export const PATCH: APIRoute = async (context) => {
  const actor = requirePermission(context, "user.manage"); if (isResponse(actor)) return actor;
  const target = await db.user.findUnique({ where: { id: context.params.id || "" }, include: { roles: true } });
  if (!target) return errorJson(404, "NOT_FOUND", "Không tìm thấy người dùng.");
  if (!canManageTargetUser(actor, target.roles.map(({ roleId }) => roleId))) return errorJson(403, "PROTECTED_SUPER_ADMIN", "Bạn không thể thay đổi Super Admin.");
  const body = await readJson<{ status?: string }>(context.request);
  if (!body || !["ACTIVE", "PENDING", "DISABLED"].includes(body.status || "")) return errorJson(400, "INVALID_INPUT", "Trạng thái không hợp lệ.");
  if (target.roles.some(({ roleId }) => roleId === "super-admin") && body.status !== "ACTIVE") return errorJson(403, "PROTECTED_SUPER_ADMIN", "Super Admin không thể bị vô hiệu hóa qua thao tác thông thường.");
  await db.$transaction([
    db.user.update({ where: { id: target.id }, data: { status: body.status as "ACTIVE" | "PENDING" | "DISABLED", securityVersion: { increment: 1 } } }),
    db.session.deleteMany({ where: { userId: target.id } }),
  ]);
  await audit("user.status_changed", actor.id, target.id, `user:${target.id}`, "success", { status: body.status }, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
  return json({ ok: true });
};
