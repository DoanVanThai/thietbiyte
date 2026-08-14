import type { APIRoute } from "astro";
import { errorJson, json } from "@/server/auth/http";

export const GET: APIRoute = ({ locals }) => {
  const user = locals.auth;
  return user ? json({ user: { id: user.id, name: user.name, email: user.email, roles: user.roleIds, permissions: user.permissions } }) : errorJson(401, "UNAUTHENTICATED", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
};
