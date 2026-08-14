import type { APIContext } from "astro";
import type { AuthPrincipal, Permission } from "./permissions";
import { can, isCustomerOnly, isStaff } from "./permissions";

export const json = (data: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
});

export const errorJson = (status: number, code: string, message: string) => json({ ok: false, code, message }, status);

export async function readJson<T>(request: Request): Promise<T | null> {
  if (!request.headers.get("content-type")?.toLocaleLowerCase("en-US").includes("application/json")) return null;
  try { return await request.json() as T; } catch { return null; }
}

export function requirePrincipal(context: APIContext): AuthPrincipal | Response {
  return context.locals.auth || errorJson(401, "UNAUTHENTICATED", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
}

export function requirePermission(context: APIContext, permission: Permission): AuthPrincipal | Response {
  const principal = requirePrincipal(context);
  if (principal instanceof Response) return principal;
  if (!isStaff(principal) || !can(principal, permission)) return errorJson(403, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.");
  return principal;
}

export function requireCustomer(context: APIContext): AuthPrincipal | Response {
  const principal = requirePrincipal(context);
  if (principal instanceof Response) return principal;
  return isCustomerOnly(principal) ? principal : errorJson(403, "FORBIDDEN", "Khu vực này chỉ dành cho khách hàng.");
}

export const isResponse = (value: AuthPrincipal | Response): value is Response => value instanceof Response;

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}
