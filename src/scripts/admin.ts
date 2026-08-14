type AdminProduct = { id: string; label: string; meta: string; href: string; image: string; keywords: string };
type StoredQuote = {
  id: string;
  date: string;
  status: string;
  customer: { name: string; email: string; unit: string };
  items: Array<{ productId: string; quantity: number; name: string; model: string }>;
};

let adminLifecycle: AbortController | undefined;
const initAdmin = () => {
adminLifecycle?.abort();
adminLifecycle = new AbortController();
const { signal } = adminLifecycle;
const shell = document.querySelector<HTMLElement>("[data-admin-shell]");

if (shell) {
  const sidebar = shell.querySelector<HTMLElement>("[data-admin-sidebar]");
  const backdrop = shell.querySelector<HTMLElement>("[data-sidebar-backdrop]");
  const collapseButton = shell.querySelector<HTMLButtonElement>("[data-sidebar-collapse]");
  const mobileMenuButton = shell.querySelector<HTMLButtonElement>("[data-admin-menu-open]");
  const dashboard = shell.querySelector<HTMLElement>("[data-admin-dashboard]");
  const moduleView = shell.querySelector<HTMLElement>("[data-admin-module]");
  const toast = document.querySelector<HTMLElement>("[data-admin-toast]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let toastTimer = 0;
  let mobileSidebarReturnFocus: HTMLElement | null = null;

  const safeJson = <T>(value: string | null, fallback: T): T => {
    try { return JSON.parse(value || "") as T; } catch { return fallback; }
  };
  const showToast = (message: string) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => { toast.hidden = true; }, reduceMotion.matches ? 0 : 150);
    }, 2200);
  };

  const setCollapsed = (collapsed: boolean) => {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    collapseButton?.setAttribute("aria-expanded", String(!collapsed));
    collapseButton?.setAttribute("aria-label", collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng");
    try { localStorage.setItem("tlm-admin-sidebar-collapsed", String(collapsed)); } catch { /* optional preference */ }
  };
  try { setCollapsed(localStorage.getItem("tlm-admin-sidebar-collapsed") === "true"); } catch { setCollapsed(false); }
  collapseButton?.addEventListener("click", () => setCollapsed(!document.body.classList.contains("sidebar-collapsed")), { signal });

  const closeMobileSidebar = () => {
    document.body.classList.remove("sidebar-open");
    if (backdrop) backdrop.hidden = true;
    mobileMenuButton?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("has-modal-open");
    mobileSidebarReturnFocus?.focus({ preventScroll: true });
    mobileSidebarReturnFocus = null;
  };
  mobileMenuButton?.addEventListener("click", () => {
    mobileSidebarReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : mobileMenuButton;
    document.body.classList.add("sidebar-open");
    if (backdrop) backdrop.hidden = false;
    mobileMenuButton.setAttribute("aria-expanded", "true");
    document.body.classList.add("has-modal-open");
    requestAnimationFrame(() => sidebar?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus({ preventScroll: true }));
  }, { signal });
  backdrop?.addEventListener("click", closeMobileSidebar, { signal });
  sidebar?.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => link.addEventListener("click", closeMobileSidebar, { signal }));
  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("sidebar-open") || !sidebar) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileSidebar();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(sidebar.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((item) => !item.hidden && item.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }, { signal });

  const sectionLabels: Record<string, string> = {
    "san-pham": "Sản phẩm", "danh-muc": "Danh mục", "thuong-hieu": "Thương hiệu", "chuyen-khoa": "Chuyên khoa",
    "bao-gia": "Yêu cầu báo giá", crm: "CRM", "khach-hang": "Khách hàng", "du-an": "Dự án", "noi-dung": "Nội dung",
    "tai-lieu": "Tài liệu", media: "Thư viện media", "nguoi-dung": "Người dùng", "vai-tro": "Vai trò", "phan-quyen": "Ma trận quyền", "audit-logs": "Audit Logs", "cai-dat": "Cài đặt",
  };
  const currentUrl = new URL(window.location.href);
  const adminNavItems = Array.from(shell.querySelectorAll<HTMLAnchorElement>("[data-admin-nav-item]"));
  const matchingPathItem = adminNavItems
    .map((link) => ({ link, target: new URL(link.href) }))
    .filter(({ target }) => {
      if (target.pathname === "/admin" && target.searchParams.has("section")) return false;
      return currentUrl.pathname === target.pathname || currentUrl.pathname.startsWith(`${target.pathname}/`);
    })
    .sort((a, b) => b.target.pathname.length - a.target.pathname.length)[0]?.link;
  const activeSection = currentUrl.pathname === "/admin"
    ? currentUrl.searchParams.get("section") || "tong-quan"
    : matchingPathItem?.dataset.adminNavSection || "";
  adminNavItems.forEach((link) => {
    const linkSection = link.dataset.adminNavSection || new URL(link.href).searchParams.get("section") || "";
    const active = activeSection === linkSection;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
  const sectionViews = Array.from(shell.querySelectorAll<HTMLElement>("[data-admin-section]"));
  const requestedView = sectionViews.find((view) => view.dataset.adminSection === activeSection);
  if (activeSection !== "tong-quan" && sectionLabels[activeSection]) {
    if (requestedView) {
      sectionViews.forEach((view) => { view.hidden = view !== requestedView; });
    } else {
      if (dashboard) dashboard.hidden = true;
      if (moduleView) moduleView.hidden = false;
      const title = moduleView?.querySelector<HTMLElement>("[data-admin-module-title]");
      if (title) title.textContent = sectionLabels[activeSection];
    }
    const breadcrumb = shell.querySelector<HTMLElement>(".admin-topbar-context nav [aria-current='page']");
    if (breadcrumb) breadcrumb.textContent = sectionLabels[activeSection];
    document.title = `${sectionLabels[activeSection]} | Thiên Lộc Group Admin`;
  } else if (sectionViews.length) {
    sectionViews.forEach((view) => { view.hidden = view.dataset.adminSection !== "tong-quan"; });
  }

  const products = safeJson<AdminProduct[]>(document.getElementById("admin-product-index")?.textContent || "", []);
  const navSearchItems = adminNavItems.map((link) => ({
    label: link.dataset.adminNavLabel || "", meta: "Chức năng quản trị", href: link.href, icon: link.querySelector("i")?.className || "ph ph-arrow-right",
  }));
  const searchInput = shell.querySelector<HTMLInputElement>("[data-admin-search-input]");
  const searchResults = shell.querySelector<HTMLElement>("[data-admin-search-results]");
  const mobileSearchToggle = shell.querySelector<HTMLButtonElement>("[data-admin-search-toggle]");
  let activeSearchIndex = -1;
  let searchOptions: HTMLAnchorElement[] = [];
  const closeMobileSearch = () => {
    shell.classList.remove("is-admin-search-open");
    mobileSearchToggle?.setAttribute("aria-expanded", "false");
  };
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
  const renderSearch = () => {
    if (!searchInput || !searchResults) return;
    const query = normalize(searchInput.value);
    activeSearchIndex = -1;
    searchInput.removeAttribute("aria-activedescendant");
    searchResults.replaceChildren();
    if (!query) { searchResults.hidden = true; searchInput.setAttribute("aria-expanded", "false"); return; }
    const matches = [
      ...navSearchItems.filter((item) => normalize(item.label).includes(query)).map((item) => ({ ...item, type: "Chức năng" })),
      ...products.filter((item) => normalize(item.keywords).includes(query)).slice(0, 5).map((item) => ({ ...item, icon: "ph ph-package", type: "Sản phẩm" })),
    ].slice(0, 8);
    if (!matches.length) {
      const empty = document.createElement("div"); empty.className = "admin-search-empty"; empty.setAttribute("role", "status"); empty.textContent = "Không tìm thấy kết quả phù hợp."; searchResults.append(empty);
    } else {
      matches.forEach((item, index) => {
        const link = document.createElement("a"); link.id = `admin-search-option-${index}`; link.href = item.href; link.setAttribute("role", "option"); link.setAttribute("aria-selected", "false"); link.tabIndex = -1;
        const icon = document.createElement("i"); icon.className = item.icon; icon.setAttribute("aria-hidden", "true");
        const copy = document.createElement("span");
        const label = document.createElement("strong"); label.textContent = item.label;
        const meta = document.createElement("small"); meta.textContent = `${item.type} · ${item.meta}`;
        copy.append(label, meta); link.append(icon, copy); searchResults.append(link);
      });
    }
    searchOptions = Array.from(searchResults.querySelectorAll<HTMLAnchorElement>("[role='option']"));
    searchResults.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  };
  const setActiveSearchOption = (index: number) => {
    if (!searchInput || !searchOptions.length) return;
    activeSearchIndex = (index + searchOptions.length) % searchOptions.length;
    searchOptions.forEach((option, optionIndex) => option.setAttribute("aria-selected", String(optionIndex === activeSearchIndex)));
    const active = searchOptions[activeSearchIndex];
    searchInput.setAttribute("aria-activedescendant", active.id);
    active.scrollIntoView({ block: "nearest" });
  };
  searchInput?.addEventListener("input", renderSearch, { signal });
  mobileSearchToggle?.addEventListener("click", () => {
    const open = !shell.classList.contains("is-admin-search-open");
    shell.classList.toggle("is-admin-search-open", open);
    mobileSearchToggle.setAttribute("aria-expanded", String(open));
    if (open) requestAnimationFrame(() => searchInput?.focus());
    else {
      if (searchResults) searchResults.hidden = true;
      searchInput?.setAttribute("aria-expanded", "false");
    }
  }, { signal });
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveSearchOption(activeSearchIndex + 1); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveSearchOption(activeSearchIndex - 1); }
    if (event.key === "Enter" && activeSearchIndex >= 0) { event.preventDefault(); searchOptions[activeSearchIndex]?.click(); }
    if (event.key === "Escape") { searchInput.value = ""; renderSearch(); closeMobileSearch(); searchInput.blur(); }
  }, { signal });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase("vi") === "k") {
      event.preventDefault();
      shell.classList.add("is-admin-search-open");
      mobileSearchToggle?.setAttribute("aria-expanded", "true");
      searchInput?.focus();
    }
  }, { signal });
  document.addEventListener("click", (event) => {
    if (!(event.target as HTMLElement).closest("[data-admin-search], [data-admin-search-toggle]")) {
      if (searchResults) searchResults.hidden = true;
      searchInput?.setAttribute("aria-expanded", "false");
      closeMobileSearch();
    }
  }, { signal });

  let storedQuotes: StoredQuote[] = [];
  try { storedQuotes = safeJson<StoredQuote[]>(localStorage.getItem("tlm-public-quotes"), []); } catch { /* dashboard remains empty when storage is unavailable */ }
  const quotes = storedQuotes.filter((quote) => quote?.id && quote?.date && Array.isArray(quote.items));
  const quoteCount = quotes.filter((quote) => quote.status === "received").length;
  const processingCount = quotes.filter((quote) => ["processing", "consulting", "quoted"].includes(quote.status)).length;
  const customerCount = new Set(quotes.map((quote) => quote.customer?.email).filter(Boolean)).size;
  const setText = (selector: string, value: string) => { const target = shell.querySelector<HTMLElement>(selector); if (target) target.textContent = value; };
  setText("[data-kpi-new-quotes]", String(quoteCount));
  setText("[data-kpi-processing]", String(processingCount));
  setText("[data-kpi-customers]", String(customerCount));
  setText("[data-kpi-processing-note]", processingCount ? `${processingCount} yêu cầu cần theo dõi` : "Chưa có yêu cầu đang xử lý");
  setText("[data-kpi-customers-note]", customerCount ? `${customerCount} khách hàng từ yêu cầu báo giá` : "Chưa có dữ liệu khách hàng");

  const formatDate = (value: string, time = false) => new Intl.DateTimeFormat("vi-VN", time ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" }).format(new Date(value));
  const statusLabel = (status: string) => status === "received" ? "Đã tiếp nhận" : status === "processing" ? "Đang xử lý" : status === "quoted" ? "Đã báo giá" : "Đang tư vấn";
  const quoteTable = shell.querySelector<HTMLElement>("[data-admin-quotes-table]");
  const quoteEmpty = shell.querySelector<HTMLElement>("[data-admin-quotes-empty]");
  const quoteBody = shell.querySelector<HTMLElement>("[data-admin-quotes-body]");
  if (quotes.length && quoteTable && quoteEmpty && quoteBody) {
    quoteTable.hidden = false; quoteEmpty.hidden = true;
    [...quotes].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 6).forEach((quote) => {
      const row = document.createElement("tr");
      const productLabel = quote.items.length === 1 ? quote.items[0].name : `${quote.items[0]?.name || "Thiết bị"} +${quote.items.length - 1}`;
      row.innerHTML = `<td><strong>${quote.id}</strong></td><td><span>${quote.customer?.name || "Chưa có tên"}</span><small>${quote.customer?.unit || quote.customer?.email || ""}</small></td><td>${productLabel}</td><td>${formatDate(quote.date)}</td><td><span class="admin-status status-${quote.status}">${statusLabel(quote.status)}</span></td><td><a href="/yeu-cau-bao-gia/chi-tiet?id=${encodeURIComponent(quote.id)}" aria-label="Xem ${quote.id}"><i class="ph ph-arrow-up-right" aria-hidden="true"></i></a></td>`;
      quoteBody.append(row);
    });
  }

  const activity = shell.querySelector<HTMLOListElement>("[data-admin-activity]");
  const activityEmpty = shell.querySelector<HTMLElement>("[data-admin-activity-empty]");
  if (quotes.length && activity && activityEmpty) {
    activity.hidden = false; activityEmpty.hidden = true;
    [...quotes].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 6).forEach((quote) => {
      const item = document.createElement("li");
      item.innerHTML = `<span><i class="ph ph-file-plus" aria-hidden="true"></i></span><div><strong>Quote created</strong><p><b>${quote.id}</b> được tạo bởi ${quote.customer?.name || "khách hàng"}.</p><time datetime="${quote.date}">${formatDate(quote.date, true)}</time></div>`;
      activity.append(item);
    });
  }

  const monthCounts = new Map<string, number>();
  quotes.forEach((quote) => {
    const date = new Date(quote.date); if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
  });
  const chartPanel = shell.querySelector<HTMLElement>("[data-quotes-chart-panel]");
  const chart = shell.querySelector<HTMLElement>("[data-quotes-chart]");
  if (monthCounts.size && chartPanel && chart) {
    chartPanel.hidden = false;
    const max = Math.max(...monthCounts.values());
    const visibleMonths = [...monthCounts.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    chart.setAttribute("aria-label", `Biểu đồ số yêu cầu báo giá theo tháng: ${visibleMonths.map(([month, count]) => `${month}: ${count} yêu cầu`).join(", ")}`);
    visibleMonths.forEach(([month, count]) => {
      const item = document.createElement("div"); item.className = "admin-bar-item";
      const value = document.createElement("strong"); value.textContent = String(count);
      const bar = document.createElement("i"); bar.style.setProperty("--bar-height", `${Math.max(12, (count / max) * 100)}%`);
      const label = document.createElement("span"); const [year, number] = month.split("-"); label.textContent = `T${Number(number)}/${year.slice(2)}`;
      item.append(value, bar, label); chart.append(item);
    });
  }

  const interestCounts = new Map<string, { label: string; model: string; count: number }>();
  quotes.flatMap((quote) => quote.items).forEach((item) => {
    const current = interestCounts.get(item.productId) || { label: item.name, model: item.model, count: 0 };
    current.count += 1; interestCounts.set(item.productId, current);
  });
  const interestPanel = shell.querySelector<HTMLElement>("[data-interest-panel]");
  const interestList = shell.querySelector<HTMLOListElement>("[data-interest-list]");
  if (interestCounts.size && interestPanel && interestList) {
    interestPanel.hidden = false;
    [...interestCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5).forEach((product, index) => {
      const item = document.createElement("li"); item.innerHTML = `<span>${index + 1}</span><div><strong>${product.label}</strong><small>${product.model}</small></div><b>${product.count} yêu cầu</b>`; interestList.append(item);
    });
  }
  const noCharts = shell.querySelector<HTMLElement>("[data-dashboard-no-charts]");
  if (noCharts) noCharts.hidden = monthCounts.size > 0 || interestCounts.size > 0;

  shell.querySelectorAll<HTMLAnchorElement>(".admin-module-placeholder a, .admin-quick-actions a").forEach((link) => {
    if (link.classList.contains("button-outline")) return;
    link.addEventListener("click", () => showToast("Đang mở module quản trị tương ứng."), { signal });
  });
}
};

document.addEventListener("astro:page-load", initAdmin);
