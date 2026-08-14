import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { hashPassword, passwordPolicyError, verifyPassword } from "@/server/auth/crypto";
import { audit } from "@/server/auth/service";
import { errorJson, isResponse, json, readJson, requestIp, requireCustomer } from "@/server/auth/http";

export const PATCH: APIRoute = async (context) => {
  const actor = requireCustomer(context); if (isResponse(actor)) return actor;
  const body = await readJson<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>(context.request);
  if (!body?.currentPassword || !body.newPassword) return errorJson(400, "INVALID_INPUT", "Vui lòng nhập đầy đủ mật khẩu.");
  const policyError = passwordPolicyError(body.newPassword); if (policyError) return errorJson(400, "WEAK_PASSWORD", policyError);
  if (body.newPassword !== body.confirmPassword) return errorJson(400, "PASSWORD_MISMATCH", "Mật khẩu xác nhận chưa khớp.");
  const user = await db.user.findUniqueOrThrow({ where: { id: actor.id } });
  if (!await verifyPassword(body.currentPassword, user.passwordHash)) return errorJson(400, "CURRENT_PASSWORD_INVALID", "Mật khẩu hiện tại chưa đúng.");
  const nextVersion = user.securityVersion + 1;
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.newPassword), securityVersion: nextVersion } }),
    db.session.deleteMany({ where: { userId: user.id, id: { not: actor.sessionId } } }),
    db.session.update({ where: { id: actor.sessionId }, data: { securityVersion: nextVersion } }),
  ]);
  await audit("auth.password_change", actor.id, actor.id, "security", "success", {}, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
  return json({ ok: true, message: "Đã đổi mật khẩu và thu hồi các phiên khác." });
};
