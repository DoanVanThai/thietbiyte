const initAdminAccess = () => {
const accessRoot = document.querySelector<HTMLElement>(".admin-access-root");

if (accessRoot) {
  const toast = document.querySelector<HTMLElement>("[data-admin-toast]");
  let toastTimer = 0;
  const showToast = (message: string) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => { toast.hidden = true; }, 160);
    }, 2600);
  };

  accessRoot.querySelectorAll<HTMLElement>("[data-admin-toast-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", () => showToast(trigger.dataset.adminToastTrigger || "Đã ghi nhận thao tác."));
  });

  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();
  const userRows = Array.from(accessRoot.querySelectorAll<HTMLTableRowElement>("[data-user-row]"));
  const userSearch = accessRoot.querySelector<HTMLInputElement>("[data-user-search]");
  const userRole = accessRoot.querySelector<HTMLSelectElement>("[data-user-role]");
  const userStatus = accessRoot.querySelector<HTMLSelectElement>("[data-user-status]");
  const userOrganization = accessRoot.querySelector<HTMLSelectElement>("[data-user-organization]");
  const userCount = accessRoot.querySelector<HTMLElement>("[data-user-count]");
  const userEmpty = accessRoot.querySelector<HTMLTableRowElement>("[data-user-empty]");

  const filterUsers = () => {
    const query = normalize(userSearch?.value || "");
    let visibleCount = 0;
    userRows.forEach((row) => {
      const visible = (!query || normalize(row.dataset.search || "").includes(query))
        && (!userRole?.value || (row.dataset.role || "").split(" ").includes(userRole.value))
        && (!userStatus?.value || row.dataset.status === userStatus.value)
        && (!userOrganization?.value || row.dataset.organization === userOrganization.value);
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    if (userCount) userCount.textContent = String(visibleCount);
    if (userEmpty) userEmpty.hidden = visibleCount > 0;
  };

  [userSearch, userRole, userStatus, userOrganization].forEach((control) => {
    control?.addEventListener(control instanceof HTMLInputElement ? "input" : "change", filterUsers);
  });
  accessRoot.querySelector<HTMLFormElement>("[data-user-filters]")?.addEventListener("reset", () => window.setTimeout(filterUsers));

  const confirmDialog = document.querySelector<HTMLDialogElement>("[data-admin-confirm]");
  const confirmTitle = confirmDialog?.querySelector<HTMLElement>("[data-confirm-title]");
  const confirmDescription = confirmDialog?.querySelector<HTMLElement>("[data-confirm-description]");
  const confirmImpact = confirmDialog?.querySelector<HTMLElement>("[data-confirm-impact]");
  const confirmSubmit = confirmDialog?.querySelector<HTMLButtonElement>("[data-confirm-submit]");
  let pendingMessage = "Đã xác nhận thao tác.";
  let pendingAction = "";
  let pendingUserId = "";
  let pendingRoleId = "";

  const confirmationCopy: Record<string, { title: string; description: (name: string) => string; impact: string; action: string; done: string }> = {
    "disable-user": {
      title: "Vô hiệu hóa người dùng?",
      description: (name) => `${name} sẽ không thể đăng nhập sau khi thay đổi được backend xác nhận.`,
      impact: "Các phiên đang hoạt động nên được thu hồi. Dữ liệu và audit history của người dùng vẫn được giữ lại.",
      action: "Vô hiệu hóa",
      done: "Đã ghi nhận yêu cầu vô hiệu hóa người dùng.",
    },
    "remove-admin": {
      title: "Gỡ vai trò Admin?",
      description: (name) => `${name} sẽ mất các quyền quản trị gắn với vai trò Admin.`,
      impact: "Hãy xác nhận người dùng vẫn còn ít nhất một vai trò phù hợp. Backend phải chặn thao tác nếu vi phạm policy bảo vệ quản trị viên.",
      action: "Gỡ Admin",
      done: "Đã ghi nhận yêu cầu gỡ vai trò Admin.",
    },
    "delete-role": {
      title: "Xóa vai trò tùy chỉnh?",
      description: (name) => `Vai trò ${name} sẽ không còn khả dụng để gán cho người dùng.`,
      impact: "Chỉ được xóa khi backend xác nhận không còn người dùng phụ thuộc hoặc đã có vai trò thay thế.",
      action: "Xóa vai trò",
      done: "Đã ghi nhận yêu cầu xóa vai trò.",
    },
    "end-session": {
      title: "Kết thúc phiên đăng nhập?",
      description: (name) => `Phiên ${name} sẽ cần đăng nhập lại.`,
      impact: "Phiên hiện tại của quản trị viên không bị ảnh hưởng.",
      action: "Kết thúc phiên",
      done: "Đã ghi nhận yêu cầu kết thúc phiên.",
    },
    "end-sessions": {
      title: "Đăng xuất các phiên khác?",
      description: (name) => `Tất cả phiên khác của ${name} sẽ cần đăng nhập lại.`,
      impact: "Giữ nguyên phiên hiện tại và ghi thao tác vào audit log.",
      action: "Đăng xuất phiên khác",
      done: "Đã ghi nhận yêu cầu thu hồi các phiên khác.",
    },
  };

  accessRoot.querySelectorAll<HTMLButtonElement>("[data-confirm-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const config = confirmationCopy[button.dataset.confirmAction || ""];
      if (!confirmDialog || !config) return;
      const name = button.dataset.confirmName || "người dùng này";
      if (confirmTitle) confirmTitle.textContent = config.title;
      if (confirmDescription) confirmDescription.textContent = config.description(name);
      if (confirmImpact) confirmImpact.textContent = config.impact;
      if (confirmSubmit) confirmSubmit.textContent = config.action;
      pendingMessage = config.done;
      pendingAction = button.dataset.confirmAction || "";
      pendingUserId = button.dataset.userId || "";
      pendingRoleId = button.dataset.roleId || "";
      confirmDialog.showModal();
    });
  });

  confirmDialog?.addEventListener("close", async () => {
    if (confirmDialog.returnValue !== "confirm") return;
    let response: Response | null = null;
    if (pendingAction === "disable-user" && pendingUserId) response = await fetch(`/api/admin/users/${encodeURIComponent(pendingUserId)}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "DISABLED" }) });
    if (pendingAction === "delete-role" && pendingRoleId) response = await fetch(`/api/admin/roles/${encodeURIComponent(pendingRoleId)}`, { method: "DELETE" });
    if (pendingAction === "remove-admin" && pendingUserId) {
      const roleIds = Array.from(accessRoot.querySelectorAll<HTMLAnchorElement>(".admin-role-chip[href*='/admin/roles/']")).map((link) => link.href.split("/").pop() || "").filter((roleId) => roleId && roleId !== "admin");
      response = await fetch(`/api/admin/users/${encodeURIComponent(pendingUserId)}/roles`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ roleIds }) });
    }
    if (!response) { showToast(pendingMessage); return; }
    const result = await response.json() as { message?: string };
    if (response.ok) { showToast(pendingMessage); window.setTimeout(() => document.dispatchEvent(new Event("admin:refresh")), 300); }
    else showToast(result.message || "Không thể thực hiện thao tác.");
  });

  const roleEditor = accessRoot.querySelector<HTMLFormElement>("[data-role-editor]");
  const roleCheckboxes = Array.from(accessRoot.querySelectorAll<HTMLInputElement>("[data-permission-checkbox]"));
  const selectedCount = accessRoot.querySelector<HTMLElement>("[data-role-selected-count]");
  const updateRoleCounts = () => {
    if (selectedCount) selectedCount.textContent = String(roleCheckboxes.filter((checkbox) => checkbox.checked).length);
    accessRoot.querySelectorAll<HTMLElement>("[data-permission-group]").forEach((group) => {
      const checkboxes = Array.from(group.querySelectorAll<HTMLInputElement>("[data-permission-checkbox]"));
      const count = group.querySelector<HTMLElement>("[data-group-count]");
      if (count) count.textContent = `${checkboxes.filter((checkbox) => checkbox.checked).length}/${checkboxes.length}`;
    });
  };
  roleCheckboxes.forEach((checkbox) => checkbox.addEventListener("change", updateRoleCounts));
  accessRoot.querySelectorAll<HTMLElement>("[data-permission-group]").forEach((group) => {
    const setGroup = (checked: boolean) => {
      group.querySelectorAll<HTMLInputElement>("[data-permission-checkbox]:not(:disabled)").forEach((checkbox) => { checkbox.checked = checked; });
      updateRoleCounts();
    };
    group.querySelector<HTMLButtonElement>("[data-select-group]")?.addEventListener("click", () => setGroup(true));
    group.querySelector<HTMLButtonElement>("[data-clear-group]")?.addEventListener("click", () => setGroup(false));
  });
  accessRoot.querySelector<HTMLButtonElement>("[data-expand-permission-groups]")?.addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const groups = Array.from(accessRoot.querySelectorAll<HTMLDetailsElement>("[data-permission-group]"));
    const shouldOpen = groups.some((group) => !group.open);
    groups.forEach((group) => { group.open = shouldOpen; });
    button.textContent = shouldOpen ? "Thu gọn tất cả" : "Mở tất cả nhóm";
  });
  roleEditor?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (roleEditor.dataset.roleImmutable === "true") return;
    const roleId = roleEditor.dataset.roleId;
    const response = await fetch(`/api/admin/roles/${encodeURIComponent(roleId || "")}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: roleEditor.querySelector<HTMLInputElement>('[name="roleName"]')?.value, description: roleEditor.querySelector<HTMLTextAreaElement>('[name="description"]')?.value, permissionIds: roleCheckboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value) }) });
    const result = await response.json() as { message?: string };
    showToast(response.ok ? "Đã lưu vai trò và ghi audit log." : result.message || "Không thể lưu vai trò.");
  });

  const userRoleForm = accessRoot.querySelector<HTMLFormElement>("[data-user-role-form]");
  userRoleForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const roleIds = Array.from(userRoleForm.querySelectorAll<HTMLInputElement>('[name="role"]:checked')).map((input) => input.value);
    const message = userRoleForm.querySelector<HTMLElement>("[data-user-role-message]");
    const submit = userRoleForm.querySelector<HTMLButtonElement>('[type="submit"]');
    if (!roleIds.length) {
      if (message) message.textContent = "Hãy chọn ít nhất một vai trò.";
      return;
    }
    if (submit) { submit.disabled = true; submit.setAttribute("aria-busy", "true"); }
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userRoleForm.dataset.userId || "")}/roles`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roleIds }),
    });
    const result = await response.json() as { message?: string };
    if (message) message.textContent = response.ok ? "Đã lưu vai trò. Các phiên cũ đã được thu hồi." : result.message || "Không thể lưu vai trò.";
    if (response.ok) { showToast("Đã cập nhật vai trò và ghi audit log."); window.setTimeout(() => document.dispatchEvent(new Event("admin:refresh")), 300); }
    else if (submit) { submit.disabled = false; submit.removeAttribute("aria-busy"); }
  });

  accessRoot.querySelectorAll<HTMLElement>("[data-matrix-group]").forEach((group) => {
    const setMatrixGroup = (roleId: string, checked: boolean) => {
      group.querySelectorAll<HTMLInputElement>(`[data-matrix-checkbox][data-role="${roleId}"]:not(:disabled)`).forEach((checkbox) => { checkbox.checked = checked; });
    };
    group.querySelectorAll<HTMLButtonElement>("[data-matrix-select]").forEach((button) => button.addEventListener("click", () => setMatrixGroup(button.dataset.matrixSelect || "", true)));
    group.querySelectorAll<HTMLButtonElement>("[data-matrix-clear]").forEach((button) => button.addEventListener("click", () => setMatrixGroup(button.dataset.matrixClear || "", false)));
  });
  accessRoot.querySelector<HTMLButtonElement>("[data-save-matrix]")?.addEventListener("click", async () => {
    const checkboxes = Array.from(accessRoot.querySelectorAll<HTMLInputElement>("[data-matrix-checkbox]:not(:disabled)"));
    const roleIds = [...new Set(checkboxes.map((checkbox) => checkbox.dataset.role || "").filter(Boolean))];
    const responses = await Promise.all(roleIds.map((roleId) => fetch(`/api/admin/roles/${encodeURIComponent(roleId)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ permissionIds: checkboxes.filter((checkbox) => checkbox.dataset.role === roleId && checkbox.checked).map((checkbox) => checkbox.dataset.permission) }) })));
    showToast(responses.every((response) => response.ok) ? "Đã lưu ma trận quyền và ghi audit log." : "Có vai trò chưa thể cập nhật.");
  });

  const createRoleDialog = document.querySelector<HTMLDialogElement>("[data-create-role-dialog]");
  accessRoot.querySelector<HTMLButtonElement>("[data-create-role]")?.addEventListener("click", () => createRoleDialog?.showModal());
  createRoleDialog?.querySelector<HTMLButtonElement>("[data-create-role-cancel]")?.addEventListener("click", () => createRoleDialog.close());
  createRoleDialog?.querySelector<HTMLFormElement>("[data-create-role-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement;
    const response = await fetch("/api/admin/roles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(new FormData(form).entries()), permissionIds: [] }) });
    const result = await response.json() as { role?: { id: string }; message?: string };
    if (response.ok && result.role) document.dispatchEvent(new CustomEvent("admin:navigate", { detail: `/admin/roles/${encodeURIComponent(result.role.id)}` })); else showToast(result.message || "Không thể tạo vai trò.");
  });
}
};

document.addEventListener("astro:page-load", initAdminAccess);
