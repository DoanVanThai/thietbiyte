import { ADMIN_IMAGE_ACCEPT, validateAdminImage } from "@/lib/admin-image-upload";

export {};

let productLifecycle: AbortController | undefined;
const initAdminProducts = () => {
const lifecycleRoot = document.querySelector<HTMLElement>("[data-products-list-view]");
if (!lifecycleRoot) { productLifecycle?.abort(); productLifecycle = undefined; return; }
if (lifecycleRoot.dataset.productsInitialized === "true") return;
lifecycleRoot.dataset.productsInitialized = "true";
productLifecycle?.abort();
productLifecycle = new AbortController();
const { signal } = productLifecycle;

type AdminProduct = {
  id: string; slug: string; sku: string; group: "medical" | "veterinary"; category: string; categorySlug: string; specialties: string[]; specialtySlugs: string[];
  brand: string; brandSlug: string; model: string; origin: string; warranty: string; name: string; image: string; imagePosition: string;
  applications: string[]; applicationSlugs: string[]; specs: string[]; priceBand: string; priceMode: "SHOW_PRICE" | "CONTACT" | "REQUEST_QUOTE"; priceVnd?: number;
  availability: "available" | "contact" | "unavailable"; featured: number; publishStatus: "draft" | "published" | "archived"; description?: string;
};

const toast = document.querySelector<HTMLElement>("[data-admin-toast]");
let toastTimer = 0;
const showToast = (message: string) => {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => { toast.hidden = true; }, 150);
  }, 2800);
};

type UploadedAdminImage = { url: string; name?: string; type?: string; width?: number; height?: number };
const uploadAdminImage = async (file: File): Promise<UploadedAdminImage> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
  const uploaded = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(uploaded.error || `Không thể tải ${file.name}.`);
  return uploaded as UploadedAdminImage;
};

const listView = document.querySelector<HTMLElement>("[data-products-list-view]");
const editorView = document.querySelector<HTMLElement>("[data-product-editor]");
const params = new URLSearchParams(window.location.search);
const editorActive = params.get("view") === "editor";
if (listView && editorView) { listView.hidden = editorActive; editorView.hidden = !editorActive; }

// Products table and filters.
const rows = [...document.querySelectorAll<HTMLTableRowElement>("[data-product-row]")];
const search = document.querySelector<HTMLInputElement>("[data-admin-search]");
const filters = [...document.querySelectorAll<HTMLSelectElement>("select[data-filter]")];
const featuredFilter = document.querySelector<HTMLInputElement>("[data-filter-featured]");
const resultCount = document.querySelector<HTMLElement>("[data-result-count]");
const filterSummary = document.querySelector<HTMLElement>("[data-filter-summary]");
const filterBadge = document.querySelector<HTMLElement>("[data-filter-count]");
const tableEmpty = document.querySelector<HTMLElement>("[data-table-empty]");
const table = document.querySelector<HTMLTableElement>(".admin-products-table");
let serverFilterTimer = 0;
const filterUrl = new URL(window.location.href);
if (search) search.value = filterUrl.searchParams.get("q") || "";
filters.forEach((filter) => { filter.value = filterUrl.searchParams.get(filter.dataset.filter || "") || "all"; });
if (featuredFilter) featuredFilter.checked = filterUrl.searchParams.get("featured") === "1";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
const applyFilters = (requestServer = false) => {
  const query = normalize(search?.value || "");
  const activeSelects = filters.filter((filter) => filter.value !== "all");
  let visible = 0;
  rows.forEach((row) => {
    const matchesSearch = !query || normalize(row.dataset.search || "").includes(query);
    const matchesFilters = activeSelects.every((filter) => {
      const key = filter.dataset.filter || "";
      if (key === "specialty") return (row.dataset.specialties || "").split("|").includes(filter.value);
      return row.dataset[key] === filter.value;
    });
    const matchesFeatured = !featuredFilter?.checked || row.dataset.featured === "true";
    const show = matchesSearch && matchesFilters && matchesFeatured;
    row.hidden = !show;
    if (show) visible += 1;
  });
  if (resultCount) resultCount.textContent = String(visible);
  const activeCount = activeSelects.length + (featuredFilter?.checked ? 1 : 0) + (query ? 1 : 0);
  if (filterBadge) { filterBadge.textContent = String(activeCount); filterBadge.hidden = activeCount === 0; }
  if (filterSummary) filterSummary.textContent = activeCount ? `${activeCount} bộ lọc đang áp dụng` : "Hiển thị tất cả";
  if (tableEmpty) tableEmpty.hidden = visible > 0;
  if (table) table.hidden = visible === 0;
  const url = new URL(window.location.href);
  if (search?.value.trim()) url.searchParams.set("q", search.value.trim()); else url.searchParams.delete("q");
  filters.forEach((filter) => { const key = filter.dataset.filter || ""; if (!key) return; if (filter.value !== "all") url.searchParams.set(key, filter.value); else url.searchParams.delete(key); });
  if (featuredFilter?.checked) url.searchParams.set("featured", "1"); else url.searchParams.delete("featured");
  history.replaceState(history.state, "", url);
  if (requestServer && !editorActive) {
    window.clearTimeout(serverFilterTimer);
    serverFilterTimer = window.setTimeout(() => {
      url.searchParams.set("page", "1");
      document.dispatchEvent(new CustomEvent("admin:navigate", { detail: `${url.pathname}${url.search}` }));
    }, 280);
  }
  syncSelectAll();
};

search?.addEventListener("input", () => applyFilters(true));
filters.forEach((filter) => filter.addEventListener("change", () => applyFilters(true)));
featuredFilter?.addEventListener("change", () => applyFilters(true));

const resetFilters = () => {
  if (search) search.value = "";
  filters.forEach((filter) => { filter.value = "all"; });
  if (featuredFilter) featuredFilter.checked = false;
  applyFilters(true);
};
document.querySelectorAll<HTMLButtonElement>("[data-clear-filters]").forEach((button) => button.addEventListener("click", resetFilters));

const secondaryFilters = document.querySelector<HTMLElement>("[data-secondary-filters]");
const moreFilters = document.querySelector<HTMLButtonElement>("[data-more-filters]");
moreFilters?.addEventListener("click", () => {
  if (!secondaryFilters) return;
  secondaryFilters.hidden = !secondaryFilters.hidden;
  moreFilters.setAttribute("aria-expanded", String(!secondaryFilters.hidden));
});

// Strict JSON product import: parse locally, validate on the server, then create drafts.
type ProductImportPreview = {
  index: number; name: string; sku: string; model: string; brand: string; category: string;
  imageCount: number; configurationCount: number; specificationCount: number;
};
type ProductImportError = { path: string; message: string };
type ProductImportResponse = {
  ok?: boolean; preview?: ProductImportPreview[]; errors?: ProductImportError[];
  created?: Array<{ id: string; name: string; slug: string }>; message?: string;
};
const importDialog = document.querySelector<HTMLDialogElement>("[data-product-import-dialog]");
const importInput = importDialog?.querySelector<HTMLInputElement>("[data-product-import-file]");
const importDropzone = importDialog?.querySelector<HTMLElement>("[data-product-import-dropzone]");
const importFileInfo = importDialog?.querySelector<HTMLElement>("[data-product-import-file-info]");
const importFileName = importDialog?.querySelector<HTMLElement>("[data-product-import-file-name]");
const importFileSize = importDialog?.querySelector<HTMLElement>("[data-product-import-file-size]");
const importProgress = importDialog?.querySelector<HTMLElement>("[data-product-import-progress]");
const importErrors = importDialog?.querySelector<HTMLElement>("[data-product-import-errors]");
const importErrorList = importDialog?.querySelector<HTMLUListElement>("[data-product-import-error-list]");
const importPreview = importDialog?.querySelector<HTMLElement>("[data-product-import-preview]");
const importPreviewList = importDialog?.querySelector<HTMLElement>("[data-product-import-preview-list]");
const importCount = importDialog?.querySelector<HTMLElement>("[data-product-import-count]");
const confirmImport = importDialog?.querySelector<HTMLButtonElement>("[data-confirm-product-import]");
let importDocument: unknown;
let importRequest: AbortController | undefined;

