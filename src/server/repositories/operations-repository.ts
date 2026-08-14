import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { articles as homepageArticles } from "@/data/homepage";
import { invalidateContentCache } from "@/lib/content-repository";
import { getPublicUploadDirectory } from "@/server/uploads/public-upload-storage";

export type ArticleStatus = "draft" | "review" | "scheduled" | "published" | "archived";
export type ArticleType = "knowledge" | "blog" | "page";
export type DocumentAccess = "public" | "registered" | "staff" | "admin";
export type DocumentType = "catalogue" | "datasheet" | "manual" | "certificate" | "warranty" | "other";

export interface OperationsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: ArticleType;
  category: string;
  status: ArticleStatus;
  coverUrl: string;
  coverAlt: string;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperationsDocument {
  id: string;
  name: string;
  url: string;
  originalName: string;
  mimeType: string;
  type: DocumentType;
  access: DocumentAccess;
  productId: string;
  productName: string;
  fileSize: number;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  alt: string;
  caption: string;
  fileSize: number;
  width: number;
  height: number;
  source: "public" | "upload";
  createdAt: string;
  updatedAt: string;
}

const databasePath = resolve(process.env.CONTENT_DB_PATH || ".data/thien-loc-content.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });
const database = new DatabaseSync(databasePath);
database.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
database.exec(`
CREATE TABLE IF NOT EXISTS operations_articles (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'knowledge', category TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft',
  cover_url TEXT NOT NULL DEFAULT '', cover_alt TEXT NOT NULL DEFAULT '', seo_title TEXT NOT NULL DEFAULT '', seo_description TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '', published_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_operations_articles_status_updated ON operations_articles(status, updated_at DESC);
CREATE TABLE IF NOT EXISTS operations_documents (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE, original_name TEXT NOT NULL DEFAULT '', mime_type TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'other', access TEXT NOT NULL DEFAULT 'public', product_id TEXT NOT NULL DEFAULT '', product_name TEXT NOT NULL DEFAULT '',
  file_size INTEGER NOT NULL DEFAULT 0, version TEXT NOT NULL DEFAULT '1.0', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_operations_documents_product ON operations_documents(product_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL DEFAULT 'image/webp', alt TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '', file_size INTEGER NOT NULL DEFAULT 0, width INTEGER NOT NULL DEFAULT 0, height INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'upload', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_assets_updated ON media_assets(updated_at DESC);
`);

const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const uniqueArticleSlug = (value: string, id = "") => {
  const base = slugify(value) || `noi-dung-${Date.now()}`;
  let candidate = base;
  let suffix = 2;
  while (database.prepare("SELECT 1 FROM operations_articles WHERE slug=? AND id<>?").get(candidate, id)) candidate = `${base}-${suffix++}`;
  return candidate;
};

const articleFromRow = (row: Record<string, unknown>): OperationsArticle => ({
  id: String(row.id), title: String(row.title), slug: String(row.slug), excerpt: String(row.excerpt), content: String(row.content),
  type: row.type as ArticleType, category: String(row.category), status: row.status as ArticleStatus,
  coverUrl: String(row.cover_url), coverAlt: String(row.cover_alt), seoTitle: String(row.seo_title), seoDescription: String(row.seo_description),
  authorName: String(row.author_name), publishedAt: row.published_at ? String(row.published_at) : undefined,
  createdAt: String(row.created_at), updatedAt: String(row.updated_at),
});
const documentFromRow = (row: Record<string, unknown>): OperationsDocument => ({
  id: String(row.id), name: String(row.name), url: String(row.url), originalName: String(row.original_name), mimeType: String(row.mime_type),
  type: row.type as DocumentType, access: row.access as DocumentAccess, productId: String(row.product_id), productName: String(row.product_name),
  fileSize: Number(row.file_size), version: String(row.version), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
});
const mediaFromRow = (row: Record<string, unknown>): MediaAsset => ({
  id: String(row.id), name: String(row.name), url: String(row.url), mimeType: String(row.mime_type), alt: String(row.alt), caption: String(row.caption),
  fileSize: Number(row.file_size), width: Number(row.width), height: Number(row.height), source: row.source as MediaAsset["source"],
  createdAt: String(row.created_at), updatedAt: String(row.updated_at),
});

const seedArticles = () => {
  const count = Number((database.prepare("SELECT COUNT(*) AS count FROM operations_articles").get() as { count: number }).count);
  if (count) return;
  const statement = database.prepare("INSERT INTO operations_articles(id,title,slug,excerpt,content,type,category,status,author_name,published_at) VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)");
  database.exec("BEGIN");
  try {
    homepageArticles.forEach(([category, title, excerpt], index) => statement.run(`article-${index + 1}`, title, uniqueArticleSlug(title), excerpt, excerpt, "knowledge", category, "published", "Thiên Lộc Group"));
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
};
seedArticles();

export const listArticles = () => (database.prepare("SELECT * FROM operations_articles ORDER BY updated_at DESC").all() as Record<string, unknown>[]).map(articleFromRow);
export const listPublishedArticles = (limit = 20) => (database.prepare("SELECT * FROM operations_articles WHERE status='published' ORDER BY COALESCE(published_at,updated_at) DESC LIMIT ?").all(Math.max(1, Math.min(100, limit))) as Record<string, unknown>[]).map(articleFromRow);
export const getArticle = (id: string) => {
  const row = database.prepare("SELECT * FROM operations_articles WHERE id=?").get(id) as Record<string, unknown> | undefined;
  return row ? articleFromRow(row) : undefined;
};
export const saveArticle = (input: Partial<OperationsArticle> & { title: string }, authorName: string) => {
  const id = input.id || `article-${randomUUID().slice(0, 12)}`;
  const existing = getArticle(id);
  const status = input.status || existing?.status || "draft";
  const slug = uniqueArticleSlug(input.slug || input.title, id);
  const publishedAt = status === "published" ? existing?.publishedAt || new Date().toISOString() : input.publishedAt || existing?.publishedAt || null;
  database.prepare(`INSERT INTO operations_articles(id,title,slug,excerpt,content,type,category,status,cover_url,cover_alt,seo_title,seo_description,author_name,published_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title,slug=excluded.slug,excerpt=excluded.excerpt,content=excluded.content,type=excluded.type,category=excluded.category,status=excluded.status,cover_url=excluded.cover_url,cover_alt=excluded.cover_alt,seo_title=excluded.seo_title,seo_description=excluded.seo_description,author_name=excluded.author_name,published_at=excluded.published_at,updated_at=CURRENT_TIMESTAMP`)
    .run(id, input.title.trim(), slug, input.excerpt || "", input.content || "", input.type || "knowledge", input.category || "", status, input.coverUrl || "", input.coverAlt || "", input.seoTitle || "", input.seoDescription || "", authorName || existing?.authorName || "Quản trị viên", publishedAt);
  invalidateContentCache("content");
  return getArticle(id)!;
};
export const deleteArticle = (id: string) => {
  const changed = Boolean(database.prepare("DELETE FROM operations_articles WHERE id=?").run(id).changes);
  if (changed) invalidateContentCache("content");
  return changed;
};

export const listDocuments = () => (database.prepare("SELECT * FROM operations_documents ORDER BY updated_at DESC").all() as Record<string, unknown>[]).map(documentFromRow);
export const getDocument = (id: string) => {
  const row = database.prepare("SELECT * FROM operations_documents WHERE id=?").get(id) as Record<string, unknown> | undefined;
  return row ? documentFromRow(row) : undefined;
};
export const saveDocument = (input: Partial<OperationsDocument> & { name: string; url: string }) => {
  const id = input.id || `document-${randomUUID().slice(0, 12)}`;
  database.prepare(`INSERT INTO operations_documents(id,name,url,original_name,mime_type,type,access,product_id,product_name,file_size,version,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,url=excluded.url,original_name=excluded.original_name,mime_type=excluded.mime_type,type=excluded.type,access=excluded.access,product_id=excluded.product_id,product_name=excluded.product_name,file_size=excluded.file_size,version=excluded.version,updated_at=CURRENT_TIMESTAMP`)
    .run(id, input.name.trim(), input.url, input.originalName || input.name, input.mimeType || "application/octet-stream", input.type || "other", input.access || "public", input.productId || "", input.productName || "", input.fileSize || 0, input.version || "1.0");
  return getDocument(id)!;
};
export const deleteDocument = (id: string) => Boolean(database.prepare("DELETE FROM operations_documents WHERE id=?").run(id).changes);

const mimeForExtension = (extension: string) => ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" }[extension] || "application/octet-stream");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);
type DiscoveredMedia = { path: string; url: string; source: MediaAsset["source"] };
const walkImages = (directory: string, urlPrefix: string, source: MediaAsset["source"]): DiscoveredMedia[] => {
  try {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = resolve(directory, entry.name);
      const url = `${urlPrefix}/${entry.name}`.replace(/\/+/g, "/");
      if (entry.isDirectory()) return walkImages(path, url, source);
      const isGeneratedVariant = source === "upload" && /-\d{2,4}\.webp$/i.test(entry.name);
      return imageExtensions.has(extname(entry.name).toLowerCase()) && !isGeneratedVariant ? [{ path, url, source }] : [];
    });
  } catch { return []; }
};
let mediaSynced = false;
export const syncMediaLibrary = async () => {
  if (mediaSynced) return;
  mediaSynced = true;
  const files = [
    ...walkImages(resolve("public/images"), "/images", "public"),
    ...walkImages(getPublicUploadDirectory(), "/uploads", "upload"),
  ];
  const insert = database.prepare("INSERT OR IGNORE INTO media_assets(id,name,url,mime_type,file_size,width,height,source) VALUES(?,?,?,?,?,?,?,?)");
  for (const file of files) {
    const info = statSync(file.path);
    let width = 0;
    let height = 0;
    if (extname(file.path).toLowerCase() !== ".svg") {
      try { const metadata = await sharp(file.path).metadata(); width = metadata.width || 0; height = metadata.height || 0; } catch { /* Ignore unreadable assets. */ }
    }
    insert.run(`media-${Buffer.from(file.url).toString("base64url").slice(0, 32)}`, basename(file.url), file.url, mimeForExtension(extname(file.url).toLowerCase()), info.size, width, height, file.source);
  }
};
export const listMedia = async () => {
  await syncMediaLibrary();
  return (database.prepare("SELECT * FROM media_assets ORDER BY updated_at DESC, name ASC").all() as Record<string, unknown>[]).map(mediaFromRow);
};
export const getMedia = (id: string) => {
  const row = database.prepare("SELECT * FROM media_assets WHERE id=?").get(id) as Record<string, unknown> | undefined;
  return row ? mediaFromRow(row) : undefined;
};
export const saveMedia = (input: Partial<MediaAsset> & { name: string; url: string }) => {
  const id = input.id || `media-${randomUUID().slice(0, 12)}`;
  database.prepare(`INSERT INTO media_assets(id,name,url,mime_type,alt,caption,file_size,width,height,source,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,url=excluded.url,mime_type=excluded.mime_type,alt=excluded.alt,caption=excluded.caption,file_size=excluded.file_size,width=excluded.width,height=excluded.height,source=excluded.source,updated_at=CURRENT_TIMESTAMP`)
    .run(id, input.name.trim(), input.url, input.mimeType || "image/webp", input.alt || "", input.caption || "", input.fileSize || 0, input.width || 0, input.height || 0, input.source || "upload");
  return getMedia(id)!;
};
export const deleteMedia = (id: string) => Boolean(database.prepare("DELETE FROM media_assets WHERE id=?").run(id).changes);
