type QuoteProduct = {
  id: string;
  slug: string;
  name: string;
  model: string;
  brand: string;
  category: string;
  image: string;
};

type QuoteItem = { productId: string; quantity: number; note: string };
type UploadItem = { id: string; file: File; progress: number; error?: string };
type PublicQuote = {
  id: string;
  date: string;
  status: "received";
  customer: { name: string; phone: string; email: string; unit: string; facility: string; city: string };
  need: string;
  note: string;
  items: Array<QuoteItem & { name: string; model: string; brand: string; image: string }>;
  documents: Array<{ name: string; size: number }>;
};
type QuoteResult = { quoteNumber: string; leadNumber: string; accessToken: string; status: "RECEIVED"; url: string };

const root = document.querySelector<HTMLElement>("[data-quote-page]");

if (root) {
  const parseProducts = () => {
    try { return JSON.parse(document.getElementById("quote-product-data")?.textContent || "[]") as QuoteProduct[]; }
    catch { return []; }
  };

  const products = parseProducts();
  const productMap = new Map(products.map((product) => [product.id, product]));
  const productSlugMap = new Map(products.map((product) => [product.slug, product]));
  const form = root.querySelector<HTMLFormElement>("[data-quote-form]");
  const formView = root.querySelector<HTMLElement>("[data-quote-form-view]");
  const successView = root.querySelector<HTMLElement>("[data-quote-success]");
  const itemsRoot = root.querySelector<HTMLElement>("[data-quote-items]");
  const itemsEmpty = root.querySelector<HTMLElement>("[data-quote-items-empty]");
  const itemsError = root.querySelector<HTMLElement>("[data-items-error]");
  const picker = root.querySelector<HTMLDialogElement>("[data-product-picker]");
  const pickerList = root.querySelector<HTMLElement>("[data-product-picker-list]");
  const pickerEmpty = root.querySelector<HTMLElement>("[data-product-picker-empty]");
  const pickerSearch = root.querySelector<HTMLInputElement>("[data-product-search]");
  const pickerCount = root.querySelector<HTMLElement>("[data-picker-selected-count]");
  const fileInput = root.querySelector<HTMLInputElement>("[data-file-input]");
  const fileList = root.querySelector<HTMLElement>("[data-file-list]");
  const filesError = root.querySelector<HTMLElement>("[data-files-error]");
  const uploadZone = root.querySelector<HTMLElement>("[data-upload-zone]");
  const submitButton = root.querySelector<HTMLButtonElement>("[data-quote-submit]");
  const submitError = root.querySelector<HTMLElement>("[data-submit-error]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let quoteItems: QuoteItem[] = [];
  let uploads: UploadItem[] = [];

  const readStoredIds = (storage: Storage, key: string) => {
    try {
      const value = JSON.parse(storage.getItem(key) || "[]") as unknown;
      return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string" && productMap.has(id)) : [];
    } catch { return []; }
  };

  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const updateSummary = () => {
    const count = root.querySelector<HTMLElement>("[data-summary-count]");
    const quantity = root.querySelector<HTMLElement>("[data-summary-quantity]");
    const fileCount = root.querySelector<HTMLElement>("[data-summary-files]");
    if (count) count.textContent = String(quoteItems.length);
    if (quantity) quantity.textContent = String(quoteItems.reduce((total, item) => total + item.quantity, 0));
    if (fileCount) fileCount.textContent = String(uploads.filter((item) => !item.error).length);
    if (pickerCount) pickerCount.textContent = `${quoteItems.length} sản phẩm đã chọn`;
  };

  const renderItems = () => {
    if (!itemsRoot || !itemsEmpty) return;
    itemsRoot.replaceChildren();
    itemsEmpty.hidden = quoteItems.length > 0;
    quoteItems.forEach((item) => {
      const product = productMap.get(item.productId);
      if (!product) return;
      const row = document.createElement("article");
      row.className = "quote-item";
      row.dataset.quoteProduct = product.id;
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = "";
      image.width = 72;
      image.height = 58;
      const copy = document.createElement("div");
      copy.className = "quote-item-copy";
      const name = document.createElement("strong");
      name.textContent = product.name;
      const meta = document.createElement("span");
      meta.textContent = `${product.brand} · ${product.model}`;
      const noteLabel = document.createElement("label");
      noteLabel.className = "quote-item-note";
      noteLabel.htmlFor = `quote-note-${product.id}`;
      const noteLabelText = document.createElement("span");
      noteLabelText.textContent = "Ghi chú cho thiết bị";
      const note = document.createElement("input");
      note.id = `quote-note-${product.id}`;
      note.type = "text";
      note.maxLength = 500;
      note.placeholder = "Cấu hình, phụ kiện hoặc yêu cầu riêng…";
      note.value = item.note;
      note.dataset.itemNote = product.id;
      noteLabel.append(noteLabelText, note);
      copy.append(name, meta, noteLabel);
      const quantity = document.createElement("div");
      quantity.className = "quote-quantity";
      const quantityLabel = document.createElement("label");
      quantityLabel.htmlFor = `quote-quantity-${product.id}`;
      quantityLabel.textContent = "Số lượng";
      const controls = document.createElement("div");
      controls.className = "quote-quantity-control";
      const decrease = document.createElement("button");
      decrease.type = "button";
      decrease.dataset.quantityAction = "decrease";
      decrease.setAttribute("aria-label", `Giảm số lượng ${product.name}`);
      decrease.innerHTML = '<i class="ph ph-minus" aria-hidden="true"></i>';
      const input = document.createElement("input");
      input.id = `quote-quantity-${product.id}`;
      input.type = "number";
      input.min = "1";
      input.max = "99";
      input.value = String(item.quantity);
      input.inputMode = "numeric";
      input.dataset.quantityInput = product.id;
      const increase = document.createElement("button");
      increase.type = "button";
      increase.dataset.quantityAction = "increase";
      increase.setAttribute("aria-label", `Tăng số lượng ${product.name}`);
      increase.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i>';
      controls.append(decrease, input, increase);
      quantity.append(quantityLabel, controls);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "quote-remove-item";
      remove.dataset.removeQuoteProduct = product.id;
      remove.setAttribute("aria-label", `Xóa ${product.name}`);
      remove.innerHTML = '<i class="ph ph-trash" aria-hidden="true"></i>';
      row.append(image, copy, quantity, remove);
      itemsRoot.append(row);
    });
    if (itemsError && quoteItems.length) itemsError.textContent = "";
    updateSummary();
    renderPicker();
  };

  const renderPicker = () => {
    if (!pickerList || !pickerEmpty) return;
    pickerList.replaceChildren();
    const query = normalize(pickerSearch?.value || "");
    const filtered = products.filter((product) => !query || normalize(`${product.name} ${product.model} ${product.brand} ${product.category}`).includes(query));
    pickerEmpty.hidden = filtered.length > 0;
    filtered.forEach((product) => {
      const selected = quoteItems.some((item) => item.productId === product.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quote-picker-item";
      button.classList.toggle("is-selected", selected);
      button.dataset.pickProduct = product.id;
      button.setAttribute("aria-pressed", String(selected));
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = "";
      image.width = 68;
      image.height = 54;
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = product.name;
      const meta = document.createElement("small");
      meta.textContent = `${product.brand} · ${product.model} · ${product.category}`;
      copy.append(name, meta);
      const icon = document.createElement("i");
      icon.className = `ph ${selected ? "ph-check" : "ph-plus"}`;
      icon.setAttribute("aria-hidden", "true");
      button.append(image, copy, icon);
      pickerList.append(button);
    });
    updateSummary();
  };

  const addProduct = (id: string) => {
    if (!productMap.has(id) || quoteItems.some((item) => item.productId === id)) return;
    quoteItems.push({ productId: id, quantity: 1, note: "" });
    renderItems();
  };

  const removeProduct = (id: string) => {
    quoteItems = quoteItems.filter((item) => item.productId !== id);
    renderItems();
  };

  const openPicker = () => {
    if (!picker) return;
    renderPicker();
    picker.showModal();
    requestAnimationFrame(() => pickerSearch?.focus());
  };

  root.querySelectorAll<HTMLButtonElement>("[data-open-product-picker]").forEach((button) => button.addEventListener("click", openPicker));
  root.querySelector("[data-close-product-picker]")?.addEventListener("click", () => picker?.close());
  root.querySelector("[data-finish-product-picker]")?.addEventListener("click", () => picker?.close());
  picker?.addEventListener("click", (event) => { if (event.target === picker) picker.close(); });
  pickerSearch?.addEventListener("input", renderPicker);
  pickerList?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-pick-product]");
    const id = button?.dataset.pickProduct;
    if (!id) return;
    if (quoteItems.some((item) => item.productId === id)) removeProduct(id); else addProduct(id);
  });

  itemsRoot?.addEventListener("click", (event) => {
    const remove = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-remove-quote-product]");
    if (remove?.dataset.removeQuoteProduct) { removeProduct(remove.dataset.removeQuoteProduct); return; }
    const action = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-quantity-action]");
    const row = action?.closest<HTMLElement>("[data-quote-product]");
    if (!action || !row?.dataset.quoteProduct) return;
    const item = quoteItems.find((entry) => entry.productId === row.dataset.quoteProduct);
    if (!item) return;
    item.quantity = Math.min(99, Math.max(1, item.quantity + (action.dataset.quantityAction === "increase" ? 1 : -1)));
    renderItems();
  });
  itemsRoot?.addEventListener("change", (event) => {
    const note = (event.target as HTMLElement).closest<HTMLInputElement>("[data-item-note]");
    if (note) {
      const item = quoteItems.find((entry) => entry.productId === note.dataset.itemNote);
      if (item) item.note = note.value.slice(0, 500);
      return;
    }
    const input = (event.target as HTMLElement).closest<HTMLInputElement>("[data-quantity-input]");
    const item = quoteItems.find((entry) => entry.productId === input?.dataset.quantityInput);
    if (!input || !item) return;
    item.quantity = Math.min(99, Math.max(1, Number(input.value) || 1));
    renderItems();
  });

  const validExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"];
  const fileError = (file: File) => {
    const extension = file.name.split(".").pop()?.toLocaleLowerCase("vi") || "";
    if (!validExtensions.includes(extension)) return "Định dạng file chưa được hỗ trợ.";
    if (file.size > 10 * 1024 * 1024) return "File vượt quá giới hạn 10 MB.";
    return "";
  };
  const renderFiles = () => {
    if (!fileList) return;
    fileList.replaceChildren();
    uploads.forEach((item) => {
      const row = document.createElement("div");
      row.className = "quote-file";
      row.classList.toggle("is-error", Boolean(item.error));
      const icon = document.createElement("i");
      icon.className = `ph ${item.error ? "ph-warning-circle" : "ph-file-text"}`;
      icon.setAttribute("aria-hidden", "true");
      const copy = document.createElement("div");
      copy.className = "quote-file-copy";
      const name = document.createElement("strong");
      name.textContent = item.file.name;
      const meta = document.createElement("span");
      meta.textContent = item.error || `${formatSize(item.file.size)} · ${item.progress < 100 ? `Đang tải ${item.progress}%` : "Sẵn sàng gửi"}`;
      copy.append(name, meta);
      if (!item.error) {
        const progress = document.createElement("div");
        progress.className = "quote-file-progress";
        const bar = document.createElement("i");
        progress.style.setProperty("--file-progress-scale", String(item.progress / 100));
        progress.append(bar);
        copy.append(progress);
      }
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "quote-file-remove";
      remove.dataset.removeFile = item.id;
      remove.setAttribute("aria-label", `Xóa file ${item.file.name}`);
      remove.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
      row.append(icon, copy, remove);
      fileList.append(row);
    });
    if (filesError) filesError.textContent = uploads.some((item) => item.error) ? "Hãy xóa file lỗi trước khi gửi yêu cầu." : "";
    updateSummary();
  };
  const addFiles = (files: File[]) => {
    const availableSlots = Math.max(0, 3 - uploads.length);
    if (files.length > availableSlots && filesError) filesError.textContent = "Bạn chỉ có thể đính kèm tối đa 3 file.";
    files.slice(0, availableSlots).forEach((file) => uploads.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, file, progress: 0, error: fileError(file) || undefined }));
    renderFiles();
    if (reduceMotion.matches) {
      uploads.forEach((item) => { if (!item.error) item.progress = 100; });
      renderFiles();
      return;
    }
    const timer = window.setInterval(() => {
      let pending = false;
      uploads.forEach((item) => {
        if (!item.error && item.progress < 100) { item.progress = Math.min(100, item.progress + 25); pending = item.progress < 100; }
      });
      renderFiles();
      if (!pending) window.clearInterval(timer);
    }, 120);
  };
  fileInput?.addEventListener("change", () => {
    addFiles(Array.from(fileInput.files || []));
    fileInput.value = "";
  });
  fileList?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-remove-file]");
    if (!button?.dataset.removeFile) return;
    uploads = uploads.filter((item) => item.id !== button.dataset.removeFile);
    renderFiles();
  });
  ["dragenter", "dragover"].forEach((name) => uploadZone?.addEventListener(name, (event) => { event.preventDefault(); uploadZone.classList.add("is-dragging"); }));
  ["dragleave", "drop"].forEach((name) => uploadZone?.addEventListener(name, (event) => { event.preventDefault(); uploadZone.classList.remove("is-dragging"); }));
  uploadZone?.addEventListener("drop", (event) => addFiles(Array.from((event as DragEvent).dataTransfer?.files || [])));

  const fieldMessage = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
    if (field.validity.valueMissing) return field instanceof HTMLSelectElement ? "Vui lòng chọn loại cơ sở." : "Vui lòng nhập thông tin này.";
    if (field.validity.typeMismatch) return "Email chưa đúng định dạng. Ví dụ: ten@donvi.vn";
    if (field.validity.patternMismatch) return "Số điện thoại chưa đúng định dạng.";
    if (field.validity.tooShort && !(field instanceof HTMLSelectElement)) return `Vui lòng nhập ít nhất ${field.minLength} ký tự.`;
    return "Vui lòng kiểm tra lại thông tin.";
  };
  const validateField = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
    const message = field.validity.valid ? "" : fieldMessage(field);
    field.setAttribute("aria-invalid", String(Boolean(message)));
    const error = field.closest<HTMLElement>("[data-field]")?.querySelector<HTMLElement>("[data-field-error]");
    if (error) error.textContent = message;
    return !message;
  };
  const fields = Array.from(form?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input:not([type='file']), select, textarea") || []);
  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => { if (field.getAttribute("aria-invalid") === "true") validateField(field); });
  });

  const showSuccess = async (quote: QuoteResult) => {
    if (!formView || !successView) return;
    formView.hidden = true;
    successView.hidden = false;
    const id = successView.querySelector<HTMLElement>("[data-success-id]");
    const viewLink = successView.querySelector<HTMLAnchorElement>("[data-view-quote]");
    if (id) id.textContent = quote.quoteNumber;
    if (viewLink) viewLink.href = quote.url;
    let authenticated = false;
    try { authenticated = (await fetch("/api/auth/me", { credentials: "same-origin" })).ok; } catch { authenticated = false; }
    const suggestion = successView.querySelector<HTMLElement>("[data-account-suggestion]");
    if (suggestion) suggestion.hidden = authenticated;
    successView.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
  };
  const submit = async () => {
    if (!form || !submitButton) return;
    const invalid = fields.filter((field) => !validateField(field));
    if (!quoteItems.length && itemsError) itemsError.textContent = "Vui lòng thêm ít nhất một sản phẩm.";
    const hasFileError = uploads.some((item) => item.error || item.progress < 100);
    if (hasFileError && filesError) filesError.textContent = uploads.some((item) => item.error) ? "Hãy xóa file lỗi trước khi gửi yêu cầu." : "Vui lòng chờ file tải xong.";
    if (invalid.length || !quoteItems.length || hasFileError) {
      (invalid[0] || (!quoteItems.length ? itemsError : filesError))?.focus();
      return;
    }
    submitError!.hidden = true;
    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    try {
      if (new URL(window.location.href).searchParams.get("state") === "network-error") throw new Error("Forced network error");
      const payload = new FormData(form);
      payload.set("source", new URL(window.location.href).searchParams.get("source") || "global");
      payload.set("items", JSON.stringify(quoteItems));
      uploads.filter((item) => !item.error).forEach((item) => payload.append("attachments", item.file, item.file.name));
      const response = await fetch("/api/quotes", { method: "POST", body: payload, credentials: "same-origin" });
      const result = await response.json() as QuoteResult & { error?: string };
      if (!response.ok) throw new Error(result.error || "QUOTE_CREATE_FAILED");
      submitButton.disabled = false;
      submitButton.setAttribute("aria-busy", "false");
      await showSuccess(result);
    } catch {
      submitButton.disabled = false;
      submitButton.setAttribute("aria-busy", "false");
      if (submitError) submitError.hidden = false;
      submitError?.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });
    }
  };
  form?.addEventListener("submit", (event) => { event.preventDefault(); submit(); });
  root.querySelector("[data-retry-submit]")?.addEventListener("click", () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("state");
    window.history.replaceState({}, "", url);
    submit();
  });
  root.querySelector("[data-copy-quote-id]")?.addEventListener("click", async () => {
    const id = root.querySelector<HTMLElement>("[data-success-id]")?.textContent || "";
    try { await navigator.clipboard.writeText(id); window.dispatchEvent(new CustomEvent("tlm:toast", { detail: { message: "Đã sao chép mã yêu cầu." } })); }
    catch { window.dispatchEvent(new CustomEvent("tlm:toast", { detail: { message: "Không thể sao chép mã yêu cầu.", tone: "error" } })); }
  });

  const initialize = async () => {
    const params = new URL(window.location.href).searchParams;
    const source = params.get("source") || "";
    const ids = new Set<string>();
    (params.get("products") || params.get("product") || "").split(",").filter(Boolean).forEach((value) => {
      const direct = productMap.get(value) || productSlugMap.get(value);
      if (direct) ids.add(direct.id);
    });
    if (source === "compare") readStoredIds(sessionStorage, "tlm-compared-products").forEach((id) => ids.add(id));
    if (source === "favorites") readStoredIds(localStorage, "tlm-saved-products").forEach((id) => ids.add(id));
    quoteItems = Array.from(ids).map((productId) => ({ productId, quantity: 1, note: "" }));
    const need = form?.elements.namedItem("need") as HTMLTextAreaElement | null;
    if (need && params.get("need")) need.value = params.get("need") || "";
    renderItems();
    renderFiles();
    try {
      const response = await fetch("/api/portal/profile", { credentials: "same-origin" });
      if (response.ok) {
        const payload = await response.json() as { user?: { name?: string; email?: string; phone?: string; organization?: string; customerType?: string; province?: string } };
        const profile = payload.user;
        const customerTypeLabels: Record<string, string> = { doctor: "Khác", clinic: "Phòng khám tư nhân", hospital: "Bệnh viện / Trung tâm y tế", laboratory: "Phòng xét nghiệm", dealer: "Đơn vị phân phối", "vet-clinic": "Phòng khám thú y", "vet-hospital": "Bệnh viện thú y" };
        const values = { name: profile?.name, email: profile?.email, phone: profile?.phone, organization: profile?.organization, customerType: customerTypeLabels[profile?.customerType || ""] || profile?.customerType, province: profile?.province };
        Object.entries(values).forEach(([key, value]) => {
          const field = form?.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null;
          if (field && typeof value === "string") field.value = value;
        });
      }
    } catch { /* guest flow remains available */ }
  };
  void initialize();
}
