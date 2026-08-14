import type { APIRoute } from "astro";
import { isResponse, requirePermission } from "@/server/auth/http";
import { listArticles, saveArticle } from "@/server/repositories/operations-repository";
import { articleOperationInput, validationMessage } from "@/server/validation/operations";

export const GET: APIRoute = (context) => {
  const actor = requirePermission(context, "article.view");
  return isResponse(actor) ? actor : Response.json({ articles: listArticles() }, { headers: { "Cache-Control": "no-store" } });
};

export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "article.manage");
  if (isResponse(actor)) return actor;
  const parsed = articleOperationInput.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: validationMessage(parsed.error) }, { status: 400 });
  if (parsed.data.status === "published") {
    const publisher = requirePermission(context, "article.publish");
    if (isResponse(publisher)) return publisher;
  }
  const article = saveArticle(parsed.data, actor.name);
  return Response.json({ article, message: parsed.data.status === "published" ? "Đã xuất bản nội dung." : "Đã lưu nội dung." }, { status: 201 });
};

