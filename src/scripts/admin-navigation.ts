import { navigate } from "astro:transitions/client";

const progressDelay = 120;
let progressTimer = 0;
let navigationStarted = 0;

const progress = () => document.querySelector<HTMLElement>("[data-admin-navigation-progress]");

const beginNavigation = () => {
  navigationStarted = performance.now();
  document.querySelector("#admin-main")?.setAttribute("aria-busy", "true");
  window.clearTimeout(progressTimer);
  progressTimer = window.setTimeout(() => progress()?.classList.add("is-visible"), progressDelay);
};

const finishNavigation = () => {
  window.clearTimeout(progressTimer);
  const bar = progress();
  document.querySelector("#admin-main")?.removeAttribute("aria-busy");
  bar?.classList.add("is-complete");
  window.setTimeout(() => bar?.classList.remove("is-visible", "is-complete"), 140);
  if (navigationStarted) {
    performance.measure("admin-navigation", { start: navigationStarted, end: performance.now() });
    navigationStarted = 0;
  }
};

const syncNavigation = () => {
  const current = new URL(window.location.href);
  const items = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-admin-nav-item]"));
  let bestMatch: HTMLAnchorElement | undefined;

  if (current.pathname === "/admin") {
    const section = current.searchParams.get("section") || "tong-quan";
    bestMatch = items.find((link) => link.dataset.adminNavSection === section);
  } else {
    bestMatch = items
      .filter((link) => {
        const target = new URL(link.href);
        return target.pathname !== "/admin" && (current.pathname === target.pathname || current.pathname.startsWith(`${target.pathname}/`));
      })
      .sort((a, b) => new URL(b.href).pathname.length - new URL(a.href).pathname.length)[0];
  }

  items.forEach((link) => {
    const active = link === bestMatch;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const breadcrumb = document.querySelector<HTMLElement>("[data-admin-breadcrumb]");
  if (breadcrumb && bestMatch?.dataset.adminNavLabel) breadcrumb.textContent = bestMatch.dataset.adminNavLabel;
};

document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
  if (!link || link.target || link.hasAttribute("download") || link.dataset.astroReload !== undefined) return;
  const target = new URL(link.href, window.location.href);
  if (target.origin !== window.location.origin || !target.pathname.startsWith("/admin")) return;

  const navItem = link.closest<HTMLAnchorElement>("[data-admin-nav-item]");
  if (navItem) {
    document.querySelectorAll("[data-admin-nav-item]").forEach((item) => {
      item.classList.toggle("is-active", item === navItem);
      if (item === navItem) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  }
}, { capture: true });

document.addEventListener("astro:before-preparation", beginNavigation);
document.addEventListener("astro:page-load", () => {
  syncNavigation();
  finishNavigation();
});

document.addEventListener("admin:refresh", () => {
  void navigate(window.location.href, { history: "replace" });
});

document.addEventListener("admin:navigate", (event) => {
  const href = (event as CustomEvent<string>).detail;
  if (href) void navigate(href);
});
