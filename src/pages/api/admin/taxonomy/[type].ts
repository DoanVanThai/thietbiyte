import type { APIRoute } from "astro";
import { deactivateEntity, getEntities, saveEntity } from "@/lib/content-repository";
import { isResponse, requirePermission } from "@/server/auth/http";

const valid = (value?: string): value is "category" | "brand" | "specialty" => ["category", "brand", "specialty"].includes(value || "");
export const GET: APIRoute = (context) => {
  if (!valid(context.params.type)) return Response.json({ error: "Loại dữ liệu không hợp lệ." }, { status: 400 });
  const actor = requirePermission(context, context.params.type === "brand" ? "brand.view" : "category.view");
  return isResponse(actor) ? actor : Response.json({ items: getEntities(context.params.type, false) }, { headers: { "Cache-Control": "no-store" } });
};
export const POST: APIRoute = async (context) => {
  if (!valid(context.params.type)) return Response.json({ error: "Loại dữ liệu không hợp lệ." }, { status: 400 });
  const actor = requirePermission(context, context.params.type === "brand" ? "brand.manage" : "category.manage");
  if (isResponse(actor)) return actor;
  const body = await context.request.json(); if (!body?.name) return Response.json({ error: "Tên là bắt buộc." }, { status: 400 });
  try { return Response.json({ item: saveEntity(context.params.type, body) }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Slug đã tồn tại hoặc dữ liệu không hợp lệ." }, { status: 409 }); }
};
export const DELETE: APIRoute = (context) => {
  if (!valid(context.params.type)) return Response.json({ error: "Loại dữ liệu không hợp lệ." }, { status: 400 });
  const actor = requirePermission(context, context.params.type === "brand" ? "brand.manage" : "category.manage");
  if (isResponse(actor)) return actor;
  const id = context.url.searchParams.get("id");
  if (!id || !deactivateEntity(context.params.type, id)) return Response.json({ error: "Không tìm thấy dữ liệu." }, { status: 404 });
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
};
