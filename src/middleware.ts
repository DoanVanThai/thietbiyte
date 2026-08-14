import { defineMiddleware } from "astro:middleware";
import { getPrincipal, SESSION_COOKIE } from "@/server/auth/service";
import { resolveCsrfOrigin } from "@/server/auth/csrf";
import { can, isCustomerOnly, isStaff, ROUTE_PERMISSIONS } from "@/server/auth/permissions";
import type { Permission } from "@/server/auth/permissions";
import { getCacheVersion } from "@/lib/content-repository";

const authPages = new Set(["/dang-nhap", "/dang-ky", "/quen-mat-khau", "/dat-lai-mat-khau", "/xac-minh-email"]);
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const adminSectionPermissions: Record<string, Permission> = {
  "san-pham": "product.view", "danh-muc": "category.view", "thuong-hieu": "brand.view", "chuyen-khoa": "category.view",
  "bao-gia": "quote.view", "bao-gia-pdf": "quote.edit", crm: "lead.view", "khach-hang": "customer.view", "du-an": "project.view",
  "noi-dung": "article.view", "tai-lieu": "document.view", media: "document.view", "nguoi-dung": "user.view",
  "vai-tro": "role.view", "phan-quyen": "role.view", "audit-logs": "audit.view", "cai-dat": "settings.view",
};

export const onRequest = defineMiddleware(async (context, next) => {
  const rawSession = context.cookies.get(SESSION_COOKIE)?.value;
  let principal = null;
  try { principal = await getPrincipal(rawSession); } catch (error) {
    console.error("Authentication store unavailable", error instanceof Error ? error.message : "unknown error");
  }
  context.locals.auth = principal;

  const { pathname } = context.url;
  if (unsafeMethods.has(context.request.method) && pathname.startsWith("/api/")) {
    const origin = context.request.headers.get("origin");
    const fetchSite = context.request.headers.get("sec-fetch-site");
    const trustedOrigin = resolveCsrfOrigin(context.url, context.site, context.request.headers);
    if ((origin && origin !== trustedOrigin) || fetchSite === "cross-site") return new Response(JSON.stringify({ ok: false, code: "CSRF_REJECTED", message: "Nguồn yêu cầu không hợp lệ." }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }

  if (authPages.has(pathname) && principal && !pathname.includes("dat-lai") && !pathname.includes("xac-minh")) return context.redirect(isCustomerOnly(principal) ? "/tai-khoan" : "/admin");
  if (pathname === "/tai-khoan") {
    if (!principal) return context.redirect(`/dang-nhap?state=${rawSession ? "expired" : "required"}&next=${encodeURIComponent(pathname)}`);
    if (!isCustomerOnly(principal)) return context.redirect("/khong-co-quyen?area=portal");
  }
  if (pathname.startsWith("/admin")) {
    if (!principal) return context.redirect(`/dang-nhap?state=${rawSession ? "expired" : "required"}&next=${encodeURIComponent(pathname + context.url.search)}`);
    if (!isStaff(principal)) return context.redirect("/khong-co-quyen?area=admin");
    const guard = ROUTE_PERMISSIONS.find(({ prefix }) => pathname.startsWith(prefix));
    if (guard && !can(principal, guard.permission)) return context.redirect(`/khong-co-quyen?permission=${guard.permission}`);
    if (pathname === "/admin") {
      const permission = adminSectionPermissions[context.url.searchParams.get("section") || ""];
      if (permission && !can(principal, permission)) return context.redirect(`/khong-co-quyen?permission=${permission}`);
    }
    if (pathname === "/admin/san-pham" && context.url.searchParams.get("view") === "editor") {
      const permission = context.url.searchParams.get("id") === "new" ? "product.create" : "product.edit";
      if (!can(principal, permission)) return context.redirect(`/khong-co-quyen?permission=${permission}`);
    }
  }
  if (pathname.startsWith("/api/admin")) {
    if (!principal) return new Response(JSON.stringify({ error: "Cần đăng nhập quản trị." }), { status: 401, headers: { "content-type": "application/json", "cache-control": "no-store" } });
    if (!isStaff(principal)) return new Response(JSON.stringify({ error: "Không có quyền quản trị." }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }

  const response = await next();
  const privateApi = pathname.startsWith("/api/admin") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/crm") || pathname.startsWith("/api/portal") || pathname.startsWith("/api/quotes");
  const privatePage = pathname.startsWith("/admin") || pathname === "/tai-khoan" || authPages.has(pathname);
  if (privatePage || privateApi) {
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("x-content-type-options", "nosniff");
    response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  } else if (context.request.method === "GET" && (!pathname.startsWith("/api/") || pathname.startsWith("/api/products") || pathname === "/api/site-settings")) {
    const productPath = pathname.startsWith("/san-pham") || pathname.startsWith("/danh-muc") || pathname.startsWith("/thuong-hieu") || pathname.startsWith("/chuyen-khoa") || pathname === "/y-te" || pathname === "/thu-y" || pathname.startsWith("/api/products");
    const keys = pathname === "/api/site-settings" ? ["settings"] as const : productPath ? ["products", "taxonomy"] as const : ["products", "taxonomy", "content", "settings"] as const;
    const contentVersion = keys.map((key) => getCacheVersion(key)).join(".");
    // Versioned surrogate keys allow an edge purge; the short TTL is the safe
    // fallback when a deployment has no CDN purge hook configured.
    const maxAge = pathname === "/api/site-settings" ? 60 : 30;
    response.headers.set("cache-control", `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=120`);
    response.headers.set("etag", `W/\"${keys.join("-")}-${contentVersion}-${encodeURIComponent(pathname)}\"`);
    response.headers.set("surrogate-key", `tlm-public ${keys.map((key, index) => `tlm-${key}-${contentVersion.split(".")[index]}`).join(" ")}`);
    response.headers.set("x-content-version", contentVersion);
    response.headers.set("vary", "Accept-Encoding");
  }
  return response;
});
