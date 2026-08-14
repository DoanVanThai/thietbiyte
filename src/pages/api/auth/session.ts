import type { APIRoute } from "astro";
import { json } from "@/server/auth/http";

export const GET: APIRoute = (context) => json({ authenticated: Boolean(context.locals.auth), user: context.locals.auth ? {
  id: context.locals.auth.id, email: context.locals.auth.email, name: context.locals.auth.name,
  roles: context.locals.auth.roleIds, permissions: context.locals.auth.permissions,
} : null });

