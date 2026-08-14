import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { errorJson, isResponse, json, readJson, requireCustomer } from "@/server/auth/http";

export const GET: APIRoute = async (context) => {
  const actor = requireCustomer(context); if (isResponse(actor)) return actor;
  const user = await db.user.findUnique({ where: { id: actor.id }, select: { id: true, name: true, email: true, phone: true, organization: true, customerType: true, province: true } });
  return json({ user });
};

export const PATCH: APIRoute = async (context) => {
  const actor = requireCustomer(context); if (isResponse(actor)) return actor;
  const body = await readJson<{ name?: string; phone?: string; organization?: string; customerType?: string; province?: string; userId?: string }>(context.request);
  if (!body?.name?.trim() || !body.phone?.trim()) return errorJson(400, "INVALID_INPUT", "Họ tên và số điện thoại là bắt buộc.");
  const user = await db.user.update({ where: { id: actor.id }, data: { name: body.name.trim(), phone: body.phone.trim(), organization: body.organization?.trim(), customerType: body.customerType, province: body.province }, select: { id: true, name: true, email: true, phone: true, organization: true, customerType: true, province: true } });
  return json({ ok: true, user });
};
