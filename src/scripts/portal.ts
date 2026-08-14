export {};

const views = [...document.querySelectorAll<HTMLElement>("[data-portal-view]")];
const navigationLinks = [...document.querySelectorAll<HTMLAnchorElement>("[data-portal-nav]")];
const drawerNavigationLinks = [...document.querySelectorAll<HTMLAnchorElement>(".portal-nav [data-portal-nav]")];
const mobileViewTitle = document.querySelector<HTMLElement>("[data-mobile-view-title]");
const mobileDrawer = document.querySelector<HTMLDialogElement>("[data-portal-mobile-drawer]");
const menuOpen = document.querySelector<HTMLButtonElement>("[data-portal-menu-open]");
const menuClose = document.querySelector<HTMLButtonElement>("[data-portal-menu-close]");

const viewLabel = (id: string) => drawerNavigationLinks.find((link) => link.dataset.portalNav === id)?.textContent?.trim() || "Tổng quan";

const activateView = (id: string, updateHistory = true) => {
  const nextView = views.find((view) => view.dataset.portalView === id) || views[0];
  if (!nextView) return;
  const nextId = nextView.dataset.portalView || "tong-quan";

  views.forEach((view) => { view.hidden = view !== nextView; });
  drawerNavigationLinks.forEach((link) => {
    if (link.dataset.portalNav === nextId) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (mobileViewTitle) mobileViewTitle.textContent = viewLabel(nextId);
  if (updateHistory) history.pushState(null, "", `#${nextId}`);
  mobileDrawer?.close();
  window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
};

navigationLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.dataset.portalNav;
    if (!id || !views.some((view) => view.dataset.portalView === id)) return;
    event.preventDefault();
    activateView(id);
  });
});

window.addEventListener("hashchange", () => activateView(window.location.hash.slice(1), false));
activateView(window.location.hash.slice(1) || "tong-quan", false);

menuOpen?.addEventListener("click", () => {
  if (!mobileDrawer?.open) mobileDrawer?.showModal();
  menuOpen.setAttribute("aria-expanded", "true");
});
menuClose?.addEventListener("click", () => mobileDrawer?.close());
mobileDrawer?.addEventListener("close", () => {
  menuOpen?.setAttribute("aria-expanded", "false");
  menuOpen?.focus({ preventScroll: true });
});
mobileDrawer?.addEventListener("click", (event) => {
  if (event.target === mobileDrawer) mobileDrawer.close();
});

const emptyScope = new URLSearchParams(window.location.search).get("empty");
if (emptyScope) {
  document.querySelectorAll<HTMLElement>(`[data-empty-scope="${emptyScope}"]`).forEach((content) => { content.hidden = true; });
  document.querySelectorAll<HTMLElement>(`[data-empty-state="${emptyScope}"]`).forEach((state) => { state.hidden = false; });
  if (emptyScope === "favorites") document.querySelectorAll<HTMLElement>("[data-favorite-count]").forEach((count) => { count.textContent = "0"; });
  if (emptyScope === "quotes") {
    document.querySelector<HTMLElement>("[data-quote-count]")!.textContent = "0";
    document.querySelector<HTMLElement>("[data-processing-count]")!.textContent = "0";
  }
  if (emptyScope === "documents") document.querySelector<HTMLElement>("[data-document-count]")!.textContent = "0";
}

const toast = document.querySelector<HTMLElement>("[data-portal-toast]");
const toastMessage = toast?.querySelector<HTMLElement>("[data-toast-message]");
const toastUndo = toast?.querySelector<HTMLButtonElement>("[data-toast-undo]");
let toastTimer = 0;

const showToast = (message: string, showUndo = false) => {
  if (!toast || !toastMessage || !toastUndo) return;
  window.clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toastUndo.hidden = !showUndo;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
};

