import { existsSync } from "node:fs";
import { resolve } from "node:path";

const uploadNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export const getPublicUploadDirectory = () => resolve(process.env.PUBLIC_UPLOAD_DIR || "var/uploads/public");

export const getPublicUploadPath = (name: string) => uploadNamePattern.test(name)
  ? resolve(getPublicUploadDirectory(), name)
  : null;

export const findPublicUploadPath = (pathname: string) => {
  if (!pathname.startsWith("/uploads/")) return null;
  const name = pathname.slice("/uploads/".length);
  if (!uploadNamePattern.test(name)) return null;
  const candidates = [
    resolve(getPublicUploadDirectory(), name),
    resolve(process.cwd(), "public/uploads", name),
    resolve(process.cwd(), "dist/client/uploads", name),
    resolve(process.cwd(), "client/uploads", name),
  ];
  return candidates.find(existsSync) || null;
};

export const publicUploadUrl = (name: string) => `/uploads/${name}`;