const formatFileSize = (bytes: number) => bytes < 1024
  ? `${bytes} B`
  : bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const setImportBusy = (busy: boolean, label = "Đang kiểm tra cấu trúc và dữ liệu…") => {
  if (importProgress) { importProgress.hidden = !busy; const copy = importProgress.querySelector("span"); if (copy) copy.textContent = label; }
  if (confirmImport) { confirmImport.disabled = busy || !importDocument || importPreview?.hidden !== false; confirmImport.setAttribute("aria-busy", String(busy)); }
  if (importInput) importInput.disabled = busy;
};
const clearImportResults = () => {
  if (importErrors) importErrors.hidden = true;
  if (importErrorList) importErrorList.replaceChildren();
  if (importPreview) importPreview.hidden = true;
  if (importPreviewList) importPreviewList.replaceChildren();
  if (confirmImport) confirmImport.disabled = true;
};
const resetImport = () => {
  importRequest?.abort();
  importRequest = undefined;
  importDocument = undefined;
  if (importInput) { importInput.value = ""; importInput.disabled = false; }
  if (importDropzone) { importDropzone.hidden = false; importDropzone.classList.remove("is-dragging"); }
  if (importFileInfo) importFileInfo.hidden = true;
  if (importProgress) importProgress.hidden = true;
  clearImportResults();
};
const renderImportErrors = (errors: ProductImportError[]) => {
  if (!importErrors || !importErrorList) return;
  importErrorList.replaceChildren(...errors.slice(0, 100).map((error) => {
    const row = document.createElement("li");
    const path = document.createElement("code"); path.textContent = error.path || "file";
    const message = document.createElement("span"); message.textContent = error.message;
    row.append(path, message); return row;
  }));
  if (errors.length > 100) {
    const row = document.createElement("li");
    const path = document.createElement("code"); path.textContent = "…";
    const message = document.createElement("span"); message.textContent = `Còn ${errors.length - 100} lỗi khác. Sửa các lỗi đầu tiên rồi kiểm tra lại.`;
    row.append(path, message); importErrorList.append(row);
  }
  importErrors.hidden = false;
};
const renderImportPreview = (items: ProductImportPreview[]) => {
  if (!importPreview || !importPreviewList) return;
  importPreviewList.replaceChildren(...items.map((item) => {
    const row = document.createElement("article"); row.className = "admin-import-preview-item";
    const number = document.createElement("span"); number.textContent = String(item.index + 1);
    const copy = document.createElement("div");
    const name = document.createElement("strong"); name.textContent = item.name;
    const identity = document.createElement("small"); identity.textContent = `${item.brand} · ${item.model} · SKU ${item.sku}`;
    copy.append(name, identity);
    const totals = document.createElement("small"); totals.textContent = `${item.imageCount} ảnh · ${item.configurationCount} cấu hình · ${item.specificationCount} thông số`;
    row.append(number, copy, totals); return row;
  }));
  if (importCount) importCount.textContent = String(items.length);
  importPreview.hidden = false;
};
const requestProductImport = async (action: "validate" | "import") => {
  importRequest?.abort();
  importRequest = new AbortController();
  const response = await fetch("/api/admin/products/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, document: importDocument }),
    signal: importRequest.signal,
  });
  const result = await response.json().catch(() => ({})) as ProductImportResponse;
  if (!response.ok || !result.ok) throw Object.assign(new Error(result.errors?.[0]?.message || "Không thể xử lý file JSON."), { errors: result.errors, created: result.created });
  return result;
};
const validateImportFile = async (file: File) => {
  clearImportResults();
  importDocument = undefined;
  if (importDropzone) importDropzone.hidden = true;
  if (importFileInfo) importFileInfo.hidden = false;
  if (importFileName) importFileName.textContent = file.name;
  if (importFileSize) importFileSize.textContent = `${formatFileSize(file.size)} · Đang chờ kiểm tra`;

  if (file.size > 5 * 1024 * 1024) {
    renderImportErrors([{ path: "file", message: "File vượt quá dung lượng tối đa 5 MB." }]);
    if (importFileSize) importFileSize.textContent = `${formatFileSize(file.size)} · Quá dung lượng`;
    return;
  }
  if (!file.name.toLocaleLowerCase("vi").endsWith(".json")) {
    renderImportErrors([{ path: "file", message: "Vui lòng chọn đúng file có đuôi .json." }]);
    if (importFileSize) importFileSize.textContent = `${formatFileSize(file.size)} · Sai định dạng`;
    return;
  }

  setImportBusy(true);
  try {
    const source = await file.text();
    try { importDocument = JSON.parse(source); }
    catch { throw Object.assign(new Error("Nội dung không phải JSON hợp lệ."), { errors: [{ path: "file", message: "Sai cú pháp JSON. Kiểm tra dấu phẩy, dấu ngoặc và dấu ngoặc kép." }] }); }
    const result = await requestProductImport("validate");
    renderImportPreview(result.preview || []);
    if (importFileSize) importFileSize.textContent = `${formatFileSize(file.size)} · Đã kiểm tra`;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    const typed = error as Error & { errors?: ProductImportError[] };
    renderImportErrors(typed.errors?.length ? typed.errors : [{ path: "file", message: typed.message || "Không thể kiểm tra file." }]);
    if (importFileSize) importFileSize.textContent = `${formatFileSize(file.size)} · Có lỗi`;
  } finally { setImportBusy(false); }
};

document.querySelector<HTMLButtonElement>("[data-open-product-import]")?.addEventListener("click", () => { resetImport(); importDialog?.showModal(); }, { signal });
importDialog?.querySelectorAll<HTMLButtonElement>("[data-close-product-import]").forEach((button) => button.addEventListener("click", () => importDialog.close(), { signal }));
importDialog?.addEventListener("close", resetImport, { signal });
importDialog?.addEventListener("click", (event) => { if (event.target === importDialog) importDialog.close(); }, { signal });
importInput?.addEventListener("change", () => { const file = importInput.files?.[0]; if (file) void validateImportFile(file); }, { signal });
importDialog?.querySelector<HTMLButtonElement>("[data-product-import-replace]")?.addEventListener("click", () => { if (importInput) { importInput.value = ""; importInput.click(); } }, { signal });
if (importDropzone) {
  importDropzone.addEventListener("dragover", (event) => { event.preventDefault(); importDropzone.classList.add("is-dragging"); }, { signal });
  importDropzone.addEventListener("dragleave", () => importDropzone.classList.remove("is-dragging"), { signal });
  importDropzone.addEventListener("drop", (event) => {
    event.preventDefault(); importDropzone.classList.remove("is-dragging");
    const file = event.dataTransfer?.files[0]; if (file) void validateImportFile(file);
  }, { signal });
}
confirmImport?.addEventListener("click", async () => {
  if (!importDocument || importPreview?.hidden !== false) return;
  clearImportResults(); setImportBusy(true, "Đang tạo sản phẩm bản nháp…");
  if (confirmImport) confirmImport.textContent = "Đang nhập…";
  try {
    const result = await requestProductImport("import");
    importDialog?.close(); showToast(result.message || `Đã nhập ${result.created?.length || 0} sản phẩm.`);
    window.setTimeout(() => document.dispatchEvent(new CustomEvent("admin:navigate", { detail: "/admin/san-pham?status=draft" })), 650);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    const typed = error as Error & { errors?: ProductImportError[]; created?: unknown[] };
    renderImportErrors(typed.errors?.length ? typed.errors : [{ path: "products", message: typed.message || "Không thể nhập sản phẩm." }]);
    if (typed.created?.length) showToast(`Đã tạo ${typed.created.length} sản phẩm trước khi xảy ra lỗi.`);
  } finally {
    if (confirmImport) { confirmImport.innerHTML = '<i class="ph ph-file-arrow-up" aria-hidden="true"></i>Nhập sản phẩm'; }
    setImportBusy(false);
  }
}, { signal });

// Row selection and bulk actions.
const selectAll = document.querySelector<HTMLInputElement>("[data-select-all]");
const bulkBar = document.querySelector<HTMLElement>("[data-bulk-bar]");
const selectedCount = document.querySelector<HTMLElement>("[data-selected-count]");
const rowCheckboxes = rows.map((row) => row.querySelector<HTMLInputElement>("[data-row-select]")).filter((input): input is HTMLInputElement => Boolean(input));

