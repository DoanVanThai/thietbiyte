const one = <T extends Element>(selector: string, scope: ParentNode = document) => scope.querySelector<T>(selector);
const all = <T extends Element>(selector: string, scope: ParentNode = document) => Array.from(scope.querySelectorAll<T>(selector));

let cmsLifecycle: AbortController | undefined;
const initAdminCms = () => {
cmsLifecycle?.abort();
cmsLifecycle = new AbortController();
const { signal } = cmsLifecycle;
const cmsShell = one<HTMLElement>("[data-admin-dashboard]")?.closest<HTMLElement>("[data-admin-shell]") || null;

if (cmsShell) {
  const toast = one<HTMLElement>("[data-admin-toast]");
  let toastTimer = 0;
  const showToast = (message: string, icon = "ph-check-circle") => {
    if (!toast) return;
    toast.replaceChildren();
    const iconElement = document.createElement("i"); iconElement.className = `ph ${icon}`;
    const copy = document.createElement("span"); copy.textContent = message;
    toast.append(iconElement, copy); toast.hidden = false; toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.classList.remove("is-visible"); toast.hidden = true; }, 3000);
  };

  // Keep every table action menu anchored to the three-dot button that opened it.
  // The panel uses fixed positioning so it can escape table overflow clipping.
  const rowMenus = all<HTMLDetailsElement>(".row-menu", cmsShell);
  const closeRowMenus = (except?: HTMLDetailsElement) => {
    rowMenus.forEach((menu) => {
      if (menu === except) return;
      menu.open = false;
      one<HTMLElement>(":scope > summary", menu)?.setAttribute("aria-expanded", "false");
    });
  };
  const positionRowMenu = (menu: HTMLDetailsElement) => {
    const trigger = one<HTMLElement>(":scope > summary", menu);
    const panel = one<HTMLElement>(":scope > div", menu);
    if (!trigger || !panel) return;

    const gap = 6;
    const edge = 8;
    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const left = Math.min(
      Math.max(edge, triggerRect.right - panelRect.width),
      window.innerWidth - panelRect.width - edge,
    );
    const belowTop = triggerRect.bottom + gap;
    const top = belowTop + panelRect.height <= window.innerHeight - edge
      ? belowTop
      : Math.max(edge, triggerRect.top - panelRect.height - gap);

    panel.style.inset = "auto";
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  };

  rowMenus.forEach((menu) => {
    const trigger = one<HTMLElement>(":scope > summary", menu);
    trigger?.setAttribute("aria-expanded", "false");
    trigger?.addEventListener("click", (event) => {
      event.preventDefault();
      const shouldOpen = !menu.open;
      closeRowMenus(menu);
      if (!shouldOpen) {
        menu.open = false;
        trigger.setAttribute("aria-expanded", "false");
        return;
      }

      menu.dataset.positioning = "";
      menu.open = true;
      positionRowMenu(menu);
      delete menu.dataset.positioning;
      rowMenus.forEach((item) => one<HTMLElement>(":scope > summary", item)?.setAttribute("aria-expanded", String(item === menu)));
    });
  });
  document.addEventListener("pointerdown", (event) => {
    const target = event.target as Node;
    closeRowMenus(rowMenus.find((menu) => menu.contains(target)));
  }, { signal });
  const dismissRowMenus = () => closeRowMenus();
  window.addEventListener("resize", dismissRowMenus, { signal });
  window.addEventListener("scroll", dismissRowMenus, { capture: true, signal });

  const contentList = one<HTMLElement>("[data-content-list]", cmsShell);
  const articleEditor = one<HTMLElement>("[data-article-editor]", cmsShell);
  const setEditorOpen = (open: boolean, push = true) => {
    if (!contentList || !articleEditor) return;
    contentList.hidden = open; articleEditor.hidden = !open;
    if (push) {
      const url = new URL(location.href); url.searchParams.set("section", "noi-dung");
      if (open) url.searchParams.set("view", "editor"); else url.searchParams.delete("view");
      history.pushState({}, "", url);
    }
    if (open) one<HTMLTextAreaElement>("[data-article-title]", articleEditor)?.focus();
  };
  const route = new URLSearchParams(location.search);
  if (route.get("section") === "noi-dung" && route.get("view") === "editor") setEditorOpen(true, false);
  all<HTMLButtonElement>("[data-open-editor]", cmsShell).forEach((button) => button.addEventListener("click", () => setEditorOpen(true)));
  one<HTMLButtonElement>("[data-close-editor]", cmsShell)?.addEventListener("click", () => setEditorOpen(false));

  const projectList = one<HTMLElement>("[data-project-list]", cmsShell);
  const projectEditor = one<HTMLElement>("[data-project-editor]", cmsShell);
  const setProjectOpen = (open: boolean, push = true) => {
    if (!projectList || !projectEditor) return;
    projectList.hidden = open; projectEditor.hidden = !open;
    if (push) {
      const url = new URL(location.href); url.searchParams.set("section", "du-an");
      if (open) url.searchParams.set("view", "editor"); else url.searchParams.delete("view");
      history.pushState({}, "", url);
    }
  };
  if (route.get("section") === "du-an" && route.get("view") === "editor") setProjectOpen(true, false);
  all<HTMLButtonElement>("[data-open-project]", cmsShell).forEach((button) => button.addEventListener("click", () => setProjectOpen(true)));
  one<HTMLButtonElement>("[data-close-project]", cmsShell)?.addEventListener("click", () => setProjectOpen(false));
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(location.search);
    setEditorOpen(params.get("section") === "noi-dung" && params.get("view") === "editor", false);
    setProjectOpen(params.get("section") === "du-an" && params.get("view") === "editor", false);
  }, { signal });

  let activeArticleType = "all";
  const articleSearch = one<HTMLInputElement>("[data-article-search]", cmsShell);
  const articleCategory = one<HTMLSelectElement>("[data-article-category]", cmsShell);
  const articleStatus = one<HTMLSelectElement>("[data-article-status]", cmsShell);
  const filterArticles = () => {
    const query = articleSearch?.value.trim().toLowerCase() || "";
    let visible = 0;
    all<HTMLElement>("[data-article-row]", cmsShell).forEach((row) => {
      const matches = (activeArticleType === "all" || row.dataset.type === activeArticleType)
        && (!articleCategory || articleCategory.value === "all" || row.dataset.category === articleCategory.value)
        && (!articleStatus || articleStatus.value === "all" || row.dataset.status === articleStatus.value)
        && (!query || row.dataset.title?.includes(query));
      row.hidden = !matches; if (matches) visible += 1;
    });
    const count = one<HTMLElement>("[data-visible-article-count]", cmsShell); if (count) count.textContent = String(visible);
    const empty = one<HTMLElement>("[data-article-empty]", cmsShell); if (empty) empty.hidden = visible !== 0;
  };
  all<HTMLButtonElement>("[data-content-tab]", cmsShell).forEach((tab) => tab.addEventListener("click", () => {
    activeArticleType = tab.dataset.contentTab || "all";
    all<HTMLButtonElement>("[data-content-tab]", cmsShell).forEach((item) => item.setAttribute("aria-pressed", String(item === tab)));
    filterArticles();
  }));
  [articleSearch, articleCategory, articleStatus].forEach((control) => control?.addEventListener("input", filterArticles));
  one<HTMLButtonElement>("[data-reset-articles]", cmsShell)?.addEventListener("click", () => {
    if (articleSearch) articleSearch.value = ""; if (articleCategory) articleCategory.value = "all"; if (articleStatus) articleStatus.value = "all"; filterArticles();
  });

  const updateCount = (inputSelector: string, outputSelector: string) => {
    const input = one<HTMLInputElement | HTMLTextAreaElement>(inputSelector, cmsShell);
    const output = one<HTMLElement>(outputSelector, cmsShell);
    const run = () => { if (input && output) output.textContent = String(input.value.length); };
    input?.addEventListener("input", run); run();
  };
  updateCount("[data-article-excerpt]", "[data-excerpt-count]"); updateCount("[data-seo-title]", "[data-seo-title-count]"); updateCount("[data-seo-description]", "[data-seo-description-count]");
  const seoTitle = one<HTMLInputElement>("[data-seo-title]", cmsShell);
  const seoDescription = one<HTMLTextAreaElement>("[data-seo-description]", cmsShell);
  seoTitle?.addEventListener("input", () => { const target = one<HTMLElement>("[data-seo-preview-title]", cmsShell); if (target) target.textContent = seoTitle.value || "Tiêu đề bài viết"; });
  seoDescription?.addEventListener("input", () => { const target = one<HTMLElement>("[data-seo-preview-description]", cmsShell); if (target) target.textContent = seoDescription.value || "Mô tả bài viết sẽ xuất hiện tại đây."; });

  let saveDelay = 0;
  one<HTMLFormElement>("[data-editor-form]", cmsShell)?.addEventListener("input", () => {
    const state = one<HTMLElement>("[data-save-state]", cmsShell); if (!state) return;
    state.innerHTML = '<i class="ph ph-circle-notch"></i>Đang lưu bản nháp…'; window.clearTimeout(saveDelay);
    saveDelay = window.setTimeout(() => { state.innerHTML = '<i class="ph ph-check-circle"></i>Đã tự động lưu'; }, 700);
  });
  one<HTMLButtonElement>("[data-save-article]", cmsShell)?.addEventListener("click", () => showToast("Đã lưu nội dung và tạo phiên bản mới."));
  one<HTMLButtonElement>("[data-preview-article]", cmsShell)?.addEventListener("click", () => showToast("Bản xem trước đã sẵn sàng.", "ph-eye"));

  const blockTemplates: Record<string, string> = {
    heading: '<span class="block-label">Heading 2</span><h2 contenteditable="true">Tiêu đề mới</h2>', paragraph: '<span class="block-label">Đoạn văn</span><p contenteditable="true">Bắt đầu viết nội dung tại đây…</p>',
    list: '<span class="block-label">Danh sách</span><ul contenteditable="true"><li>Mục danh sách mới</li><li>Nhấn Enter để thêm mục</li></ul>', image: '<span class="block-label">Ảnh</span><p contenteditable="true">Chọn ảnh từ thư viện media để tái sử dụng tài nguyên.</p>',
    quote: '<span class="block-label">Trích dẫn</span><blockquote contenteditable="true">Nhập nội dung trích dẫn…</blockquote>', table: '<span class="block-label">Bảng</span><table><tbody><tr><td contenteditable="true">Tiêu chí</td><td contenteditable="true">Thông tin</td></tr></tbody></table>',
    link: '<span class="block-label">Liên kết</span><p contenteditable="true"><a href="#">Văn bản liên kết</a></p>', callout: '<span class="block-label">Ghi chú</span><p contenteditable="true">Thông tin cần lưu ý…</p>',
    product: '<span class="block-label">Sản phẩm nhúng</span><strong>Chọn sản phẩm liên quan</strong><small>Thông tin sẽ đồng bộ từ catalogue.</small>',
  };
  all<HTMLButtonElement>("[data-add-block]", cmsShell).forEach((button) => button.addEventListener("click", () => {
    const type = button.dataset.addBlock || "paragraph"; const canvas = one<HTMLElement>("[data-block-canvas]", cmsShell); if (!canvas) return;
    const block = document.createElement("article"); block.className = `editor-block ${type === "callout" ? "callout-block" : ""}`; block.dataset.block = ""; block.draggable = true;
    block.innerHTML = `<button type="button" class="drag-handle" aria-label="Sắp xếp khối; dùng Alt và mũi tên lên hoặc xuống" aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"><i class="ph ph-dots-six-vertical" aria-hidden="true"></i></button><div>${blockTemplates[type]}</div><button class="block-action" type="button" aria-label="Tùy chọn khối"><i class="ph ph-dots-three" aria-hidden="true"></i></button>`;
    canvas.append(block); block.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }); one<HTMLElement>("[contenteditable]", block)?.focus();
  }));
  one<HTMLElement>("[data-block-canvas]", cmsShell)?.addEventListener("keydown", (event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.altKey || !["ArrowUp", "ArrowDown"].includes(keyboardEvent.key)) return;
    const handle = (keyboardEvent.target as Element).closest<HTMLButtonElement>(".drag-handle");
    const block = handle?.closest<HTMLElement>("[data-block]");
    const sibling = keyboardEvent.key === "ArrowUp" ? block?.previousElementSibling : block?.nextElementSibling;
    if (!handle || !block || !sibling) return;
    keyboardEvent.preventDefault();
    if (keyboardEvent.key === "ArrowUp") block.parentElement?.insertBefore(block, sibling);
    else block.parentElement?.insertBefore(sibling, block);
    handle.focus();
    const position = Array.from(block.parentElement?.children || []).indexOf(block) + 1;
    showToast(`Đã chuyển khối đến vị trí ${position}.`, "ph-arrows-down-up");
  });

  const publicRadio = one<HTMLInputElement>("[data-project-public]", cmsShell);
  const publicConfirmation = one<HTMLElement>("[data-public-confirmation]", cmsShell);
  all<HTMLInputElement>('input[name="visibility"]', cmsShell).forEach((radio) => radio.addEventListener("change", () => { if (publicConfirmation) publicConfirmation.hidden = !publicRadio?.checked; }));
  one<HTMLButtonElement>("[data-save-project]", cmsShell)?.addEventListener("click", () => {
    const approved = one<HTMLInputElement>("[data-public-approved]", cmsShell);
    if (publicRadio?.checked && !approved?.checked) { publicConfirmation?.scrollIntoView({ behavior: "smooth", block: "center" }); showToast("Cần xác nhận quyền công khai dữ liệu khách hàng.", "ph-warning"); return; }
    showToast("Đã lưu dự án. Chế độ hiển thị không tự xuất bản.");
  });
  const refreshGalleryLabels = () => all<HTMLElement>("[data-gallery-item]", cmsShell).forEach((item, index) => { const label = one<HTMLElement>(".cover-label", item); if (label) label.textContent = item.classList.contains("is-cover") ? "Ảnh bìa" : `Ảnh ${index + 1}`; });
  one<HTMLElement>("[data-project-gallery]", cmsShell)?.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button"); const item = button?.closest<HTMLElement>("[data-gallery-item]"); if (!button || !item) return;
    if (button.matches("[data-gallery-left]") && item.previousElementSibling) item.parentElement?.insertBefore(item, item.previousElementSibling);
    if (button.matches("[data-gallery-right]") && item.nextElementSibling) item.parentElement?.insertBefore(item.nextElementSibling, item);
    if (button.matches("[data-set-cover]")) { all("[data-gallery-item]", cmsShell).forEach((entry) => entry.classList.remove("is-cover")); item.classList.add("is-cover"); }
    refreshGalleryLabels();
  });

  const documentSearch = one<HTMLInputElement>("[data-document-search]", cmsShell); const documentType = one<HTMLSelectElement>("[data-document-type]", cmsShell); const documentAccess = one<HTMLSelectElement>("[data-document-access]", cmsShell);
  const filterDocuments = () => { const query = documentSearch?.value.trim().toLowerCase() || ""; let visible = 0; all<HTMLElement>("[data-document-row]", cmsShell).forEach((row) => { const matches = (!query || row.dataset.name?.includes(query)) && (!documentType || documentType.value === "all" || row.dataset.type === documentType.value) && (!documentAccess || documentAccess.value === "all" || row.dataset.access === documentAccess.value); row.hidden = !matches; if (matches) visible += 1; }); const count = one<HTMLElement>("[data-visible-document-count]", cmsShell); if (count) count.textContent = String(visible); const empty = one<HTMLElement>("[data-document-empty]", cmsShell); if (empty) empty.hidden = visible !== 0; };
  [documentSearch, documentType, documentAccess].forEach((control) => control?.addEventListener("input", filterDocuments));

  const mediaLibrary = one<HTMLElement>("[data-media-library]", cmsShell); const mediaSearch = one<HTMLInputElement>("[data-media-search]", cmsShell); const mediaType = one<HTMLSelectElement>("[data-media-type]", cmsShell);
  const filterMedia = () => { const query = mediaSearch?.value.trim().toLowerCase() || ""; let visible = 0; all<HTMLElement>("[data-media-item]", cmsShell).forEach((item) => { const matches = (!query || item.dataset.name?.includes(query)) && (!mediaType || mediaType.value === "all" || item.dataset.type === mediaType.value); item.hidden = !matches; if (matches) visible += 1; }); const count = one<HTMLElement>("[data-visible-media-count]", cmsShell); if (count) count.textContent = String(visible); const empty = one<HTMLElement>("[data-media-empty]", cmsShell); if (empty) empty.hidden = visible !== 0; };
  [mediaSearch, mediaType].forEach((control) => control?.addEventListener("input", filterMedia));
  all<HTMLButtonElement>("[data-media-view]", cmsShell).forEach((button) => button.addEventListener("click", () => { if (mediaLibrary) mediaLibrary.dataset.view = button.dataset.mediaView || "grid"; all<HTMLButtonElement>("[data-media-view]", cmsShell).forEach((item) => item.setAttribute("aria-pressed", String(item === button))); }));
  const mediaDialog = one<HTMLDialogElement>("[data-media-dialog]", cmsShell); all<HTMLButtonElement>("[data-open-media]", cmsShell).forEach((button) => button.addEventListener("click", () => mediaDialog?.showModal()));
  all<HTMLInputElement>("[data-media-upload], [data-document-upload], [data-gallery-upload]", cmsShell).forEach((input) => input.addEventListener("change", () => { const count = input.files?.length || 0; if (count) showToast(`Đã thêm ${count} tệp vào hàng chờ tải lên.`, "ph-upload-simple"); }));
}
};

document.addEventListener("astro:page-load", initAdminCms);
