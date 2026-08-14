import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { isResponse, json, requireCustomer } from "@/server/auth/http";

export const PUT: APIRoute = async (context) => {
  const actor = requireCustomer(context); if (isResponse(actor)) return actor;
  const productId = context.params.productId || "";
  await db.favorite.upsert({ where: { userId_productId: { userId: actor.id, productId } }, update: {}, create: { userId: actor.id, productId } });
  return json({ ok: true });
};

export const DELETE: APIRoute = async (context) => {
  const actor = requireCustomer(context); if (isResponse(actor)) return actor;
  await db.favorite.deleteMany({ where: { userId: actor.id, productId: context.params.productId || "" } });
  return json({ ok: true });
};