function visibleCheckboxes() { return rows.filter((row) => !row.hidden).map((row) => row.querySelector<HTMLInputElement>("[data-row-select]")).filter((input): input is HTMLInputElement => Boolean(input)); }
function syncSelectAll() {
  const visible = visibleCheckboxes();
  const checked = visible.filter((input) => input.checked);
  if (selectAll) { selectAll.checked = visible.length > 0 && checked.length === visible.length; selectAll.indeterminate = checked.length > 0 && checked.length < visible.length; }
  const allChecked = rowCheckboxes.filter((input) => input.checked);
  if (bulkBar) bulkBar.hidden = allChecked.length === 0;
  if (selectedCount) selectedCount.textContent = String(allChecked.length);
rows.forEach((row) => row.classList.toggle("is-selected", Boolean(row.querySelector<HTMLInputElement>("[data-row-select]")?.checked)));
}
applyFilters();
selectAll?.addEventListener("change", () => { visibleCheckboxes().forEach((input) => { input.checked = selectAll.checked; }); syncSelectAll(); });
rowCheckboxes.forEach((input) => input.addEventListener("change", syncSelectAll));
document.querySelector<HTMLButtonElement>("[data-clear-selection]")?.addEventListener("click", () => { rowCheckboxes.forEach((input) => { input.checked = false; }); syncSelectAll(); });

type ProductMutationResult = { ok?: boolean; error?: string; message?: string; code?: string };
const selectedRows = () => rows.filter((row) => row.querySelector<HTMLInputElement>("[data-row-select]")?.checked);
const selectedIds = () => selectedRows().map((row) => row.dataset.id).filter((id): id is string => Boolean(id));
const productNameForRow = (row: HTMLTableRowElement) => row.querySelector<HTMLElement>(".admin-product-name strong")?.textContent?.trim() || row.dataset.id || "sản phẩm";
const bulkButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-bulk-bar] button")];
const setBulkBusy = (busy: boolean) => {
  bulkBar?.setAttribute("aria-busy", String(busy));
  bulkButtons.forEach((button) => { button.disabled = busy; });
};
const readMutationResult = async (response: Response) => {
  const result = await response.json().catch(() => ({})) as ProductMutationResult;
  if (!response.ok) throw new Error(result.error || result.message || "Không thể cập nhật sản phẩm.");
  return result;
};
const mutateProducts = async (ids: string[], request: (id: string) => Promise<Response>) => {
  const results = await Promise.all(ids.map(async (id) => {
    try { await readMutationResult(await request(id)); return { id, ok: true as const }; }
    catch (error) { return { id, ok: false as const, error: error instanceof Error ? error.message : "Không thể cập nhật sản phẩm." }; }
  }));
  const succeeded = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);
  return { succeeded, failed };
};
const refreshProductList = () => {
  const current = `${window.location.pathname}${window.location.search}`;
  document.dispatchEvent(new CustomEvent("admin:navigate", { detail: current }));
};
const finishBulkMutation = (label: string, total: number, summary: Awaited<ReturnType<typeof mutateProducts>>) => {
  if (summary.failed.length === 0) showToast(`${label} thành công cho ${summary.succeeded.length} sản phẩm.`);
  else if (summary.succeeded.length > 0) showToast(`${label} thành công ${summary.succeeded.length}/${total} sản phẩm. ${summary.failed[0]?.error}`);
  else showToast(summary.failed[0]?.error || `${label} không thành công. Vui lòng thử lại.`);
  if (summary.succeeded.length > 0) window.setTimeout(refreshProductList, 900);
  else setBulkBusy(false);
};

document.querySelectorAll<HTMLButtonElement>("[data-bulk-action]").forEach((button) => button.addEventListener("click", async () => {
  const ids = selectedIds();
  if (!ids.length) return showToast("Chọn ít nhất một sản phẩm để thao tác.");
  const action = button.dataset.bulkAction || "";
  const label = button.dataset.bulkLabel || "Cập nhật";
  const body = action === "featured" ? { featured: 10 } : { action };
  setBulkBusy(true);
  const summary = await mutateProducts(ids, (id) => fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
  finishBulkMutation(label, ids.length, summary);
}));

const categoryDialog = document.querySelector<HTMLDialogElement>("[data-category-dialog]");
document.querySelector<HTMLButtonElement>("[data-bulk-category]")?.addEventListener("click", () => categoryDialog?.showModal());
document.querySelector<HTMLButtonElement>("[data-confirm-category]")?.addEventListener("click", async (event) => {
  event.preventDefault();
  const ids = selectedIds();
  if (!ids.length) { categoryDialog?.close(); return showToast("Chọn ít nhất một sản phẩm để chuyển danh mục."); }
  const category = categoryDialog?.querySelector<HTMLSelectElement>("select")?.value || "";
  const categorySlug = category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  setBulkBusy(true);
  const summary = await mutateProducts(ids, (id) => fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, categorySlug }) }));
  categoryDialog?.close();
  finishBulkMutation(`Chuyển sang ${category}`, ids.length, summary);
});

const deleteDialog = document.querySelector<HTMLDialogElement>("[data-delete-dialog]");
const deleteDialogMessage = deleteDialog?.querySelector<HTMLElement>("[data-delete-dialog-message]");
const confirmDelete = deleteDialog?.querySelector<HTMLButtonElement>("[data-confirm-delete]");
let deleteTargets: Array<{ id: string; name: string }> = [];
const openDeleteDialog = (targets: Array<{ id: string; name: string }>) => {
  if (!deleteDialog || targets.length === 0) return;
  deleteTargets = targets;
  if (deleteDialogMessage) deleteDialogMessage.textContent = targets.length === 1
    ? `“${targets[0].name}” sẽ bị xóa vĩnh viễn khỏi hệ thống.`
    : `${targets.length} sản phẩm đã chọn sẽ bị xóa vĩnh viễn khỏi hệ thống.`;
  if (confirmDelete) confirmDelete.textContent = targets.length === 1 ? "Xóa sản phẩm" : `Xóa ${targets.length} sản phẩm`;
  deleteDialog.showModal();
};
document.querySelector<HTMLButtonElement>("[data-bulk-delete]")?.addEventListener("click", () => {
  openDeleteDialog(selectedRows().map((row) => ({ id: row.dataset.id || "", name: productNameForRow(row) })).filter((target) => target.id));
});

// Per-row actions use a top-layer popover to avoid table clipping.
const rowPopover = document.querySelector<HTMLElement>("[data-row-popover]");
let activeRow: HTMLTableRowElement | null = null;
let activeRowTrigger: HTMLButtonElement | null = null;
const rowMenuButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-row-menu]"));
const closeRowPopover = () => {
  if (rowPopover?.matches(":popover-open")) rowPopover.hidePopover();
};
const positionRowPopover = (button: HTMLButtonElement) => {
  if (!rowPopover) return;
  const gap = 6;
  const edge = 8;
  const triggerRect = button.getBoundingClientRect();
  const menuRect = rowPopover.getBoundingClientRect();
  const left = Math.min(Math.max(edge, triggerRect.right - menuRect.width), window.innerWidth - menuRect.width - edge);
  const belowTop = triggerRect.bottom + gap;
  const top = belowTop + menuRect.height <= window.innerHeight - edge
    ? belowTop
    : Math.max(edge, triggerRect.top - menuRect.height - gap);
  rowPopover.style.inset = "auto";
  rowPopover.style.left = `${left}px`;
  rowPopover.style.top = `${top}px`;
  rowPopover.style.right = "auto";
  rowPopover.style.bottom = "auto";
};
rowMenuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (rowPopover?.matches(":popover-open") && activeRowTrigger === button) {
      closeRowPopover();
      return;
    }
    activeRow = button.closest<HTMLTableRowElement>("[data-product-row]");
    if (!rowPopover || !activeRow) return;
    closeRowPopover();
    activeRowTrigger = button;
    const id = activeRow.dataset.id || "p-001";
    const productLink = activeRow.querySelector<HTMLAnchorElement>(".admin-product-name a")?.getAttribute("href") || `/admin/san-pham?view=editor&id=${id}`;
    const editLink = rowPopover.querySelector<HTMLAnchorElement>("[data-row-edit]");
    if (editLink) editLink.href = productLink;
    const quoteLink = rowPopover.querySelector<HTMLAnchorElement>("[data-row-quote]");
    if (quoteLink) quoteLink.href = `/admin/bao-gia?product=${encodeURIComponent(id)}`;
    const publicProduct = products.find((product) => product.id === id);
    const previewLink = rowPopover.querySelector<HTMLAnchorElement>("[data-row-preview]");
    if (previewLink && publicProduct) previewLink.href = `/san-pham/${publicProduct.slug}`;
    rowMenuButtons.forEach((item) => item.setAttribute("aria-expanded", String(item === button)));
    rowPopover.dataset.positioning = "";
    rowPopover.showPopover();
    positionRowPopover(button);
    delete rowPopover.dataset.positioning;
    button.setAttribute("aria-expanded", "true");
  });
});
rowPopover?.addEventListener("toggle", (event) => {
  const toggle = event as ToggleEvent;
  if (toggle.newState === "closed") {
    rowMenuButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
    activeRowTrigger = null;
  }
});
window.addEventListener("resize", closeRowPopover, { signal });
window.addEventListener("scroll", closeRowPopover, { capture: true, signal });
rowPopover?.querySelector<HTMLButtonElement>("[data-row-duplicate]")?.addEventListener("click", async () => {
  const id = activeRow?.dataset.id; rowPopover.hidePopover(); if (!id) return;
  try {
    const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"duplicate"}) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Không thể nhân bản sản phẩm.");
    showToast("Đã tạo bản sao ở trạng thái bản nháp.");
    window.setTimeout(() => document.dispatchEvent(new CustomEvent("admin:navigate", { detail: `/admin/san-pham?view=editor&id=${encodeURIComponent(result.product.id)}` })), 300);
  } catch (error) { showToast(error instanceof Error ? error.message : "Không thể nhân bản sản phẩm."); }
});
rowPopover?.querySelector<HTMLButtonElement>("[data-row-archive]")?.addEventListener("click", async () => {
  const id = activeRow?.dataset.id; rowPopover.hidePopover(); if (!id) return;
  try {
    await readMutationResult(await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"archived"}) }));
    showToast("Sản phẩm đã được lưu trữ và gỡ khỏi website công khai.");
    window.setTimeout(refreshProductList, 700);
  } catch (error) { showToast(error instanceof Error ? error.message : "Không thể lưu trữ sản phẩm."); }
});
rowPopover?.querySelector<HTMLButtonElement>("[data-row-delete]")?.addEventListener("click", () => {
  const row = activeRow;
  rowPopover.hidePopover();
  if (!row?.dataset.id) return;
  openDeleteDialog([{ id: row.dataset.id, name: productNameForRow(row) }]);
});

