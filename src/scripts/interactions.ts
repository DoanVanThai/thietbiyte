const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const header = document.querySelector<HTMLElement>("[data-site-header]");
const headerSentinel = document.querySelector<HTMLElement>("[data-header-sentinel]");

if (header && headerSentinel) {
  const headerObserver = new IntersectionObserver(([entry]) => {
    header.classList.toggle("is-scrolled", !entry.isIntersecting);
  }, { threshold: 0 });
  headerObserver.observe(headerSentinel);
}

const menuDialog = document.querySelector<HTMLDialogElement>("[data-mobile-navigation]");
const menuOpen = document.querySelector<HTMLButtonElement>("[data-mobile-menu-open]");
const menuClose = menuDialog?.querySelector<HTMLButtonElement>("[data-mobile-menu-close]");

const setMenuState = (open: boolean) => {
  menuOpen?.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("has-modal-open", open);
};

menuOpen?.addEventListener("click", () => {
  if (!menuDialog || menuDialog.open) return;
  menuDialog.showModal();
  setMenuState(true);
});

menuClose?.addEventListener("click", () => menuDialog?.close());
menuDialog?.addEventListener("close", () => {
  setMenuState(false);
  menuOpen?.focus({ preventScroll: true });
});
menuDialog?.addEventListener("click", (event) => {
  if (event.target === menuDialog) menuDialog.close();
});
menuDialog?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => menuDialog.close()));

const desktopNavigation = window.matchMedia("(min-width: 821px)");
desktopNavigation.addEventListener("change", (event) => {
  if (event.matches && menuDialog?.open) menuDialog.close();
});

if (!reduceMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      (entry.target as HTMLElement).animate([
        { opacity: 0.01, transform: "translateY(16px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], {
        duration: 380,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "none",
      });
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.14 });

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => revealObserver.observe(element));

  const homepageOwnsImageMotion = Boolean(document.querySelector(".home-hero"));
  if (!homepageOwnsImageMotion) {
    document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((image) => {
      if (image.complete) return;
      image.addEventListener("load", () => {
        image.animate([
          { opacity: 0.05 },
          { opacity: 1 },
        ], { duration: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
      }, { once: true });
    });
  }
}

const animatedDetails = document.querySelectorAll<HTMLDetailsElement>(
  ".filter-group, .specification-group, .faq-list details",
);

animatedDetails.forEach((details) => {
  const summary = details.querySelector<HTMLElement>(":scope > summary");
  if (!summary) return;
  let animation: Animation | null = null;

  summary.addEventListener("click", (event) => {
    if (reduceMotion.matches) return;
    event.preventDefault();
    animation?.cancel();

    const startHeight = details.offsetHeight;
    const wasOpen = details.open;
    if (!wasOpen) details.open = true;
    const endHeight = wasOpen ? summary.offsetHeight : details.offsetHeight;

    details.style.overflow = "hidden";
    animation = details.animate(
      { height: [`${startHeight}px`, `${endHeight}px`] },
      {
        duration: wasOpen ? 170 : 210,
        easing: wasOpen ? "cubic-bezier(0.4, 0, 1, 1)" : "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    );

    animation.addEventListener("finish", () => {
      details.open = !wasOpen;
      details.style.removeProperty("overflow");
      animation = null;
    }, { once: true });
    animation.addEventListener("cancel", () => details.style.removeProperty("overflow"), { once: true });
  });
});
