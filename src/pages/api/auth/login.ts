import type { APIRoute } from "astro";
import { authenticate, createSession, setSessionCookie } from "@/server/auth/service";
import { errorJson, json, readJson, requestIp } from "@/server/auth/http";
import { hashToken, normalizeEmail } from "@/server/auth/crypto";
import { rateLimit } from "@/server/auth/rate-limit";
import { db } from "@/server/db";

type LoginBody = { email?: string; password?: string; remember?: boolean; next?: string };
const safeNext = (value: string | undefined, fallback: string) => value?.startsWith("/") && !value.startsWith("//") ? value : fallback;

export const POST: APIRoute = async (context) => {
  const body = await readJson<LoginBody>(context.request);
  if (!body?.email || !body.password) return errorJson(400, "INVALID_INPUT", "Vui lòng nhập tên đăng nhập và mật khẩu.");
  const ip = requestIp(context.request);
  const limiter = rateLimit(`login:${ip || "unknown"}:${hashToken(normalizeEmail(body.email))}`, 8, 15 * 60 * 1000);
  if (!limiter.allowed) return errorJson(429, "RATE_LIMITED", `Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ${limiter.retryAfter} giây.`);
  const meta = { ip, userAgent: context.request.headers.get("user-agent") };
  const result = await authenticate(body.email, body.password, meta);
  if (!result.ok) {
    if (result.reason === "unverified") return errorJson(403, "EMAIL_UNVERIFIED", "Email chưa được xác minh.");
    if (result.reason === "disabled") return errorJson(403, "ACCOUNT_DISABLED", "Tài khoản hiện không thể đăng nhập. Vui lòng liên hệ hỗ trợ.");
    return errorJson(401, "INVALID_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu chưa đúng.");
  }
  const session = await createSession(result.user.id, Boolean(body.remember), meta);
  setSessionCookie(context.cookies, session.rawToken, session.maxAge);
  const roleRows = await db.userRole.findMany({ where: { userId: result.user.id }, select: { roleId: true } });
  const customer = roleRows.some(({ roleId }) => roleId === "customer") && !roleRows.some(({ roleId }) => roleId !== "customer");
  return json({ ok: true, redirect: safeNext(body.next, customer ? "/tai-khoan" : "/admin") });
};