confirmDelete?.addEventListener("click", async () => {
  if (!deleteTargets.length) return;
  const targets = [...deleteTargets];
  confirmDelete.disabled = true;
  confirmDelete.setAttribute("aria-busy", "true");
  const originalLabel = confirmDelete.textContent || "Xóa sản phẩm";
  confirmDelete.textContent = "Đang xóa…";
  const summary = await mutateProducts(targets.map((target) => target.id), (id) => fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete" }) }));
  confirmDelete.disabled = false;
  confirmDelete.removeAttribute("aria-busy");
  confirmDelete.textContent = originalLabel;
  deleteDialog?.close();
  deleteTargets = [];
  if (summary.failed.length === 0) showToast(`Đã xóa ${summary.succeeded.length} sản phẩm.`);
  else if (summary.succeeded.length > 0) showToast(`Đã xóa ${summary.succeeded.length}/${targets.length} sản phẩm. ${summary.failed[0]?.error}`);
  else showToast(summary.failed[0]?.error || "Không thể xóa sản phẩm.");
  if (summary.succeeded.length > 0) window.setTimeout(refreshProductList, 900);
});

// Editor data hydration.
let products: AdminProduct[] = [];
try { products = JSON.parse(document.getElementById("admin-product-data")?.textContent || "[]") as AdminProduct[]; } catch { products = []; }
const requestedId = params.get("id");
const selectedProduct = products.find((product) => product.id === requestedId) || products[0];
const isNewProduct = requestedId === "new";

if (editorActive) {
  const setValue = (selector: string, value = "") => { const field = document.querySelector<HTMLInputElement | HTMLSelectElement>(selector); if (field) field.value = value; };
  const setText = (selector: string, value = "") => { const field = document.querySelector<HTMLElement>(selector); if (field) field.textContent = value; };
  if (isNewProduct) {
    setText("[data-editor-kicker]", "Sản phẩm mới"); setText("[data-editor-heading]", "Sản phẩm chưa đặt tên"); setText("[data-editor-id]", "BẢN NHÁP MỚI");
    ["[data-editor-name]", "[data-editor-slug]", "[data-editor-sku]", "[data-editor-model]"].forEach((selector) => setValue(selector, ""));
    document.querySelector<HTMLAnchorElement>("[data-preview-link]")?.setAttribute("aria-disabled", "true");
  } else if (selectedProduct) {
    setText("[data-editor-heading]", selectedProduct.name); setText("[data-editor-id]", selectedProduct.id.toUpperCase());
    setValue("[data-editor-name]", selectedProduct.name); setValue("[data-editor-slug]", selectedProduct.slug); setValue("[data-editor-sku]", selectedProduct.sku);
    setValue("[data-editor-model]", selectedProduct.model); setValue("[data-editor-brand]", selectedProduct.brand); setValue("[data-editor-category]", selectedProduct.category);
    setValue("[data-editor-origin]", selectedProduct.origin); setValue("[data-editor-warranty]", selectedProduct.warranty);
    const preview = document.querySelector<HTMLAnchorElement>("[data-preview-link]"); if (preview) preview.href = `/san-pham/${selectedProduct.slug}${selectedProduct.publishStatus === "published" ? "" : `?preview=${encodeURIComponent(selectedProduct.id)}`}`;
    const group = document.querySelector<HTMLInputElement>(`input[name="group"][value="${selectedProduct.group}"]`); if (group) group.checked = true;
  }
}

// Dirty state and persistence.
const productForm = document.querySelector<HTMLFormElement>("[data-product-form]");
const saveState = document.querySelector<HTMLElement>("[data-save-state]");
let dirty = false;
let autosaveTimer = 0;
const markDirty = () => {
  if (!editorActive) return;
  dirty = true;
  if (saveState) { saveState.className = "admin-save-state is-dirty"; saveState.innerHTML = '<i class="ph ph-warning-circle" aria-hidden="true"></i>Chưa lưu'; }
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => saveProduct("autosave"), 1800);
};
let savedProductId = productForm?.dataset.productId || "";
const value = (selector: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.value.trim() || "";
const slugify = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const productNameInput = document.querySelector<HTMLInputElement>("[data-editor-name]");
const productSlugInput = document.querySelector<HTMLInputElement>("[data-editor-slug]");
const productSkuInput = document.querySelector<HTMLInputElement>("[data-editor-sku]");
let slugFollowsName = isNewProduct && !productSlugInput?.value;
const syncGeneratedSlug = () => {
  if (!productSlugInput) return;
  const generated = slugify(productNameInput?.value || "");
  productSlugInput.value = generated;
  const seoSlugInput = document.querySelector<HTMLInputElement>("[data-seo-slug]");
  const previewSlug = document.querySelector<HTMLElement>("[data-preview-slug]");
  if (seoSlugInput) seoSlugInput.value = generated;
  if (previewSlug) previewSlug.textContent = generated || "ten-san-pham";
};
const generateSku = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const randomPart = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `TL-${new Date().getFullYear()}-${randomPart}`;
};
productNameInput?.addEventListener("input", () => {
  if (slugFollowsName) syncGeneratedSlug();
  if (isNewProduct) {
    const heading = document.querySelector<HTMLElement>("[data-editor-heading]");
    if (heading) heading.textContent = productNameInput.value.trim() || "Sản phẩm chưa đặt tên";
  }
});
productSlugInput?.addEventListener("input", () => { slugFollowsName = false; });
productSlugInput?.addEventListener("blur", () => {
  productSlugInput.value = slugify(productSlugInput.value);
  const seoSlugInput = document.querySelector<HTMLInputElement>("[data-seo-slug]");
  if (seoSlugInput) seoSlugInput.value = productSlugInput.value;
});
document.querySelector<HTMLButtonElement>("[data-generate-slug]")?.addEventListener("click", () => {
  slugFollowsName = true;
  syncGeneratedSlug();
  productSlugInput?.focus();
});
document.querySelector<HTMLButtonElement>("[data-generate-sku]")?.addEventListener("click", () => {
  if (!productSkuInput) return;
  productSkuInput.value = generateSku();
  productSkuInput.dispatchEvent(new Event("input", { bubbles: true }));
  productSkuInput.focus();
});
if (isNewProduct && productSkuInput && !productSkuInput.value) productSkuInput.value = generateSku();
const collectPayload = () => {
  const media = [...document.querySelectorAll<HTMLElement>("[data-media-item]")].map((item) => ({
    type:"image" as const,
    src:item.querySelector<HTMLImageElement>("[data-media-image]")?.dataset.mediaSrc || item.querySelector<HTMLImageElement>("[data-media-image]")?.getAttribute("src") || "",
    alt:item.querySelector<HTMLInputElement>("[data-media-alt]")?.value.trim() || "Ảnh sản phẩm",
    position:"center",
    quoteEnabled:Boolean(item.querySelector<HTMLInputElement>("[data-media-quote-enabled]")?.checked),
    quoteCaption:item.querySelector<HTMLInputElement>("[data-media-quote-caption]")?.value.trim() || undefined,
    quoteAfterText:item.querySelector<HTMLSelectElement>("[data-media-quote-after]")?.value || undefined,
  })).filter(item=>item.src);
  const features = [...document.querySelectorAll<HTMLElement>("[data-feature-row]")].map((row) => { const inputs=row.querySelectorAll<HTMLInputElement>("input"); return {title:inputs[0]?.value.trim()||"",description:inputs[1]?.value.trim()||""}; }).filter(item=>item.title);
  const configurationRows = [...document.querySelectorAll<HTMLElement>("[data-configuration-row]")].map((row) => { const inputs=row.querySelectorAll<HTMLInputElement>('input:not([type="file"])'); return {title:row.querySelector<HTMLSelectElement>("select")?.value||"Option",name:inputs[0]?.value.trim()||"",detail:inputs[1]?.value.trim()||"",quantity:Number(inputs[2]?.value||1),imageUrl:row.dataset.imageUrl||undefined}; }).filter(item=>item.name);
  const configurationMap = new Map<string,{title:string;items:{name:string;detail?:string;quantity?:number;imageUrl?:string}[]}>(); configurationRows.forEach(item=>{const group=configurationMap.get(item.title)||{title:item.title,items:[]};group.items.push({name:item.name,detail:item.detail,quantity:item.quantity,imageUrl:item.imageUrl});configurationMap.set(item.title,group);});
  const specificationGroups = [...document.querySelectorAll<HTMLElement>("[data-spec-group]")].map((group) => ({ title:group.querySelector<HTMLInputElement>("[data-spec-group-name]")?.value.trim()||"Thông số", items:[...group.querySelectorAll<HTMLElement>("[data-spec-row]")].map(row=>{const inputs=row.querySelectorAll<HTMLInputElement>("input");return{label:inputs[0]?.value.trim()||"",value:inputs[1]?.value.trim()||""};}).filter(item=>item.label&&item.value) })).filter(group=>group.items.length);
  const documents = [...document.querySelectorAll<HTMLElement>(".admin-document-row")].map(row=>{const selects=row.querySelectorAll<HTMLSelectElement>("select"),access=selects[1]?.value;return{title:row.querySelector("strong")?.textContent?.trim()||"Tài liệu",type:selects[0]?.value||"Other",format:row.querySelector("small")?.textContent?.split("·")[0]?.trim()||"Tệp",access:access==="Public"?"public" as const:access==="Registered"?"login" as const:"restricted" as const,href:row.dataset.href||undefined};});
  const applications=[...document.querySelectorAll<HTMLElement>("[data-tag-editor] > span")].map(item=>item.childNodes[0]?.textContent?.trim()||"").filter(Boolean);
  const specialties=[...document.querySelectorAll<HTMLInputElement>("[data-specialty]:checked")].map(input=>input.value);
  const name=value("[data-editor-name]"),brand=value("[data-editor-brand]"),category=value("[data-editor-category]");
  const priceChoice=document.querySelector<HTMLInputElement>('input[name="priceMode"]:checked')?.value||"contact";
  const quotePrice=value("#product-price");
  return { id:savedProductId||undefined,name,slug:value("[data-editor-slug]")||slugify(name),sku:value("[data-editor-sku]"),model:value("[data-editor-model]"),brand,brandSlug:!isNewProduct&&selectedProduct?.brand===brand?selectedProduct.brandSlug:slugify(brand),category,categorySlug:!isNewProduct&&selectedProduct?.category===category?selectedProduct.categorySlug:slugify(category),group:(document.querySelector<HTMLInputElement>('input[name="group"]:checked')?.value||"medical") as "medical"|"veterinary",origin:value("[data-editor-origin]"),manufacturingYear:value("#manufacturing-year"),warranty:value("[data-editor-warranty]")||value("#warranty-period"),shortDescription:value("#short-description"),description:value("#product-description"),seoTitle:value("#seo-title"),seoDescription:value("#meta-description"),priceMode:priceChoice==="show"?"SHOW_PRICE":priceChoice==="quote"?"REQUEST_QUOTE":"CONTACT",priceVnd:quotePrice?Number(quotePrice):undefined,featured:document.querySelector<HTMLInputElement>('input[name="featured"]')?.checked?10:0,availability:"contact",priceBand:selectedProduct?.priceBand||"",image:media[0]?.src||selectedProduct?.image||"/images/project-handover-placeholder.webp",imagePosition:"center",specialties,specialtySlugs:specialties.map(slugify),applications,applicationSlugs:applications.map(slugify),specs:specificationGroups.flatMap(group=>group.items.slice(0,1).map(item=>`${item.label}: ${item.value}`)).slice(0,3),publishStatus:value("#product-status")||"draft",detail:{gallery:media,features,configurations:[...configurationMap.values()],specificationGroups,documents,shortDescription:value("#short-description"),seo:{title:value("#seo-title"),description:value("#meta-description"),ogImage:document.querySelector<HTMLImageElement>("[data-og-image]")?.getAttribute("src")||media[0]?.src},warranty:{period:value("#warranty-period")||value("[data-editor-warranty]"),coverage:value("#warranty-coverage"),installation:value("#installation-scope"),technicalSupport:value("#technical-support")}} };
};
const saveProduct = async (mode: "draft" | "publish" | "autosave") => {
  if (!saveState) return;
  saveState.className = "admin-save-state is-saving";
  saveState.innerHTML = '<i class="ph ph-circle-notch" aria-hidden="true"></i>Đang lưu…';
  try {
    const payload = collectPayload();
    payload.publishStatus = mode === "publish" ? "published" : mode === "draft" ? "draft" : payload.publishStatus;
    const endpoint=savedProductId?`/api/admin/products/${encodeURIComponent(savedProductId)}`:"/api/admin/products";
    const response=await fetch(endpoint,{method:savedProductId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,action:mode==="publish"?"publish":mode==="draft"?"draft":"save"})});
    const result=await response.json(); if(!response.ok) throw new Error(result.error||"Không thể lưu sản phẩm.");
    savedProductId=result.product.id; if(productForm) productForm.dataset.productId=savedProductId;
    dirty = false;
    saveState.className = "admin-save-state";
    saveState.innerHTML = '<i class="ph ph-cloud-check" aria-hidden="true"></i>Đã lưu';
    const preview=document.querySelector<HTMLAnchorElement>("[data-preview-link]");if(preview){preview.href=`/san-pham/${result.product.slug}${mode==="publish"?"":`?preview=${encodeURIComponent(result.product.id)}`}`;preview.removeAttribute("aria-disabled");}
    if(mode!=="autosave")showToast(result.message|| (mode==="publish"?"Đã lưu và xuất bản sản phẩm.":"Đã lưu bản nháp."));
    if(isNewProduct&&mode!=="autosave")history.replaceState({},"",`/admin/san-pham?view=editor&id=${encodeURIComponent(savedProductId)}`);
  } catch(error) { saveState.className="admin-save-state is-dirty";saveState.innerHTML='<i class="ph ph-warning-circle"></i>Lưu thất bại';showToast(error instanceof Error?error.message:"Không thể lưu sản phẩm."); }
};
productForm?.addEventListener("input", markDirty);
productForm?.addEventListener("change", markDirty);
document.querySelector<HTMLButtonElement>("[data-save-draft]")?.addEventListener("click", () => saveProduct("draft"));
document.querySelector<HTMLButtonElement>("[data-save-publish]")?.addEventListener("click", () => {
  const required = [...(productForm?.querySelectorAll<HTMLInputElement>("input[required]") || [])];
  const invalid = required.filter((field) => !field.validity.valid);
  required.forEach((field) => {
    const message = field.validity.valid ? "" : "Vui lòng nhập thông tin này.";
    field.setAttribute("aria-invalid", String(Boolean(message)));
    const error = field.closest(".admin-field")?.querySelector<HTMLElement>("[data-field-error]"); if (error) error.textContent = message;
  });
  if (invalid.length) { invalid[0].focus(); showToast("Cần hoàn tất các trường bắt buộc trước khi xuất bản."); return; }
  saveProduct("publish");
});
window.addEventListener("beforeunload", (event) => { if (dirty) event.preventDefault(); }, { signal });

