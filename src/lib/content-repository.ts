import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { catalogProducts as seedProducts, type CatalogProduct } from "@/data/catalog";

export type PublishStatus = "draft" | "published" | "archived";
export type PriceMode = "SHOW_PRICE" | "CONTACT" | "REQUEST_QUOTE";

export interface CmsProduct extends CatalogProduct {
  sku: string;
  manufacturingYear?: string;
  description: string;
  priceMode: PriceMode;
  priceVnd?: number;
  publishStatus: PublishStatus;
  detail?: ProductContent;
  updatedAt?: string;
}

export interface ProductContent {
  gallery: { type: "image" | "video"; src: string; alt: string; position?: string; poster?: string; isCover?: boolean; quoteEnabled?: boolean; quoteCaption?: string; quoteAfterText?: string }[];
  features: { title: string; description: string }[];
  configurations: { title: string; description?: string; items: { name: string; detail?: string; quantity?: number; imageUrl?: string }[] }[];
  specificationGroups: { title: string; items: { label: string; value: string }[] }[];
  documents: { title: string; type: string; format: string; size?: string; fileSize?: number; access: "public" | "login" | "restricted"; href?: string }[];
  shortDescription?: string;
  seo?: { title?: string; description?: string; ogImage?: string };
  warranty?: { period?: string; coverage?: string; installation?: string; technicalSupport?: string };
}

export interface TaxonomyEntity {
  id: string; slug: string; name: string; description: string; image: string; parentSlug?: string;
  type?: string; sortOrder: number; status: "active" | "inactive"; data?: Record<string, unknown>;
}

const dbPath = resolve(process.env.CONTENT_DB_PATH || ".data/thien-loc-content.sqlite");
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
db.exec(`
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, model TEXT NOT NULL DEFAULT '',
 group_name TEXT NOT NULL, category_name TEXT NOT NULL DEFAULT '', category_slug TEXT NOT NULL DEFAULT '', brand_name TEXT NOT NULL DEFAULT '', brand_slug TEXT NOT NULL DEFAULT '',
 origin TEXT NOT NULL DEFAULT '', manufacturing_year TEXT, warranty TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '', price_band TEXT NOT NULL DEFAULT '',
 price_mode TEXT NOT NULL DEFAULT 'CONTACT', price_vnd INTEGER, featured INTEGER NOT NULL DEFAULT 0, availability TEXT NOT NULL DEFAULT 'contact',
 image TEXT NOT NULL DEFAULT '/images/project-handover-placeholder.webp', image_position TEXT NOT NULL DEFAULT 'center', specialties_json TEXT NOT NULL DEFAULT '[]',
 specialty_slugs_json TEXT NOT NULL DEFAULT '[]', applications_json TEXT NOT NULL DEFAULT '[]', application_slugs_json TEXT NOT NULL DEFAULT '[]', specs_json TEXT NOT NULL DEFAULT '[]',
 detail_json TEXT, publish_status TEXT NOT NULL DEFAULT 'draft', created_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_products_public_order ON products(publish_status,featured DESC,created_order DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_public ON products(category_slug,publish_status,created_order DESC);
CREATE INDEX IF NOT EXISTS idx_products_brand_public ON products(brand_slug,publish_status,created_order DESC);
CREATE INDEX IF NOT EXISTS idx_products_group_public ON products(group_name,publish_status,created_order DESC);
CREATE TABLE IF NOT EXISTS slug_history (old_slug TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS taxonomy (entity_type TEXT NOT NULL, id TEXT NOT NULL, slug TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '', parent_slug TEXT, subtype TEXT, sort_order INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', data_json TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(entity_type,id), UNIQUE(entity_type,slug));
CREATE TABLE IF NOT EXISTS content_blocks (block_key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS site_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS cache_state (cache_key TEXT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO cache_state(cache_key,version) VALUES('products',1),('taxonomy',1),('content',1),('settings',1);
`);

const json = <T>(value: unknown, fallback: T): T => { try { return JSON.parse(String(value || "")) as T; } catch { return fallback; } };
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
type CacheResource = "products" | "taxonomy" | "content" | "settings";
const entityCache = new Map<string, { version: number; value: TaxonomyEntity[] }>();
const contentCache = new Map<string, { version: number; value: unknown }>();
const version = (resource: CacheResource = "products") => Number((db.prepare("SELECT version FROM cache_state WHERE cache_key=?").get(resource) as {version:number}).version);
const invalidate = (resource: CacheResource) => {
 db.prepare("UPDATE cache_state SET version=version+1,updated_at=CURRENT_TIMESTAMP WHERE cache_key=?").run(resource);
 if (resource === "products") cache.clear();
 if (resource === "taxonomy") entityCache.clear();
 if (resource === "content") contentCache.clear();
 if (resource === "settings") settingsCache = undefined;
};

