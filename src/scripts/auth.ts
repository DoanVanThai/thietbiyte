const authForms = document.querySelectorAll<HTMLFormElement>("[data-auth-form]");

const errorMessage = (input: HTMLInputElement | HTMLSelectElement) => {
  if (input.validity.valueMissing) return input instanceof HTMLSelectElement ? "Vui lòng chọn một loại khách hàng." : "Vui lòng nhập thông tin này.";
  if (input.validity.typeMismatch) return "Email chưa đúng định dạng. Ví dụ: ten@congty.vn";
  if (input.validity.tooShort && input instanceof HTMLInputElement) return `Vui lòng nhập ít nhất ${input.minLength} ký tự.`;
  if (input.validity.patternMismatch && input.name === "phone") return "Số điện thoại cần có từ 9 đến 18 ký tự hợp lệ.";
  if (input.validity.patternMismatch) return "Thông tin chưa đúng định dạng yêu cầu.";
  if (input.validity.customError) return input.validationMessage;
  return "Vui lòng kiểm tra lại thông tin.";
};

const setFieldError = (input: HTMLInputElement | HTMLSelectElement, message = "") => {
  input.setAttribute("aria-invalid", String(Boolean(message)));
  const field = input.closest<HTMLElement>("[data-field]");
  const error = field?.querySelector<HTMLElement>("[data-field-error]");
  if (error) error.textContent = message;
};

document.querySelectorAll<HTMLButtonElement>("[data-password-toggle]").forEach((button) => {
  const input = button.closest(".password-control")?.querySelector<HTMLInputElement>("input");
  if (!input) return;
  button.addEventListener("click", () => {
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    button.setAttribute("aria-pressed", String(!visible));
    button.setAttribute("aria-label", `${visible ? "Hiện" : "Ẩn"} ${input.labels?.[0]?.textContent?.toLocaleLowerCase("vi") || "mật khẩu"}`);
    const icon = button.querySelector("i");
    icon?.classList.toggle("ph-eye", visible);
    icon?.classList.toggle("ph-eye-slash", !visible);
    input.focus({ preventScroll: true });
  });
});

const password = document.querySelector<HTMLInputElement>('[data-password="primary"]');
const confirmPassword = document.querySelector<HTMLInputElement>("[data-password-confirm]");
const rules = document.querySelectorAll<HTMLElement>("[data-password-rule]");

const updatePasswordRules = () => {
  if (!password) return;
  const tests: Record<string, boolean> = {
    length: password.value.length >= 10,
    letter: /[A-Za-zÀ-ỹ]/.test(password.value),
    number: /\d/.test(password.value),
    symbol: /[^A-Za-zÀ-ỹ\d\s]/.test(password.value),
  };
  rules.forEach((rule) => {
    const met = Boolean(tests[rule.dataset.passwordRule || ""]);
    const ruleLabel = rule.textContent?.trim() || "Yêu cầu mật khẩu";
    rule.classList.toggle("is-met", met);
    rule.setAttribute("aria-label", `${met ? "Đã đáp ứng" : "Chưa đáp ứng"}: ${ruleLabel}`);
    rule.querySelector("i")?.classList.toggle("ph-circle", !met);
    rule.querySelector("i")?.classList.toggle("ph-check-circle", met);
  });
  if (rules.length) {
    password.setCustomValidity(Object.values(tests).every(Boolean) ? "" : "Mật khẩu chưa đáp ứng đầy đủ các yêu cầu bên dưới.");
  }
  if (confirmPassword?.value) {
    confirmPassword.setCustomValidity(confirmPassword.value === password.value ? "" : "Mật khẩu xác nhận chưa khớp.");
  }
};

password?.addEventListener("input", updatePasswordRules);
confirmPassword?.addEventListener("input", () => {
  confirmPassword.setCustomValidity(confirmPassword.value === password?.value ? "" : "Mật khẩu xác nhận chưa khớp.");
  setFieldError(confirmPassword, confirmPassword.validity.customError ? confirmPassword.validationMessage : "");
});

updatePasswordRules();

type ApiResult = { ok?: boolean; code?: string; message?: string; redirect?: string; developmentUrl?: string };
const endpointFor: Record<string, string> = { login: "/api/auth/login", register: "/api/auth/register", forgot: "/api/auth/forgot-password", reset: "/api/auth/reset-password" };
const showPanel = (from: string, to: string) => {
  const formPanel = document.querySelector<HTMLElement>(from);
  const statePanel = document.querySelector<HTMLElement>(to);
  if (!formPanel || !statePanel) return;
  formPanel.hidden = true; statePanel.hidden = false;
  const heading = statePanel.querySelector<HTMLElement>("h2"); heading?.setAttribute("tabindex", "-1"); heading?.focus();
};
const formMessage = (form: HTMLFormElement) => {
  let message = form.querySelector<HTMLElement>("[data-form-message]");
  if (!message) {
    message = document.createElement("div"); message.className = "auth-form-message"; message.dataset.formMessage = ""; message.setAttribute("role", "alert"); message.hidden = true;
    message.innerHTML = '<i class="ph ph-warning-circle" aria-hidden="true"></i><span></span>'; form.prepend(message);
  }
  return message;
};

