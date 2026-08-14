document.addEventListener("click", async (event) => {
  const trigger = (event.target as Element).closest<HTMLElement>("[data-auth-logout]");
  if (!trigger) return;
  event.preventDefault();
  trigger.setAttribute("aria-busy", "true");
  try { await fetch("/api/auth/logout", { method: "POST" }); } finally { window.location.assign("/dang-nhap"); }
});
