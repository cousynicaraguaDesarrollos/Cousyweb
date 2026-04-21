function rootPrefix() {
  const p = String(window.location?.pathname ?? "");
  return p.includes("/es/") || p.includes("/en/") ? ".." : ".";
}

function fromRoot(relPath) {
  return `${rootPrefix()}/${String(relPath).replace(/^\.?\//, "")}`;
}

function setActiveNav() {
  const currentPath = String(window.location?.pathname ?? "");
  const currentFile = currentPath.split("/").pop() || "index.html";
  const links = document.querySelectorAll(".js-nav-link");
  for (const a of links) {
    if (!(a instanceof HTMLAnchorElement)) continue;
    const href = a.getAttribute("href") ?? "";
    const hrefFile = href.split("/").pop() || "";
    const isActive = hrefFile === currentFile;
    a.classList.toggle("border-b-2", isActive);
    a.classList.toggle("border-brand-ink", isActive);
    a.classList.toggle("pb-1", isActive);
    if (isActive) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }

  const quoteActive = currentFile === "cotizacion.html" || currentFile === "quote.html";
  for (const el of document.querySelectorAll(".js-quote-link")) {
    el.classList.toggle("bg-black/5", quoteActive);
  }
}

async function inject(target, partialPath) {
  if (!target) return false;
  try {
    const res = await fetch(fromRoot(partialPath), { cache: "no-store" });
    if (!res.ok) return false;
    target.innerHTML = await res.text();
    target.dataset.partialInjected = "1";
    return true;
  } catch {
    return false;
  }
}

function setYear() {
  const y = String(new Date().getFullYear());
  for (const el of document.querySelectorAll("[data-year]")) {
    el.textContent = y;
  }
}

let siteConfigPromise = null;

async function loadSiteConfig() {
  if (!siteConfigPromise) {
    siteConfigPromise = fetch(fromRoot("config/site.json"), { cache: "no-store" }).then((res) => {
      if (!res.ok) throw new Error("No se pudo cargar site.json");
      return res.json();
    });
  }
  return siteConfigPromise;
}

function enableSocialLinks(social) {
  const cfg = social && typeof social === "object" ? social : {};
  for (const el of document.querySelectorAll("[data-social-link]")) {
    if (!(el instanceof HTMLAnchorElement)) continue;
    const key = el.getAttribute("data-social-link") ?? "";
    const href = String(cfg[key] ?? "").trim();
    if (!href) continue;
    el.href = href;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.removeAttribute("aria-disabled");
    el.removeAttribute("tabindex");
    el.classList.remove("pointer-events-none");
  }
}

async function initLayout() {
  const path = String(window.location?.pathname ?? "");
  const lang = path.includes("/en/") ? "en" : "es";

  const header = document.querySelector("[data-site-header]");
  const footer = document.querySelector("[data-site-footer]");

  if (header && !header.dataset.partialInjected) {
    await inject(header, `partials/header-${lang}.html`);
  }
  if (footer && !footer.dataset.partialInjected) {
    await inject(footer, `partials/footer-${lang}.html`);
  }

  setActiveNav();
  setYear();

  // Recalcular badge del carrito en cada navegación.
  window.dispatchEvent(new CustomEvent("cousy:cart-changed"));

  try {
    const cfg = await loadSiteConfig();
    enableSocialLinks(cfg?.social);
  } catch {
    // noop
  }
}

let initPromise = null;

function runInit() {
  if (initPromise) return initPromise;
  initPromise = initLayout().finally(() => {
    initPromise = null;
  });
  return initPromise;
}

function onLoad() {
  void runInit();
}

window.addEventListener("DOMContentLoaded", onLoad);
document.addEventListener("turbo:load", onLoad);
onLoad();
