import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { normalizeEmail } from "@/server/auth/crypto";
import { issueOneTimeToken } from "@/server/auth/service";
import { sendAuthMail } from "@/server/auth/mailer";
import { errorJson, json, readJson, requestIp } from "@/server/auth/http";
import { rateLimit } from "@/server/auth/rate-limit";

export const POST: APIRoute = async (context) => {
  const ip = requestIp(context.request);
  if (!rateLimit(`verify:${ip || "unknown"}`, 5, 60 * 60 * 1000).allowed) return errorJson(429, "RATE_LIMITED", "Đã có quá nhiều yêu cầu. Vui lòng thử lại sau.");
  const body = await readJson<{ email?: string }>(context.request);
  if (body?.email) {
    const user = await db.user.findUnique({ where: { email: normalizeEmail(body.email) } });
    if (user && !user.emailVerifiedAt && user.status !== "DISABLED") {
      const token = await issueOneTimeToken(user.id, "EMAIL_VERIFICATION", 24 * 60 * 60 * 1000);
      await sendAuthMail({ to: user.email, type: "verify", url: new URL(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, context.url.origin).toString() });
    }
  }
  return json({ ok: true, message: "Nếu địa chỉ hợp lệ, email xác minh mới đã được gửi." });
};

