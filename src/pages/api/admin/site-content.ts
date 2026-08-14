import type { APIRoute } from "astro";
import { saveSiteContentBundle } from "@/lib/content-repository";
import { isResponse, requirePermission } from "@/server/auth/http";
import { adminSiteContentBundleInput } from "@/server/validation/settings";

export const PUT: APIRoute = async (context) => {
  const settingsActor = requirePermission(context, "settings.manage");
  if (isResponse(settingsActor)) return settingsActor;
  const contentActor = requirePermission(context, "article.manage");
  if (isResponse(contentActor)) return contentActor;
  const parsed = adminSiteContentBundleInput.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || "Dữ liệu cấu hình chưa hợp lệ." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const saved = saveSiteContentBundle(parsed.data);
    return Response.json({ ...saved, message: "Đã lưu cấu hình website vào cơ sở dữ liệu." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Không thể ghi cấu hình vào cơ sở dữ liệu. Dữ liệu cũ vẫn được giữ nguyên." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
};