let removedFavorite: HTMLElement | null = null;
const updateFavoriteCount = () => {
  const visibleItems = [...document.querySelectorAll<HTMLElement>("[data-favorite-item]")].filter((item) => !item.hidden);
  document.querySelectorAll<HTMLElement>("[data-favorite-count]").forEach((count) => { count.textContent = String(visibleItems.length); });
  const list = document.querySelector<HTMLElement>('[data-empty-scope="favorites"]');
  const empty = document.querySelector<HTMLElement>('[data-empty-state="favorites"]');
  if (list && empty) {
    list.hidden = visibleItems.length === 0;
    empty.hidden = visibleItems.length > 0;
  }
};

document.querySelectorAll<HTMLButtonElement>("[data-favorite-remove]").forEach((button) => {
  button.addEventListener("click", async () => {
    const item = button.closest<HTMLElement>("[data-favorite-item]");
    if (!item) return;
    const productId = item.dataset.productId || "";
    const response = await fetch(`/api/portal/favorites/${encodeURIComponent(productId)}`, { method: "DELETE" });
    if (!response.ok) { showToast("Không thể xóa sản phẩm. Vui lòng thử lại."); return; }
    removedFavorite = item;
    item.hidden = true;
    updateFavoriteCount();
    showToast("Đã xóa sản phẩm khỏi danh sách đã lưu.", true);
  });
});

toastUndo?.addEventListener("click", async () => {
  if (!removedFavorite) return;
  const productId = removedFavorite.dataset.productId || "";
  const response = await fetch(`/api/portal/favorites/${encodeURIComponent(productId)}`, { method: "PUT" });
  if (!response.ok) { showToast("Không thể hoàn tác. Vui lòng tải lại trang."); return; }
  removedFavorite.hidden = false;
  removedFavorite = null;
  updateFavoriteCount();
  if (toast) toast.hidden = true;
});

document.querySelectorAll<HTMLAnchorElement>("[data-portal-compare]").forEach((link) => {
  link.addEventListener("click", () => {
    const id = link.dataset.portalCompare;
    if (!id) return;
    try {
      const stored = JSON.parse(sessionStorage.getItem("tlm-compared-products") || "[]") as unknown;
      const ids = Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string") : [];
      sessionStorage.setItem("tlm-compared-products", JSON.stringify([...new Set([...ids, id])].slice(0, 4)));
    } catch { /* comparison still opens without stored state */ }
  });
});

const documentFilters = document.querySelector<HTMLFormElement>("[data-document-filters]");
const documentItems = [...document.querySelectorAll<HTMLElement>("[data-document-item]")];
const documentFilterEmpty = document.querySelector<HTMLElement>("[data-document-filter-empty]");
const documentList = document.querySelector<HTMLElement>("[data-document-list]");

