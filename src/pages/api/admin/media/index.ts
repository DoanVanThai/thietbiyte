import type { APIRoute } from "astro";
import { isResponse, requirePermission } from "@/server/auth/http";
import { listMedia, saveMedia } from "@/server/repositories/operations-repository";
import { mediaOperationInput, validationMessage } from "@/server/validation/operations";

export const GET: APIRoute = async (context) => {
  const actor = requirePermission(context, "document.view");
  return isResponse(actor) ? actor : Response.json({ media: await listMedia() }, { headers: { "Cache-Control": "no-store" } });
};
export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "document.manage");
  if (isResponse(actor)) return actor;
  const parsed = mediaOperationInput.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: validationMessage(parsed.error) }, { status: 400 });
  try { return Response.json({ media: saveMedia(parsed.data), message: "Đã thêm ảnh vào thư viện." }, { status: 201 }); }
  catch { return Response.json({ error: "Ảnh này đã có trong thư viện." }, { status: 409 }); }
};
