const initAdminAudit = () => {
const auditPage = document.querySelector<HTMLElement>("[data-audit-page]");

if (auditPage) {
  const form = auditPage.querySelector<HTMLFormElement>("[data-audit-filters]");
  const search = auditPage.querySelector<HTMLInputElement>("[data-audit-search]");
  const group = auditPage.querySelector<HTMLSelectElement>("[data-audit-group]");
  const outcome = auditPage.querySelector<HTMLSelectElement>("[data-audit-outcome]");
  const date = auditPage.querySelector<HTMLInputElement>("[data-audit-date]");
  const rows = Array.from(auditPage.querySelectorAll<HTMLTableRowElement>("[data-audit-row]"));
  const count = auditPage.querySelector<HTMLElement>("[data-audit-count]");
  const empty = auditPage.querySelector<HTMLTableRowElement>("[data-audit-empty]");
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();

  const filter = () => {
    const query = normalize(search?.value || "");
    let visible = 0;
    rows.forEach((row) => {
      const matches = (!query || normalize(row.dataset.search || "").includes(query))
        && (!group?.value || row.dataset.group === group.value)
        && (!outcome?.value || row.dataset.outcome === outcome.value)
        && (!date?.value || (row.dataset.date || "") >= date.value);
      row.hidden = !matches;
      if (matches) visible += 1;
    });
    if (count) count.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
  };

  form?.addEventListener("input", filter);
  form?.addEventListener("change", filter);
  form?.addEventListener("reset", () => window.setTimeout(filter));

  auditPage.querySelector<HTMLButtonElement>("[data-audit-export]")?.addEventListener("click", () => {
    const visibleRows = rows.filter((row) => !row.hidden);
    const header = ["Thời gian", "Người thực hiện", "Hành động", "Tài nguyên", "Kết quả"];
    const cells = visibleRows.map((row) => Array.from(row.cells).slice(0, 5).map((cell) => `"${cell.innerText.replaceAll('"', '""').replace(/\s+/g, " ").trim()}"`));
    const csv = `\uFEFF${[header, ...cells].map((line) => line.join(",")).join("\n")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
}
};

document.addEventListener("astro:page-load", initAdminAudit);