const applyDocumentFilters = () => {
  if (!documentFilters || !documentFilterEmpty || !documentList) return;
  const formData = new FormData(documentFilters);
  const product = String(formData.get("product") || "all");
  const type = String(formData.get("type") || "all");
  const date = String(formData.get("date") || "");
  let visibleCount = 0;
  documentItems.forEach((item) => {
    const visible = (product === "all" || item.dataset.product === product)
      && (type === "all" || item.dataset.type === type)
      && (!date || (item.dataset.date || "") >= date);
    item.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  documentList.hidden = visibleCount === 0;
  documentFilterEmpty.hidden = visibleCount > 0;
};

documentFilters?.addEventListener("input", applyDocumentFilters);
documentFilters?.addEventListener("submit", (event) => { event.preventDefault(); applyDocumentFilters(); });
documentFilters?.addEventListener("reset", () => window.setTimeout(applyDocumentFilters, 0));
document.querySelector<HTMLButtonElement>("[data-document-reset]")?.addEventListener("click", () => {
  documentFilters?.reset();
  applyDocumentFilters();
});

document.querySelectorAll<HTMLButtonElement>("[data-document-download]").forEach((button) => {
  button.addEventListener("click", () => {
    const title = button.dataset.documentTitle || "Tài liệu";
    showToast(`${title}: file sẽ được tải khi backend cung cấp đường dẫn.`);
  });
});

const fieldMessage = (input: HTMLInputElement) => {
  if (input.validity.valueMissing) return "Vui lòng nhập thông tin này.";
  if (input.validity.typeMismatch) return "Thông tin chưa đúng định dạng.";
  if (input.validity.patternMismatch) return "Số điện thoại chưa đúng định dạng.";
  if (input.validity.tooShort) return `Vui lòng nhập ít nhất ${input.minLength} ký tự.`;
  if (input.validity.customError) return input.validationMessage;
  return "Vui lòng kiểm tra lại thông tin.";
};

const validateForm = (form: HTMLFormElement) => {
  const inputs = [...form.querySelectorAll<HTMLInputElement>("input[required]")];
  const invalidInputs: HTMLInputElement[] = [];
  inputs.forEach((input) => {
    const error = input.closest(".portal-field")?.querySelector<HTMLElement>("[data-field-error]");
    const message = input.validity.valid ? "" : fieldMessage(input);
    input.setAttribute("aria-invalid", String(Boolean(message)));
    if (error) error.textContent = message;
    if (message) invalidInputs.push(input);
  });
  invalidInputs[0]?.focus();
  return invalidInputs.length === 0;
};

const setBusy = (button: HTMLButtonElement, busy: boolean) => {
  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
};

const profileForm = document.querySelector<HTMLFormElement>("[data-profile-form]");
profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateForm(profileForm)) return;
  const submit = profileForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  const status = profileForm.querySelector<HTMLElement>("[data-profile-status]");
  if (!submit || !status) return;
  setBusy(submit, true);
  status.textContent = "";
  try {
    const response = await fetch("/api/portal/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(profileForm).entries())) });
    const result = await response.json() as { message?: string };
    status.textContent = response.ok ? "Đã lưu thay đổi." : result.message || "Không thể lưu thay đổi.";
  } catch { status.textContent = "Không thể kết nối máy chủ."; }
  finally {
    setBusy(submit, false);
  }
});

document.querySelectorAll<HTMLButtonElement>("[data-portal-password-toggle]").forEach((button) => {
  const input = button.closest(".portal-password-control")?.querySelector<HTMLInputElement>("input");
  if (!input) return;
  button.addEventListener("click", () => {
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    button.setAttribute("aria-pressed", String(!visible));
    button.setAttribute("aria-label", `${visible ? "Hiện" : "Ẩn"} ${input.labels?.[0]?.textContent?.toLocaleLowerCase("vi") || "mật khẩu"}`);
    button.querySelector("i")?.classList.toggle("ph-eye", visible);
    button.querySelector("i")?.classList.toggle("ph-eye-slash", !visible);
    input.focus({ preventScroll: true });
  });
});

const passwordForm = document.querySelector<HTMLFormElement>("[data-password-form]");
const newPassword = passwordForm?.querySelector<HTMLInputElement>("[data-new-password]");
const confirmPassword = passwordForm?.querySelector<HTMLInputElement>("[data-confirm-password]");
const passwordRules = passwordForm?.querySelectorAll<HTMLElement>("[data-rule]");

const updatePasswordRules = () => {
  if (!newPassword || !passwordRules) return;
  const rules: Record<string, boolean> = {
    length: newPassword.value.length >= 10,
    letter: /[A-Za-zÀ-ỹ]/.test(newPassword.value),
    number: /\d/.test(newPassword.value),
    symbol: /[^A-Za-zÀ-ỹ\d\s]/.test(newPassword.value),
  };
  passwordRules.forEach((rule) => {
    const met = Boolean(rules[rule.dataset.rule || ""]);
    rule.classList.toggle("is-met", met);
    rule.querySelector("i")?.classList.toggle("ph-circle", !met);
    rule.querySelector("i")?.classList.toggle("ph-check-circle", met);
  });
  newPassword.setCustomValidity(Object.values(rules).every(Boolean) ? "" : "Mật khẩu chưa đáp ứng các yêu cầu bên dưới.");
  if (confirmPassword?.value) confirmPassword.setCustomValidity(confirmPassword.value === newPassword.value ? "" : "Mật khẩu xác nhận chưa khớp.");
};

