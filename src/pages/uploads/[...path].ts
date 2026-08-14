import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { findPublicUploadPath } from "@/server/uploads/public-upload-storage";

export const prerender = false;

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const serveUpload: APIRoute = async ({ params, request }) => {
  const name = params.path || "";
  const filePath = findPublicUploadPath(`/uploads/${name}`);
  if (!filePath) return new Response("Không tìm thấy tệp.", { status: 404 });

  const headers = new Headers({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Type": contentTypes[extname(name).toLowerCase()] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (request.method === "HEAD") return new Response(null, { status: 200, headers });
  return new Response(new Uint8Array(await readFile(filePath)), { status: 200, headers });
};

export const GET = serveUpload;
export const HEAD = serveUpload;
