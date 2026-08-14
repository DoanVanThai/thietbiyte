import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { isResponse, json, requirePermission } from "@/server/auth/http";

export const GET: APIRoute = async (context) => {
  const actor = requirePermission(context, "audit.view"); if (isResponse(actor)) return actor;
  const events = await db.auditLog.findMany({ take: 100, orderBy: { createdAt: "desc" }, include: { actor: { select: { id: true, name: true, email: true } } } });
  return json({ events });
};

