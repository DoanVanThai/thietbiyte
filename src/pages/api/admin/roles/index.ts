import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { PERMISSIONS } from "@/server/auth/permissions";
import { validatePermissionIds } from "@/server/auth/admin-policy";
import { audit } from "@/server/auth/service";
import { errorJson, isResponse, json, readJson, requestIp, requirePermission } from "@/server/auth/http";

export const GET: APIRoute = async (context) => {
  const actor = requirePermission(context, "role.view"); if (isResponse(actor)) return actor;
  const roles = await db.role.findMany({ include: { permissions: true, _count: { select: { users: true } } }, orderBy: { name: "asc" } });
  return json({ roles });
};

export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "role.manage"); if (isResponse(actor)) return actor;
  const body = await readJson<{ id?: string; name?: string; description?: string; permissionIds?: unknown }>(context.request);
  if (!body?.name?.trim() || !validatePermissionIds(body.permissionIds, PERMISSIONS)) return errorJson(400, "INVALID_INPUT", "Thông tin vai trò hoặc permission không hợp lệ.");
  const id = (body.id || body.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!id || ["super-admin", "customer"].includes(id)) return errorJson(400, "PROTECTED_ROLE", "Không thể tạo vai trò với định danh được bảo vệ.");
  const role = await db.role.create({ data: { id, name: body.name.trim(), description: body.description?.trim() || "", permissions: { create: (body.permissionIds as string[]).map((permissionId) => ({ permissionId })) } } });
  await audit("rbac.role_created", actor.id, null, `role:${role.id}`, "success", { permissionIds: body.permissionIds }, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
  return json({ ok: true, role }, 201);
};

