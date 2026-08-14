import type { AstroCookies } from "astro";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { hashNetworkValue, hashPassword, hashToken, normalizeEmail, randomToken, verifyPassword } from "./crypto";
import type { AuthPrincipal, Permission } from "./permissions";
import { isPermission } from "./permissions";

export const SESSION_COOKIE = "tlm_session";
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const dummyPasswordHash = hashPassword(randomToken());

type RequestMeta = { ip: string | null; userAgent: string | null };

const principalFromSession = (session: any): AuthPrincipal => ({
  id: session.user.id,
  email: session.user.email,
  name: session.user.name,
  status: session.user.status,
  sessionId: session.id,
  roleIds: session.user.roles.map((entry: any) => entry.role.id),
  permissions: Array.from(new Set(session.user.roles.flatMap((entry: any) => entry.role.permissions.map((link: any) => link.permission.id)).filter(isPermission))) as Permission[],
});

export async function getPrincipal(rawToken: string | undefined) {
  if (!rawToken) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } } } },
  });
  if (!session || session.expiresAt <= new Date() || session.user.status !== "ACTIVE" || session.securityVersion !== session.user.securityVersion) {
    if (session) await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60 * 1000) await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  return principalFromSession(session);
}

export async function createSession(userId: string, remember: boolean, meta: RequestMeta) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const rawToken = randomToken();
  const maxAge = remember ? 30 * DAY : 8 * HOUR;
  await db.session.create({ data: {
    tokenHash: hashToken(rawToken), userId, securityVersion: user.securityVersion,
    expiresAt: new Date(Date.now() + maxAge), ipHash: hashNetworkValue(meta.ip), userAgent: meta.userAgent?.slice(0, 300),
  } });
  return { rawToken, maxAge: Math.floor(maxAge / 1000) };
}

export function setSessionCookie(cookies: AstroCookies, rawToken: string, maxAge: number) {
  cookies.set(SESSION_COOKIE, rawToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge });
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

export async function authenticate(email: string, password: string, meta: RequestMeta) {
  const normalized = normalizeEmail(email);
  const adminLogin = process.env.ADMIN_LOGIN ? normalizeEmail(process.env.ADMIN_LOGIN) : "";
  const adminEmail = process.env.ADMIN_EMAIL ? normalizeEmail(process.env.ADMIN_EMAIL) : "";
  const adminEmailCandidates = Array.from(new Set([
    adminEmail,
    adminEmail.replace(/@thienlocmedical\.vn$/i, "@thienlocgroup.com"),
    adminEmail.replace(/@thienlocgroup\.com$/i, "@thienlocmedical.vn"),
  ].filter(Boolean)));
  const user = adminLogin && adminEmailCandidates.length && normalized === adminLogin
    ? await db.user.findFirst({ where: { email: { in: adminEmailCandidates } }, orderBy: { createdAt: "asc" } })
    : await db.user.findUnique({ where: { email: normalized } });
  const valid = await verifyPassword(password, user?.passwordHash || await dummyPasswordHash);
  if (!user || !valid) {
    await audit("auth.login_failed", null, null, "authentication", "denied", { emailHash: hashToken(normalized) }, meta);
    return { ok: false as const, reason: "invalid" as const };
  }
  if (user.status === "DISABLED") {
    await audit("auth.login_failed", user.id, user.id, "authentication", "disabled", {}, meta);
    return { ok: false as const, reason: "disabled" as const };
  }
  if (!user.emailVerifiedAt || user.status === "PENDING") return { ok: false as const, reason: "unverified" as const };
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit("auth.login", user.id, user.id, "authentication", "success", {}, meta);
  return { ok: true as const, user };
}

export async function registerCustomer(input: { email: string; password: string; name: string; phone: string; customerType: string }, meta: RequestMeta) {
  const email = normalizeEmail(input.email);
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return null;
  const user = await db.user.create({ data: {
    email, passwordHash: await hashPassword(input.password), name: input.name.trim(), phone: input.phone.trim(), customerType: input.customerType,
    organizationType: input.customerType, roles: { create: { roleId: "customer" } },
  } });
  await audit("auth.register", user.id, user.id, "authentication", "success", {}, meta);
  return { user, token: await issueOneTimeToken(user.id, "EMAIL_VERIFICATION", 24 * HOUR) };
}

export async function issueOneTimeToken(userId: string, purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET", ttlMs: number) {
  const rawToken = randomToken();
  await db.$transaction([
    db.oneTimeToken.deleteMany({ where: { userId, purpose, usedAt: null } }),
    db.oneTimeToken.create({ data: { userId, purpose, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + ttlMs) } }),
  ]);
  return rawToken;
}

export async function consumeToken(rawToken: string, purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET") {
  const record = await db.oneTimeToken.findUnique({ where: { tokenHash: hashToken(rawToken) }, include: { user: true } });
  if (!record || record.purpose !== purpose || record.usedAt || record.expiresAt <= new Date()) return null;
  const consumed = await db.oneTimeToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
  return consumed.count === 1 ? record.user : null;
}

export async function logout(rawToken: string | undefined, actor: AuthPrincipal | null, meta: RequestMeta) {
  if (rawToken) await db.session.deleteMany({ where: { tokenHash: hashToken(rawToken) } });
  await audit("auth.logout", actor?.id || null, actor?.id || null, "authentication", "success", {}, meta);
}

export async function audit(action: string, actorId: string | null, subjectId: string | null, resource: string | null, outcome: string, metadata: Record<string, unknown>, meta: RequestMeta) {
  await db.auditLog.create({ data: { action, actorId, subjectId, resource, outcome, metadata: metadata as Prisma.InputJsonValue, ipHash: hashNetworkValue(meta.ip) } });
}
