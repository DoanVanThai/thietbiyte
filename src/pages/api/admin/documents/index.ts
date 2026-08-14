import type { APIRoute } from "astro";
import { isResponse, requirePermission } from "@/server/auth/http";
import { listDocuments, saveDocument } from "@/server/repositories/operations-repository";
import { documentOperationInput, validationMessage } from "@/server/validation/operations";

export const GET: APIRoute = (context) => {
  const actor = requirePermission(context, "document.view");
  return isResponse(actor) ? actor : Response.json({ documents: listDocuments() }, { headers: { "Cache-Control": "no-store" } });
};
export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "document.manage");
  if (isResponse(actor)) return actor;
  const parsed = documentOperationInput.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: validationMessage(parsed.error) }, { status: 400 });
  try { return Response.json({ document: saveDocument(parsed.data), message: "Đã thêm tài liệu vào thư viện." }, { status: 201 }); }
  catch { return Response.json({ error: "Tệp này đã có trong thư viện tài liệu." }, { status: 409 }); }
};
