import { navigate } from "astro:transitions/client";
import { validateAdminImage } from "@/lib/admin-image-upload";

type ArticleRecord = {
  id: string; title: string; slug: string; excerpt: string; content: string; type: string; category: string; status: string;
  coverUrl: string; coverAlt: string; seoTitle: string; seoDescription: string;
};
type DocumentRecord = {
  id: string; name: string; url: string; originalName: string; mimeType: string; type: string; access: string;
  productId: string; productName: string; fileSize: number; version: string;
};
type MediaRecord = {
  id: string; name: string; url: string; mimeType: string; alt: string; caption: string; fileSize: number;
  width: number; height: number; source: "public" | "upload";
};

const one = <T extends Element>(selector: string, scope: ParentNode = document) => scope.querySelector<T>(selector);
const all = <T extends Element>(selector: string, scope: ParentNode = document) => Array.from(scope.querySelectorAll<T>(selector));
const parseData = <T>(id: string): T[] => {
  try { return JSON.parse(one<HTMLScriptElement>(`#${id}`)?.textContent || "[]") as T[]; } catch { return []; }
};
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const formatSize = (size: number) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;
const refreshPage = () => navigate(window.location.href, { history: "replace" });

let lifecycle: AbortController | undefined;
const initOperations = () => {
  lifecycle?.abort();
  lifecycle = new AbortController();
  const { signal } = lifecycle;
  const root = one<HTMLElement>("[data-ops-module]");
  if (!root) return;

  const module = root.dataset.opsModule;
  const notify = (message: string, error = false) => {
    const toast = one<HTMLElement>("[data-admin-shell-toast]");
    if (!toast) return;
    toast.replaceChildren();
    const icon = document.createElement("i"); icon.className = `ph ${error ? "ph-warning-circle" : "ph-check-circle"}`;
    const copy = document.createElement("span"); copy.textContent = message;
    toast.append(icon, copy); toast.hidden = false; toast.classList.toggle("is-error", error); toast.classList.add("is-visible");
    window.setTimeout(() => { toast.classList.remove("is-visible"); toast.hidden = true; }, 3200);
  };
  const request = async <T>(url: string, options: RequestInit = {}) => {
    const response = await fetch(url, { ...options, headers: options.body instanceof FormData ? options.headers : { "content-type": "application/json", ...options.headers } });
    if (response.status === 204) return null as T;
    const data = await response.json().catch(() => ({})) as T & { error?: string; message?: string };
    if (!response.ok) throw new Error(data.error || "Không thể hoàn tất thao tác.");
    return data;
  };
  const closeDialog = (dialog: HTMLDialogElement) => dialog.close();
  all<HTMLButtonElement>("[data-dialog-close]", root).forEach((button) => button.addEventListener("click", () => {
    const dialog = button.closest<HTMLDialogElement>("dialog"); if (dialog) closeDialog(dialog);
  }, { signal }));
  all<HTMLDialogElement>("dialog", root).forEach((dialog) => dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  }, { signal }));

  const search = one<HTMLInputElement>("[data-ops-search]", root);
  const visible = one<HTMLElement>("[data-ops-visible]", root);
  const empty = one<HTMLElement>("[data-ops-empty]", root);
  let summaryStatus = "all";
  const filterRows = () => {
    const query = search?.value.trim().toLocaleLowerCase("vi") || "";
    const type = one<HTMLSelectElement>("[data-ops-type]", root)?.value || "all";
    const status = one<HTMLSelectElement>("[data-ops-status]", root)?.value || summaryStatus;
    const access = one<HTMLSelectElement>("[data-ops-access]", root)?.value || "all";
    const source = one<HTMLSelectElement>("[data-ops-source]", root)?.value || "all";
    let count = 0;
    all<HTMLElement>("[data-ops-row]", root).forEach((row) => {
      const matches = (!query || row.dataset.search?.includes(query))
        && (type === "all" || row.dataset.type === type)
        && (status === "all" || row.dataset.status === status)
        && (access === "all" || row.dataset.access === access)
        && (source === "all" || row.dataset.source === source);
      row.hidden = !matches;
      if (matches) count += 1;
    });
    if (visible) visible.textContent = String(count);
    if (empty) empty.hidden = count !== 0;
  };
  [search, one("[data-ops-type]", root), one("[data-ops-status]", root), one("[data-ops-access]", root), one("[data-ops-source]", root)].forEach((control) => control?.addEventListener("input", filterRows, { signal }));
  all<HTMLButtonElement>("[data-summary-status]", root).forEach((button) => button.addEventListener("click", () => {
    summaryStatus = button.dataset.summaryStatus || "all";
    const status = one<HTMLSelectElement>("[data-ops-status]", root); if (status) { status.value = summaryStatus; status.dispatchEvent(new Event("change", { bubbles: true })); }
    all<HTMLButtonElement>("[data-summary-status]", root).forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    filterRows();
  }, { signal }));
  one<HTMLButtonElement>("[data-ops-reset]", root)?.addEventListener("click", () => {
    if (search) search.value = "";
    all<HTMLSelectElement>("[data-ops-type], [data-ops-status], [data-ops-access], [data-ops-source]", root).forEach((select) => { select.value = "all"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    summaryStatus = "all";
    all<HTMLButtonElement>("[data-summary-status]", root).forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.summaryStatus === "all")));
    filterRows();
  }, { signal });

  if (module === "articles") {
    const records = parseData<ArticleRecord>("ops-articles-data");
    const dialog = one<HTMLDialogElement>("[data-article-dialog]", root);
    const form = one<HTMLFormElement>("[data-article-form]", root);
    const title = one<HTMLInputElement>("[data-article-title]", root);
    const slug = form?.elements.namedItem("slug") as HTMLInputElement | null;
    let slugWasEdited = false;
    slug?.addEventListener("input", () => { slugWasEdited = Boolean(slug.value); }, { signal });
    title?.addEventListener("input", () => { if (slug && !slugWasEdited) slug.value = slugify(title.value); }, { signal });
    const open = (record?: ArticleRecord) => {
      if (!dialog || !form) return;
      form.reset(); slugWasEdited = Boolean(record?.slug);
      const values: Record<string, string> = record || { id: "", title: "", slug: "", excerpt: "", content: "", type: "knowledge", category: "", status: "draft", coverUrl: "", coverAlt: "", seoTitle: "", seoDescription: "" };
      Object.entries(values).forEach(([name, value]) => { const control = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null; if (control && typeof value === "string") control.value = value; });
      const heading = one<HTMLElement>("[data-article-dialog-title]", dialog); if (heading) heading.textContent = record ? "Chỉnh sửa nội dung" : "Viết nội dung";
      one<HTMLElement>("[data-ops-feedback]", dialog)!.textContent = "";
      dialog.showModal(); window.setTimeout(() => title?.focus(), 30);
    };
    one<HTMLButtonElement>("[data-article-new]", root)?.addEventListener("click", () => open(), { signal });
    all<HTMLButtonElement>("[data-article-edit]", root).forEach((button) => button.addEventListener("click", () => open(records.find((item) => item.id === button.dataset.articleEdit)), { signal }));
    all<HTMLButtonElement>("[data-article-delete]", root).forEach((button) => button.addEventListener("click", async () => {
      const record = records.find((item) => item.id === button.dataset.articleDelete);
      if (!record || !confirm(`Xóa nội dung “${record.title}”? Thao tác này không thể hoàn tác.`)) return;
      button.disabled = true;
      try { await request(`/api/admin/articles/${record.id}`, { method: "DELETE" }); await refreshPage(); } catch (error) { button.disabled = false; notify(error instanceof Error ? error.message : "Không thể xóa nội dung.", true); }
    }, { signal }));
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = one<HTMLButtonElement>('button[type="submit"]', form); const label = one<HTMLElement>("[data-submit-label]", form); const feedback = one<HTMLElement>("[data-ops-feedback]", form);
      if (submit) submit.disabled = true; if (label) label.textContent = "Đang lưu…"; if (feedback) feedback.textContent = "";
      const values = Object.fromEntries(new FormData(form).entries()); const id = String(values.id || "");
      try { const result = await request<{ message?: string }>(id ? `/api/admin/articles/${id}` : "/api/admin/articles", { method: id ? "PUT" : "POST", body: JSON.stringify(values) }); notify(result.message || "Đã lưu nội dung."); await refreshPage(); }
      catch (error) { if (submit) submit.disabled = false; if (label) label.textContent = "Lưu nội dung"; if (feedback) feedback.textContent = error instanceof Error ? error.message : "Không thể lưu nội dung."; }
    }, { signal });
    if (new URLSearchParams(location.search).get("new") === "1") open();
  }

  if (module === "documents") {
    const records = parseData<DocumentRecord>("ops-documents-data");
    const dialog = one<HTMLDialogElement>("[data-document-dialog]", root); const form = one<HTMLFormElement>("[data-document-form]", root); const file = form?.elements.namedItem("file") as HTMLInputElement | null; const zone = one<HTMLElement>("[data-document-file-zone]", root);
    const fill = (name: string, value: string | number) => { const control = form?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null; if (control) control.value = String(value); };
    const open = (record?: DocumentRecord) => {
      if (!dialog || !form) return; form.reset();
      const values = record || { id: "", name: "", url: "", originalName: "", mimeType: "", type: "catalogue", access: "public", productId: "", fileSize: 0, version: "1.0" };
      Object.entries(values).forEach(([name, value]) => { if (["productName", "createdAt", "updatedAt"].includes(name)) return; fill(name, String(value)); });
      if (file) file.required = !record; if (zone) { zone.hidden = Boolean(record); zone.classList.remove("has-file"); }
      const heading = one<HTMLElement>("[data-document-dialog-title]", dialog); if (heading) heading.textContent = record ? "Sửa thông tin tài liệu" : "Tải tài liệu";
      one<HTMLElement>("[data-ops-feedback]", dialog)!.textContent = ""; dialog.showModal();
    };
    file?.addEventListener("change", () => { const selected = file.files?.[0]; if (!selected) return; fill("name", selected.name.replace(/\.[^.]+$/, "")); zone?.classList.add("has-file"); const strong = zone?.querySelector("strong"); if (strong) strong.textContent = selected.name; }, { signal });
    one<HTMLButtonElement>("[data-document-new]", root)?.addEventListener("click", () => open(), { signal });
    all<HTMLButtonElement>("[data-document-edit]", root).forEach((button) => button.addEventListener("click", () => open(records.find((item) => item.id === button.dataset.documentEdit)), { signal }));
    all<HTMLButtonElement>("[data-document-delete]", root).forEach((button) => button.addEventListener("click", async () => { const record = records.find((item) => item.id === button.dataset.documentDelete); if (!record || !confirm(`Xóa “${record.name}” khỏi thư viện?`)) return; button.disabled = true; try { await request(`/api/admin/documents/${record.id}`, { method: "DELETE" }); await refreshPage(); } catch (error) { button.disabled = false; notify(error instanceof Error ? error.message : "Không thể xóa tài liệu.", true); } }, { signal }));
    form?.addEventListener("submit", async (event) => {
      event.preventDefault(); const submit = one<HTMLButtonElement>('button[type="submit"]', form); const label = one<HTMLElement>("[data-submit-label]", form); const feedback = one<HTMLElement>("[data-ops-feedback]", form);
      if (submit) submit.disabled = true; if (label) label.textContent = "Đang lưu…"; if (feedback) feedback.textContent = "";
      try {
        const selectedFile = file?.files?.[0];
        if (selectedFile) { if (label) label.textContent = "Đang tải tệp…"; const uploadData = new FormData(); uploadData.append("file", selectedFile); const upload = await request<{ url: string; name: string; type: string; size: number }>("/api/admin/upload", { method: "POST", body: uploadData }); fill("url", upload.url); fill("originalName", upload.name); fill("mimeType", upload.type || selectedFile.type); fill("fileSize", upload.size || selectedFile.size); }
        const values = Object.fromEntries(new FormData(form).entries()); delete values.file; values.fileSize = Number(values.fileSize || 0) as never;
        const productSelect = form.elements.namedItem("productId") as HTMLSelectElement; values.productName = productSelect.selectedOptions[0]?.dataset.productName || "";
        const id = String(values.id || ""); const result = await request<{ message?: string }>(id ? `/api/admin/documents/${id}` : "/api/admin/documents", { method: id ? "PUT" : "POST", body: JSON.stringify(values) }); notify(result.message || "Đã lưu tài liệu."); await refreshPage();
      } catch (error) { if (submit) submit.disabled = false; if (label) label.textContent = "Lưu tài liệu"; if (feedback) feedback.textContent = error instanceof Error ? error.message : "Không thể lưu tài liệu."; }
    }, { signal });
  }

  if (module === "media") {
    const records = parseData<MediaRecord>("ops-media-data"); const library = one<HTMLElement>("[data-media-library]", root); const dialog = one<HTMLDialogElement>("[data-media-dialog]", root); const form = one<HTMLFormElement>("[data-media-form]", root);
    all<HTMLButtonElement>("[data-media-view]", root).forEach((button) => button.addEventListener("click", () => { if (library) library.dataset.view = button.dataset.mediaView || "grid"; all<HTMLButtonElement>("[data-media-view]", root).forEach((item) => item.setAttribute("aria-pressed", String(item === button))); }, { signal }));
    const open = (record: MediaRecord) => { if (!dialog || !form) return; Object.entries(record).forEach(([name, value]) => { const control = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null; if (control) control.value = String(value); }); const preview = one<HTMLImageElement>("[data-media-preview]", dialog); if (preview) { preview.src = record.url; preview.alt = record.alt; } const dimensions = one<HTMLElement>("[data-media-dimensions]", dialog); if (dimensions) dimensions.textContent = record.width && record.height ? `${record.width} × ${record.height} px` : "Chưa xác định"; const size = one<HTMLElement>("[data-media-size]", dialog); if (size) size.textContent = formatSize(record.fileSize); const source = one<HTMLElement>("[data-media-source]", dialog); if (source) source.textContent = record.source === "upload" ? "Đã tải lên" : "Ảnh hệ thống"; const remove = one<HTMLButtonElement>("[data-media-delete]", dialog); if (remove) remove.hidden = record.source === "public"; one<HTMLElement>("[data-ops-feedback]", dialog)!.textContent = ""; dialog.showModal(); };
    all<HTMLButtonElement>("[data-media-edit]", root).forEach((button) => button.addEventListener("click", () => { const record = records.find((item) => item.id === button.dataset.mediaEdit); if (record) open(record); }, { signal }));
    one<HTMLButtonElement>("[data-copy-media-url]", root)?.addEventListener("click", async () => { const url = String((form?.elements.namedItem("url") as HTMLInputElement)?.value || ""); await navigator.clipboard.writeText(new URL(url, location.origin).href); notify("Đã sao chép URL ảnh."); }, { signal });
    one<HTMLButtonElement>("[data-media-delete]", root)?.addEventListener("click", async () => { const id = String((form?.elements.namedItem("id") as HTMLInputElement)?.value || ""); const record = records.find((item) => item.id === id); if (!record || !confirm(`Xóa ảnh “${record.name}”? Các vị trí đang dùng URL này có thể mất ảnh.`)) return; try { await request(`/api/admin/media/${id}`, { method: "DELETE" }); await refreshPage(); } catch (error) { const feedback = one<HTMLElement>("[data-ops-feedback]", form!); if (feedback) feedback.textContent = error instanceof Error ? error.message : "Không thể xóa ảnh."; } }, { signal });
    form?.addEventListener("submit", async (event) => { event.preventDefault(); const submit = one<HTMLButtonElement>('button[type="submit"]', form); const label = one<HTMLElement>("[data-submit-label]", form); const feedback = one<HTMLElement>("[data-ops-feedback]", form); if (submit) submit.disabled = true; if (label) label.textContent = "Đang lưu…"; try { const values = Object.fromEntries(new FormData(form).entries()); ["fileSize", "width", "height"].forEach((key) => { values[key] = Number(values[key] || 0) as never; }); await request(`/api/admin/media/${values.id}`, { method: "PUT", body: JSON.stringify(values) }); await refreshPage(); } catch (error) { if (submit) submit.disabled = false; if (label) label.textContent = "Lưu thay đổi"; if (feedback) feedback.textContent = error instanceof Error ? error.message : "Không thể lưu media."; } }, { signal });
    one<HTMLInputElement>("[data-media-upload]", root)?.addEventListener("change", async (event) => { const input = event.currentTarget as HTMLInputElement; const files = Array.from(input.files || []); if (!files.length) return; const progress = one<HTMLElement>("[data-upload-progress]", root); const invalid = files.map((file) => ({ file, error: validateAdminImage(file) })).find((entry) => entry.error); if (invalid) { notify(`${invalid.file.name}: ${invalid.error}`, true); input.value = ""; return; } input.disabled = true; try { for (let index = 0; index < files.length; index += 1) { const file = files[index]; if (progress) progress.textContent = `Đang tải ${index + 1}/${files.length}: ${file.name}`; const data = new FormData(); data.append("file", file); const upload = await request<{ url: string; name: string; type: string; size?: number; width?: number; height?: number }>("/api/admin/upload", { method: "POST", body: data }); await request("/api/admin/media", { method: "POST", body: JSON.stringify({ name: upload.name, url: upload.url, mimeType: upload.type, fileSize: upload.size || file.size, width: upload.width || 0, height: upload.height || 0, source: "upload", alt: "", caption: "" }) }); } if (progress) progress.textContent = `Đã tải ${files.length} ảnh`; await refreshPage(); } catch (error) { if (progress) progress.textContent = ""; notify(error instanceof Error ? error.message : "Không thể tải ảnh.", true); } finally { input.disabled = false; input.value = ""; } }, { signal });
  }
  filterRows();
};

document.addEventListener("astro:page-load", initOperations);

export {};
