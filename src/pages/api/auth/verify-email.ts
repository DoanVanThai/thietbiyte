import type { APIRoute } from "astro";
import { db } from "@/server/db";
import { consumeToken, audit } from "@/server/auth/service";
import { requestIp } from "@/server/auth/http";

export const GET: APIRoute = async (context) => {
  const token = context.url.searchParams.get("token");
  const user = token ? await consumeToken(token, "EMAIL_VERIFICATION") : null;
  if (!user) return context.redirect("/xac-minh-email?state=expired");
  await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), status: "ACTIVE" } });
  await audit("auth.email_verified", user.id, user.id, "authentication", "success", {}, { ip: requestIp(context.request), userAgent: context.request.headers.get("user-agent") });
  return context.redirect("/xac-minh-email?state=success");
};

