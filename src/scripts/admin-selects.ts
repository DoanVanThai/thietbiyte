type EnhancedSelect = { select: HTMLSelectElement; trigger: HTMLButtonElement; sync: () => void; close: (restoreFocus?: boolean) => void };

let selectLifecycle: AbortController | undefined;
const initAdminSelects = () => {
selectLifecycle?.abort();
selectLifecycle = new AbortController();
const { signal } = selectLifecycle;
const candidates = Array.from(document.querySelectorAll<HTMLSelectElement>(".admin-main select:not([multiple]):not([data-native-select])"))
  .filter((select) => select.dataset.searchable !== undefined || select.options.length >= 5);

if (candidates.length) {
  const enhanced: EnhancedSelect[] = [];
  let activeControl: EnhancedSelect | null = null;
  let sequence = 0;
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();

  candidates.forEach((select) => {
    if (select.dataset.selectEnhanced === "true") return;
    select.dataset.selectEnhanced = "true";
    const originalId = select.id;
    const controlId = originalId || `admin-select-${++sequence}`;
    if (originalId) select.id = `${originalId}-native`;

    const control = document.createElement("div");
    control.className = "admin-select-control";
    select.before(control);
    control.append(select);
    select.classList.add("admin-native-select");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.id = controlId;
    trigger.className = "admin-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.disabled = select.disabled;
    const triggerLabel = document.createElement("span");
    const caret = document.createElement("i");
    caret.className = "ph ph-caret-down";
    caret.setAttribute("aria-hidden", "true");
    trigger.append(triggerLabel, caret);
    control.prepend(trigger);

    const popover = document.createElement("div");
    popover.className = "admin-select-popover";
    popover.id = `${controlId}-popover`;
    popover.setAttribute("popover", "manual");
    trigger.setAttribute("aria-controls", popover.id);

    const searchWrap = document.createElement("div");
    searchWrap.className = "admin-select-search";
    const searchIcon = document.createElement("i");
    searchIcon.className = "ph ph-magnifying-glass";
    searchIcon.setAttribute("aria-hidden", "true");
    const search = document.createElement("input");
    search.type = "search";
    search.autocomplete = "off";
    search.placeholder = "Tìm lựa chọn...";
    search.setAttribute("role", "combobox");
    search.setAttribute("aria-autocomplete", "list");
    search.setAttribute("aria-expanded", "false");
    const escapeHint = document.createElement("kbd");
    escapeHint.textContent = "Esc";
    searchWrap.append(searchIcon, search, escapeHint);

    const optionsList = document.createElement("div");
    optionsList.className = "admin-select-options";
    optionsList.id = `${controlId}-listbox`;
    optionsList.setAttribute("role", "listbox");
    search.setAttribute("aria-controls", optionsList.id);
    popover.append(searchWrap, optionsList);
    document.body.append(popover);

    let optionButtons: HTMLButtonElement[] = [];
    let activeIndex = -1;

    const sync = () => {
      triggerLabel.textContent = select.selectedOptions[0]?.textContent?.trim() || "Chọn một giá trị";
      trigger.disabled = select.disabled;
    };
    const close = (restoreFocus = false) => {
      if (!popover.matches(":popover-open")) return;
      popover.hidePopover();
      trigger.setAttribute("aria-expanded", "false");
      search.setAttribute("aria-expanded", "false");
      search.removeAttribute("aria-activedescendant");
      if (activeControl?.select === select) activeControl = null;
      if (restoreFocus) trigger.focus({ preventScroll: true });
    };
    const controlState: EnhancedSelect = { select, trigger, sync, close };
    enhanced.push(controlState);

    const choose = (value: string) => {
      if (select.value !== value) {
        select.value = value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      sync();
      close(true);
    };
    const setActive = (index: number) => {
      if (!optionButtons.length) return;
      activeIndex = (index + optionButtons.length) % optionButtons.length;
      optionButtons.forEach((button, buttonIndex) => button.classList.toggle("is-active", buttonIndex === activeIndex));
      const active = optionButtons[activeIndex];
      search.setAttribute("aria-activedescendant", active.id);
      active.scrollIntoView({ block: "nearest" });
    };
    const render = () => {
      const query = normalize(search.value);
      const choices = Array.from(select.options).filter((option) => !option.disabled && (!query || normalize(option.textContent || "").includes(query)));
      optionsList.replaceChildren();
      optionButtons = choices.map((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.id = `${controlId}-option-${index}`;
        button.className = "admin-select-option";
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", String(option.value === select.value));
        button.textContent = option.textContent?.trim() || option.value;
        button.addEventListener("click", () => choose(option.value));
        optionsList.append(button);
        return button;
      });
      if (!choices.length) {
        const empty = document.createElement("div");
        empty.className = "admin-select-empty";
        empty.setAttribute("role", "status");
        empty.textContent = "Không tìm thấy lựa chọn phù hợp.";
        optionsList.append(empty);
      }
      activeIndex = Math.max(0, choices.findIndex((option) => option.value === select.value));
      if (optionButtons.length) optionButtons[activeIndex]?.classList.add("is-active");
    };
    const position = () => {
      const rect = trigger.getBoundingClientRect();
      const viewportGap = 8;
      const width = Math.min(Math.max(rect.width, 280), window.innerWidth - viewportGap * 2);
      const left = Math.min(Math.max(viewportGap, rect.left), window.innerWidth - width - viewportGap);
      const below = window.innerHeight - rect.bottom - viewportGap;
      const above = rect.top - viewportGap;
      const placeBelow = below >= Math.min(280, above) || below >= above;
      const available = Math.max(180, (placeBelow ? below : above) - 6);
      popover.style.setProperty("--admin-select-width", `${width}px`);
      popover.style.setProperty("--admin-select-max-height", `${Math.min(340, available)}px`);
      popover.style.left = `${left}px`;
      popover.style.top = placeBelow ? `${rect.bottom + 6}px` : "auto";
      popover.style.bottom = placeBelow ? "auto" : `${window.innerHeight - rect.top + 6}px`;
    };
    const open = () => {
      if (trigger.disabled) return;
      activeControl?.close();
      activeControl = controlState;
      search.value = "";
      render();
      position();
      popover.showPopover();
      trigger.setAttribute("aria-expanded", "true");
      search.setAttribute("aria-expanded", "true");
      requestAnimationFrame(() => { search.focus({ preventScroll: true }); search.select(); });
    };

    trigger.addEventListener("click", () => popover.matches(":popover-open") ? close() : open());
    trigger.addEventListener("keydown", (event) => {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); open(); }
    });
    search.addEventListener("input", render);
    search.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") { event.preventDefault(); setActive(activeIndex + 1); }
      else if (event.key === "ArrowUp") { event.preventDefault(); setActive(activeIndex - 1); }
      else if (event.key === "Enter" && optionButtons[activeIndex]) { event.preventDefault(); optionButtons[activeIndex].click(); }
      else if (event.key === "Escape") { event.preventDefault(); close(true); }
      else if (event.key === "Tab") close();
    });
    select.addEventListener("change", sync);
    select.form?.addEventListener("reset", () => window.setTimeout(sync));
    sync();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!activeControl) return;
    const target = event.target as Node;
    const popover = document.getElementById(activeControl.trigger.getAttribute("aria-controls") || "");
    if (!activeControl.trigger.contains(target) && !popover?.contains(target)) activeControl.close();
  }, { signal });
  window.addEventListener("resize", () => activeControl?.close(), { signal });
  window.addEventListener("scroll", () => activeControl?.close(), { capture: true, signal });
  document.addEventListener("click", (event) => {
    if ((event.target as Element).closest("[data-clear-filters], [data-reset-articles], [data-filter-reset], [data-user-reset]")) {
      window.setTimeout(() => enhanced.forEach((control) => control.sync()));
    }
  }, { signal });
}
};

document.addEventListener("astro:page-load", initAdminSelects);
