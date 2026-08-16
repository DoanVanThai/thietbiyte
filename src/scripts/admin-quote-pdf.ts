import { ADMIN_IMAGE_ACCEPT, validateAdminImage } from "@/lib/admin-image-upload";
import { plainTextToQuoteRichText, quoteRichTextToPlainText, type QuoteRichText, type QuoteRichTextRun } from "@/lib/quote-rich-text";

export {};

type ProductSource = { id: string; name: string; sku: string; model: string; brand: string; origin: string; manufacturingYear?: string; warranty: string; price: number; description: string; images: Array<{ url: string; caption: string; afterText: string }> };
type SavedQuoteSummary = { id: string; quoteNumber: string; quoteDate: string; customerName: string; customerOrganization: string; total: number; status: "DRAFT" | "EXPORTED" | "ARCHIVED"; version: number; updatedAt: string };
type QuotePayload = {
  quoteNumber: string;
  quoteDate: string;
  city: string;
  companyTagline: string;
  companyAddress: string;
  website: string;
  customer: { name: string; organization: string; address: string; phone: string; email: string };
  introduction: string;
  items: Array<{ productId: string; productSnapshot?: { name: string; sku: string; model: string; brand: string; origin: string; manufacturingYear?: string; warranty: string }; quantity: number; unitPrice: number; description: string; descriptionRich: QuoteRichText; images: Array<{ url: string; caption: string; afterText: string }> }>;
  vatIncluded: boolean;
  delivery: string;
  payment: string;
  validity: string;
  additionalTerms: string;
};
const initAdminQuotePdf = () => {
const root = document.querySelector<HTMLElement>("[data-quote-builder]");
if (root) {
  if (root.dataset.quoteBuilderReady === "true") return;
  root.dataset.quoteBuilderReady = "true";
  const form = root.querySelector<HTMLFormElement>("[data-quote-form]");
  const itemsRoot = root.querySelector<HTMLElement>("[data-quote-items]");
  const feedback = root.querySelector<HTMLElement>("[data-quote-feedback]");
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-quote-download]"));
  const saveButton = root.querySelector<HTMLButtonElement>("[data-save-quote]");
  const saveLabel = root.querySelector<HTMLElement>("[data-save-quote-label]");
  const savedCurrent = root.querySelector<HTMLElement>("[data-saved-quote-current]");
  const savedPanel = root.querySelector<HTMLElement>("[data-saved-quotes-panel]");
  const savedList = root.querySelector<HTMLElement>("[data-saved-quotes-list]");
  const savedEmpty = root.querySelector<HTMLElement>("[data-saved-quotes-empty]");
  const savedSearch = root.querySelector<HTMLInputElement>("[data-saved-quote-search]");
  const savedToggle = root.querySelector<HTMLButtonElement>("[data-toggle-saved-quotes]");
  const fileDialog = root.querySelector<HTMLDialogElement>("[data-quote-file-dialog]");
  const fileNameInput = fileDialog?.querySelector<HTMLInputElement>("[data-quote-file-name]");
  const fileExtension = fileDialog?.querySelector<HTMLElement>("[data-quote-file-extension]");
  const fileDialogTitle = fileDialog?.querySelector<HTMLElement>("[data-quote-file-dialog-title]");
  const fileConfirmLabel = fileDialog?.querySelector<HTMLElement>("[data-quote-file-confirm]");
  let currentSavedQuoteId = form?.dataset.savedQuoteId || "";
  let quoteDirty = true;
  let choosingFileName = false;
  let savedQuotes: SavedQuoteSummary[] = [];
  let products: ProductSource[] = [];
  try { products = JSON.parse(document.querySelector("#quote-product-data")?.textContent || "[]") as ProductSource[]; } catch { products = []; }

  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
  const productLabel = (product: ProductSource) => `${product.name} · ${product.model}`;
  const defaultFileStem = (quoteNumber: string) => {
    const number = quoteNumber.trim().replaceAll("/", "／").replace(/[\\:*?"<>]/g, "-") || "Báo giá";
    return `Thiên Lộc Group | ${number}`;
  };
  const safeFileStem = (name: string, fallback: string) => {
    const withoutExtension = name.trim().replace(/\.(?:pdf|docx)$/i, "").trim();
    return withoutExtension.replace(/[\u0000-\u001f]/g, "").replaceAll("/", "／").replace(/\\/g, "-").replace(/[\:*?"<>]/g, "-").trim() || fallback;
  };
  const requestFileName = (format: "pdf" | "word", quoteNumber: string) => {
    const extension = format === "word" ? "docx" : "pdf";
    const formatLabel = format === "word" ? "Word" : "PDF";
    const fallback = defaultFileStem(quoteNumber);
    if (!fileDialog || !fileNameInput) return Promise.resolve(fallback);
    fileDialog.returnValue = "";
    fileNameInput.value = fallback;
    if (fileExtension) fileExtension.textContent = `.${extension}`;
    if (fileDialogTitle) fileDialogTitle.textContent = `Tên file ${formatLabel}`;
    if (fileConfirmLabel) fileConfirmLabel.textContent = `OK, tải ${formatLabel}`;
    return new Promise<string | null>((resolve) => {
      fileDialog.addEventListener("close", () => {
        resolve(fileDialog.returnValue === "confirm" ? safeFileStem(fileNameInput.value, fallback) : null);
      }, { once: true });
      fileDialog.showModal();
      window.requestAnimationFrame(() => { fileNameInput.focus(); fileNameInput.select(); });
    });
  };
  fileDialog?.addEventListener("click", (event) => { if (event.target === fileDialog) fileDialog.close("cancel"); });

  const sameRunStyle = (left: QuoteRichTextRun, right: QuoteRichTextRun) => Boolean(left.bold) === Boolean(right.bold)
    && Boolean(left.underline) === Boolean(right.underline)
    && (left.color || "default") === (right.color || "default");

  const appendRun = (runs: QuoteRichTextRun[], run: QuoteRichTextRun) => {
    if (!run.text) return;
    const previous = runs.at(-1);
    if (previous && sameRunStyle(previous, run)) previous.text += run.text;
    else runs.push(run);
  };

  const readRuns = (node: Node, inherited: Omit<QuoteRichTextRun, "text"> = {}, output: QuoteRichTextRun[] = []) => {
    if (node.nodeType === Node.TEXT_NODE) {
      appendRun(output, { text: node.textContent || "", ...inherited });
      return output;
    }
    if (!(node instanceof HTMLElement)) return output;
    if (node.tagName === "BR") return output;
    const tag = node.tagName.toLocaleLowerCase("en-US");
    const colorValue = node.dataset.quoteColor || node.getAttribute("color") || node.style.color;
    const style = {
      ...inherited,
      bold: inherited.bold || tag === "b" || tag === "strong" || Number.parseInt(node.style.fontWeight || "0", 10) >= 600,
      underline: inherited.underline || tag === "u" || node.style.textDecoration.includes("underline"),
      color: inherited.color === "red" || /c62828|rgb\(198,\s*40,\s*40\)|red/i.test(colorValue) ? "red" as const : inherited.color,
    };
    node.childNodes.forEach((child) => readRuns(child, style, output));
    return output;
  };

  const editorToRichText = (editor: HTMLElement): QuoteRichText => {
    const blocks = Array.from(editor.childNodes);
    const rawParagraphs = blocks.length
      ? blocks.flatMap((node) => {
        if (node.nodeType === Node.TEXT_NODE) return [{ runs: readRuns(node) }];
        if (!(node instanceof HTMLElement)) return [];
        if (["DIV", "P"].includes(node.tagName)) return [{ runs: readRuns(node) }];
        return [{ runs: readRuns(node) }];
      })
      : [{ runs: [] }];
    const paragraphs = rawParagraphs.flatMap((paragraph) => {
      const lines: Array<{ runs: QuoteRichTextRun[] }> = [{ runs: [] }];
      paragraph.runs.forEach((run) => {
        run.text.replace(/\r\n?/g, "\n").split("\n").forEach((text, index, values) => {
          appendRun(lines.at(-1)!.runs, { ...run, text });
          if (index < values.length - 1) lines.push({ runs: [] });
        });
      });
      return lines;
    });
    return { version: 1, paragraphs };
  };

  const setEditorRichText = (editor: HTMLElement, richText: QuoteRichText) => {
    editor.replaceChildren();
    richText.paragraphs.forEach((paragraph) => {
      const line = document.createElement("div");
      if (!paragraph.runs.length) line.append(document.createElement("br"));
      paragraph.runs.forEach((run) => {
        const span = document.createElement("span");
        span.textContent = run.text;
        if (run.bold) span.style.fontWeight = "700";
        if (run.underline) span.style.textDecoration = "underline";
        if (run.color === "red") { span.dataset.quoteColor = "red"; span.style.color = "#c62828"; }
        line.append(span);
      });
      editor.append(line);
    });
  };

  const syncDescription = (item: HTMLElement) => {
    const editor = item.querySelector<HTMLElement>("[data-quote-description-editor]");
    const textarea = item.querySelector<HTMLTextAreaElement>("[data-quote-description]");
    if (!editor || !textarea) return;
    textarea.value = quoteRichTextToPlainText(editorToRichText(editor));
  };

  const setItemDescription = (item: HTMLElement, description: string, richText?: QuoteRichText) => {
    const editor = item.querySelector<HTMLElement>("[data-quote-description-editor]");
    const textarea = item.querySelector<HTMLTextAreaElement>("[data-quote-description]");
    if (!editor || !textarea) return;
    const value = richText?.paragraphs?.length ? richText : plainTextToQuoteRichText(description, true);
    setEditorRichText(editor, value);
    textarea.value = quoteRichTextToPlainText(value, description);
  };

  const descriptionLines = (item: HTMLElement) => {
    syncDescription(item);
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
    const anchorLabel = document.createElement("label"); anchorLabel.className = "quote-image-anchor-field"; const anchorTitle = document.createElement("span"); anchorTitle.textContent = "Đặt ảnh sau mục";
    const anchor = document.createElement("select"); anchor.className = "quote-image-anchor-select"; anchor.dataset.quoteImageAnchor = ""; anchorLabel.append(anchorTitle, anchor); fields.append(captionLabel, anchorLabel);
    const actions = document.createElement("div"); actions.className = "quote-image-actions";
    const replace = document.createElement("label"); replace.className = "quote-image-file-action"; replace.title = "Đổi ảnh"; replace.innerHTML = `<input type="file" accept="${ADMIN_IMAGE_ACCEPT}" data-quote-image-upload data-upload-mode="replace"><i class="ph ph-arrows-clockwise" aria-hidden="true"></i><span>Đổi</span>`;
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
    const add = document.createElement("label"); add.className = "button button-outline button-sm quote-image-add"; add.innerHTML = `<input type="file" accept="${ADMIN_IMAGE_ACCEPT}" data-quote-image-upload data-upload-mode="add"><i class="ph ph-plus" aria-hidden="true"></i>Thêm ảnh`;
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

  const hydrateItem = (item: HTMLElement, productId: string, saved?: QuotePayload["items"][number]) => {
    const product = products.find((entry) => entry.id === productId);
    if (!product) return;
    const productInput = item.querySelector<HTMLInputElement>("[data-quote-product]");
    const productSearch = item.querySelector<HTMLInputElement>("[data-quote-product-search]");
    const price = item.querySelector<HTMLInputElement>('[name="unitPrice"]');
    const quantity = item.querySelector<HTMLInputElement>('[name="quantity"]');
    if (productInput) productInput.value = product.id;
    if (productSearch) {
      productSearch.value = productLabel(product);
      delete productSearch.dataset.editing;
    }
    setItemDescription(item, saved?.description || product.description, saved?.descriptionRich);
    if (price) price.value = String(saved?.unitPrice ?? product.price ?? 0);
    if (quantity) quantity.value = String(saved?.quantity ?? 1);
    renderImageManager(item, saved?.images || product.images);
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
    quoteDirty = true;
    const search = (event.target as Element).closest<HTMLInputElement>("[data-quote-product-search]");
    const item = search?.closest<HTMLElement>("[data-quote-item]");
    if (search && item) renderProductOptions(item, search.value);
    const editor = (event.target as Element).closest<HTMLElement>("[data-quote-description-editor]");
    const editorItem = editor?.closest<HTMLElement>("[data-quote-item]");
    if (editorItem) syncDescription(editorItem);
  });
  itemsRoot?.addEventListener("paste", (event) => {
    const editor = (event.target as Element).closest<HTMLElement>("[data-quote-description-editor]");
    if (!editor) return;
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData?.getData("text/plain") || "");
  });
  itemsRoot?.addEventListener("mousedown", (event) => {
    if ((event.target as Element).closest("[data-rich-command]")) event.preventDefault();
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
    const validationError = validateAdminImage(file);
    if (validationError) { if (feedback) feedback.textContent = validationError; input.value = ""; return; }
    const uploadAction = input.closest<HTMLElement>("label");
    input.disabled = true; uploadAction?.classList.add("is-uploading"); uploadAction?.setAttribute("aria-busy", "true"); if (feedback) feedback.textContent = `Đang tải ${file.name}…`;
    try {
      const formData = new FormData(); formData.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const raw = await response.text();
      let uploaded: { url?: string; error?: string } = {};
      try { uploaded = JSON.parse(raw) as typeof uploaded; } catch { uploaded = {}; }
      if (!response.ok || !uploaded.url) throw new Error(uploaded.error || raw || "Không thể tải ảnh.");
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
    finally { input.disabled = false; input.value = ""; uploadAction?.classList.remove("is-uploading"); uploadAction?.removeAttribute("aria-busy"); }
  });
  itemsRoot?.addEventListener("focusout", (event) => {
    const description = (event.target as Element).closest("[data-quote-description-editor]"); const item = description?.closest<HTMLElement>("[data-quote-item]"); if (item) refreshImageAnchors(item);
  });
  itemsRoot?.addEventListener("click", (event) => {
    const richCommand = (event.target as Element).closest<HTMLButtonElement>("[data-rich-command]");
    if (richCommand) {
      const item = richCommand.closest<HTMLElement>("[data-quote-item]");
      const editor = item?.querySelector<HTMLElement>("[data-quote-description-editor]");
      if (!item || !editor) return;
      editor.focus({ preventScroll: true });
      const command = richCommand.dataset.richCommand;
      if (command === "bold") document.execCommand("bold");
      if (command === "underline") document.execCommand("underline");
      if (command === "red") document.execCommand("foreColor", false, "#c62828");
      if (command === "clear") { document.execCommand("removeFormat"); document.execCommand("foreColor", false, "#111827"); }
      syncDescription(item);
      quoteDirty = true;
      return;
    }
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

  const value = (name: string) => (form?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() || "";
  const buildPayload = (): QuotePayload => ({
    quoteNumber: value("quoteNumber") || (form?.elements.namedItem("quoteNumber") as HTMLInputElement | null)?.dataset.defaultQuoteNumber || "", quoteDate: value("quoteDate"), city: value("city"),
    companyTagline: value("companyTagline"), companyAddress: value("companyAddress"), website: value("website"),
    customer: { name: value("customerName"), organization: value("customerOrganization"), address: value("customerAddress"), phone: value("customerPhone"), email: value("customerEmail") },
    introduction: value("introduction"),
    items: Array.from(root.querySelectorAll<HTMLElement>("[data-quote-item]")).map((item) => {
      syncDescription(item);
      const itemValue = (name: string) => item.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${name}"]`)?.value.trim() || "";
      const editor = item.querySelector<HTMLElement>("[data-quote-description-editor]");
      const source = products.find((product) => product.id === itemValue("productId"));
      return {
        productId: itemValue("productId"), quantity: Number(itemValue("quantity")), unitPrice: Number(itemValue("unitPrice")), description: itemValue("description"),
        productSnapshot: source ? { name: source.name, sku: source.sku, model: source.model, brand: source.brand, origin: source.origin, manufacturingYear: source.manufacturingYear, warranty: source.warranty } : undefined,
        descriptionRich: editor ? editorToRichText(editor) : plainTextToQuoteRichText(itemValue("description"), true),
        images: Array.from(item.querySelectorAll<HTMLElement>("[data-quote-image-card]")).filter((card) => card.querySelector<HTMLInputElement>("[data-quote-image-enabled]")?.checked).map((card) => ({
          url: card.dataset.imageUrl || "",
          caption: card.querySelector<HTMLInputElement>("[data-quote-image-caption]")?.value.trim() || "Ảnh minh họa",
          afterText: card.querySelector<HTMLSelectElement>("[data-quote-image-anchor]")?.value || "",
        })).filter((image) => image.url),
      };
    }),
    vatIncluded: Boolean((form?.elements.namedItem("vatIncluded") as HTMLInputElement | null)?.checked),
    delivery: value("delivery"), payment: value("payment"), validity: value("validity"), additionalTerms: value("additionalTerms"),
  });

  const descriptionsValid = () => {
    const invalid = Array.from(root.querySelectorAll<HTMLElement>("[data-quote-item]")).find((item) => {
      syncDescription(item);
      return (item.querySelector<HTMLTextAreaElement>("[data-quote-description]")?.value.trim().length || 0) < 10;
    });
    root.querySelectorAll<HTMLElement>("[data-quote-description-editor]").forEach((editor) => editor.removeAttribute("aria-invalid"));
    const editor = invalid?.querySelector<HTMLElement>("[data-quote-description-editor]");
    if (!editor) return true;
    editor.setAttribute("aria-invalid", "true");
    editor.focus();
    if (feedback) feedback.textContent = "Mô tả mỗi sản phẩm cần ít nhất 10 ký tự.";
    return false;
  };

  const updateSavedState = (quote: SavedQuoteSummary) => {
    currentSavedQuoteId = quote.id;
    if (form) form.dataset.savedQuoteId = quote.id;
    if (saveLabel) saveLabel.textContent = "Cập nhật bản báo giá";
    if (savedCurrent) {
      savedCurrent.hidden = false;
      savedCurrent.textContent = `Đang sửa ${quote.quoteNumber} · phiên bản ${quote.version}`;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("quote", quote.id);
    history.replaceState({}, "", url);
  };

  const saveCurrentQuote = async (announce = true) => {
    if (!descriptionsValid() || !form?.reportValidity()) return null;
    if (!quoteDirty && currentSavedQuoteId) return currentSavedQuoteId;
    const payload = buildPayload();
    if (saveButton) { saveButton.disabled = true; saveButton.setAttribute("aria-busy", "true"); }
    if (saveLabel) saveLabel.textContent = currentSavedQuoteId ? "Đang cập nhật…" : "Đang lưu…";
    try {
      const response = await fetch(currentSavedQuoteId ? `/api/admin/sales-quotes/${encodeURIComponent(currentSavedQuoteId)}` : "/api/admin/sales-quotes", {
        method: currentSavedQuoteId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { quote?: SavedQuoteSummary; message?: string; error?: string };
      if (!response.ok || !result.quote) throw new Error(result.error || "Không thể lưu bản báo giá.");
      updateSavedState(result.quote);
      quoteDirty = false;
      if (announce && feedback) feedback.textContent = result.message || "Đã lưu bản báo giá.";
      await loadSavedQuotes();
      return result.quote.id;
    } catch (error) {
      if (feedback) feedback.textContent = error instanceof Error ? error.message : "Không thể lưu bản báo giá.";
      return null;
    } finally {
      if (saveButton) { saveButton.disabled = false; saveButton.removeAttribute("aria-busy"); }
      if (saveLabel) saveLabel.textContent = currentSavedQuoteId ? "Cập nhật bản báo giá" : "Lưu bản báo giá";
    }
  };

  const setField = (name: string, fieldValue: string) => {
    const field = form?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
    if (field) field.value = fieldValue;
  };

  const applySavedPayload = (payload: QuotePayload) => {
    if (!form || !itemsRoot || !payload.items.length) return;
    setField("quoteNumber", payload.quoteNumber); setField("quoteDate", payload.quoteDate); setField("city", payload.city);
    setField("companyTagline", payload.companyTagline); setField("companyAddress", payload.companyAddress); setField("website", payload.website);
    setField("customerName", payload.customer.name); setField("customerOrganization", payload.customer.organization); setField("customerAddress", payload.customer.address);
    setField("customerPhone", payload.customer.phone); setField("customerEmail", payload.customer.email); setField("introduction", payload.introduction);
    setField("delivery", payload.delivery); setField("payment", payload.payment); setField("validity", payload.validity); setField("additionalTerms", payload.additionalTerms);
    const vat = form.elements.namedItem("vatIncluded") as HTMLInputElement | null; if (vat) vat.checked = payload.vatIncluded;

    const template = itemsRoot.querySelector<HTMLElement>("[data-quote-item]")?.cloneNode(true) as HTMLElement | undefined;
    if (!template) return;
    itemsRoot.replaceChildren();
    payload.items.forEach((savedItem) => {
      const item = template.cloneNode(true) as HTMLElement;
      itemsRoot.append(item);
      if (products.some((product) => product.id === savedItem.productId)) hydrateItem(item, savedItem.productId, savedItem);
      else {
        const productInput = item.querySelector<HTMLInputElement>("[data-quote-product]");
        const productSearch = item.querySelector<HTMLInputElement>("[data-quote-product-search]");
        if (productInput) productInput.value = savedItem.productId;
        if (productSearch) productSearch.value = savedItem.productSnapshot
          ? `${savedItem.productSnapshot.name} · ${savedItem.productSnapshot.model || "Sản phẩm đã lưu"}`
          : "Sản phẩm không còn trong danh mục";
        setItemDescription(item, savedItem.description, savedItem.descriptionRich);
        const quantity = item.querySelector<HTMLInputElement>('[name="quantity"]'); if (quantity) quantity.value = String(savedItem.quantity);
        const price = item.querySelector<HTMLInputElement>('[name="unitPrice"]'); if (price) price.value = String(savedItem.unitPrice);
        renderImageManager(item, savedItem.images);
      }
    });
    syncItems();
    quoteDirty = false;
  };

  const renderSavedQuotes = () => {
    if (!savedList || !savedEmpty) return;
    const query = normalize(savedSearch?.value || "");
    const visible = savedQuotes.filter((quote) => !query || normalize(`${quote.quoteNumber} ${quote.customerName} ${quote.customerOrganization}`).includes(query));
    savedList.replaceChildren();
    visible.forEach((quote) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "quote-saved-item"; button.dataset.savedQuoteId = quote.id;
      const copy = document.createElement("span"); const number = document.createElement("strong"); const customer = document.createElement("small");
      number.textContent = quote.quoteNumber; customer.textContent = quote.customerOrganization || quote.customerName; copy.append(number, customer);
      const meta = document.createElement("span"); meta.textContent = `v${quote.version} · ${new Intl.DateTimeFormat("vi-VN").format(new Date(quote.updatedAt))}`;
      button.append(copy, meta); savedList.append(button);
    });
    savedEmpty.hidden = visible.length > 0;
    savedEmpty.textContent = savedQuotes.length ? "Không tìm thấy báo giá phù hợp." : "Chưa có bản báo giá đã lưu.";
  };

  async function loadSavedQuotes() {
    try {
      const response = await fetch("/api/admin/sales-quotes?limit=100", { cache: "no-store" });
      const result = await response.json() as { quotes?: SavedQuoteSummary[] };
      savedQuotes = response.ok && Array.isArray(result.quotes) ? result.quotes : [];
    } catch { savedQuotes = []; }
    renderSavedQuotes();
  }

  const openSavedQuote = async (id: string) => {
    if (feedback) feedback.textContent = "Đang mở bản báo giá…";
    try {
      const response = await fetch(`/api/admin/sales-quotes/${encodeURIComponent(id)}`, { cache: "no-store" });
      const result = await response.json() as { quote?: SavedQuoteSummary & { payload: QuotePayload }; error?: string };
      if (!response.ok || !result.quote) throw new Error(result.error || "Không thể mở bản báo giá.");
      applySavedPayload(result.quote.payload);
      updateSavedState(result.quote);
      quoteDirty = false;
      if (savedPanel) savedPanel.hidden = true;
      savedToggle?.setAttribute("aria-expanded", "false");
      if (feedback) feedback.textContent = `Đã mở ${result.quote.quoteNumber}, phiên bản ${result.quote.version}.`;
      form?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    } catch (error) {
      if (feedback) feedback.textContent = error instanceof Error ? error.message : "Không thể mở bản báo giá.";
    }
  };

  form?.addEventListener("input", () => { quoteDirty = true; });
  form?.addEventListener("change", () => { quoteDirty = true; });
  saveButton?.addEventListener("click", () => { void saveCurrentQuote(); });
  savedToggle?.addEventListener("click", () => {
    if (!savedPanel) return;
    savedPanel.hidden = !savedPanel.hidden;
    savedToggle.setAttribute("aria-expanded", String(!savedPanel.hidden));
    if (!savedPanel.hidden) { void loadSavedQuotes(); window.requestAnimationFrame(() => savedSearch?.focus()); }
  });
  root.querySelector("[data-close-saved-quotes]")?.addEventListener("click", () => { if (savedPanel) savedPanel.hidden = true; savedToggle?.setAttribute("aria-expanded", "false"); });
  savedSearch?.addEventListener("input", renderSavedQuotes);
  savedList?.addEventListener("click", (event) => { const button = (event.target as Element).closest<HTMLButtonElement>("[data-saved-quote-id]"); if (button?.dataset.savedQuoteId) void openSavedQuote(button.dataset.savedQuoteId); });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (choosingFileName || !descriptionsValid() || !form.reportValidity()) return;
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
    const format = submitter?.dataset.exportFormat === "word" ? "word" : "pdf";
    const activeButton = submitter || buttons.find((entry) => entry.dataset.exportFormat === format) || buttons[0];
    const formatLabel = format === "word" ? "Word" : "PDF";
    const extension = format === "word" ? "docx" : "pdf";
    const initialPayload = buildPayload();
    choosingFileName = true;
    const chosenFileName = await requestFileName(format, initialPayload.quoteNumber);
    choosingFileName = false;
    if (!chosenFileName) return;
    const savedId = await saveCurrentQuote(false);
    if (!savedId) return;
    const payload = buildPayload();
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
      const url = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = url; download.download = `${chosenFileName}.${extension}`; document.body.append(download); download.click(); download.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
      await fetch(`/api/admin/sales-quotes/${encodeURIComponent(savedId)}`, { method: "PATCH" }).catch(() => undefined);
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
  const requestedQuoteId = new URL(window.location.href).searchParams.get("quote");
  if (requestedQuoteId) void openSavedQuote(requestedQuoteId);
  void loadSavedQuotes();
}
};

document.addEventListener("astro:page-load", initAdminQuotePdf);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAdminQuotePdf, { once: true });
else initAdminQuotePdf();
