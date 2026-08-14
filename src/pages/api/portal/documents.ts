import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { isResponse, json, requireCustomer } from "@/server/auth/http";

export const GET: APIRoute = async (context) => {
  const actor = requireCustomer(context); if (isResponse(actor)) return actor;
  const documents = await db.document.findMany({ where: { OR: [
    { accessLevel: "PUBLIC" }, { accessLevel: "REGISTERED" }, { grants: { some: { userId: actor.id } } },
  ] }, orderBy: { createdAt: "desc" } });
  return json({ documents });
};
