import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { consumeToken, audit } from "@/server/auth/service";
import { hashPassword, passwordPolicyError } from "@/server/auth/crypto";
import { errorJson, json, readJson, requestIp } from "@/server/auth/http";

export const POST: APIRoute = async (context) => {
  const body = await readJson<{ token?: string; password?: string; confirmPassword?: string }>(context.request);
  if (!body?.token || !body.password) return errorJson(400, "INVALID_INPUT", "Liên kết đặt lại mật khẩu không hợp lệ.");
  const policyError = passwordPolicyError(body.password);
  if (policyError) return errorJson(400, "WEAK_PASSWORD", policyError);
  if (body.password !== body.confirmPassword) return errorJson(400, "PASSWORD_MISMATCH", "Mật khẩu xác nhận chưa khớp.");
  const user = await consumeToken(body.token, "PASSWORD_RESET");
  if (!user) return errorJson(410, "TOKEN_EXPIRED", "Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng.");
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.password), securityVersion: { increment: 1 } } }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);
  await audit("auth.password_reset", user.id, user.id, "security", "success", {}, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
  return json({ ok: true });
};

