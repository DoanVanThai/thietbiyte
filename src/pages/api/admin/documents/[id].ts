import type { APIRoute } from "astro";
import { isResponse, requirePermission } from "@/server/auth/http";
import { deleteDocument, getDocument, saveDocument } from "@/server/repositories/operations-repository";
import { documentOperationInput, validationMessage } from "@/server/validation/operations";

export const PUT: APIRoute = async (context) => {
  const actor = requirePermission(context, "document.manage");
  if (isResponse(actor)) return actor;
  const id = context.params.id || "";
  if (!getDocument(id)) return Response.json({ error: "Không tìm thấy tài liệu." }, { status: 404 });
  const parsed = documentOperationInput.safeParse({ ...(await context.request.json().catch(() => null)), id });
  return parsed.success ? Response.json({ document: saveDocument(parsed.data), message: "Đã cập nhật tài liệu." }) : Response.json({ error: validationMessage(parsed.error) }, { status: 400 });
};
export const DELETE: APIRoute = (context) => {
  const actor = requirePermission(context, "document.manage");
  if (isResponse(actor)) return actor;
  return deleteDocument(context.params.id || "") ? new Response(null, { status: 204 }) : Response.json({ error: "Không tìm thấy tài liệu." }, { status: 404 });
};

