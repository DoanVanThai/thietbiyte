import type { APIRoute } from "astro";
import { isResponse, requirePermission } from "@/server/auth/http";
import { deleteArticle, getArticle, saveArticle } from "@/server/repositories/operations-repository";
import { articleOperationInput, validationMessage } from "@/server/validation/operations";

export const GET: APIRoute = (context) => {
  const actor = requirePermission(context, "article.view");
  if (isResponse(actor)) return actor;
  const article = getArticle(context.params.id || "");
  return article ? Response.json({ article }) : Response.json({ error: "Không tìm thấy nội dung." }, { status: 404 });
};

export const PUT: APIRoute = async (context) => {
  const actor = requirePermission(context, "article.manage");
  if (isResponse(actor)) return actor;
  const id = context.params.id || "";
  if (!getArticle(id)) return Response.json({ error: "Không tìm thấy nội dung." }, { status: 404 });
  const parsed = articleOperationInput.safeParse({ ...(await context.request.json().catch(() => null)), id });
  if (!parsed.success) return Response.json({ error: validationMessage(parsed.error) }, { status: 400 });
  if (parsed.data.status === "published") {
    const publisher = requirePermission(context, "article.publish");
    if (isResponse(publisher)) return publisher;
  }
  return Response.json({ article: saveArticle(parsed.data, actor.name), message: "Đã cập nhật nội dung." });
};

export const DELETE: APIRoute = (context) => {
  const actor = requirePermission(context, "article.manage");
  if (isResponse(actor)) return actor;
  return deleteArticle(context.params.id || "") ? new Response(null, { status: 204 }) : Response.json({ error: "Không tìm thấy nội dung." }, { status: 404 });
};

