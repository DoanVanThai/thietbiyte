export const MAX_ADMIN_IMAGE_BYTES = 15 * 1024 * 1024;

export const ADMIN_IMAGE_ACCEPT = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
  ".avif",
].join(",");

const supportedImageExtensions = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif", "avif"]);
const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"]);

type ImageFileLike = Pick<File, "name" | "size" | "type">;

export const isSupportedAdminImage = (file: ImageFileLike) => {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase("en") || "";
  return supportedImageTypes.has(file.type.toLocaleLowerCase("en")) || supportedImageExtensions.has(extension);
};

export const validateAdminImage = (file: ImageFileLike): string | null => {
  if (!isSupportedAdminImage(file)) return "Chỉ hỗ trợ ảnh JPG, PNG, WebP, HEIC/HEIF hoặc AVIF.";
  if (file.size > MAX_ADMIN_IMAGE_BYTES) return "Ảnh vượt quá giới hạn 15 MB.";
  if (file.size === 0) return "Ảnh đang trống hoặc chưa tải xong từ thiết bị.";
  return null;
};
