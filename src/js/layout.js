import { initHeaderView } from "./header.js";

const ROUTE_MAP = Object.freeze({
  es: Object.freeze({
    home: "es/",
    store: "es/tienda/",
    about: "es/nosotros/",
    sustainability: "es/sostenibilidad/",
    quote: "es/cotizacion/",
  }),
});

const VIEW_TRANSITION_CLASS = "is-view-transitioning";
let pageTransitionsReady = false;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isPreviewRendered() {
  return document.documentElement.hasAttribute("data-turbo-preview");
}

function clearViewTransitionClass() {
  if (document.body) {
    document.body.classList.remove(VIEW_TRANSITION_CLASS);
  }
}

function initPageTransitions() {
  if (pageTransitionsReady) return;
  pageTransitionsReady = true;

  document.addEventListener("turbo:visit", () => {
    if (prefersReducedMotion()) return;
    document.body?.classList.add(VIEW_TRANSITION_CLASS);
  });

  document.addEventListener("turbo:before-render", (event) => {
    if (prefersReducedMotion()) return;
    const newBody = event.detail?.newBody;
    if (!(newBody instanceof HTMLBodyElement)) return;
    newBody.classList.add(VIEW_TRANSITION_CLASS);
  });

  document.addEventListener("turbo:render", () => {
    if (prefersReducedMotion()) {
      clearViewTransitionClass();
      return;
    }
    if (isPreviewRendered()) return;
    requestAnimationFrame(() => {
      clearViewTransitionClass();
    });
  });

  document.addEventListener("turbo:before-cache", () => {
    clearViewTransitionClass();
  });
}

function rootPrefix() {
  const pathname = String(window.location?.pathname ?? "/").replace(/\/+/g, "/");
  let dirPath = pathname;

  if (dirPath.endsWith("/")) {
    // already a directory path
  } else if (/\/[^/]+\.[a-z0-9]+$/i.test(dirPath)) {
    dirPath = dirPath.replace(/\/[^/]+$/, "/");
  } else {
    dirPath = `${dirPath}/`;
  }

  const depth = dirPath.split("/").filter(Boolean).length;
  if (depth <= 0) return ".";
  return Array(depth).fill("..").join("/");
}

function basePathPrefix() {
  const pathname = String(window.location?.pathname ?? "/").replace(/\/+/g, "/");
  let dirPath = pathname;

  if (dirPath.endsWith("/")) {
    // already a directory path
  } else if (/\/[^/]+\.[a-z0-9]+$/i.test(dirPath)) {
    dirPath = dirPath.replace(/\/[^/]+$/, "/");
  } else {
    dirPath = `${dirPath}/`;
  }

  const segments = dirPath.split("/").filter(Boolean);
  const langIndex = segments.findIndex((segment) => segment === "es");
  if (langIndex <= 0) return "";

  return `/${segments.slice(0, langIndex).join("/")}`;
}

function fromRoot(relPath) {
  const cleaned = String(relPath).replace(/^\.?\//, "");
  const basePath = basePathPrefix();

  if (!basePath) return `${rootPrefix()}/${cleaned}`;
  return `${basePath}/${cleaned}`.replace(/\/{2,}/g, "/");
}

function normalizePathname(pathname) {
  let normalized = String(pathname ?? "/").replace(/\/+/g, "/");
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;

  if (normalized.endsWith("/index.html")) {
    normalized = normalized.slice(0, -"index.html".length);
  } else if (normalized.endsWith(".html")) {
    normalized = normalized.slice(0, -".html".length);
  }

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || "/";
}

function normalizeHrefToPath(href) {
  if (!href) return "";
  try {
    const url = new URL(href, window.location.origin);
    return normalizePathname(url.pathname);
  } catch {
    return "";
  }
}

function applyHeaderRoutes(header, lang) {
  if (!header) return;

  const langRoutes = ROUTE_MAP[lang] ?? ROUTE_MAP.es;
  for (const el of header.querySelectorAll("[data-nav-route]")) {
    if (!(el instanceof HTMLAnchorElement)) continue;
    const key = el.getAttribute("data-nav-route") ?? "";
    const route = langRoutes[key];
    if (!route) continue;
    el.href = fromRoot(route);
  }

  for (const el of header.querySelectorAll("[data-nav-asset='logo']")) {
    if (!(el instanceof HTMLImageElement)) continue;
    el.src = fromRoot("assets/logo-cousy.webp");
  }
}

function setActiveNav() {
  const currentPath = normalizePathname(window.location?.pathname ?? "/");
  const links = document.querySelectorAll(".js-nav-link");
  for (const a of links) {
    if (!(a instanceof HTMLAnchorElement)) continue;
    const targetPath = normalizeHrefToPath(a.getAttribute("href") ?? "");
    const isActive = targetPath !== "" && targetPath === currentPath;
    const isDesktopNav = !!a.closest(".js-site-nav");
    if (isDesktopNav) {
      a.classList.toggle("border-b-2", isActive);
      a.classList.toggle("border-brand-ink", isActive);
      a.classList.toggle("pb-1", isActive);
    } else {
      a.classList.remove("border-b-2", "border-brand-ink", "pb-1", "bg-brand-muted");
    }
    if (isActive) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }

  let quoteActive = false;
  for (const el of document.querySelectorAll(".js-quote-link")) {
    if (!(el instanceof HTMLAnchorElement)) continue;
    const quotePath = normalizeHrefToPath(el.getAttribute("href") ?? "");
    if (quotePath && quotePath === currentPath) {
      quoteActive = true;
      break;
    }
  }

  for (const el of document.querySelectorAll(".js-quote-link")) {
    const keepSolidBg = el.classList.contains("bg-brand-cta");
    if (keepSolidBg) {
      el.classList.remove("bg-black/5");
      continue;
    }
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

let swRegisterPromise = null;

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (swRegisterPromise) return swRegisterPromise;

  swRegisterPromise = navigator.serviceWorker
    .register(fromRoot("service-worker.js"))
    .catch(() => null)
    .finally(() => {
      swRegisterPromise = null;
    });

  return swRegisterPromise;
}

async function initLayout() {
  const lang = "es";

  const header = document.querySelector("[data-site-header]");
  const footer = document.querySelector("[data-site-footer]");

  if (header && !header.dataset.partialInjected) {
    await inject(header, `partials/header-${lang}.html`);
  }
  if (footer && !footer.dataset.partialInjected) {
    await inject(footer, `partials/footer-${lang}.html`);
  }

  applyHeaderRoutes(header, lang);
  setActiveNav();
  initHeaderView(header ?? document);
  setYear();

  // Recalcular badge del carrito en cada navegación.
  window.dispatchEvent(new CustomEvent("cousy:cart-changed"));

  try {
    const cfg = await loadSiteConfig();
    enableSocialLinks(cfg?.social);
  } catch {
    // noop
  }

  void registerServiceWorker();
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

initPageTransitions();
window.addEventListener("DOMContentLoaded", onLoad);
document.addEventListener("turbo:load", onLoad);
onLoad();