// Editor section navigation.
const editorSections = [...document.querySelectorAll<HTMLElement>(".admin-editor-section")];
const editorNav = [...document.querySelectorAll<HTMLAnchorElement>("[data-editor-nav]")];
if (editorActive && editorSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    editorNav.forEach((link) => link.setAttribute("aria-current", link.hash === `#${visible.target.id}` ? "location" : "false"));
  }, { rootMargin: "-25% 0px -60%", threshold: [0.05, 0.25] });
  editorSections.forEach((section) => sectionObserver.observe(section));
}

// Reusable builder helpers.
const iconButton = (label: string, dataName: string) => {
  const button = document.createElement("button"); button.type = "button"; button.className = "admin-icon-danger"; button.dataset[dataName] = ""; button.setAttribute("aria-label", label); button.innerHTML = '<i class="ph ph-trash" aria-hidden="true"></i>'; return button;
};
const dragButton = () => { const button = document.createElement("button"); button.type = "button"; button.className = "admin-drag-handle"; button.setAttribute("aria-label", "Sắp xếp mục; dùng Alt và mũi tên lên hoặc xuống"); button.setAttribute("aria-keyshortcuts", "Alt+ArrowUp Alt+ArrowDown"); button.innerHTML = '<i class="ph ph-dots-six-vertical" aria-hidden="true"></i>'; return button; };
const textInput = (label: string, placeholder = "") => { const input = document.createElement("input"); input.type = "text"; input.setAttribute("aria-label", label); input.placeholder = placeholder; return input; };
const configurationImageControl = () => {
  const wrap = document.createElement("div"); wrap.className = "admin-configuration-image";
  const label = document.createElement("label"); label.className = "admin-config-image-button"; label.title = "Thêm ảnh minh họa";
  const input = document.createElement("input"); input.type = "file"; input.accept = ADMIN_IMAGE_ACCEPT; input.dataset.configurationImageUpload = "";
  const icon = document.createElement("i"); icon.className = "ph ph-image-square"; icon.setAttribute("aria-hidden", "true");
  const copy = document.createElement("span"); copy.textContent = "Thêm ảnh";
  label.append(input, icon, copy); wrap.append(label); return wrap;
};

