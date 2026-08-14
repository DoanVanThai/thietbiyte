import type { APIRoute } from "astro";
import { clearSessionCookie, logout, SESSION_COOKIE } from "@/server/auth/service";
import { json, requestIp } from "@/server/auth/http";

export const POST: APIRoute = async (context) => {
  await logout(context.cookies.get(SESSION_COOKIE)?.value, context.locals.auth, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
  clearSessionCookie(context.cookies);
  return json({ ok: true, redirect: "/dang-nhap" });
};

