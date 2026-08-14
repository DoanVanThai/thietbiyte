import type { APIRoute } from "astro";
import { errorJson, json, readJson, requestIp } from "@/server/auth/http";
import { passwordPolicyError } from "@/server/auth/crypto";
import { registerCustomer } from "@/server/auth/service";
import { sendAuthMail } from "@/server/auth/mailer";
import { rateLimit } from "@/server/auth/rate-limit";

type RegisterBody = { name?: string; email?: string; phone?: string; password?: string; confirmPassword?: string; customerType?: string };

export const POST: APIRoute = async (context) => {
  const ip = requestIp(context.request);
  if (!rateLimit(`register:${ip || "unknown"}`, 5, 60 * 60 * 1000).allowed) return errorJson(429, "RATE_LIMITED", "Đã có quá nhiều yêu cầu. Vui lòng thử lại sau.");
  const body = await readJson<RegisterBody>(context.request);
  if (!body?.name?.trim() || !body.email?.includes("@") || !body.phone?.trim() || !body.customerType || !body.password) return errorJson(400, "INVALID_INPUT", "Vui lòng hoàn tất các trường bắt buộc.");
  const policyError = passwordPolicyError(body.password);
  if (policyError) return errorJson(400, "WEAK_PASSWORD", policyError);
  if (body.password !== body.confirmPassword) return errorJson(400, "PASSWORD_MISMATCH", "Mật khẩu xác nhận chưa khớp.");
  const meta = { ip, userAgent: context.request.headers.get("user-agent") };
  const registration = await registerCustomer({ name: body.name, email: body.email, phone: body.phone, customerType: body.customerType, password: body.password }, meta);
  if (registration) {
    const verifyUrl = new URL(`/api/auth/verify-email?token=${encodeURIComponent(registration.token)}`, context.url.origin).toString();
    await sendAuthMail({ to: registration.user.email, type: "verify", url: verifyUrl });
    return json({ ok: true, redirect: "/xac-minh-email", ...(process.env.NODE_ENV !== "production" ? { developmentUrl: verifyUrl } : {}) }, 201);
  }
  return json({ ok: true, redirect: "/xac-minh-email" }, 202);
};