document.querySelector<HTMLButtonElement>("[data-add-feature]")?.addEventListener("click", () => {
  const list = document.querySelector<HTMLElement>("[data-feature-list]"); if (!list) return;
  const row = document.createElement("div"); row.className = "admin-builder-row"; row.dataset.featureRow = "";
  row.append(dragButton(), textInput("Tên tính năng", "Tên tính năng"), textInput("Mô tả tính năng", "Mô tả ngắn gọn"), iconButton("Xóa tính năng", "removeRow")); list.append(row); row.querySelector("input")?.focus(); markDirty();
});

document.querySelector<HTMLButtonElement>("[data-add-configuration]")?.addEventListener("click", () => {
  const list = document.querySelector<HTMLElement>("[data-configuration-list]"); if (!list) return;
  const row = document.createElement("div"); row.className = "admin-configuration-row"; row.dataset.configurationRow = "";
  const select = document.createElement("select"); select.setAttribute("aria-label", "Loại cấu hình"); ["Máy chính", "Phụ kiện", "Đầu dò", "Tùy chọn"].forEach((value) => select.add(new Option(value)));
  const quantity = document.createElement("input"); quantity.type = "number"; quantity.min = "1"; quantity.value = "1"; quantity.setAttribute("aria-label", "Số lượng");
  row.append(dragButton(), select, textInput("Tên thành phần", "Tên thành phần"), textInput("Chi tiết", "Model hoặc ghi chú"), quantity, configurationImageControl(), iconButton("Xóa dòng", "removeRow")); list.append(row); row.querySelector<HTMLInputElement>('input[type="text"]')?.focus(); markDirty();
});

const renderConfigurationImage = (row: HTMLElement, url = "") => {
  row.dataset.imageUrl = url;
  const wrap = row.querySelector<HTMLElement>(".admin-configuration-image"); if (!wrap) return;
  wrap.querySelector("img")?.remove(); wrap.querySelector("[data-remove-configuration-image]")?.remove();
  const label = wrap.querySelector<HTMLLabelElement>(".admin-config-image-button");
  if (label) {
    label.title = url ? "Đổi ảnh minh họa" : "Thêm ảnh minh họa";
    const icon = label.querySelector("i"); if (icon) icon.className = `ph ${url ? "ph-arrows-clockwise" : "ph-image-square"}`;
    const copy = label.querySelector("span"); if (copy) copy.textContent = url ? "Đổi" : "Thêm ảnh";
  }
  if (!url) return;
  const image = document.createElement("img"); image.src = url; image.alt = ""; image.width = 54; image.height = 42;
  const remove = document.createElement("button"); remove.type = "button"; remove.dataset.removeConfigurationImage = ""; remove.setAttribute("aria-label", "Bỏ ảnh minh họa"); remove.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
  wrap.prepend(image); wrap.append(remove);
};

document.addEventListener("change", async (event) => {
  const input = (event.target as Element).closest<HTMLInputElement>("[data-configuration-image-upload]");
  const row = input?.closest<HTMLElement>("[data-configuration-row]"); const file = input?.files?.[0];
  if (!input || !row || !file) return;
  const validationError = validateAdminImage(file);
  if (validationError) { showToast(validationError); input.value = ""; return; }
  input.disabled = true;
  input.closest("label")?.classList.add("is-uploading");
  try {
    const uploaded = await uploadAdminImage(file);
    renderConfigurationImage(row, uploaded.url); markDirty(); showToast("Đã gắn ảnh minh họa vào mục cấu hình.");
  } catch (error) { showToast(error instanceof Error ? error.message : "Không thể tải ảnh minh họa."); }
  finally { input.disabled = false; input.value = ""; input.closest("label")?.classList.remove("is-uploading"); }
}, { signal });

const makeSpecRow = () => {
  const row = document.createElement("div"); row.className = "admin-spec-row"; row.dataset.specRow = "";
  row.append(dragButton(), textInput("Tên thông số", "Tên thông số"), textInput("Giá trị thông số", "Giá trị"), iconButton("Xóa thông số", "removeRow")); return row;
};
document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const removeConfigurationImage = target.closest<HTMLButtonElement>("[data-remove-configuration-image]");
  if (removeConfigurationImage) { const row = removeConfigurationImage.closest<HTMLElement>("[data-configuration-row]"); if (row) { renderConfigurationImage(row); markDirty(); } return; }
  const remove = target.closest<HTMLButtonElement>("[data-remove-row]");
  if (remove) { remove.parentElement?.remove(); markDirty(); return; }
  const addSpec = target.closest<HTMLButtonElement>("[data-add-spec]");
  if (addSpec) { const list = addSpec.closest("[data-spec-group]")?.querySelector<HTMLElement>("[data-spec-list]"); const row = makeSpecRow(); list?.append(row); row.querySelector("input")?.focus(); markDirty(); return; }
  const deleteGroup = target.closest<HTMLButtonElement>("[data-delete-group]");
  if (deleteGroup) { deleteGroup.closest("[data-spec-group]")?.remove(); markDirty(); return; }
  const duplicate = target.closest<HTMLButtonElement>("[data-duplicate-group]");
  if (duplicate) { const group = duplicate.closest<HTMLElement>("[data-spec-group]"); if (group) { const clone = group.cloneNode(true) as HTMLElement; group.after(clone); markDirty(); } return; }
  const removeTag = target.closest<HTMLButtonElement>("[data-remove-tag]");
  if (removeTag) { removeTag.parentElement?.remove(); markDirty(); }
}, { signal });

