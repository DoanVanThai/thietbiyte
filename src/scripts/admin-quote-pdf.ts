import { ADMIN_IMAGE_ACCEPT, validateAdminImage } from "@/lib/admin-image-upload";
import { plainTextToQuoteRichText, quoteRichTextToPlainText, type QuoteRichText, type QuoteRichTextRun } from "@/lib/quote-rich-text";

export {};

type ProductSource = { id: string; name: string; sku: string; model: string; brand: string; origin: string; manufacturingYear?: string; warranty: string; price: number; description: string; images: Array<{ url: string; caption: string; afterText: string }> };
type SavedQuoteSummary = { id: string; quoteNumber: string; quoteDate: string; customerName: string; customerOrganization: string; productNames: string[]; total: number; status: "DRAFT" | "EXPORTED" | "ARCHIVED"; version: number; updatedAt: string };
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
  const savedPanel = root.querySelector<HTMLDialogElement>("[data-saved-quotes-panel]");
  const savedList = root.querySelector<HTMLElement>("[data-saved-quotes-list]");
  const savedEmpty = root.querySelector<HTMLElement>("[data-saved-quotes-empty]");
  const savedSearch = root.querySelector<HTMLInputElement>("[data-saved-quote-search]");
  const savedToggle = root.querySelector<HTMLButtonElement>("[data-toggle-saved-quotes]");
  const savedPagination = root.querySelector<HTMLElement>("[data-saved-quotes-pagination]");
  const savedPrevious = root.querySelector<HTMLButtonElement>("[data-saved-quotes-previous]");
  const savedNext = root.querySelector<HTMLButtonElement>("[data-saved-quotes-next]");
  const savedPageStatus = root.querySelector<HTMLElement>("[data-saved-quotes-page-status]");
  const fileDialog = root.querySelector<HTMLDialogElement>("[data-quote-file-dialog]");
  const fileNameInput = fileDialog?.querySelector<HTMLInputElement>("[data-quote-file-name]");
  const fileExtension = fileDialog?.querySelector<HTMLElement>("[data-quote-file-extension]");
  const fileDialogTitle = fileDialog?.querySelector<HTMLElement>("[data-quote-file-dialog-title]");
  const fileConfirmLabel = fileDialog?.querySelector<HTMLElement>("[data-quote-file-confirm]");
  const saveState = root.querySelector<HTMLElement>("[data-quote-save-state]");
  const productPicker = root.querySelector<HTMLDialogElement>("[data-product-picker]");
  const productPickerSearch = root.querySelector<HTMLInputElement>("[data-product-picker-search]");
  const productPickerList = root.querySelector<HTMLElement>("[data-product-picker-list]");
  const productPickerEmpty = root.querySelector<HTMLElement>("[data-product-picker-empty]");
  const productPickerCount = root.querySelector<HTMLElement>("[data-product-picker-count]");
  const productPickerConfirm = root.querySelector<HTMLButtonElement>("[data-confirm-product-picker]");
  const previewDialog = root.querySelector<HTMLDialogElement>("[data-preview-dialog]");
  const previewFrame = root.querySelector<HTMLIFrameElement>("[data-preview-frame]");
  const previewLoading = root.querySelector<HTMLElement>("[data-preview-loading]");
  const mobileSummary = root.querySelector<HTMLDialogElement>("[data-mobile-summary]");
  const mobileSummaryContent = root.querySelector<HTMLElement>("[data-mobile-summary-content]");
  const toast = root.querySelector<HTMLElement>("[data-quote-toast]");
  const initialItem = itemsRoot?.querySelector<HTMLElement>("[data-quote-item]");
  const itemTemplate = initialItem?.cloneNode(true) as HTMLElement | undefined;
  let currentSavedQuoteId = form?.dataset.savedQuoteId || "";
  let quoteDirty = true;
  let choosingFileName = false;
  let previewObjectUrl = "";
  let toastTimer = 0;
  const pickerSelection = new Set<string>();
  let savedQuotes: SavedQuoteSummary[] = [];
  let savedQuotesPage = 1;
  const savedQuotesPageSize = 9;
  let products: ProductSource[] = [];
  try { products = JSON.parse(document.querySelector("#quote-product-data")?.textContent || "[]") as ProductSource[]; } catch { products = []; }

  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
  const productLabel = (product: ProductSource) => `${product.name} · ${product.model}`;
  const formatMoney = (value: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0) + "đ";
  const showToast = (message: string, error = false) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.toggle("is-error", error);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3_200);
  };
  const setSaveState = (state: "dirty" | "saving" | "saved" | "error", copy?: string) => {
    if (!saveState) return;
    saveState.className = `quote-save-state is-${state}`;
    const label = saveState.querySelector("span");
    if (label) label.textContent = copy || ({ dirty: "Có thay đổi chưa lưu", saving: "Đang lưu…", saved: "Đã lưu", error: "Không thể lưu" }[state]);
  };
  const markDirty = () => { quoteDirty = true; setSaveState("dirty"); };
  const savedQuoteTitle = (quote: SavedQuoteSummary) => {
    const [primaryProduct, ...otherProducts] = quote.productNames;
    if (!primaryProduct) return `Báo giá ${quote.quoteNumber}`;
    return `Báo giá ${primaryProduct}${otherProducts.length ? ` + ${otherProducts.length} sản phẩm` : ""}`;
  };
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
    const blocks = Array.from(editor.childNodes).filter((node) => !(node instanceof HTMLElement) || node.dataset.quoteExcluded !== "true");
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
    renderConfigOutline(item);
  };

  const descriptionHeadings = (item: HTMLElement) => {
    const editor = item.querySelector<HTMLElement>("[data-quote-description-editor]");
    if (!editor) return [];
    const blocks = Array.from(editor.children) as HTMLElement[];
    return blocks.flatMap((block, index) => {
      const text = block.textContent?.trim() || "";
      const uppercase = text.length > 2 && text.length < 90 && text === text.toLocaleUpperCase("vi") && !text.startsWith("-");
      const commonHeading = /^(Mô tả|Tính năng nổi bật|Cấu hình cung cấp|Thông số kỹ thuật|Bảo hành)/iu.test(text);
      return index === 0 || uppercase || commonHeading ? [{ index, text }] : [];
    }).slice(0, 12);
  };

  const renderConfigOutline = (item: HTMLElement) => {
    const outline = item.querySelector<HTMLElement>("[data-config-outline]");
    const editor = item.querySelector<HTMLElement>("[data-quote-description-editor]");
    if (!outline || !editor) return;
    outline.replaceChildren();
    const headings = descriptionHeadings(item);
    headings.forEach(({ index, text }, headingIndex) => {
      const label = document.createElement("label");
      const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = editor.children.item(index)?.getAttribute("data-quote-excluded") !== "true"; checkbox.dataset.configInclude = String(headingIndex); checkbox.setAttribute("aria-label", `Bao gồm ${text} trong báo giá`);
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.configTarget = String(index);
      button.textContent = headingIndex === 0 ? "Thông tin sản phẩm" : text.replace(/[:：].*$/, "").toLocaleLowerCase("vi").replace(/^./u, (letter) => letter.toLocaleUpperCase("vi"));
      label.append(checkbox, button); outline.append(label);
    });
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
    const moveUp = document.createElement("button"); moveUp.type = "button"; moveUp.dataset.moveQuoteImage = "up"; moveUp.setAttribute("aria-label", "Đưa ảnh lên"); moveUp.innerHTML = '<i class="ph ph-arrow-up" aria-hidden="true"></i>';
    const moveDown = document.createElement("button"); moveDown.type = "button"; moveDown.dataset.moveQuoteImage = "down"; moveDown.setAttribute("aria-label", "Đưa ảnh xuống"); moveDown.innerHTML = '<i class="ph ph-arrow-down" aria-hidden="true"></i>';
    const remove = document.createElement("button"); remove.type = "button"; remove.dataset.removeQuoteImage = ""; remove.innerHTML = '<i class="ph ph-trash" aria-hidden="true"></i><span>Xóa</span>';
    actions.append(replace, moveUp, moveDown, remove); card.append(toggle, preview, fields, actions);
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
    const snapshot = saved?.productSnapshot || { name: product.name, sku: product.sku, model: product.model, brand: product.brand, origin: product.origin, manufacturingYear: product.manufacturingYear, warranty: product.warranty };
    item.dataset.productSnapshot = JSON.stringify(snapshot);
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
    const name = item.querySelector<HTMLElement>("[data-quote-item-name]");
    const meta = item.querySelector<HTMLElement>("[data-quote-item-meta]");
    if (name) name.textContent = snapshot.name;
    if (meta) meta.textContent = [snapshot.brand, snapshot.model].filter(Boolean).join(" · ");
    item.querySelectorAll<HTMLElement>("[data-drawer-product-name]").forEach((copy) => { copy.textContent = [snapshot.name, snapshot.model].filter(Boolean).join(" · "); });
    item.querySelector<HTMLDialogElement>("[data-config-drawer]")?.setAttribute("aria-label", `Mô tả và cấu hình ${snapshot.name}`);
    item.querySelector<HTMLDialogElement>("[data-image-drawer]")?.setAttribute("aria-label", `Ảnh báo giá ${snapshot.name}`);
    syncItemSummary(item);
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
  const syncItemSummary = (item: HTMLElement) => {
    syncDescription(item);
    const quantity = Number(item.querySelector<HTMLInputElement>('[name="quantity"]')?.value || 0);
    const price = Number(item.querySelector<HTMLInputElement>('[name="unitPrice"]')?.value || 0);
    const total = item.querySelector<HTMLElement>("[data-quote-line-total]");
    if (total) total.textContent = formatMoney(quantity * price);
    const description = item.querySelector<HTMLTextAreaElement>("[data-quote-description]")?.value || "";
    const groups = descriptionHeadings(item).length;
    const configSummary = item.querySelector<HTMLElement>("[data-quote-config-summary]");
    if (configSummary) configSummary.textContent = `${groups || 1} nhóm · ${new Intl.NumberFormat("vi-VN").format(description.length)} ký tự`;
    const images = item.querySelectorAll<HTMLInputElement>("[data-quote-image-enabled]:checked").length;
    const imageSummary = item.querySelector<HTMLElement>("[data-quote-image-summary]");
    if (imageSummary) imageSummary.textContent = images ? `${images} ảnh báo giá` : "Chưa chọn ảnh";
    imageSummary?.classList.toggle("needs-attention", images === 0);
  };

  const syncQuoteUI = () => {
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-quote-item]"));
    items.forEach(syncItemSummary);
    const subtotal = items.reduce((sum, item) => sum + Number(item.querySelector<HTMLInputElement>('[name="quantity"]')?.value || 0) * Number(item.querySelector<HTMLInputElement>('[name="unitPrice"]')?.value || 0), 0);
    root.querySelectorAll<HTMLElement>("[data-quote-subtotal], [data-quote-total]").forEach((node) => { node.textContent = formatMoney(subtotal); });
    root.querySelectorAll<HTMLElement>("[data-quote-vat]").forEach((node) => { node.textContent = (form?.elements.namedItem("vatIncluded") as HTMLInputElement | null)?.checked ? "Đã bao gồm" : "Chưa bao gồm"; });
    const customer = (form?.elements.namedItem("customerName") as HTMLInputElement | null)?.value.trim() || "";
    const organization = (form?.elements.namedItem("customerOrganization") as HTMLInputElement | null)?.value.trim() || "";
    const customerHeader = root.querySelector<HTMLElement>("[data-quote-customer-header]");
    if (customerHeader) customerHeader.textContent = customer || organization || "Chưa có khách hàng";
    const quoteTitle = root.querySelector<HTMLElement>("[data-quote-number-title]");
    const quoteNumberValue = (form?.elements.namedItem("quoteNumber") as HTMLInputElement | null)?.value.trim();
    if (quoteTitle) quoteTitle.textContent = quoteNumberValue || "Báo giá mới";
    const priceReady = items.length > 0 && items.every((item) => Number(item.querySelector<HTMLInputElement>('[name="unitPrice"]')?.value || 0) > 0);
    const termsReady = ["delivery", "payment", "validity"].every((name) => Boolean((form?.elements.namedItem(name) as HTMLInputElement | null)?.value.trim()));
    const readiness: Record<string, boolean> = { customer: Boolean(customer), product: items.length > 0, price: priceReady, terms: termsReady };
    root.querySelectorAll<HTMLElement>("[data-check]").forEach((node) => {
      const complete = readiness[node.dataset.check || ""];
      node.classList.toggle("is-complete", complete);
      node.classList.toggle("needs-attention", !complete);
      const icon = node.querySelector<HTMLElement>("i");
      if (icon) icon.className = complete ? "ph ph-check-circle" : "ph ph-circle";
    });
    const infoSummary = root.querySelector<HTMLElement>('[data-section-name="information"] [data-section-summary]');
    const quoteDateValue = (form?.elements.namedItem("quoteDate") as HTMLInputElement | null)?.value || "";
    const city = (form?.elements.namedItem("city") as HTMLInputElement | null)?.value.trim() || "";
    if (infoSummary) infoSummary.textContent = [quoteNumberValue, quoteDateValue ? quoteDateValue.split("-").reverse().join("/") : "", city].filter(Boolean).join(" · ");
    const customerSummary = root.querySelector<HTMLElement>('[data-section-name="customer"] [data-section-summary]');
    const phone = (form?.elements.namedItem("customerPhone") as HTMLInputElement | null)?.value.trim() || "";
    if (customerSummary) customerSummary.textContent = customer ? [customer, organization, phone].filter(Boolean).join(" · ") : "Thêm người liên hệ và đơn vị nhận báo giá";
    const customerState = root.querySelector<HTMLElement>('[data-section-name="customer"] [data-section-state]');
    customerState?.classList.toggle("is-complete", Boolean(customer));
    customerState?.classList.toggle("needs-attention", !customer);
    if (customerState) customerState.innerHTML = customer ? '<i class="ph ph-check" aria-hidden="true"></i>' : "·";
    const productsState = root.querySelector<HTMLElement>('[data-section-link="quote-products"] [data-nav-state]');
    if (productsState) productsState.textContent = items.length && priceReady ? "✓" : "!";
  };

  const syncItems = () => {
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-quote-item]"));
    items.forEach((item, index) => {
      const number = item.querySelector<HTMLElement>("[data-quote-item-number]");
      if (number) number.textContent = String(index + 1);
      const up = item.querySelector<HTMLButtonElement>('[data-move-quote-item="up"]');
      const down = item.querySelector<HTMLButtonElement>('[data-move-quote-item="down"]');
      if (up) up.disabled = index === 0;
      if (down) down.disabled = index === items.length - 1;
    });
    root.querySelectorAll<HTMLElement>("[data-quote-product-summary], [data-side-product-count], [data-products-heading-count]").forEach((summary) => { summary.textContent = `${items.length} sản phẩm`; });
    root.querySelectorAll<HTMLElement>("[data-quote-item-count]").forEach((count) => { count.textContent = String(items.length); });
    const empty = root.querySelector<HTMLElement>("[data-products-empty]");
    if (empty) empty.hidden = items.length > 0;
    if (itemsRoot) itemsRoot.hidden = items.length === 0;
    syncQuoteUI();
  };
  const chooseProduct = (item: HTMLElement, productId: string) => {
    hydrateItem(item, productId);
    closeProductOptions(item);
    if (item === itemsRoot?.firstElementChild) {
      const url = new URL(window.location.href); url.searchParams.set("product", productId); history.replaceState({}, "", url);
    }
  };

  const createQuoteItem = (productId: string, saved?: QuotePayload["items"][number]) => {
    if (!itemTemplate || !itemsRoot || itemsRoot.children.length >= 20) return null;
    const item = itemTemplate.cloneNode(true) as HTMLElement;
    item.querySelectorAll<HTMLDialogElement>("dialog").forEach((dialog) => dialog.removeAttribute("open"));
    item.querySelectorAll<HTMLDetailsElement>("details").forEach((details) => { details.open = false; });
    itemsRoot.append(item);
    hydrateItem(item, productId, saved);
    item.classList.add("is-entering");
    item.addEventListener("animationend", () => item.classList.remove("is-entering"), { once: true });
    return item;
  };

  const renderProductPicker = () => {
    if (!productPickerList || !productPickerEmpty) return;
    const query = normalize(productPickerSearch?.value || "");
    const visible = products.filter((product) => !query || normalize(`${product.name} ${product.model} ${product.sku} ${product.brand}`).includes(query));
    productPickerList.replaceChildren();
    visible.forEach((product) => {
      const label = document.createElement("label"); label.className = "quote-picker-option";
      const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.value = product.id; checkbox.checked = pickerSelection.has(product.id); checkbox.dataset.productPickerOption = "";
      const copy = document.createElement("span"); const name = document.createElement("strong"); const meta = document.createElement("small");
      name.textContent = product.name; meta.textContent = [product.brand, product.model, product.sku].filter(Boolean).join(" · "); copy.append(name, meta);
      const price = document.createElement("b"); price.textContent = product.price > 0 ? formatMoney(product.price) : "Chưa có đơn giá"; price.classList.toggle("needs-attention", product.price <= 0);
      label.append(checkbox, copy, price); productPickerList.append(label);
    });
    productPickerEmpty.hidden = visible.length > 0;
    if (productPickerCount) productPickerCount.textContent = String(pickerSelection.size);
    if (productPickerConfirm) productPickerConfirm.disabled = pickerSelection.size === 0;
  };

  const openProductPicker = () => {
    if (!productPicker) return;
    pickerSelection.clear();
    if (productPickerSearch) productPickerSearch.value = "";
    renderProductPicker();
    productPicker.showModal();
    window.requestAnimationFrame(() => productPickerSearch?.focus());
  };

  const snapshotItem = (item: HTMLElement): QuotePayload["items"][number] => {
    syncDescription(item);
    const productId = item.querySelector<HTMLInputElement>("[data-quote-product]")?.value || "";
    const product = products.find((entry) => entry.id === productId);
    let storedSnapshot: QuotePayload["items"][number]["productSnapshot"];
    try { storedSnapshot = JSON.parse(item.dataset.productSnapshot || "null") as QuotePayload["items"][number]["productSnapshot"]; } catch { storedSnapshot = undefined; }
    const editor = item.querySelector<HTMLElement>("[data-quote-description-editor]");
    const description = item.querySelector<HTMLTextAreaElement>("[data-quote-description]")?.value || "";
    return {
      productId,
      productSnapshot: storedSnapshot || (product ? { name: product.name, sku: product.sku, model: product.model, brand: product.brand, origin: product.origin, manufacturingYear: product.manufacturingYear, warranty: product.warranty } : undefined),
      quantity: Number(item.querySelector<HTMLInputElement>('[name="quantity"]')?.value || 1),
      unitPrice: Number(item.querySelector<HTMLInputElement>('[name="unitPrice"]')?.value || 0),
      description,
      descriptionRich: editor ? editorToRichText(editor) : plainTextToQuoteRichText(description, true),
      images: Array.from(item.querySelectorAll<HTMLElement>("[data-quote-image-card]")).filter((card) => card.querySelector<HTMLInputElement>("[data-quote-image-enabled]")?.checked).map((card) => ({
        url: card.dataset.imageUrl || "",
        caption: card.querySelector<HTMLInputElement>("[data-quote-image-caption]")?.value.trim() || "Ảnh minh họa",
        afterText: card.querySelector<HTMLSelectElement>("[data-quote-image-anchor]")?.value || "",
      })).filter((image) => image.url),
    };
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
    markDirty();
    const search = (event.target as Element).closest<HTMLInputElement>("[data-quote-product-search]");
    const item = search?.closest<HTMLElement>("[data-quote-item]");
    if (search && item) renderProductOptions(item, search.value);
    const editor = (event.target as Element).closest<HTMLElement>("[data-quote-description-editor]");
    const editorItem = editor?.closest<HTMLElement>("[data-quote-item]");
    if (editorItem) syncDescription(editorItem);
    const changedItem = (event.target as Element).closest<HTMLElement>("[data-quote-item]");
    if (changedItem) syncItemSummary(changedItem);
    syncQuoteUI();
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
    const include = (event.target as Element).closest<HTMLInputElement>("[data-config-include]");
    if (include) {
      const item = include.closest<HTMLElement>("[data-quote-item]"); const editor = item?.querySelector<HTMLElement>("[data-quote-description-editor]");
      if (!item || !editor) return;
      const headings = descriptionHeadings(item); const headingIndex = Number(include.dataset.configInclude || 0);
      const start = headings[headingIndex]?.index ?? 0; const end = headings[headingIndex + 1]?.index ?? editor.children.length;
      for (let index = start; index < end; index += 1) {
        const block = editor.children.item(index) as HTMLElement | null;
        if (block) { block.dataset.quoteExcluded = include.checked ? "false" : "true"; block.hidden = !include.checked; }
      }
      syncDescription(item); syncItemSummary(item); markDirty(); return;
    }
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
      syncItemSummary(item); markDirty();
    } catch (error) { if (feedback) feedback.textContent = error instanceof Error ? error.message : "Không thể tải ảnh."; }
    finally { input.disabled = false; input.value = ""; uploadAction?.classList.remove("is-uploading"); uploadAction?.removeAttribute("aria-busy"); }
  });
  itemsRoot?.addEventListener("focusout", (event) => {
    const description = (event.target as Element).closest("[data-quote-description-editor]"); const item = description?.closest<HTMLElement>("[data-quote-item]"); if (item) refreshImageAnchors(item);
  });
  itemsRoot?.addEventListener("click", (event) => {
    const configTarget = (event.target as Element).closest<HTMLButtonElement>("[data-config-target]");
    if (configTarget) {
      const item = configTarget.closest<HTMLElement>("[data-quote-item]");
      const editor = item?.querySelector<HTMLElement>("[data-quote-description-editor]");
      if (!item || !editor) return;
      const headings = descriptionHeadings(item); const start = Number(configTarget.dataset.configTarget || 0); const headingPosition = headings.findIndex((heading) => heading.index === start); const end = headings[headingPosition + 1]?.index ?? editor.children.length;
      Array.from(editor.children).forEach((block, index) => block.classList.toggle("quote-editor-section-hidden", index < start || index >= end));
      item.querySelectorAll("[data-config-target]").forEach((button) => button.classList.toggle("is-active", button === configTarget));
      (editor.children.item(start) as HTMLElement | null)?.scrollIntoView({ block: "start" });
      return;
    }
    const openConfig = (event.target as Element).closest<HTMLButtonElement>("[data-open-config]");
    if (openConfig) { const item = openConfig.closest<HTMLElement>("[data-quote-item]"); if (!item) return; renderConfigOutline(item); item.querySelector<HTMLDialogElement>("[data-config-drawer]")?.showModal(); window.requestAnimationFrame(() => item.querySelector<HTMLButtonElement>("[data-config-target]")?.click()); return; }
    const openImages = (event.target as Element).closest<HTMLButtonElement>("[data-open-images]");
    if (openImages) { openImages.closest<HTMLElement>("[data-quote-item]")?.querySelector<HTMLDialogElement>("[data-image-drawer]")?.showModal(); return; }
    const closeDrawer = (event.target as Element).closest<HTMLButtonElement>("[data-close-drawer]");
    if (closeDrawer) { const item = closeDrawer.closest<HTMLElement>("[data-quote-item]"); closeDrawer.closest<HTMLDialogElement>("dialog")?.close(); if (item) { syncItemSummary(item); markDirty(); } return; }
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
      renderConfigOutline(item);
      syncItemSummary(item);
      markDirty();
      return;
    }
    const productOption = (event.target as Element).closest<HTMLButtonElement>("[data-quote-product-option]");
    if (productOption) {
      const item = productOption.closest<HTMLElement>("[data-quote-item]");
      if (item && productOption.dataset.quoteProductOption) chooseProduct(item, productOption.dataset.quoteProductOption);
      return;
    }
    const moveImage = (event.target as Element).closest<HTMLButtonElement>("[data-move-quote-image]");
    if (moveImage) {
      const card = moveImage.closest<HTMLElement>("[data-quote-image-card]"); const list = card?.parentElement;
      if (card && list && moveImage.dataset.moveQuoteImage === "up" && card.previousElementSibling) list.insertBefore(card, card.previousElementSibling);
      if (card && list && moveImage.dataset.moveQuoteImage === "down" && card.nextElementSibling) list.insertBefore(card.nextElementSibling, card);
      markDirty(); return;
    }
    const removeImage = (event.target as Element).closest<HTMLButtonElement>("[data-remove-quote-image]");
    if (removeImage) { const item = removeImage.closest<HTMLElement>("[data-quote-item]"); removeImage.closest("[data-quote-image-card]")?.remove(); if (item) { syncImageEmptyState(item); syncItemSummary(item); markDirty(); } return; }
    const move = (event.target as Element).closest<HTMLButtonElement>("[data-move-quote-item]");
    if (move) {
      const item = move.closest<HTMLElement>("[data-quote-item]");
      if (!item || !itemsRoot) return;
      if (move.dataset.moveQuoteItem === "up" && item.previousElementSibling) itemsRoot.insertBefore(item, item.previousElementSibling);
      if (move.dataset.moveQuoteItem === "down" && item.nextElementSibling) itemsRoot.insertBefore(item.nextElementSibling, item);
      move.closest<HTMLDetailsElement>("details")?.removeAttribute("open"); syncItems(); markDirty(); return;
    }
    const duplicate = (event.target as Element).closest<HTMLButtonElement>("[data-duplicate-quote-item]");
    if (duplicate) {
      const source = duplicate.closest<HTMLElement>("[data-quote-item]");
      if (!source || !itemsRoot) return;
      const saved = snapshotItem(source); const clone = createQuoteItem(saved.productId, saved);
      if (clone) { itemsRoot.insertBefore(clone, source.nextElementSibling); syncItems(); markDirty(); showToast("Đã nhân bản sản phẩm trong báo giá."); }
      return;
    }
    const reset = (event.target as Element).closest<HTMLButtonElement>("[data-reset-quote-item]");
    if (reset) {
      const item = reset.closest<HTMLElement>("[data-quote-item]");
      const productId = item?.querySelector<HTMLInputElement>("[data-quote-product]")?.value;
      if (!item || !productId || !window.confirm("Khôi phục cấu hình từ dữ liệu sản phẩm?\n\nCác chỉnh sửa riêng của sản phẩm trong báo giá này sẽ bị thay thế.")) return;
      hydrateItem(item, productId); syncItems(); markDirty(); showToast("Đã khôi phục dữ liệu từ sản phẩm."); return;
    }
    const remove = (event.target as Element).closest<HTMLButtonElement>("[data-remove-quote-item]");
    if (!remove) return;
    remove.closest("[data-quote-item]")?.remove();
    syncItems(); markDirty();
  });
  root.querySelectorAll<HTMLButtonElement>("[data-add-quote-item]").forEach((button) => button.addEventListener("click", openProductPicker));
  syncItems();

  productPickerSearch?.addEventListener("input", renderProductPicker);
  productPickerList?.addEventListener("change", (event) => {
    const checkbox = (event.target as Element).closest<HTMLInputElement>("[data-product-picker-option]");
    if (!checkbox) return;
    if (checkbox.checked) pickerSelection.add(checkbox.value); else pickerSelection.delete(checkbox.value);
    if (productPickerCount) productPickerCount.textContent = String(pickerSelection.size);
    if (productPickerConfirm) productPickerConfirm.disabled = pickerSelection.size === 0;
  });
  root.querySelectorAll<HTMLButtonElement>("[data-close-product-picker]").forEach((button) => button.addEventListener("click", () => productPicker?.close()));
  productPicker?.addEventListener("click", (event) => { if (event.target === productPicker) productPicker.close(); });
  productPickerConfirm?.addEventListener("click", () => {
    const added = Array.from(pickerSelection).flatMap((productId) => createQuoteItem(productId) || []);
    if (!added.length) return;
    productPicker?.close(); syncItems(); markDirty();
    const missingPrice = added.find((item) => Number(item.querySelector<HTMLInputElement>('[name="unitPrice"]')?.value || 0) <= 0);
    const target = missingPrice?.querySelector<HTMLInputElement>('[name="unitPrice"]') || added.at(-1)?.querySelector<HTMLInputElement>('[name="quantity"]');
    added.at(-1)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    window.requestAnimationFrame(() => target?.focus({ preventScroll: true }));
  });

  root.querySelectorAll<HTMLButtonElement>("[data-quote-accordion-toggle]").forEach((toggle) => toggle.addEventListener("click", () => {
    const section = toggle.closest<HTMLElement>("[data-quote-section]");
    const panel = section?.querySelector<HTMLElement>("[data-quote-accordion-panel]");
    if (!section || !panel) return;
    const willOpen = toggle.getAttribute("aria-expanded") !== "true";
    if (willOpen) {
      root.querySelectorAll<HTMLElement>("[data-quote-section].is-expanded").forEach((other) => {
        if (other === section || other.contains(document.activeElement)) return;
        other.classList.remove("is-expanded");
        other.querySelector<HTMLButtonElement>("[data-quote-accordion-toggle]")?.setAttribute("aria-expanded", "false");
        const otherPanel = other.querySelector<HTMLElement>("[data-quote-accordion-panel]"); if (otherPanel) otherPanel.hidden = true;
      });
    }
    section.classList.toggle("is-expanded", willOpen); toggle.setAttribute("aria-expanded", String(willOpen)); panel.hidden = !willOpen;
  }));

  root.querySelectorAll<HTMLButtonElement>("[data-section-link]").forEach((link) => link.addEventListener("click", () => {
    const section = document.getElementById(link.dataset.sectionLink || "");
    if (!section) return;
    root.querySelectorAll<HTMLElement>("[data-quote-section].is-expanded").forEach((other) => {
      if (other === section || other.contains(document.activeElement)) return;
      const otherToggle = other.querySelector<HTMLButtonElement>("[data-quote-accordion-toggle]"); const otherPanel = other.querySelector<HTMLElement>("[data-quote-accordion-panel]");
      if (otherToggle && otherPanel) { other.classList.remove("is-expanded"); otherToggle.setAttribute("aria-expanded", "false"); otherPanel.hidden = true; }
    });
    const toggle = section.querySelector<HTMLButtonElement>("[data-quote-accordion-toggle]");
    const panel = section.querySelector<HTMLElement>("[data-quote-accordion-panel]");
    if (toggle && panel && toggle.getAttribute("aria-expanded") !== "true") { section.classList.add("is-expanded"); toggle.setAttribute("aria-expanded", "true"); panel.hidden = false; }
    section.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }));

  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
    if (!visible) return;
    root.querySelectorAll<HTMLElement>("[data-section-link]").forEach((link) => link.classList.toggle("is-active", link.dataset.sectionLink === visible.target.id));
  }, { rootMargin: "-35% 0px -55%", threshold: [0, .25, .5] });
  root.querySelectorAll<HTMLElement>("[data-quote-section]").forEach((section) => sectionObserver.observe(section));

  const autoGrow = (textarea: HTMLTextAreaElement) => { textarea.style.height = "auto"; textarea.style.height = `${Math.min(160, Math.max(38, textarea.scrollHeight))}px`; };
  root.querySelectorAll<HTMLTextAreaElement>("[data-auto-grow]").forEach((textarea) => { autoGrow(textarea); textarea.addEventListener("input", () => autoGrow(textarea)); });

  const value = (name: string) => (form?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() || "";
  const buildPayload = (): QuotePayload => ({
    quoteNumber: value("quoteNumber") || (form?.elements.namedItem("quoteNumber") as HTMLInputElement | null)?.dataset.defaultQuoteNumber || "", quoteDate: value("quoteDate"), city: value("city"),
    companyTagline: value("companyTagline"), companyAddress: value("companyAddress"), website: value("website"),
    customer: { name: value("customerName"), organization: value("customerOrganization"), address: value("customerAddress"), phone: value("customerPhone"), email: value("customerEmail") },
    introduction: value("introduction"),
    items: Array.from(root.querySelectorAll<HTMLElement>("[data-quote-item]")).map(snapshotItem),
    vatIncluded: Boolean((form?.elements.namedItem("vatIncluded") as HTMLInputElement | null)?.checked),
    delivery: value("delivery"), payment: value("payment"), validity: value("validity"), additionalTerms: value("additionalTerms"),
  });

  const descriptionsValid = () => {
    if (!root.querySelector("[data-quote-item]")) {
      if (feedback) feedback.textContent = "Không thể tiếp tục. Cần bổ sung ít nhất một sản phẩm.";
      document.getElementById("quote-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }
    const invalid = Array.from(root.querySelectorAll<HTMLElement>("[data-quote-item]")).find((item) => {
      syncDescription(item);
      return (item.querySelector<HTMLTextAreaElement>("[data-quote-description]")?.value.trim().length || 0) < 10;
    });
    root.querySelectorAll<HTMLElement>("[data-quote-description-editor]").forEach((editor) => editor.removeAttribute("aria-invalid"));
    const editor = invalid?.querySelector<HTMLElement>("[data-quote-description-editor]");
    if (!editor) return true;
    editor.setAttribute("aria-invalid", "true");
    invalid?.querySelector<HTMLDialogElement>("[data-config-drawer]")?.showModal();
    window.requestAnimationFrame(() => editor.focus());
    if (feedback) feedback.textContent = "Mô tả mỗi sản phẩm cần ít nhất 10 ký tự.";
    return false;
  };

  const formFieldsValid = () => {
    if (!form) return false;
    form.querySelectorAll("[aria-invalid=true]").forEach((field) => field.removeAttribute("aria-invalid"));
    const invalid = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")).find((field) => !field.checkValidity());
    if (!invalid) return true;
    invalid.setAttribute("aria-invalid", "true");
    const section = invalid.closest<HTMLElement>("[data-quote-section]");
    const panel = section?.querySelector<HTMLElement>("[data-quote-accordion-panel]");
    const toggle = section?.querySelector<HTMLButtonElement>("[data-quote-accordion-toggle]");
    if (section && panel && toggle) { section.classList.add("is-expanded"); panel.hidden = false; toggle.setAttribute("aria-expanded", "true"); }
    invalid.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    window.requestAnimationFrame(() => invalid.focus({ preventScroll: true }));
    if (feedback) feedback.textContent = invalid.name === "customerName" ? "Cần bổ sung tên khách hàng." : `Cần kiểm tra trường ${invalid.closest("label")?.querySelector("span")?.textContent || "bắt buộc"}.`;
    return false;
  };

  const exportFieldsValid = () => {
    const item = Array.from(root.querySelectorAll<HTMLElement>("[data-quote-item]")).find((entry) => Number(entry.querySelector<HTMLInputElement>('[name="unitPrice"]')?.value || 0) <= 0);
    if (!item) return true;
    const price = item.querySelector<HTMLInputElement>('[name="unitPrice"]');
    price?.setAttribute("aria-invalid", "true");
    item.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    window.requestAnimationFrame(() => price?.focus({ preventScroll: true }));
    const name = item.querySelector<HTMLElement>("[data-quote-item-name]")?.textContent || "sản phẩm";
    if (feedback) feedback.textContent = `Không thể xuất báo giá. Cần bổ sung đơn giá của ${name}.`;
    return false;
  };

  const updateSavedState = (quote: SavedQuoteSummary) => {
    currentSavedQuoteId = quote.id;
    if (form) form.dataset.savedQuoteId = quote.id;
    if (saveLabel) saveLabel.textContent = "Lưu nháp";
    if (savedCurrent) {
      savedCurrent.hidden = false;
      savedCurrent.textContent = `Đang sửa ${savedQuoteTitle(quote)} · phiên bản ${quote.version}`;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("quote", quote.id);
    history.replaceState({}, "", url);
  };

  const saveCurrentQuote = async (announce = true) => {
    if (!descriptionsValid() || !formFieldsValid()) return null;
    if (!quoteDirty && currentSavedQuoteId) return currentSavedQuoteId;
    const payload = buildPayload();
    if (saveButton) { saveButton.disabled = true; saveButton.setAttribute("aria-busy", "true"); }
    if (saveLabel) saveLabel.textContent = currentSavedQuoteId ? "Đang cập nhật…" : "Đang lưu…";
    setSaveState("saving");
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
      const savedAt = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date());
      setSaveState("saved", `Đã lưu lúc ${savedAt}`);
      if (announce && feedback) feedback.textContent = result.message || "Đã lưu bản báo giá.";
      if (announce) showToast(`Đã lưu báo giá ${payload.quoteNumber}`);
      await loadSavedQuotes();
      return result.quote.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lưu bản báo giá.";
      setSaveState("error");
      if (feedback) feedback.textContent = `${message} Dữ liệu bạn vừa nhập vẫn được giữ lại.`;
      showToast(message, true);
      return null;
    } finally {
      if (saveButton) { saveButton.disabled = false; saveButton.removeAttribute("aria-busy"); }
      if (saveLabel) saveLabel.textContent = "Lưu nháp";
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

    const template = itemTemplate?.cloneNode(true) as HTMLElement | undefined;
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
        if (savedItem.productSnapshot) {
          item.dataset.productSnapshot = JSON.stringify(savedItem.productSnapshot);
          const name = item.querySelector<HTMLElement>("[data-quote-item-name]"); const meta = item.querySelector<HTMLElement>("[data-quote-item-meta]");
          if (name) name.textContent = savedItem.productSnapshot.name;
          if (meta) meta.textContent = [savedItem.productSnapshot.brand, savedItem.productSnapshot.model].filter(Boolean).join(" · ");
          item.querySelectorAll<HTMLElement>("[data-drawer-product-name]").forEach((copy) => { copy.textContent = [savedItem.productSnapshot!.name, savedItem.productSnapshot!.model].filter(Boolean).join(" · "); });
        }
        setItemDescription(item, savedItem.description, savedItem.descriptionRich);
        const quantity = item.querySelector<HTMLInputElement>('[name="quantity"]'); if (quantity) quantity.value = String(savedItem.quantity);
        const price = item.querySelector<HTMLInputElement>('[name="unitPrice"]'); if (price) price.value = String(savedItem.unitPrice);
        renderImageManager(item, savedItem.images);
      }
    });
    syncItems();
    quoteDirty = false;
    setSaveState("saved", "Đã lưu");
  };

  const matchingSavedQuotes = () => {
    const query = normalize(savedSearch?.value || "");
    return savedQuotes.filter((quote) => !query || normalize(`${savedQuoteTitle(quote)} ${quote.productNames.join(" ")} ${quote.quoteNumber} ${quote.customerName} ${quote.customerOrganization}`).includes(query));
  };

  const renderSavedQuotes = () => {
    if (!savedList || !savedEmpty) return;
    const visible = matchingSavedQuotes();
    const pageCount = Math.max(1, Math.ceil(visible.length / savedQuotesPageSize));
    savedQuotesPage = Math.min(savedQuotesPage, pageCount);
    const pageQuotes = visible.slice((savedQuotesPage - 1) * savedQuotesPageSize, savedQuotesPage * savedQuotesPageSize);
    savedList.replaceChildren();
    pageQuotes.forEach((quote) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "quote-saved-item"; button.dataset.savedQuoteId = quote.id;
      const copy = document.createElement("span"); const title = document.createElement("strong"); const detail = document.createElement("small");
      title.textContent = savedQuoteTitle(quote); title.title = title.textContent;
      detail.textContent = [quote.quoteNumber, quote.customerOrganization || quote.customerName].filter(Boolean).join(" · "); copy.append(title, detail);
      const meta = document.createElement("span"); meta.textContent = `v${quote.version} · ${new Intl.DateTimeFormat("vi-VN").format(new Date(quote.updatedAt))}`;
      button.append(copy, meta); savedList.append(button);
    });
    savedEmpty.hidden = visible.length > 0;
    savedEmpty.textContent = savedQuotes.length ? "Không tìm thấy báo giá phù hợp." : "Chưa có bản báo giá đã lưu.";
    if (savedPagination) savedPagination.hidden = visible.length <= savedQuotesPageSize;
    if (savedPageStatus) savedPageStatus.textContent = `Trang ${savedQuotesPage}/${pageCount}`;
    if (savedPrevious) savedPrevious.disabled = savedQuotesPage === 1;
    if (savedNext) savedNext.disabled = savedQuotesPage === pageCount;
  };

  async function loadSavedQuotes() {
    try {
      const response = await fetch("/api/admin/sales-quotes?limit=100", { cache: "no-store" });
      const result = await response.json() as { quotes?: SavedQuoteSummary[] };
      savedQuotes = response.ok && Array.isArray(result.quotes) ? result.quotes : [];
    } catch { savedQuotes = []; }
    renderSavedQuotes();
  }

  const openSavedQuote = async (id: string, skipDirtyCheck = false) => {
    if (!skipDirtyCheck && quoteDirty && !window.confirm("Báo giá hiện tại có thay đổi chưa lưu. Mở báo giá khác và bỏ các thay đổi này?")) return;
    if (feedback) feedback.textContent = "Đang mở bản báo giá…";
    try {
      const response = await fetch(`/api/admin/sales-quotes/${encodeURIComponent(id)}`, { cache: "no-store" });
      const result = await response.json() as { quote?: SavedQuoteSummary & { payload: QuotePayload }; error?: string };
      if (!response.ok || !result.quote) throw new Error(result.error || "Không thể mở bản báo giá.");
      applySavedPayload(result.quote.payload);
      updateSavedState(result.quote);
      quoteDirty = false;
      if (savedPanel?.open) savedPanel.close();
      if (feedback) feedback.textContent = `Đã mở ${result.quote.quoteNumber}, phiên bản ${result.quote.version}.`;
      syncQuoteUI();
    } catch (error) {
      if (feedback) feedback.textContent = error instanceof Error ? error.message : "Không thể mở bản báo giá.";
    }
  };

  form?.addEventListener("input", () => { markDirty(); syncQuoteUI(); });
  form?.addEventListener("change", () => { markDirty(); syncQuoteUI(); });
  saveButton?.addEventListener("click", () => { void saveCurrentQuote(); });
  root.querySelector<HTMLButtonElement>("[data-save-and-export]")?.addEventListener("click", () => {
    root.querySelector<HTMLButtonElement>('[data-quote-download][data-export-format="pdf"]')?.click();
  });
  savedToggle?.addEventListener("click", () => {
    if (!savedPanel) return;
    if (savedPanel.open) { savedPanel.close(); return; }
    savedQuotesPage = 1;
    savedPanel.showModal();
    savedToggle.setAttribute("aria-expanded", "true");
    void loadSavedQuotes();
    window.requestAnimationFrame(() => savedSearch?.focus());
  });
  savedPanel?.addEventListener("close", () => savedToggle?.setAttribute("aria-expanded", "false"));
  savedPanel?.addEventListener("click", (event) => { if (event.target === savedPanel) savedPanel.close(); });
  root.querySelector("[data-close-saved-quotes]")?.addEventListener("click", () => savedPanel?.close());
  savedSearch?.addEventListener("input", () => { savedQuotesPage = 1; renderSavedQuotes(); });
  savedPrevious?.addEventListener("click", () => { if (savedQuotesPage > 1) { savedQuotesPage -= 1; renderSavedQuotes(); } });
  savedNext?.addEventListener("click", () => {
    if (savedQuotesPage < Math.ceil(matchingSavedQuotes().length / savedQuotesPageSize)) {
      savedQuotesPage += 1; renderSavedQuotes();
    }
  });
  savedList?.addEventListener("click", (event) => { const button = (event.target as Element).closest<HTMLButtonElement>("[data-saved-quote-id]"); if (button?.dataset.savedQuoteId) void openSavedQuote(button.dataset.savedQuoteId); });

  const closePreview = () => {
    previewDialog?.close();
    if (previewObjectUrl) { URL.revokeObjectURL(previewObjectUrl); previewObjectUrl = ""; }
    if (previewFrame) { previewFrame.src = "about:blank"; previewFrame.hidden = true; }
  };
  root.querySelectorAll<HTMLButtonElement>("[data-close-preview]").forEach((button) => button.addEventListener("click", closePreview));
  previewDialog?.addEventListener("click", (event) => { if (event.target === previewDialog) closePreview(); });
  root.querySelectorAll<HTMLButtonElement>("[data-preview-quote]").forEach((button) => button.addEventListener("click", async () => {
    if (!descriptionsValid() || !formFieldsValid() || !exportFieldsValid() || !previewDialog || !previewFrame || !previewLoading) return;
    previewLoading.hidden = false; previewFrame.hidden = true; previewDialog.showModal();
    try {
      const response = await fetch("/api/admin/quote-pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload()) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error || "Không thể tạo bản xem trước."); }
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = URL.createObjectURL(await response.blob()); previewFrame.src = previewObjectUrl; previewFrame.hidden = false; previewLoading.hidden = true;
    } catch (error) {
      closePreview(); const message = error instanceof Error ? error.message : "Không thể tạo bản xem trước."; if (feedback) feedback.textContent = message; showToast(message, true);
    }
  }));

  root.querySelector<HTMLButtonElement>("[data-open-mobile-summary]")?.addEventListener("click", () => {
    if (!mobileSummary || !mobileSummaryContent) return;
    const subtotal = root.querySelector<HTMLElement>("[data-quote-subtotal]")?.textContent || "0đ";
    const readiness = root.querySelector<HTMLElement>("[data-quote-readiness]")?.outerHTML || "";
    mobileSummaryContent.innerHTML = `<dl class="quote-totals"><div><dt>Tổng cộng</dt><dd>${subtotal}</dd></div></dl>${readiness}<div class="quote-export-actions"><button class="button button-outline" type="button" data-mobile-preview>Xem trước</button><button class="button button-primary" type="button" data-mobile-export="pdf">Xuất PDF</button><button class="button button-outline" type="button" data-mobile-export="word">Xuất Word</button><button class="button button-outline" type="button" data-mobile-save>Lưu nháp</button></div>`;
    mobileSummary.showModal();
  });
  root.querySelector<HTMLButtonElement>("[data-close-mobile-summary]")?.addEventListener("click", () => mobileSummary?.close());
  mobileSummary?.addEventListener("click", (event) => {
    if (event.target === mobileSummary) { mobileSummary.close(); return; }
    if ((event.target as Element).closest("[data-mobile-preview]")) { mobileSummary.close(); root.querySelector<HTMLButtonElement>("[data-preview-quote]")?.click(); }
    const format = (event.target as Element).closest<HTMLButtonElement>("[data-mobile-export]")?.dataset.mobileExport;
    if (format) { mobileSummary.close(); root.querySelector<HTMLButtonElement>(`[data-quote-download][data-export-format="${format}"]`)?.click(); }
    if ((event.target as Element).closest("[data-mobile-save]")) { mobileSummary.close(); void saveCurrentQuote(); }
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (choosingFileName || !descriptionsValid() || !formFieldsValid() || !exportFieldsValid()) return;
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
      showToast(`${formatLabel} đã được tạo`);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Không thể tạo ${formatLabel}.`;
      if (feedback) feedback.textContent = message;
      showToast(message, true);
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
  itemsRoot?.addEventListener("click", (event) => {
    const dialog = (event.target as Element).closest<HTMLDialogElement>("[data-config-drawer], [data-image-drawer]");
    if (dialog && event.target === dialog) dialog.close();
  });
  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase("en-US") === "s") { event.preventDefault(); void saveCurrentQuote(); }
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase("en-US") === "k") { event.preventDefault(); openProductPicker(); }
  });
  window.addEventListener("beforeunload", (event) => { if (quoteDirty) event.preventDefault(); });
  const requestedQuoteId = new URL(window.location.href).searchParams.get("quote");
  if (requestedQuoteId) void openSavedQuote(requestedQuoteId, true);
  syncItems();
  void loadSavedQuotes();
}
};

document.addEventListener("astro:page-load", initAdminQuotePdf);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAdminQuotePdf, { once: true });
else initAdminQuotePdf();
