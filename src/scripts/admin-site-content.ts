import { validateAdminImage } from "@/lib/admin-image-upload";

export {};

let siteContentLifecycle: AbortController | undefined;
const initAdminSiteContent = () => {
siteContentLifecycle?.abort();
siteContentLifecycle = new AbortController();
const { signal } = siteContentLifecycle;
const root = document.querySelector<HTMLElement>("[data-site-content-root]");
if (root) {
  const form = root.querySelector<HTMLFormElement>("[data-site-content-form]");
  const feedback = root.querySelector<HTMLElement>("[data-site-content-feedback]");
  const named = (name: string) => form?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
  const rows = (name: string, count: number) => (named(name)?.value || "")
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts.length >= count && parts.slice(0, count).every(Boolean));
  const registerUploadedMedia = async (result: { url: string; name?: string; type?: string; width?: number; height?: number }, file: File) => {
    const response = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      name: result.name || file.name, url: result.url, mimeType: result.type || file.type, fileSize: file.size,
      width: result.width || 0, height: result.height || 0, source: "upload", alt: "", caption: "",
    }) });
    if (!response.ok && response.status !== 409) throw new Error("Ảnh đã tải lên nhưng chưa thể thêm vào thư viện media.");
  };

  const solutionList = root.querySelector<HTMLElement>("[data-solution-list]");
  const solutionEmpty = root.querySelector<HTMLElement>("[data-solutions-empty]");
  const solutionTemplate = root.querySelector<HTMLTemplateElement>("[data-solution-template]");
  let activeSolutionUploads = 0;
  const solutionItems = () => Array.from(root.querySelectorAll<HTMLElement>("[data-solution-item]"));
  const refreshSolutions = () => {
    const items = solutionItems();
    items.forEach((item, index) => {
      const label = item.querySelector<HTMLElement>("[data-solution-label]");
      const up = item.querySelector<HTMLButtonElement>("[data-solution-up]");
      const down = item.querySelector<HTMLButtonElement>("[data-solution-down]");
      if (label) label.textContent = `Giải pháp ${index + 1}`;
      if (up) up.disabled = index === 0;
      if (down) down.disabled = index === items.length - 1;
    });
    if (solutionEmpty) solutionEmpty.hidden = items.length > 0;
  };
  const collectSolutions = () => solutionItems().map((item) => [
    item.querySelector<HTMLInputElement>("[data-solution-title]")?.value.trim() || "",
    item.querySelector<HTMLTextAreaElement>("[data-solution-description]")?.value.trim() || "",
    item.querySelector<HTMLInputElement>("[data-solution-image]")?.value.trim() || "/images/project-handover-placeholder.webp",
  ]).filter(([title, description]) => title && description);

  root.querySelector<HTMLButtonElement>("[data-add-solution]")?.addEventListener("click", () => {
    if (!solutionList || !solutionTemplate || solutionItems().length >= 12) {
      if (feedback) feedback.textContent = "Trang chủ hỗ trợ tối đa 12 giải pháp.";
      return;
    }
    const fragment = solutionTemplate.content.cloneNode(true) as DocumentFragment;
    const item = fragment.querySelector<HTMLElement>("[data-solution-item]");
    solutionList.append(fragment);
    refreshSolutions();
    item?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    item?.querySelector<HTMLInputElement>("[data-solution-title]")?.focus();
  }, { signal });

  solutionList?.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("button");
    const item = button?.closest<HTMLElement>("[data-solution-item]");
    if (!button || !item) return;
    if (button.matches("[data-solution-up]") && item.previousElementSibling) solutionList.insertBefore(item, item.previousElementSibling);
    if (button.matches("[data-solution-down]") && item.nextElementSibling) solutionList.insertBefore(item.nextElementSibling, item);
    if (button.matches("[data-remove-solution]")) item.remove();
    refreshSolutions();
  }, { signal });

  solutionList?.addEventListener("change", async (event) => {
    const input = (event.target as Element).closest<HTMLInputElement>("[data-solution-upload]");
    const item = input?.closest<HTMLElement>("[data-solution-item]");
    const file = input?.files?.[0];
    if (!input || !item || !file) return;
    const status = item.querySelector<HTMLElement>("[data-solution-status]");
    const preview = item.querySelector<HTMLImageElement>("[data-solution-preview]");
    const imageValue = item.querySelector<HTMLInputElement>("[data-solution-image]");
    const validationError = validateAdminImage(file);
    if (validationError) { if (status) status.textContent = validationError; input.value = ""; return; }
    activeSolutionUploads += 1;
    item.classList.add("is-uploading");
    input.disabled = true;
    if (status) status.textContent = `Đang tải ${file.name}…`;
    try {
      const data = new FormData(); data.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể tải ảnh.");
      await registerUploadedMedia(result, file);
      if (preview) preview.src = result.url;
      if (imageValue) imageValue.value = result.url;
      if (status) status.textContent = "Ảnh mới đã sẵn sàng. Nhấn Lưu để cập nhật website.";
      item.classList.add("has-new-image");
    } catch (error) {
      if (status) status.textContent = error instanceof Error ? error.message : "Không thể tải ảnh. Hãy chọn tệp khác.";
    } finally {
      activeSolutionUploads -= 1;
      item.classList.remove("is-uploading");
      input.disabled = false;
      input.value = "";
    }
  }, { signal });
  refreshSolutions();

  const upload = root.querySelector<HTMLInputElement>("[data-hero-upload]");
  upload?.addEventListener("change", async () => {
    const file = upload.files?.[0];
    if (!file) return;
    const validationError = validateAdminImage(file);
    if (validationError) { if (feedback) feedback.textContent = validationError; upload.value = ""; return; }
    const data = new FormData();
    data.set("file", file);
    if (feedback) feedback.textContent = "Đang tải ảnh Hero…";
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tải ảnh thất bại.");
      await registerUploadedMedia(result, file);
      if (named("hero.image")) named("hero.image")!.value = result.url;
      if (feedback) feedback.textContent = "Đã tải ảnh Hero. Nhấn Lưu để cập nhật website.";
    } catch (error) {
      if (feedback) feedback.textContent = error instanceof Error ? error.message : "Tải ảnh thất bại.";
    } finally {
      upload.value = "";
    }
  }, { signal });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (activeSolutionUploads > 0) { if (feedback) feedback.textContent = "Ảnh vẫn đang tải. Hãy chờ hoàn tất rồi lưu lại."; return; }
    if (!form.reportValidity()) return;
    if (feedback) feedback.textContent = "Đang lưu…";
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) submit.disabled = true;
    const settings = Object.fromEntries(["company", "logo", "hotline", "zalo", "email", "address", "facebook"].map((key) => [key, named(key)?.value.trim() || ""]));
    const hero = {
      eyebrow: named("hero.eyebrow")?.value.trim() || "",
      title: named("hero.title")?.value.trim() || "",
      description: named("hero.description")?.value.trim() || "",
      image: named("hero.image")?.value.trim() || "",
      primaryCta: { label: named("hero.primaryLabel")?.value.trim() || "", href: named("hero.primaryHref")?.value.trim() || "#categories" },
      secondaryCta: { label: named("hero.secondaryLabel")?.value.trim() || "", href: named("hero.secondaryHref")?.value.trim() || "#contact" },
    };
    const content = {
      "homepage.hero": hero,
      "homepage.solutions": collectSolutions(),
      "homepage.projects": rows("homepage.projects", 5).map(([title, location, equipment, time, image]) => ({ title, location, equipment, time, image })),
      "homepage.trust": rows("homepage.trust", 2).map((item) => item.slice(0, 2)),
      "homepage.reasons": rows("homepage.reasons", 2).map((item) => item.slice(0, 2)),
    };
    try {
      const response = await fetch("/api/admin/site-content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings, content }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chưa thể lưu cấu hình website.");
      const readBackMatches = JSON.stringify(result.content?.["homepage.solutions"]) === JSON.stringify(content["homepage.solutions"])
        && result.settings?.company === settings.company;
      if (!readBackMatches) throw new Error("Máy chủ chưa xác nhận dữ liệu vừa lưu. Hãy thử lại.");
      if (feedback) feedback.textContent = result.message || "Đã lưu cấu hình website vào cơ sở dữ liệu.";
    } catch (error) {
      if (feedback) feedback.textContent = error instanceof Error ? error.message : "Không kết nối được máy chủ. Hãy kiểm tra mạng và thử lưu lại.";
    } finally {
      if (submit) submit.disabled = false;
    }
  }, { signal });
}
};

document.addEventListener("astro:page-load", initAdminSiteContent);