document.querySelector<HTMLButtonElement>("[data-add-spec-group]")?.addEventListener("click", () => {
  const groups = document.querySelector<HTMLElement>("[data-spec-groups]"); if (!groups) return;
  const details = document.createElement("details"); details.className = "admin-spec-group"; details.open = true; details.dataset.specGroup = "";
  details.innerHTML = '<summary><span class="admin-drag-handle" aria-hidden="true"><i class="ph ph-dots-six-vertical"></i></span><strong>Nhóm thông số mới</strong><span>0 thông số</span><i class="ph ph-caret-down" aria-hidden="true"></i></summary><div class="admin-spec-group-body"><div class="admin-spec-group-tools"><label>Tên nhóm<input type="text" value="Nhóm thông số mới" data-spec-group-name></label><button type="button" data-duplicate-group><i class="ph ph-copy" aria-hidden="true"></i>Nhân bản</button><button type="button" class="admin-danger-text" data-delete-group><i class="ph ph-trash" aria-hidden="true"></i>Xóa nhóm</button></div><div class="admin-spec-list" data-spec-list></div><button class="admin-add-inline" type="button" data-add-spec><i class="ph ph-plus" aria-hidden="true"></i>Thêm thông số</button></div>';
  groups.append(details); details.querySelector<HTMLInputElement>("input")?.focus(); markDirty();
});
document.addEventListener("input", (event) => {
  const input = (event.target as HTMLElement).closest<HTMLInputElement>("[data-spec-group-name]");
  if (input) { const title = input.closest("[data-spec-group]")?.querySelector<HTMLElement>("summary strong"); if (title) title.textContent = input.value || "Nhóm chưa đặt tên"; }
}, { signal });

const tagInput = document.querySelector<HTMLInputElement>("[data-tag-input]");
tagInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || !tagInput.value.trim()) return;
  event.preventDefault(); const span = document.createElement("span"); span.append(document.createTextNode(tagInput.value.trim())); const button = document.createElement("button"); button.type = "button"; button.dataset.removeTag = ""; button.setAttribute("aria-label", `Xóa ${tagInput.value.trim()}`); button.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>'; span.append(button); tagInput.before(span); tagInput.value = ""; markDirty();
});

// Media upload, cover, preview and lightweight drag reorder.
const mediaList = document.querySelector<HTMLElement>("[data-media-list]");
const mediaDialog = document.querySelector<HTMLDialogElement>("[data-media-dialog]");
const previewImage = mediaDialog?.querySelector<HTMLImageElement>("[data-media-preview-image]");
const syncMediaImageState = (image: HTMLImageElement, state: "loaded" | "error") => {
  const thumbnail = image.closest<HTMLElement>(".admin-media-thumbnail");
  const retry = thumbnail?.querySelector<HTMLButtonElement>("[data-media-retry]");
  image.hidden = state === "error";
  if (retry) retry.hidden = state !== "error";
  thumbnail?.classList.toggle("has-error", state === "error");
};
const retryMediaImage = (image: HTMLImageElement, manual = false) => {
  const source = image.dataset.mediaSrc || image.getAttribute("src") || "";
  if (!source) { syncMediaImageState(image, "error"); return; }
  if (manual) delete image.dataset.mediaRetry;
  syncMediaImageState(image, "loaded");
  const retryUrl = new URL(source, window.location.href);
  retryUrl.searchParams.set("thumbnail-retry", Date.now().toString());
  image.src = retryUrl.href;
};
const handleMediaImageError = (image: HTMLImageElement) => {
  if (!image.dataset.mediaRetry) {
    image.dataset.mediaRetry = "true";
    retryMediaImage(image);
    return;
  }
  syncMediaImageState(image, "error");
};
const bindMediaImage = (image: HTMLImageElement) => {
  image.addEventListener("load", () => syncMediaImageState(image, "loaded"));
  image.addEventListener("error", () => handleMediaImageError(image));
  if (image.complete) image.naturalWidth > 0 ? syncMediaImageState(image, "loaded") : handleMediaImageError(image);
};
mediaList?.querySelectorAll<HTMLImageElement>("[data-media-image]").forEach(bindMediaImage);
const syncMediaQuoteSettings = (settings: HTMLElement) => {
  const enabled = Boolean(settings.querySelector<HTMLInputElement>("[data-media-quote-enabled]")?.checked);
  settings.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-media-quote-caption], [data-media-quote-after]").forEach((control) => { control.disabled = !enabled; });
};
mediaList?.querySelectorAll<HTMLElement>(".admin-media-quote-settings").forEach(syncMediaQuoteSettings);
mediaList?.addEventListener("change", (event) => { const enabled = (event.target as Element).closest("[data-media-quote-enabled]"); const settings = enabled?.closest<HTMLElement>(".admin-media-quote-settings"); if (settings) syncMediaQuoteSettings(settings); });
const currentQuotePlacementLines = () => {
  const lines: string[] = [];
  const productName = value("[data-editor-name]"); if (productName) lines.push(productName.toLocaleUpperCase("vi"));
  const model = value("[data-editor-model]"); if (model) lines.push(`Model: ${model}`);
  const brand = value("[data-editor-brand]"); if (brand) lines.push(`Hãng sản xuất: ${brand}`);
  const origin = value("[data-editor-origin]"); if (origin) lines.push(`Xuất xứ: ${origin}`);
  value("#product-description").split("\n").map((line) => line.trim()).filter(Boolean).forEach((line) => lines.push(line));
  document.querySelectorAll<HTMLElement>("[data-feature-row]").forEach((row) => { const inputs = row.querySelectorAll<HTMLInputElement>('input[type="text"]'); const title = inputs[0]?.value.trim(); if (title) lines.push(`- ${title}${inputs[1]?.value.trim() ? `: ${inputs[1].value.trim()}` : ""}`); });
  document.querySelectorAll<HTMLElement>("[data-configuration-row]").forEach((row) => { const inputs = row.querySelectorAll<HTMLInputElement>('input:not([type="file"])'); const name = inputs[0]?.value.trim(); if (name) lines.push(`- ${name}${inputs[1]?.value.trim() ? `: ${inputs[1].value.trim()}` : ""}`); });
  document.querySelectorAll<HTMLElement>("[data-spec-row]").forEach((row) => { const inputs = row.querySelectorAll<HTMLInputElement>('input[type="text"]'); if (inputs[0]?.value.trim() && inputs[1]?.value.trim()) lines.push(`- ${inputs[0].value.trim()}: ${inputs[1].value.trim()}`); });
  return [...new Set(lines)];
};
const createMediaQuoteSettings = (caption: string) => {
  const settings = document.createElement("div"); settings.className = "admin-media-quote-settings";
  const enabledLabel = document.createElement("label"); enabledLabel.className = "admin-checkbox";
  const enabled = document.createElement("input"); enabled.type = "checkbox"; enabled.dataset.mediaQuoteEnabled = "";
  const enabledCopy = document.createElement("span"); enabledCopy.textContent = "Dùng ảnh này trong PDF báo giá"; enabledLabel.append(enabled, enabledCopy);
  const captionLabel = document.createElement("label"); const captionTitle = document.createElement("span"); captionTitle.textContent = "Chú thích trong báo giá";
  const captionInput = document.createElement("input"); captionInput.type = "text"; captionInput.value = caption; captionInput.dataset.mediaQuoteCaption = ""; captionLabel.append(captionTitle, captionInput);
  const afterLabel = document.createElement("label"); const afterTitle = document.createElement("span"); afterTitle.textContent = "Đặt ảnh sau mục";
  const after = document.createElement("select"); after.dataset.mediaQuoteAfter = ""; after.add(new Option("Cuối phần mô tả", "")); currentQuotePlacementLines().forEach((line) => after.add(new Option(line.length > 90 ? `${line.slice(0, 87)}…` : line, line))); afterLabel.append(afterTitle, after);
  settings.append(enabledLabel, captionLabel, afterLabel); syncMediaQuoteSettings(settings); return settings;
};
document.querySelector<HTMLInputElement>("[data-media-upload]")?.addEventListener("change", async (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const label = input.closest<HTMLLabelElement>("label");
  const status = document.querySelector<HTMLElement>("[data-media-upload-status]");
  const files = [...(input.files || [])];
  input.disabled = true;
  label?.classList.add("is-uploading");
  label?.setAttribute("aria-busy", "true");
  let uploadedCount = 0;
  let failedCount = 0;
  for (const [index, file] of files.entries()) {
    if (status) status.textContent = `Đang tải ${index + 1}/${files.length}: ${file.name}`;
    const validationError = validateAdminImage(file);
    if (validationError) { failedCount += 1; showToast(`${file.name}: ${validationError}`); continue; }
    let uploaded: UploadedAdminImage;
    try { uploaded = await uploadAdminImage(file); }
    catch (error) { failedCount += 1; showToast(error instanceof Error ? error.message : `Không thể tải ${file.name}.`); continue; }
    const article = document.createElement("article"); article.className = "admin-media-item"; article.draggable = true; article.dataset.mediaItem = "";
    const thumbnail = document.createElement("div"); thumbnail.className = "admin-media-thumbnail";
    const image = document.createElement("img"); image.src = uploaded.url; image.dataset.mediaSrc = uploaded.url; image.dataset.mediaImage = ""; image.alt = ""; image.width = 96; image.height = 72;
    const retry = document.createElement("button"); retry.type = "button"; retry.className = "admin-media-image-error"; retry.dataset.mediaRetry = ""; retry.hidden = true; retry.setAttribute("aria-label", "Thử tải lại ảnh"); retry.innerHTML = '<i class="ph ph-arrow-clockwise" aria-hidden="true"></i><span>Tải lại ảnh</span>'; thumbnail.append(image, retry); bindMediaImage(image);
    const copy = document.createElement("div"); copy.className = "admin-media-copy"; const name = document.createElement("strong"); name.textContent = file.name; const altLabel = document.createElement("label"); altLabel.append(document.createTextNode("Alt text")); const alt = document.createElement("input"); alt.type = "text"; alt.value = file.name.replace(/\.[^.]+$/, ""); alt.dataset.mediaAlt = ""; altLabel.append(alt); copy.append(name, altLabel);
    const actions = document.createElement("div"); actions.className = "admin-media-actions"; actions.innerHTML = '<button type="button" data-set-cover>Đặt làm bìa</button><button type="button" data-media-preview>Preview</button><button type="button" data-media-delete aria-label="Xóa ảnh"><i class="ph ph-trash" aria-hidden="true"></i></button>';
    article.append(dragButton(), thumbnail, copy, actions, createMediaQuoteSettings(file.name.replace(/\.[^.]+$/, ""))); mediaList?.append(article); markDirty(); uploadedCount += 1;
  }
  if (status) status.textContent = failedCount ? `Đã tải ${uploadedCount} ảnh, ${failedCount} ảnh lỗi.` : `Đã tải ${uploadedCount} ảnh.`;
  input.disabled = false; input.value = ""; label?.classList.remove("is-uploading"); label?.removeAttribute("aria-busy");
}, { signal });
mediaList?.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const item = target.closest<HTMLElement>("[data-media-item]"); if (!item) return;
  if (target.closest("[data-media-retry]")) { const image = item.querySelector<HTMLImageElement>("[data-media-image]"); if (image) retryMediaImage(image, true); return; }
  if (target.closest("[data-media-delete]")) { item.remove(); markDirty(); return; }
  if (target.closest("[data-media-preview]")) { const image = item.querySelector<HTMLImageElement>("[data-media-image]"); if (image && previewImage) previewImage.src = image.dataset.mediaSrc || image.src; mediaDialog?.showModal(); return; }
  if (target.closest("[data-set-cover]")) { mediaList.prepend(item); showToast("Đã đặt ảnh làm ảnh bìa."); markDirty(); }
});
document.querySelector<HTMLButtonElement>("[data-media-dialog-close]")?.addEventListener("click", () => mediaDialog?.close());
mediaDialog?.addEventListener("click", (event) => { if (event.target === mediaDialog) mediaDialog.close(); });