newPassword?.addEventListener("input", updatePasswordRules);
confirmPassword?.addEventListener("input", () => {
  confirmPassword.setCustomValidity(confirmPassword.value === newPassword?.value ? "" : "Mật khẩu xác nhận chưa khớp.");
});
passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  updatePasswordRules();
  if (!validateForm(passwordForm)) return;
  const submit = passwordForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  const status = passwordForm.querySelector<HTMLElement>("[data-password-status]");
  if (!submit || !status) return;
  setBusy(submit, true);
  status.textContent = "";
  try {
    const response = await fetch("/api/portal/password", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(passwordForm).entries())) });
    const result = await response.json() as { message?: string };
    if (!response.ok) { status.textContent = result.message || "Không thể đổi mật khẩu."; return; }
    setBusy(submit, false);
    passwordForm.reset();
    updatePasswordRules();
    status.textContent = result.message || "Đã đổi mật khẩu.";
  } catch { status.textContent = "Không thể kết nối máy chủ."; }
  finally { setBusy(submit, false); }
});

document.querySelectorAll<HTMLButtonElement>("[data-quote-open]").forEach((button) => {
  button.addEventListener("click", () => {
    const productId = button.dataset.productId;
    window.location.href = productId ? `/yeu-cau-bao-gia?product=${encodeURIComponent(productId)}` : "/yeu-cau-bao-gia";
  });
});

const detailDialog = document.querySelector<HTMLDialogElement>("[data-quote-detail-dialog]");
document.querySelectorAll<HTMLButtonElement>("[data-quote-detail]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!detailDialog) return;
    const setText = (selector: string, value = "") => {
      const target = detailDialog.querySelector<HTMLElement>(selector);
      if (target) target.textContent = value;
    };
    setText("[data-detail-code]", button.dataset.code);
    setText("[data-detail-date]", button.dataset.date);
    setText("[data-detail-product]", button.dataset.product);
    setText("[data-detail-status]", button.dataset.status);
    detailDialog.showModal();
    const updates = detailDialog.querySelector<HTMLElement>("[data-detail-updates]");
    if (updates) updates.innerHTML = "<p>Đang tải lịch sử cập nhật…</p>";
    try {
      const response = await fetch(`/api/portal/quotes/${encodeURIComponent(button.dataset.quoteId || button.dataset.code || "")}`, { credentials: "same-origin" });
      const payload = await response.json() as { message?: string; quote?: { updates?: Array<{ title: string; detail?: string; createdAt?: string }> } };
      if (!response.ok || !payload.quote) throw new Error(payload.message || "Không thể tải chi tiết.");
      if (updates) {
        updates.replaceChildren();
        const heading = document.createElement("h3"); heading.textContent = "Cập nhật dành cho khách hàng"; updates.append(heading);
        const list = document.createElement("ol");
        (payload.quote.updates || []).forEach((update) => {
          const item = document.createElement("li"); const title = document.createElement("strong"); const detail = document.createElement("span");
          title.textContent = update.title; detail.textContent = update.detail || ""; item.append(title, detail); list.append(item);
        });
        if (!list.children.length) { const empty = document.createElement("p"); empty.textContent = "Chưa có cập nhật mới."; updates.append(empty); }
        else updates.append(list);
      }
    } catch (error) { if (updates) updates.textContent = error instanceof Error ? error.message : "Không thể tải chi tiết."; }
  });
});
detailDialog?.querySelector<HTMLButtonElement>("[data-detail-close]")?.addEventListener("click", () => detailDialog.close());
detailDialog?.addEventListener("click", (event) => { if (event.target === detailDialog) detailDialog.close(); });
