import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { normalizeEmail } from "@/server/auth/crypto";
import { issueOneTimeToken } from "@/server/auth/service";
import { sendAuthMail } from "@/server/auth/mailer";
import { errorJson, json, readJson, requestIp } from "@/server/auth/http";
import { rateLimit } from "@/server/auth/rate-limit";

export const POST: APIRoute = async (context) => {
  const ip = requestIp(context.request);
  if (!rateLimit(`forgot:${ip || "unknown"}`, 6, 60 * 60 * 1000).allowed) return errorJson(429, "RATE_LIMITED", "Đã có quá nhiều yêu cầu. Vui lòng thử lại sau.");
  const body = await readJson<{ email?: string }>(context.request);
  if (!body?.email?.includes("@")) return errorJson(400, "INVALID_INPUT", "Email chưa đúng định dạng.");
  const user = await db.user.findUnique({ where: { email: normalizeEmail(body.email) } });
  let developmentUrl: string | undefined;
  if (user && user.status !== "DISABLED") {
    const token = await issueOneTimeToken(user.id, "PASSWORD_RESET", 30 * 60 * 1000);
    developmentUrl = new URL(`/dat-lai-mat-khau?token=${encodeURIComponent(token)}`, context.url.origin).toString();
    await sendAuthMail({ to: user.email, type: "reset", url: developmentUrl });
  }
  return json({ ok: true, message: "Nếu email khớp với một tài khoản, hướng dẫn đặt lại mật khẩu sẽ được gửi.", ...(process.env.NODE_ENV !== "production" && developmentUrl ? { developmentUrl } : {}) });
};