authForms.forEach((form) => {
  const inputs = form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select");
  inputs.forEach((input) => {
    input.addEventListener("blur", () => setFieldError(input, input.validity.valid ? "" : errorMessage(input)));
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") setFieldError(input, input.validity.valid ? "" : errorMessage(input));
      if (form.dataset.authForm === "login") {
        const message = form.querySelector<HTMLElement>("[data-form-message]");
        if (message) message.hidden = true;
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    updatePasswordRules();
    const invalidInputs: Array<HTMLInputElement | HTMLSelectElement> = [];
    inputs.forEach((input) => {
      const message = input.validity.valid ? "" : errorMessage(input);
      setFieldError(input, message);
      if (message) invalidInputs.push(input);
    });
    if (invalidInputs.length) {
      invalidInputs[0].focus();
      return;
    }

    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!submit) return;
    const submitLabel = submit.querySelector<HTMLElement>(".button-label");
    const defaultSubmitLabel = submitLabel?.textContent || "";
    if (submitLabel && submit.dataset.loadingLabel) submitLabel.textContent = submit.dataset.loadingLabel;
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");

    try {
      const action = form.dataset.authForm || "";
      const values = Object.fromEntries(new FormData(form).entries()) as Record<string, FormDataEntryValue>;
      const params = new URLSearchParams(window.location.search);
      const payload: Record<string, unknown> = { ...values };
      if (action === "login") { payload.remember = new FormData(form).has("remember"); payload.next = params.get("next") || undefined; }
      if (action === "reset") payload.token = params.get("token") || "";
      const response = await fetch(endpointFor[action], { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as ApiResult;
      if (!response.ok) {
        if (result.code === "TOKEN_EXPIRED") { window.location.assign("/dat-lai-mat-khau?state=expired"); return; }
        if (result.code === "EMAIL_UNVERIFIED") {
          sessionStorage.setItem("tlmVerificationEmail", String(values.email || ""));
          const unverified = form.querySelector<HTMLElement>('[data-login-state="unverified"]'); if (unverified) unverified.hidden = false;
        }
        const message = formMessage(form); message.hidden = false; const copy = message.querySelector("span"); if (copy) copy.textContent = result.message || "Không thể hoàn tất yêu cầu. Vui lòng thử lại.";
        return;
      }
      if (action === "login") window.location.assign(result.redirect || "/tai-khoan");
      else if (action === "register") {
        sessionStorage.setItem("tlmVerificationEmail", String(values.email || ""));
        if (result.developmentUrl) sessionStorage.setItem("tlmDevelopmentVerificationUrl", result.developmentUrl);
        window.location.assign(result.redirect || "/xac-minh-email");
      } else if (action === "forgot") {
        if (result.developmentUrl) sessionStorage.setItem("tlmDevelopmentResetUrl", result.developmentUrl);
        showPanel("[data-form-panel]", "[data-state-sent]");
      } else if (action === "reset") showPanel("[data-form-panel]", "[data-state-success]");
    } catch {
      const message = formMessage(form); message.hidden = false; const copy = message.querySelector("span"); if (copy) copy.textContent = "Không thể kết nối máy chủ. Vui lòng thử lại.";
    } finally {
      submit.disabled = false;
      submit.setAttribute("aria-busy", "false");
      if (submitLabel) submitLabel.textContent = defaultSubmitLabel;
    }
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-resend]").forEach((button) => {
  button.addEventListener("click", async () => {
    const status = button.closest<HTMLElement>(".auth-state")?.querySelector<HTMLElement>("[data-resend-status]")
      || document.querySelector<HTMLElement>("[data-resend-status]");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    const original = button.textContent?.trim() || "Gửi lại email";
    button.textContent = "Đang gửi lại…";
    if (status) status.textContent = "Đang gửi lại email.";
    try {
      await fetch("/api/auth/resend-verification", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: sessionStorage.getItem("tlmVerificationEmail") || "" }) });
    } finally {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      button.textContent = original;
      if (status) status.textContent = "Nếu địa chỉ hợp lệ, email mới đã được gửi.";
    }
  });
});

const state = new URLSearchParams(window.location.search).get("state");
if (state === "expired" || state === "success") {
  document.querySelectorAll<HTMLElement>("[data-route-state]").forEach((panel) => {
    panel.hidden = panel.dataset.routeState !== state;
  });
}

const loginState = new URLSearchParams(window.location.search).get("state");
if (["unverified", "locked"].includes(loginState || "")) {
  const message = document.querySelector<HTMLElement>(`[data-login-state="${loginState}"]`);
  if (message) message.hidden = false;
}

if (["required", "expired"].includes(loginState || "")) {
  const form = document.querySelector<HTMLFormElement>('[data-auth-form="login"]');
  if (form) { const message = formMessage(form); message.hidden = false; const copy = message.querySelector("span"); if (copy) copy.textContent = loginState === "expired" ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." : "Vui lòng đăng nhập để tiếp tục."; }
}

document.querySelectorAll<HTMLElement>("[data-auth-logout]").forEach((trigger) => trigger.addEventListener("click", async (event) => {
  event.preventDefault();
  try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.assign("/dang-nhap"); }
}));
