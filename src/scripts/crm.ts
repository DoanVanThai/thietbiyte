export {};

const initCrm = () => {
const crmRoot = document.querySelector<HTMLElement>(".admin-main");

if (crmRoot) {
  const toast = document.querySelector<HTMLElement>("[data-admin-toast]");
  let toastTimer = 0;
  const showToast = (message: string) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  };
  const marker = document.querySelector<HTMLElement>("[data-crm-record-id]");
  const recordId = marker?.dataset.crmRecordId;
  const entity = marker?.dataset.crmEntity;
  const request = async (url: string, method: "POST" | "PATCH", body: unknown) => {
    const response = await fetch(url, { method, credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) throw new Error(payload.message || "Không thể lưu thay đổi.");
    return payload;
  };
  const runAction = async (button: HTMLButtonElement | null, action: () => Promise<unknown>, success: string) => {
    if (button) { button.disabled = true; button.setAttribute("aria-busy", "true"); }
    try { await action(); showToast(success); window.setTimeout(() => document.dispatchEvent(new Event("admin:refresh")), 300); }
    catch (error) { showToast(error instanceof Error ? error.message : "Không thể lưu thay đổi."); }
    finally { if (button) { button.disabled = false; button.removeAttribute("aria-busy"); } }
  };
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();

  document.querySelectorAll<HTMLFormElement>("[data-crm-filters]").forEach((form) => {
    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-filter-row]"));
    const empty = document.querySelector<HTMLElement>("[data-filter-empty]");
    const count = document.querySelector<HTMLElement>("[data-result-count]");
    const table = document.querySelector<HTMLElement>(".crm-table-wrap");
    const mobile = document.querySelector<HTMLElement>(".crm-mobile-list");
    const currentUrl = new URL(window.location.href);
    const searchControl = form.querySelector<HTMLInputElement>("[data-filter-search]");
    if (searchControl) searchControl.value = currentUrl.searchParams.get("q") || "";
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-filter-key]").forEach((control) => { control.value = currentUrl.searchParams.get(control.dataset.filterKey || "") || ""; });
    const applyFilters = () => {
      const query = normalize(form.querySelector<HTMLInputElement>("[data-filter-search]")?.value || "");
      const controls = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-filter-key]"));
      let visible = 0;
      rows.forEach((row) => {
        const matchesSearch = !query || normalize(row.dataset.search || "").includes(query);
        const matchesControls = controls.every((control) => {
          const value = normalize(control.value);
          if (!value) return true;
          const key = control.dataset.filterKey || "";
          const dataKey = key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
          const rowValue = normalize(row.dataset[dataKey] || "");
          return key === "date" ? rowValue >= value : rowValue.includes(value);
        });
        row.hidden = !(matchesSearch && matchesControls);
        if (!row.hidden) visible += 1;
      });
      const divisor = table && mobile ? 2 : 1;
      if (count) count.textContent = String(visible / divisor);
      if (empty) empty.hidden = visible > 0;
      if (table) table.hidden = visible === 0;
      if (mobile) mobile.hidden = visible === 0;
      const url = new URL(window.location.href);
      if (searchControl?.value.trim()) url.searchParams.set("q", searchControl.value.trim()); else url.searchParams.delete("q");
      controls.forEach((control) => { const key = control.dataset.filterKey || ""; if (!key) return; if (control.value) url.searchParams.set(key, control.value); else url.searchParams.delete(key); });
      history.replaceState(history.state, "", url);
    };
    form.addEventListener("input", applyFilters);
    form.addEventListener("change", applyFilters);
    form.addEventListener("reset", () => window.setTimeout(applyFilters, 0));
    document.querySelector("[data-empty-reset]")?.addEventListener("click", () => { form.reset(); applyFilters(); });
    applyFilters();
  });

  const kanban = document.querySelector<HTMLElement>("[data-pipeline-kanban]");
  const pipelineTable = document.querySelector<HTMLElement>("[data-pipeline-table]");
  document.querySelectorAll<HTMLButtonElement>("[data-pipeline-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const tableActive = button.dataset.pipelineView === "table";
      if (kanban) kanban.hidden = tableActive;
      if (pipelineTable) pipelineTable.hidden = !tableActive;
      document.querySelectorAll<HTMLButtonElement>("[data-pipeline-view]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-toggle-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.togglePanel;
      const panel = document.querySelector<HTMLElement>(`[data-inline-panel='${name}']`);
      if (!panel) return;
      panel.hidden = false;
      panel.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      panel.querySelector<HTMLElement>("input, textarea, select")?.focus({ preventScroll: true });
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-close-panel]").forEach((button) => button.addEventListener("click", () => {
    const panel = document.querySelector<HTMLElement>(`[data-inline-panel='${button.dataset.closePanel}']`);
    if (panel) panel.hidden = true;
  }));
  document.querySelector<HTMLButtonElement>("[data-mobile-status]")?.addEventListener("click", () => document.querySelector<HTMLElement>(".lead-status-editor")?.scrollIntoView({ behavior: "smooth", block: "center" }));

  document.querySelector<HTMLFormElement>("[data-runtime-follow-up]")?.addEventListener("submit", (event) => {
    event.preventDefault(); if (!recordId) return;
    const form = event.currentTarget as HTMLFormElement; if (!form.reportValidity()) return;
    const data = new FormData(form); const date = String(data.get("date")); const time = String(data.get("time"));
    void runAction(form.querySelector('button[type="submit"]'), () => request(`/api/crm/leads/${recordId}/follow-ups`, "POST", { assignedToId: data.get("assignedToId"), dueAt: `${date}T${time}:00`, type: data.get("type"), note: data.get("note") }), "Đã lưu follow-up.");
  });
  document.querySelector<HTMLFormElement>("[data-runtime-activity]")?.addEventListener("submit", (event) => {
    event.preventDefault(); if (!recordId) return;
    const form = event.currentTarget as HTMLFormElement; if (!form.reportValidity()) return; const data = new FormData(form);
    void runAction(form.querySelector('button[type="submit"]'), () => request(`/api/crm/leads/${recordId}/activities`, "POST", { type: data.get("type"), content: data.get("content"), visibility: data.get("visibility") }), "Đã ghi hoạt động.");
  });
  document.querySelector<HTMLFormElement>("[data-runtime-note]")?.addEventListener("submit", (event) => {
    event.preventDefault(); if (!recordId) return;
    const form = event.currentTarget as HTMLFormElement; if (!form.reportValidity()) return; const data = new FormData(form);
    void runAction(form.querySelector('button[type="submit"]'), () => request(`/api/crm/leads/${recordId}/notes`, "POST", { content: data.get("content") }), "Đã lưu ghi chú nội bộ.");
  });
  document.querySelector<HTMLFormElement>("[data-runtime-quote-note]")?.addEventListener("submit", (event) => {
    event.preventDefault(); if (!recordId) return;
    const form = event.currentTarget as HTMLFormElement; if (!form.reportValidity()) return; const data = new FormData(form);
    void runAction(form.querySelector('button[type="submit"]'), () => request(`/api/crm/quotes/${recordId}/notes`, "POST", { content: data.get("content") }), "Đã lưu ghi chú nội bộ.");
  });

  document.querySelectorAll<HTMLFormElement>("[data-demo-form], .crm-inline-panel:not([data-runtime-follow-up]), .crm-note-composer:not([data-runtime-note]):not([data-runtime-activity]), .crm-note-inline:not([data-runtime-quote-note])").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (submit) { submit.disabled = true; submit.setAttribute("aria-busy", "true"); }
      window.setTimeout(() => {
        if (submit) { submit.disabled = false; submit.setAttribute("aria-busy", "false"); }
        showToast(form.classList.contains("crm-note-composer") || form.classList.contains("crm-note-inline") ? "Đã lưu ghi chú nội bộ." : form.classList.contains("follow-up-editor") ? "Đã lưu follow-up." : "Đã lưu dữ liệu minh họa.");
        if (form.hasAttribute("data-inline-panel")) form.hidden = true;
      }, 450);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-demo-action]").forEach((button) => button.addEventListener("click", () => showToast("Tác vụ đã sẵn sàng để kết nối backend trong phase tích hợp.")));
  const leadStatusMap: Record<string, string> = { new: "NEW", contacted: "CONTACTED", qualified: "QUALIFIED", "quote-sent": "QUOTE_SENT", negotiating: "NEGOTIATING", won: "WON", lost: "LOST" };
  document.querySelectorAll<HTMLButtonElement>("[data-save-status]").forEach((button) => button.addEventListener("click", () => {
    if (!recordId || !entity) return;
    const statusControl = button.closest("section")?.querySelector<HTMLSelectElement>("[data-status-select]");
    const assignment = button.closest("section")?.querySelector<HTMLSelectElement>("[data-assignment-select]");
    const status = entity === "lead" ? leadStatusMap[statusControl?.value || ""] || statusControl?.value : statusControl?.value;
    void runAction(button, async () => {
      if (status) await request(`/api/crm/${entity}s/${recordId}`, "PATCH", { status });
      if (assignment?.value && assignment.value !== assignment.dataset.initialAssignment) await request(`/api/crm/${entity}s/${recordId}`, "PATCH", { assignedToId: assignment.value });
    }, "Đã cập nhật trạng thái và người phụ trách.");
  }));
  document.querySelector<HTMLButtonElement>("[data-send-quote]")?.addEventListener("click", (event) => {
    if (!recordId) return;
    void runAction(event.currentTarget as HTMLButtonElement, () => request(`/api/crm/quotes/${recordId}`, "PATCH", { status: "QUOTE_SENT" }), "Đã cập nhật trạng thái: đã gửi báo giá.");
  });
  document.querySelectorAll<HTMLButtonElement>("[data-complete-followup]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.followupId;
    if (id) { void runAction(button, () => request(`/api/crm/follow-ups/${id}`, "PATCH", { completed: true }), "Đã đánh dấu follow-up hoàn tất."); return; }
    const row = button.closest<HTMLElement>("article");
    const state = row?.querySelector<HTMLElement>(".follow-up-state");
    if (state) { state.textContent = "Hoàn tất"; state.className = "follow-up-state follow-up-done"; }
    button.disabled = true;
    showToast("Đã đánh dấu follow-up hoàn tất.");
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-export]").forEach((button) => button.addEventListener("click", () => showToast("Bản xuất sẽ được tạo khi API CRM được kết nối.")));
}
};

document.addEventListener("astro:page-load", initCrm);