let dragged: HTMLElement | null = null;
document.addEventListener("dragstart", (event) => { const item = (event.target as HTMLElement).closest<HTMLElement>("[draggable='true']"); if (item) { dragged = item; item.classList.add("is-dragging"); } }, { signal });
document.addEventListener("dragend", () => { dragged?.classList.remove("is-dragging"); dragged = null; markDirty(); }, { signal });
document.addEventListener("dragover", (event) => { if (!dragged) return; const target = (event.target as HTMLElement).closest<HTMLElement>("[draggable='true']"); if (!target || target === dragged || target.parentElement !== dragged.parentElement) return; event.preventDefault(); const rect = target.getBoundingClientRect(); target.parentElement?.insertBefore(dragged, event.clientY < rect.top + rect.height / 2 ? target : target.nextSibling); }, { signal });
document.addEventListener("keydown", (event) => {
  if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
  const handle = (event.target as Element).closest<HTMLButtonElement>(".admin-drag-handle");
  const item = handle?.closest<HTMLElement>("[data-media-item], [data-feature-row], [data-configuration-row], [data-spec-row]");
  const sibling = event.key === "ArrowUp" ? item?.previousElementSibling : item?.nextElementSibling;
  if (!handle || !item || !sibling) return;
  event.preventDefault();
  if (event.key === "ArrowUp") item.parentElement?.insertBefore(item, sibling);
  else item.parentElement?.insertBefore(sibling, item);
  handle.focus(); markDirty();
  const position = Array.from(item.parentElement?.children || []).indexOf(item) + 1;
  showToast(`Đã chuyển mục đến vị trí ${position}.`);
}, { signal });

// Documents upload UI.
document.querySelector<HTMLInputElement>("[data-document-upload]")?.addEventListener("change", async (event) => {
  const input = event.currentTarget as HTMLInputElement; const list = document.querySelector<HTMLElement>("[data-document-list]");
  for (const file of [...(input.files || [])]) {
    const formData=new FormData();formData.append("file",file);const response=await fetch("/api/admin/upload",{method:"POST",body:formData});const uploaded=await response.json();if(!response.ok){showToast(uploaded.error||`Không thể tải ${file.name}.`);continue;}
    const row = document.createElement("div"); row.className = "admin-document-row"; row.dataset.href=uploaded.url; const info = document.createElement("div"); info.innerHTML = `<strong>${file.name}</strong><small>${file.type || "Tài liệu"} · ${(file.size / 1024 / 1024).toFixed(1)} MB</small>`;
    const type = document.createElement("select"); type.setAttribute("aria-label", "Loại tài liệu"); ["Catalogue", "Datasheet", "Manual", "Certificate", "Warranty", "Other"].forEach((value) => type.add(new Option(value)));
    const access = document.createElement("select"); access.setAttribute("aria-label", "Quyền truy cập"); ["Public", "Registered", "Staff", "Admin"].forEach((value) => access.add(new Option(value)));
    const icon = document.createElement("i"); icon.className = "ph ph-file-text"; icon.setAttribute("aria-hidden", "true"); row.append(icon, info, type, access, iconButton("Xóa tài liệu", "removeRow")); list?.append(row); markDirty();
  } input.value = "";
});

// SEO counters and search preview.
const seoTitle = document.querySelector<HTMLInputElement>("[data-seo-title]");
const seoDescription = document.querySelector<HTMLTextAreaElement>("[data-seo-description]");
const seoSlug = document.querySelector<HTMLInputElement>("[data-seo-slug]");
const syncSeo = () => {
  const titleCount = document.querySelector<HTMLElement>("[data-seo-title-count]"); const descriptionCount = document.querySelector<HTMLElement>("[data-seo-description-count]");
  if (titleCount) titleCount.textContent = String(seoTitle?.value.length || 0); if (descriptionCount) descriptionCount.textContent = String(seoDescription?.value.length || 0);
  const previewTitle = document.querySelector<HTMLElement>("[data-preview-title]"); const previewDescription = document.querySelector<HTMLElement>("[data-preview-description]"); const previewSlug = document.querySelector<HTMLElement>("[data-preview-slug]");
  if (previewTitle) previewTitle.textContent = seoTitle?.value || "SEO title"; if (previewDescription) previewDescription.textContent = seoDescription?.value || "Meta description"; if (previewSlug) previewSlug.textContent = seoSlug?.value || "slug-san-pham";
};
[seoTitle, seoDescription, seoSlug].forEach((field) => field?.addEventListener("input", syncSeo)); syncSeo();
document.querySelector<HTMLButtonElement>("[data-select-og]")?.addEventListener("click", () => showToast("Chọn ảnh từ Media để dùng làm OG image."));
};

document.addEventListener("astro:page-load", initAdminProducts);
initAdminProducts();
