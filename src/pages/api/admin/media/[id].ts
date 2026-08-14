import type { APIRoute } from "astro";
import { unlink } from "node:fs/promises";
import { isResponse, requirePermission } from "@/server/auth/http";
import { deleteMedia, getMedia, saveMedia } from "@/server/repositories/operations-repository";
import { findPublicUploadPath } from "@/server/uploads/public-upload-storage";
import { mediaOperationInput, validationMessage } from "@/server/validation/operations";

export const PUT: APIRoute = async (context) => {
  const actor = requirePermission(context, "document.manage");
  if (isResponse(actor)) return actor;
  const id = context.params.id || "";
  if (!getMedia(id)) return Response.json({ error: "Không tìm thấy media." }, { status: 404 });
  const parsed = mediaOperationInput.safeParse({ ...(await context.request.json().catch(() => null)), id });
  return parsed.success ? Response.json({ media: saveMedia(parsed.data), message: "Đã cập nhật media." }) : Response.json({ error: validationMessage(parsed.error) }, { status: 400 });
};
export const DELETE: APIRoute = async (context) => {
  const actor = requirePermission(context, "document.manage");
  if (isResponse(actor)) return actor;
  const asset = getMedia(context.params.id || "");
  if (!asset) return Response.json({ error: "Không tìm thấy media." }, { status: 404 });
  if (asset.source === "public") return Response.json({ error: "Ảnh hệ thống chỉ có thể sửa thông tin, không thể xóa trong Admin." }, { status: 409 });
  const path = findPublicUploadPath(asset.url);
  if (path) await unlink(path).catch(() => undefined);
  deleteMedia(asset.id);
  return new Response(null, { status: 204 });
};
