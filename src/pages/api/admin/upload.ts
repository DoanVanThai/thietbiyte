import type { APIRoute } from "astro";
import { mkdir, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { isResponse, requirePermission } from "@/server/auth/http";
import { getPublicUploadDirectory, getPublicUploadPath, publicUploadUrl } from "@/server/uploads/public-upload-storage";

const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf", ".doc", ".docx"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_IMAGE_WIDTH = 2_000;
const thumbnailWidths = [320, 640, 960, 1280];

export const POST: APIRoute = async (context) => {
  const actor = requirePermission(context, "document.manage");
  if (isResponse(actor)) return actor;
  const data = await context.request.formData(); const file = data.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Không có tệp." }, { status: 400 });
  const extension = extname(file.name).toLowerCase();
  if (!allowed.has(extension) || file.size > MAX_FILE_BYTES) return Response.json({ error: "Định dạng không hỗ trợ hoặc tệp vượt 15 MB." }, { status: 400 });

  const directory = getPublicUploadDirectory();
  await mkdir(directory, { recursive: true });
  const id = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (!imageExtensions.has(extension)) {
    const name = `${id}${extension}`;
    await writeFile(getPublicUploadPath(name)!, bytes);
    return Response.json({ url: publicUploadUrl(name), name: file.name, size: file.size, type: file.type }, { status: 201, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const source = sharp(bytes, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning" }).rotate();
    const metadata = await source.metadata();
    if (!metadata.width || !metadata.height) throw new Error("Missing image dimensions");
    const outputWidth = Math.min(metadata.width, MAX_IMAGE_WIDTH);
    const outputHeight = Math.round(metadata.height * (outputWidth / metadata.width));
    const mainName = `${id}.webp`;
    const variants = thumbnailWidths.filter((width) => width < outputWidth);

    await Promise.all([
      source.clone().resize({ width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_WIDTH, fit: "inside", withoutEnlargement: true }).webp({ quality: 82, effort: 5, smartSubsample: true }).toFile(getPublicUploadPath(mainName)!),
      ...variants.map((width) => source.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 78, effort: 5, smartSubsample: true }).toFile(getPublicUploadPath(`${id}-${width}.webp`)!)),
    ]);

    const placeholder = await source.clone().resize({ width: 32, withoutEnlargement: true }).webp({ quality: 45 }).toBuffer();
    return Response.json({
      url: publicUploadUrl(mainName),
      name: file.name,
      type: "image/webp",
      width: outputWidth,
      height: outputHeight,
      variants: variants.map((width) => ({ width, url: publicUploadUrl(`${id}-${width}.webp`) })),
      placeholder: `data:image/webp;base64,${placeholder.toString("base64")}`,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Ảnh không hợp lệ, quá lớn hoặc không thể xử lý." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
};