const fromRow = (r: Record<string, unknown>): CmsProduct => ({
 id:String(r.id),slug:String(r.slug),sku:String(r.sku),name:String(r.name),model:String(r.model),group:r.group_name as CmsProduct["group"],category:String(r.category_name),categorySlug:String(r.category_slug),brand:String(r.brand_name),brandSlug:String(r.brand_slug),origin:String(r.origin),manufacturingYear:r.manufacturing_year?String(r.manufacturing_year):undefined,warranty:String(r.warranty),description:String(r.description),priceBand:String(r.price_band),priceMode:r.price_mode as PriceMode,priceVnd:typeof r.price_vnd==="number"?r.price_vnd:undefined,featured:Number(r.featured),availability:r.availability as CmsProduct["availability"],image:String(r.image),imagePosition:String(r.image_position),specialties:json(r.specialties_json,[]),specialtySlugs:json(r.specialty_slugs_json,[]),applications:json(r.applications_json,[]),applicationSlugs:json(r.application_slugs_json,[]),specs:json(r.specs_json,[]),detail:json<ProductContent|undefined>(r.detail_json,undefined),publishStatus:r.publish_status as PublishStatus,createdOrder:Number(r.created_order),updatedAt:String(r.updated_at),
});

const seed = () => {
 if (Number((db.prepare("SELECT COUNT(*) count FROM products").get() as {count:number}).count)) return;
 const insert=db.prepare("INSERT INTO products(id,slug,sku,name,model,group_name,category_name,category_slug,brand_name,brand_slug,origin,warranty,price_band,featured,availability,image,image_position,specialties_json,specialty_slugs_json,applications_json,application_slugs_json,specs_json,publish_status,created_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
 db.exec("BEGIN"); try { for(const p of seedProducts) insert.run(p.id,p.slug,p.id.toUpperCase(),p.name,p.model,p.group,p.category,p.categorySlug,p.brand,p.brandSlug,p.origin,p.warranty,p.priceBand,p.featured,p.availability,p.image,p.imagePosition,JSON.stringify(p.specialties),JSON.stringify(p.specialtySlugs),JSON.stringify(p.applications),JSON.stringify(p.applicationSlugs),JSON.stringify(p.specs),p.availability==="unavailable"?"archived":"published",p.createdOrder); db.exec("COMMIT"); } catch(e){db.exec("ROLLBACK");throw e;}
 const tax=db.prepare("INSERT OR IGNORE INTO taxonomy(entity_type,id,slug,name,description,image,sort_order,status,data_json) VALUES(?,?,?,?,?,?,?,?,?)");
 const unique=<T>(items:T[],key:(item:T)=>string)=>[...new Map(items.map(item=>[key(item),item])).values()];
 unique([...seedProducts],p=>p.categorySlug).forEach((p,i)=>tax.run("category",`category-${p.categorySlug}`,p.categorySlug,p.category,`Danh mục ${p.category}.`,p.image,i,"active",JSON.stringify({type:p.group})));
 unique([...seedProducts],p=>p.brandSlug).forEach((p,i)=>tax.run("brand",`brand-${p.brandSlug}`,p.brandSlug,p.brand,`Thiết bị thương hiệu ${p.brand}.`,"",i,"active","{}"));
 const specs=seedProducts.flatMap(p=>p.specialties.map((name,i)=>({name,slug:p.specialtySlugs[i]}))).filter(x=>x.slug);
 unique(specs,x=>x.slug).forEach((x,i)=>tax.run("specialty",`specialty-${x.slug}`,x.slug,x.name,`Thiết bị cho chuyên khoa ${x.name}.`,"",i,"active","{}"));
}; seed();

const cache=new Map<string,{version:number,value:CmsProduct[]}>();
export const getProducts=(publicOnly=true):CmsProduct[]=>{const key=publicOnly?"public":"all",v=version(),hit=cache.get(key);if(hit?.version===v)return hit.value.map(x=>({...x}));const rows=db.prepare(`SELECT * FROM products ${publicOnly?"WHERE publish_status='published'":""} ORDER BY featured DESC,created_order DESC`).all() as Record<string,unknown>[];const value=rows.map(fromRow);cache.set(key,{version:v,value});return value.map(x=>({...x}));};
export const getProductsPage=(options:{publicOnly?:boolean;page?:number;pageSize?:number;query?:string}={})=>{const publicOnly=options.publicOnly??true,page=Math.max(1,Math.trunc(options.page||1)),pageSize=Math.min(100,Math.max(1,Math.trunc(options.pageSize||24))),query=(options.query||"").trim(),where=[...(publicOnly?["publish_status='published'"]:[]),...(query?["(name LIKE ? OR model LIKE ? OR brand_name LIKE ? OR sku LIKE ?)"]:[])],params=query?Array(4).fill(`%${query}%`):[],clause=where.length?`WHERE ${where.join(" AND ")}`:"",total=Number((db.prepare(`SELECT COUNT(*) count FROM products ${clause}`).get(...params) as {count:number}).count),rows=db.prepare(`SELECT * FROM products ${clause} ORDER BY featured DESC,created_order DESC LIMIT ? OFFSET ?`).all(...params,pageSize,(page-1)*pageSize) as Record<string,unknown>[];return{products:rows.map(fromRow),pagination:{page,pageSize,total,totalPages:Math.max(1,Math.ceil(total/pageSize))}};};
export const getProductById=(id:string,publicOnly=false)=>{const row=db.prepare(`SELECT * FROM products WHERE id=? ${publicOnly?"AND publish_status='published'":""}`).get(id) as Record<string,unknown>|undefined;return row?fromRow(row):undefined;};
export const getProductBySlug=(slug:string,publicOnly=true)=>{const row=db.prepare(`SELECT * FROM products WHERE slug=? ${publicOnly?"AND publish_status='published'":""}`).get(slug) as Record<string,unknown>|undefined;return row?fromRow(row):undefined;};
export const resolveOldSlug=(slug:string)=>{const row=db.prepare("SELECT p.slug FROM slug_history h JOIN products p ON p.id=h.product_id WHERE h.old_slug=? AND p.publish_status='published'").get(slug) as {slug:string}|undefined;return row?.slug;};
const uniqueSlug=(value:string,id:string)=>{const base=slugify(value)||`san-pham-${Date.now()}`;let out=base,n=2;while(db.prepare("SELECT 1 FROM products WHERE slug=? AND id<>?").get(out,id))out=`${base}-${n++}`;return out;};

export const saveProduct=(input:Partial<CmsProduct>&{name:string},publish=false)=>{
 const old=input.id?getProductById(input.id):undefined,id=old?.id||input.id||`p-${randomUUID().slice(0,8)}`,slug=uniqueSlug(input.slug||input.name,id),status:PublishStatus=publish?"published":input.publishStatus||old?.publishStatus||"draft";
 const p:CmsProduct={id,slug,sku:input.sku||old?.sku||id.toUpperCase(),name:input.name.trim(),model:input.model||"",group:input.group||"medical",category:input.category||"Chưa phân loại",categorySlug:input.categorySlug||slugify(input.category||"chua-phan-loai"),brand:input.brand||"Chưa cập nhật",brandSlug:input.brandSlug||slugify(input.brand||"chua-cap-nhat"),origin:input.origin||"",manufacturingYear:input.manufacturingYear,warranty:input.warranty||"",description:input.description||"",priceBand:input.priceBand||"",priceMode:input.priceMode||"CONTACT",priceVnd:input.priceVnd,featured:Number(input.featured||0),availability:input.availability||"contact",image:input.image||"/images/project-handover-placeholder.webp",imagePosition:input.imagePosition||"center",specialties:input.specialties||[],specialtySlugs:input.specialtySlugs||[],applications:input.applications||[],applicationSlugs:input.applicationSlugs||[],specs:input.specs||[],detail:input.detail,publishStatus:status,createdOrder:old?.createdOrder||Date.now()};
 db.exec("BEGIN");try{if(old&&old.slug!==slug)db.prepare("INSERT OR REPLACE INTO slug_history(old_slug,product_id) VALUES(?,?)").run(old.slug,id);db.prepare(`INSERT INTO products(id,slug,sku,name,model,group_name,category_name,category_slug,brand_name,brand_slug,origin,manufacturing_year,warranty,description,price_band,price_mode,price_vnd,featured,availability,image,image_position,specialties_json,specialty_slugs_json,applications_json,application_slugs_json,specs_json,detail_json,publish_status,created_order,published_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,sku=excluded.sku,name=excluded.name,model=excluded.model,group_name=excluded.group_name,category_name=excluded.category_name,category_slug=excluded.category_slug,brand_name=excluded.brand_name,brand_slug=excluded.brand_slug,origin=excluded.origin,manufacturing_year=excluded.manufacturing_year,warranty=excluded.warranty,description=excluded.description,price_band=excluded.price_band,price_mode=excluded.price_mode,price_vnd=excluded.price_vnd,featured=excluded.featured,availability=excluded.availability,image=excluded.image,image_position=excluded.image_position,specialties_json=excluded.specialties_json,specialty_slugs_json=excluded.specialty_slugs_json,applications_json=excluded.applications_json,application_slugs_json=excluded.application_slugs_json,specs_json=excluded.specs_json,detail_json=excluded.detail_json,publish_status=excluded.publish_status,published_at=excluded.published_at,updated_at=CURRENT_TIMESTAMP`).run(p.id,p.slug,p.sku,p.name,p.model,p.group,p.category,p.categorySlug,p.brand,p.brandSlug,p.origin,p.manufacturingYear||null,p.warranty,p.description,p.priceBand,p.priceMode,p.priceVnd||null,p.featured,p.availability,p.image,p.imagePosition,JSON.stringify(p.specialties),JSON.stringify(p.specialtySlugs),JSON.stringify(p.applications),JSON.stringify(p.applicationSlugs),JSON.stringify(p.specs),p.detail?JSON.stringify(p.detail):null,p.publishStatus,p.createdOrder,status==="published"?new Date().toISOString():null);invalidate("products");db.exec("COMMIT");}catch(e){db.exec("ROLLBACK");throw e;}return getProductById(id)!;
};
export const setProductStatus=(id:string,status:PublishStatus)=>{db.prepare("UPDATE products SET publish_status=?,published_at=CASE WHEN ?='published' THEN CURRENT_TIMESTAMP ELSE published_at END,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status,status,id);invalidate("products");return getProductById(id);};
export const duplicateProduct=(id:string)=>{const p=getProductById(id);return p?saveProduct({...p,id:undefined,sku:`${p.sku}-COPY-${Date.now().toString().slice(-4)}`,slug:`${p.slug}-ban-sao`,name:`${p.name} — Bản sao`,publishStatus:"draft"}):undefined;};
export const deleteProduct=(id:string)=>{db.exec("BEGIN");try{db.prepare("DELETE FROM slug_history WHERE product_id=?").run(id);const result=db.prepare("DELETE FROM products WHERE id=?").run(id);if(result.changes)invalidate("products");db.exec("COMMIT");return Boolean(result.changes);}catch(error){db.exec("ROLLBACK");throw error;}};

export const getEntities=(type:"category"|"brand"|"specialty",publicOnly=true):TaxonomyEntity[]=>{const key=`${type}:${publicOnly?"public":"all"}`,current=version("taxonomy"),hit=entityCache.get(key);if(hit?.version===current)return hit.value.map(item=>({...item}));const value=(db.prepare(`SELECT * FROM taxonomy WHERE entity_type=? ${publicOnly?"AND status='active'":""} ORDER BY sort_order,name`).all(type) as Record<string,unknown>[]).map(r=>({id:String(r.id),slug:String(r.slug),name:String(r.name),description:String(r.description),image:String(r.image),parentSlug:r.parent_slug?String(r.parent_slug):undefined,type:r.subtype?String(r.subtype):undefined,sortOrder:Number(r.sort_order),status:r.status as TaxonomyEntity["status"],data:json(r.data_json,{})}));entityCache.set(key,{version:current,value});return value.map(item=>({...item}));};
export const getEntity=(type:"category"|"brand"|"specialty",slug:string)=>getEntities(type,false).find(x=>x.slug===slug);
export const saveEntity=(type:"category"|"brand"|"specialty",input:Partial<TaxonomyEntity>&{name:string})=>{const id=input.id||`${type}-${randomUUID().slice(0,8)}`,slug=slugify(input.slug||input.name);db.prepare("INSERT INTO taxonomy(entity_type,id,slug,name,description,image,parent_slug,subtype,sort_order,status,data_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(entity_type,id) DO UPDATE SET slug=excluded.slug,name=excluded.name,description=excluded.description,image=excluded.image,parent_slug=excluded.parent_slug,subtype=excluded.subtype,sort_order=excluded.sort_order,status=excluded.status,data_json=excluded.data_json,updated_at=CURRENT_TIMESTAMP").run(type,id,slug,input.name,input.description||"",input.image||"",input.parentSlug||null,input.type||null,input.sortOrder||0,input.status||"active",JSON.stringify(input.data||{}));invalidate("taxonomy");return getEntity(type,slug)!;};
export const deactivateEntity=(type:"category"|"brand"|"specialty",id:string)=>{const result=db.prepare("UPDATE taxonomy SET status='inactive',updated_at=CURRENT_TIMESTAMP WHERE entity_type=? AND id=?").run(type,id);if(result.changes)invalidate("taxonomy");return Boolean(result.changes);};

export const getContent=<T>(key:string,fallback:T):T=>{const current=version("content"),hit=contentCache.get(key);if(hit?.version===current)return structuredClone(hit.value) as T;const r=db.prepare("SELECT value_json FROM content_blocks WHERE block_key=?").get(key) as {value_json:string}|undefined,value=r?json(r.value_json,fallback):fallback;if(!r)db.prepare("INSERT INTO content_blocks(block_key,value_json) VALUES(?,?)").run(key,JSON.stringify(fallback));contentCache.set(key,{version:current,value});return structuredClone(value) as T;};
export const saveContent=(key:string,value:unknown)=>{db.prepare("INSERT INTO content_blocks(block_key,value_json,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(block_key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP").run(key,JSON.stringify(value));invalidate("content");return value;};
const defaults={company:"THIÊN LỘC GROUP",logo:"/images/tl-group-logo.png",hotline:"0902 137 158",email:"tuvan@thienlocgroup.com",address:"",zalo:"0902137158",facebook:"",social:"{}"};
db.prepare("UPDATE site_settings SET setting_value=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key='company' AND UPPER(TRIM(setting_value))='THIÊN LỘC MEDICAL'").run(defaults.company);
db.prepare("INSERT OR IGNORE INTO site_settings(setting_key,setting_value) VALUES('logo',?)").run(defaults.logo);
db.prepare("UPDATE site_settings SET setting_value=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key='logo' AND TRIM(setting_value)='' ").run(defaults.logo);
db.prepare("UPDATE content_blocks SET value_json=REPLACE(REPLACE(value_json,'THIÊN LỘC MEDICAL','THIÊN LỘC GROUP'),'Thiên Lộc Medical','Thiên Lộc Group'),updated_at=CURRENT_TIMESTAMP WHERE value_json LIKE '%THIÊN LỘC MEDICAL%' OR value_json LIKE '%Thiên Lộc Medical%'").run();
db.prepare("UPDATE site_settings SET setting_value=REPLACE(setting_value,'@thienlocmedical.vn','@thienlocgroup.com'),updated_at=CURRENT_TIMESTAMP WHERE setting_value LIKE '%@thienlocmedical.vn%'").run();
db.prepare("UPDATE content_blocks SET value_json=REPLACE(value_json,'thienlocmedical.vn','thienlocgroup.com'),updated_at=CURRENT_TIMESTAMP WHERE value_json LIKE '%thienlocmedical.vn%'").run();
let settingsCache:{version:number;value:Record<string,string>}|undefined;
export const getSettings=()=>{const current=version("settings");if(settingsCache?.version===current)return{...settingsCache.value};const value={...defaults,...Object.fromEntries((db.prepare("SELECT setting_key,setting_value FROM site_settings").all() as {setting_key:string;setting_value:string}[]).map(x=>[x.setting_key,x.setting_value]))};settingsCache={version:current,value};return{...value};};
export const saveSettings=(values:Record<string,string>)=>{const s=db.prepare("INSERT INTO site_settings(setting_key,setting_value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=CURRENT_TIMESTAMP");db.exec("BEGIN");try{Object.entries(values).forEach(([k,v])=>s.run(k,String(v)));invalidate("settings");db.exec("COMMIT");}catch(e){db.exec("ROLLBACK");throw e;}return getSettings();};
export const saveSiteContentBundle=(input:{settings:Record<string,string>;content:Record<string,unknown>})=>{
 const settingStatement=db.prepare("INSERT INTO site_settings(setting_key,setting_value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=CURRENT_TIMESTAMP");
 const contentStatement=db.prepare("INSERT INTO content_blocks(block_key,value_json,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(block_key) DO UPDATE SET value_json=excluded.value_json,updated_at=CURRENT_TIMESTAMP");
 db.exec("BEGIN");
 try{
  Object.entries(input.settings).forEach(([key,value])=>settingStatement.run(key,String(value)));
  Object.entries(input.content).forEach(([key,value])=>contentStatement.run(key,JSON.stringify(value)));
  invalidate("settings");invalidate("content");db.exec("COMMIT");
 }catch(error){db.exec("ROLLBACK");throw error;}
 return{settings:getSettings(),content:Object.fromEntries(Object.keys(input.content).map(key=>[key,getContent(key,null)]))};
};
export const getCacheVersion=version;
export const invalidateContentCache=(resource:CacheResource)=>invalidate(resource);
export const contentDatabasePath=dbPath;
