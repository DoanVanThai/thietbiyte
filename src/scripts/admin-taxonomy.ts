import { validateAdminImage } from "@/lib/admin-image-upload";

type Entity = { id:string; slug:string; name:string; description:string; image:string; parentSlug?:string; type?:string; sortOrder:number; status:"active"|"inactive" };
export {};

const initAdminTaxonomy = () => {
const root = document.querySelector<HTMLElement>("[data-taxonomy-root]");
if (root) {
  const type = root.dataset.entityType || "category";
  const form = root.querySelector<HTMLFormElement>("[data-taxonomy-form]");
  const feedback = root.querySelector<HTMLElement>("[data-taxonomy-feedback]");
  let items: Entity[] = [];
  try { items = JSON.parse(document.querySelector("#taxonomy-data")?.textContent || "[]") as Entity[]; } catch { items = []; }
  const field = (name:string) => form?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  const reset = () => { form?.reset(); if (field("id")) field("id")!.value=""; const title=root.querySelector("[data-form-title]"); if(title)title.textContent=`Thêm ${type === "brand" ? "thương hiệu" : type === "specialty" ? "chuyên khoa" : "danh mục"}`; if(feedback)feedback.textContent=""; };
  const edit = (item:Entity) => { ["id","name","slug","description","image","parentSlug","type","sortOrder","status"].forEach((key)=>{const input=field(key);if(input)input.value=String(item[key as keyof Entity] ?? "");}); const title=root.querySelector("[data-form-title]");if(title)title.textContent=`Sửa ${item.name}`;form?.scrollIntoView({behavior:"smooth",block:"start"}); };
  root.querySelector("[data-new-entity]")?.addEventListener("click",reset);
  root.querySelector("[data-cancel-entity]")?.addEventListener("click",reset);
  root.querySelectorAll<HTMLButtonElement>("[data-edit-entity]").forEach((button)=>button.addEventListener("click",()=>{const item=items.find(({id})=>id===button.dataset.editEntity);if(item)edit(item);}));
  root.querySelectorAll<HTMLButtonElement>("[data-delete-entity]").forEach((button)=>button.addEventListener("click",async()=>{const item=items.find(({id})=>id===button.dataset.deleteEntity);if(!item||!confirm(`Ẩn “${item.name}” khỏi website?`))return;const response=await fetch(`/api/admin/taxonomy/${type}?id=${encodeURIComponent(item.id)}`,{method:"DELETE"});if(response.ok)document.dispatchEvent(new Event("admin:refresh"));else if(feedback)feedback.textContent="Không thể ẩn dữ liệu này.";}));
  const upload = root.querySelector<HTMLInputElement>("[data-taxonomy-upload]");
  upload?.addEventListener("change",async()=>{const file=upload.files?.[0];if(!file)return;const validationError=validateAdminImage(file);if(validationError){if(feedback)feedback.textContent=validationError;upload.value="";return;}upload.disabled=true;const body=new FormData();body.set("file",file);if(feedback)feedback.textContent="Đang tải ảnh…";try{const response=await fetch("/api/admin/upload",{method:"POST",body});const result=await response.json();if(response.ok&&field("image")){field("image")!.value=result.url;if(feedback)feedback.textContent="Đã tải ảnh.";}else if(feedback)feedback.textContent=result.error||"Tải ảnh thất bại.";}catch{if(feedback)feedback.textContent="Mất kết nối khi tải ảnh. Hãy thử lại.";}finally{upload.disabled=false;upload.value="";}});
  form?.addEventListener("submit",async(event)=>{event.preventDefault();if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form).entries());data.sortOrder=Number(data.sortOrder||0) as never;if(feedback)feedback.textContent="Đang lưu…";const response=await fetch(`/api/admin/taxonomy/${type}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await response.json();if(!response.ok){if(feedback)feedback.textContent=result.error||"Không thể lưu.";return;}if(feedback)feedback.textContent="Đã lưu và làm mới dữ liệu Public.";document.dispatchEvent(new Event("admin:refresh"));});
}
};

document.addEventListener("astro:page-load", initAdminTaxonomy);
