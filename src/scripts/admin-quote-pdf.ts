export {};

type ProductSource = { id: string; name: string; model: string; price: number; description: string; images: Array<{ url: string; caption: string; afterText: string }> };
const initAdminQuotePdf = () => {
const root = document.querySelector<HTMLElement>("[data-quote-builder]");
if (root) {
  if (root.dataset.quoteBuilderReady === "true") return;
  root.dataset.quoteBuilderReady = "true";
  const form = root.querySelector<HTMLFormElement>("[data-quote-form]");
  const itemsRoot = root.querySelector<HTMLElement>("[data-quote-items]");
  const feedback = root.querySelector<HTMLElement>("[data-quote-feedback]");
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-quote-download]"));
  let products: ProductSource[] = [];
  try { products = JSON.parse(document.querySelector("#quote-product-data")?.textContent || "[]") as ProductSource[]; } catch { products = []; }

  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
  const productLabel = (product: ProductSource) => `${product.name} · ${product.model}`;

  const descriptionLines = (item: HTMLElement) => {
    const lines = item.querySelector<HTMLTextAreaElement>("[data-quote-description]")?.value.split("\n").map((line) => line.trim()).filter(Boolean) || [];
    return [...new Set(lines)];
  };

  const refreshImageAnchors = (item: HTMLElement) => {
    const lines = descriptionLines(item);
    item.querySelectorAll<HTMLSelectElement>("[data-quote-image-anchor]").forEach((select) => {
      const current = select.value;
      select.replaceChildren();
      const fallback = new Option("Cuối phần mô tả", ""); select.add(fallback);
      lines.forEach((line) => select.add(new Option(line.length > 90 ? `${line.slice(0, 87)}…` : line, line)));
      select.value = lines.includes(current) ? current : "";
    });
  };

  const createImageCard = (item: HTMLElement, image: { url: string; caption: string; afterText: string }) => {
    const card = document.createElement("article"); card.className = "quote-inline-image"; card.dataset.quoteImageCard = ""; card.dataset.imageUrl = image.url;
    const toggle = document.createElement("label"); toggle.className = "quote-image-toggle";
    const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = true; checkbox.dataset.quoteImageEnabled = "";
    const toggleCopy = document.createElement("span"); toggleCopy.textContent = "Xuất tài liệu"; toggle.append(checkbox, toggleCopy);
    const preview = document.createElement("div"); preview.className = "quote-image-preview";
    const thumbnail = document.createElement("img"); thumbnail.alt = ""; thumbnail.width = 88; thumbnail.height = 70; thumbnail.loading = "lazy"; thumbnail.dataset.quoteImagePreview = "";
    const previewError = document.createElement("span"); previewError.textContent = "Không tải được ảnh"; previewError.hidden = true;
    thumbnail.addEventListener("error", () => {
      const retry = Number(thumbnail.dataset.previewRetry || "0");
      if (retry < 3) {
        thumbnail.dataset.previewRetry = String(retry + 1);
        thumbnail.hidden = true; previewError.textContent = "Đang tải lại ảnh…"; previewError.hidden = false;
        card.classList.add("is-image-retrying"); card.classList.remove("has-image-error");
        window.setTimeout(() => {
          const retryUrl = new URL(card.dataset.imageUrl || image.url, window.location.origin);
          retryUrl.searchParams.set("quote-preview", `${Date.now()}-${retry + 1}`);
          thumbnail.src = retryUrl.href;
        }, [250, 700, 1_400][retry]);
        return;
      }
      thumbnail.hidden = true; previewError.textContent = "Ảnh chưa truy cập được"; previewError.hidden = false;
      checkbox.checked = false; checkbox.disabled = true;
      card.classList.remove("is-image-retrying"); card.classList.add("has-image-error");
    });
    thumbnail.addEventListener("load", () => {
      thumbnail.hidden = false; thumbnail.dataset.previewRetry = "0"; previewError.hidden = true;
      checkbox.disabled = false; card.classList.remove("has-image-error", "is-image-retrying");
    });
    thumbnail.src = new URL(image.url, window.location.origin).href;
    preview.append(thumbnail, previewError);
    const fields = document.createElement("div"); fields.className = "quote-image-fields";
    const captionLabel = document.createElement("label"); const captionTitle = document.createElement("span"); captionTitle.textContent = "Chú thích";
    const caption = document.createElement("input"); caption.type = "text"; caption.value = image.caption; caption.maxLength = 240; caption.dataset.quoteImageCaption = ""; captionLabel.append(captionTitle, caption);
    const anchorLabel = document.createElement("label"); const anchorTitle = document.createElement("span"); anchorTitle.textContent = "Đặt ảnh sau mục";
    const anchor = document.createElement("select"); anchor.dataset.quoteImageAnchor = ""; anchorLabel.append(anchorTitle, anchor); fields.append(captionLabel, anchorLabel);
    const actions = document.createElement("div"); actions.className = "quote-image-actions";
    const replace = document.createElement("label"); replace.className = "quote-image-file-action"; replace.title = "Đổi ảnh"; replace.innerHTML = '<input type="file" accept="image/png,image/jpeg,image/webp" data-quote-image-upload data-upload-mode="replace"><i class="ph ph-arrows-clockwise" aria-hidden="true"></i><span>Đổi</span>';
    const remove = document.createElement("button"); remove.type = "button"; remove.dataset.removeQuoteImage = ""; remove.innerHTML = '<i class="ph ph-trash" aria-hidden="true"></i><span>Xóa</span>';
    actions.append(replace, remove); card.append(toggle, preview, fields, actions);
    item.querySelector<HTMLElement>("[data-quote-image-list]")?.append(card);
    refreshImageAnchors(item); anchor.value = descriptionLines(item).includes(image.afterText) ? image.afterText : "";
    return card;
  };

  const renderImageManager = (item: HTMLElement, images: ProductSource["images"]) => {
    const imagesRoot = item.querySelector<HTMLElement>("[data-quote-images]"); if (!imagesRoot) return;
    imagesRoot.replaceChildren();
    const heading = document.createElement("div"); heading.className = "quote-inline-images-heading";
    const copy = document.createElement("div"); const title = document.createElement("strong"); title.textContent = "Ảnh minh họa trong báo giá";
    const help = document.createElement("span"); help.textContent = "Thêm ảnh rồi chọn chính xác mục sẽ đặt ảnh phía sau."; copy.append(title, help);
    const add = document.createElement("label"); add.className = "button button-outline button-sm quote-image-add"; add.innerHTML = '<input type="file" accept="image/png,image/jpeg,image/webp" data-quote-image-upload data-upload-mode="add"><i class="ph ph-plus" aria-hidden="true"></i>Thêm ảnh';
    heading.append(copy, add);
    const list = document.createElement("div"); list.className = "quote-inline-images-list"; list.dataset.quoteImageList = "";
    const empty = document.createElement("p"); empty.className = "quote-inline-images-empty"; empty.dataset.quoteImagesEmpty = ""; empty.textContent = "Chưa có ảnh. Bạn có thể thêm ảnh trực tiếp cho báo giá này.";
    imagesRoot.append(heading, list, empty);
    images.forEach((image) => createImageCard(item, image));
    empty.hidden = Boolean(images.length);
  };

  const syncImageEmptyState = (item: HTMLElement) => {
    const empty = item.querySelector<HTMLElement>("[data-quote-images-empty]"); if (empty) empty.hidden = Boolean(item.querySelector("[data-quote-image-card]"));
  };

  const hydrateItem = (item: HTMLElement, productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    if (!product) return;
    const productInput = item.querySelector<HTMLInputElement>("[data-quote-product]");
    const productSearch = item.querySelector<HTMLInputElement>("[data-quote-product-search]");
    const description = item.querySelector<HTMLTextAreaElement>("[data-quote-description]");
    const price = item.querySelector<HTMLInputElement>('[name="unitPrice"]');
    if (productInput) productInput.value = product.id;
    if (productSearch) {
      productSearch.value = productLabel(product);
      delete productSearch.dataset.editing;
    }
    if (description) description.value = product.description;
    if (price) price.value = String(product.price || 0);
    renderImageManager(item, product.images);
  };
  const closeProductOptions = (item: HTMLElement) => {
    const search = item.querySelector<HTMLInputElement>("[data-quote-product-search]");
    const options = item.querySelector<HTMLElement>("[data-quote-product-options]");
    const empty = item.querySelector<HTMLElement>("[data-quote-product-empty]");
    if (options) options.hidden = true;
    if (empty) empty.hidden = true;
    search?.setAttribute("aria-expanded", "false");
  };
  const renderProductOptions = (item: HTMLElement, query = "") => {
    const options = item.querySelector<HTMLElement>("[data-quote-product-options]");
    const empty = item.querySelector<HTMLElement>("[data-quote-product-empty]");
    const search = item.querySelector<HTMLInputElement>("[data-quote-product-search]");
    const selected = item.querySelector<HTMLInputElement>("[data-quote-product]")?.value || "";
    if (!options || !search) return;
    const matching = products.filter((product) => !query || normalize(`${product.name} ${product.model}`).includes(normalize(query)));
    options.replaceChildren();
    matching.forEach((product) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "quote-product-option";
      option.dataset.quoteProductOption = product.id;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(product.id === selected));
      const name = document.createElement("strong"); name.textContent = product.name;
      const meta = document.createElement("small"); meta.textContent = product.model;
      option.append(name, meta);
      options.append(option);
    });
    options.hidden = matching.length === 0;
    if (empty) empty.hidden = matching.length > 0;
    search.setAttribute("aria-expanded", "true");
  };
  const syncItems = () => {
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-quote-item]"));
    items.forEach((item, index) => {
      const number = item.querySelector<HTMLElement>("[data-quote-item-number]");
      const remove = item.querySelector<HTMLButtonElement>("[data-remove-quote-item]");
      if (number) number.textContent = String(index + 1);
      if (remove) remove.hidden = items.length === 1;
    });
    const summary = root.querySelector<HTMLElement>("[data-quote-product-summary]");
    if (summary) summary.textContent = `${items.length} sản phẩm`;
  };
  const chooseProduct = (item: HTMLElement, productId: string) => {
    hydrateItem(item, productId);
    closeProductOptions(item);
    if (item === itemsRoot?.firstElementChild) {
      const url = new URL(window.location.href); url.searchParams.set("product", productId); history.replaceState({}, "", url);
    }
  };
  itemsRoot?.addEventListener("focusin", (event) => {
    const search = (event.target as Element).closest<HTMLInputElement>("[data-quote-product-search]");
    const item = search?.closest<HTMLElement>("[data-quote-item]");
    if (!search || !item) return;
    search.dataset.editing = "true";
    search.select();
    renderProductOptions(item);
  });
  itemsRoot?.addEventListener("input", (event) => {
    const search = (event.target as Element).closest<HTMLInputElement>("[data-quote-product-search]");
    const item = search?.closest<HTMLElement>("[data-quote-item]");
    if (search && item) renderProductOptions(item, search.value);
  });
  itemsRoot?.addEventListener("focusout", (event) => {
    const search = (event.target as Element).closest<HTMLInputElement>("[data-quote-product-search]");
    const item = search?.closest<HTMLElement>("[data-quote-item]");
    if (!search || !item) return;
    window.setTimeout(() => {
      if (!item.querySelector<HTMLElement>("[data-quote-product-combobox]")?.contains(document.activeElement)) closeProductOptions(item);
    }, 0);
  });
  itemsRoot?.addEventListener("change", async (event) => {
    const input = (event.target as Element).closest<HTMLInputElement>("[data-quote-image-upload]");
    const item = input?.closest<HTMLElement>("[data-quote-item]"); const file = input?.files?.[0];
    if (!input || !item || !file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) { if (feedback) feedback.textContent = "Ảnh phải là PNG, JPG hoặc WebP dưới 10 MB."; input.value = ""; return; }
    input.disabled = true; if (feedback) feedback.textContent = "Đang tải ảnh minh họa…";
    try {
      const formData = new FormData(); formData.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData }); const uploaded = await response.json();
      if (!response.ok) throw new Error(uploaded.error || "Không thể tải ảnh.");
      if (input.dataset.uploadMode === "replace") {
        const card = input.closest<HTMLElement>("[data-quote-image-card]");
        if (card) {
          card.dataset.imageUrl = uploaded.url;
          const enabled = card.querySelector<HTMLInputElement>("[data-quote-image-enabled]");
          const preview = card.querySelector<HTMLImageElement>("[data-quote-image-preview]");
          if (enabled) { enabled.checked = true; enabled.disabled = false; }
          if (preview) { preview.dataset.previewRetry = "0"; preview.hidden = false; preview.src = new URL(uploaded.url, window.location.origin).href; }
        }
      } else {
        createImageCard(item, { url: uploaded.url, caption: file.name.replace(/\.[^.]+$/, ""), afterText: "" });
      }
      syncImageEmptyState(item); if (feedback) feedback.textContent = "Ảnh đã được thêm vào báo giá. Hãy chọn mục đặt ảnh.";
    } catch (error) { if (feedback) feedback.textContent = error instanceof Error ? error.message : "Không thể tải ảnh."; }
    finally { input.disabled = false; input.value = ""; }
  });
  itemsRoot?.addEventListener("focusout", (event) => {
    const description = (event.target as Element).closest("[data-quote-description]"); const item = description?.closest<HTMLElement>("[data-quote-item]"); if (item) refreshImageAnchors(item);
  });
  itemsRoot?.addEventListener("click", (event) => {
    const productOption = (event.target as Element).closest<HTMLButtonElement>("[data-quote-product-option]");
    if (productOption) {
      const item = productOption.closest<HTMLElement>("[data-quote-item]");
      if (item && productOption.dataset.quoteProductOption) chooseProduct(item, productOption.dataset.quoteProductOption);
      return;
    }
    const removeImage = (event.target as Element).closest<HTMLButtonElement>("[data-remove-quote-image]");
    if (removeImage) { const item = removeImage.closest<HTMLElement>("[data-quote-item]"); removeImage.closest("[data-quote-image-card]")?.remove(); if (item) syncImageEmptyState(item); return; }
    const remove = (event.target as Element).closest<HTMLButtonElement>("[data-remove-quote-item]");
    if (!remove || root.querySelectorAll("[data-quote-item]").length === 1) return;
    remove.closest("[data-quote-item]")?.remove();
    syncItems();
  });
  root.querySelector<HTMLButtonElement>("[data-add-quote-item]")?.addEventListener("click", () => {
    const source = itemsRoot?.querySelector<HTMLElement>("[data-quote-item]");
    if (!source || !itemsRoot || itemsRoot.children.length >= 20) return;
    const clone = source.cloneNode(true) as HTMLElement;
    const selectedIds = new Set(Array.from(itemsRoot.querySelectorAll<HTMLInputElement>("[data-quote-product]")).map((input) => input.value));
    const next = products.find((product) => !selectedIds.has(product.id)) || products[0];
    clone.querySelector<HTMLInputElement>('[name="quantity"]')!.value = "1";
    clone.classList.add("is-entering");
    itemsRoot.append(clone);
    if (next) hydrateItem(clone, next.id);
    syncItems();
    clone.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    clone.addEventListener("animationend", () => clone.classList.remove("is-entering"), { once: true });
    window.requestAnimationFrame(() => {
      clone.querySelector<HTMLInputElement>("[data-quote-product-search]")?.focus({ preventScroll: true });
    });
  });
  syncItems();

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
    const format = submitter?.dataset.exportFormat === "word" ? "word" : "pdf";
    const activeButton = submitter || buttons.find((entry) => entry.dataset.exportFormat === format) || buttons[0];
    const formatLabel = format === "word" ? "Word" : "PDF";
    const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() || "";
    const payload = {
      quoteNumber: value("quoteNumber"), quoteDate: value("quoteDate"), city: value("city"),
      companyTagline: value("companyTagline"), companyAddress: value("companyAddress"), website: value("website"),
      customer: { name: value("customerName"), organization: value("customerOrganization"), address: value("customerAddress"), phone: value("customerPhone"), email: value("customerEmail") },
      introduction: value("introduction"),
      items: Array.from(root.querySelectorAll<HTMLElement>("[data-quote-item]")).map((item) => {
        const itemValue = (name: string) => item.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)?.value.trim() || "";
        return {
          productId: itemValue("productId"), quantity: Number(itemValue("quantity")), unitPrice: Number(itemValue("unitPrice")), description: itemValue("description"),
          images: Array.from(item.querySelectorAll<HTMLElement>("[data-quote-image-card]")).filter((card) => card.querySelector<HTMLInputElement>("[data-quote-image-enabled]")?.checked).map((card) => ({
            url: card.dataset.imageUrl || "",
            caption: card.querySelector<HTMLInputElement>("[data-quote-image-caption]")?.value.trim() || "Ảnh minh họa",
            afterText: card.querySelector<HTMLSelectElement>("[data-quote-image-anchor]")?.value || "",
          })).filter((image) => image.url),
        };
      }),
      vatIncluded: Boolean((form.elements.namedItem("vatIncluded") as HTMLInputElement | null)?.checked),
      delivery: value("delivery"), payment: value("payment"), validity: value("validity"), additionalTerms: value("additionalTerms"),
    };
    buttons.forEach((button) => { button.disabled = true; });
    if (activeButton) {
      activeButton.classList.add("is-loading");
      activeButton.setAttribute("aria-busy", "true");
      const label = activeButton.querySelector<HTMLElement>("[data-quote-download-label]");
      if (label) label.textContent = `Đang tạo ${formatLabel}…`;
    }
    if (feedback) feedback.textContent = `Đang dàn trang và tạo ${formatLabel}…`;
    try {
      const response = await fetch(format === "word" ? "/api/admin/quote-word" : "/api/admin/quote-pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `Không thể tạo ${formatLabel}.`);
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const name = disposition.match(/filename="([^"]+)"/)?.[1] || `bao-gia.${format === "word" ? "docx" : "pdf"}`;
      const url = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = url; download.download = name; document.body.append(download); download.click(); download.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
      if (feedback) feedback.textContent = `Đã tạo ${formatLabel} báo giá.`;
    } catch (error) {
      if (feedback) feedback.textContent = error instanceof Error ? error.message : `Không thể tạo ${formatLabel}.`;
    } finally {
      buttons.forEach((button) => {
        button.disabled = false;
        button.classList.remove("is-loading");
        button.removeAttribute("aria-busy");
        const label = button.querySelector<HTMLElement>("[data-quote-download-label]");
        if (label) label.textContent = label.dataset.defaultLabel || "Tạo và tải";
      });
    }
  });
  root.querySelectorAll<HTMLElement>("[data-quote-item]").forEach((item) => {
    const productId = item.querySelector<HTMLInputElement>("[data-quote-product]")?.value; if (productId) hydrateItem(item, productId);
  });
}
};

document.addEventListener("astro:page-load", initAdminQuotePdf);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAdminQuotePdf, { once: true });
else initAdminQuotePdf();
