import type { APIRoute } from "astro";
import { isCustomer } from "@/server/auth/permissions";
import { quoteService } from "@/server/services/quote-service";

export const GET: APIRoute = async (context) => {
  const actor = context.locals.auth;
  const result = await quoteService.getPublic(String(context.params.number), context.url.searchParams.get("access"), isCustomer(actor) ? actor!.id : null);
  if (result.state === "not-found") return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  if (result.state === "forbidden") return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  return Response.json({ quote: result.quote }, { headers: { "Cache-Control": "private, no-store" } });
};
