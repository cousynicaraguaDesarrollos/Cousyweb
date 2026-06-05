import { addToCart } from "./cart.js";
import { trackProductView, trackQuoteClick } from "./analytics.js";

const siteBaseUrl = new URL("../", import.meta.url);
const siteBasePath = siteBaseUrl.pathname.replace(/\/$/, "");
let productViewObserver = null;

function fromRoot(relPath) {
  const cleanRelPath = String(relPath ?? "").replace(/^\.?\//, "");
  return new URL(cleanRelPath, siteBaseUrl).toString();
}

function fromBasePath(pathname) {
  const cleanPath = String(pathname ?? "");
  if (!cleanPath.startsWith("/")) return cleanPath;
  if (!siteBasePath || siteBasePath === "/") return cleanPath;
  return `${siteBasePath}${cleanPath}`;
}

function resolveSiteUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
  if (raw.startsWith("/")) return fromBasePath(raw);
  const cleaned = raw.replace(/^(\.\/)+/, "").replace(/^(\.\.\/)+/, "");
  return fromRoot(cleaned);
}

function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");
}

function card(product) {
  const el = document.createElement("article");
  el.className =
    "group flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-black/5";
  if (product.id) el.id = product.id;
  el.dataset.productCard = "1";
  el.dataset.productName = product.name || product.id || "";
  el.dataset.productCategory = product.category || "";

  const img = document.createElement("img");
  const imageUrl = resolveSiteUrl(product.image) || fromRoot("assets/placeholder.svg");
  const sourceUrl = resolveSiteUrl(product.sourceUrl) || product.sourceUrl;

  img.src = imageUrl;
  img.alt = product.name
    ? `${product.name} | producto promocional para empresas`
    : "Producto promocional para empresas";
  img.loading = "lazy";
  img.className = "w-full object-cover";
  // ~20% shorter card: smaller image area + tighter padding.
  // Add width/height as a cross-browser fallback to reserve space and keep cards compact on mobile too.
  img.width = 13;
  img.height = 8;
  img.style.aspectRatio = "13 / 8";

  const body = document.createElement("div");
  body.className = "flex flex-1 flex-col gap-1.5 p-3";

  const title = document.createElement("h3");
  title.className = "text-base font-semibold leading-snug text-brand-ink";
  title.textContent = product.name || product.id;
  title.style.minHeight = "2.5rem";
  title.style.display = "-webkit-box";
  title.style.webkitBoxOrient = "vertical";
  title.style.webkitLineClamp = "2";
  title.style.overflow = "hidden";

  const meta = document.createElement("p");
  meta.className = "text-sm font-normal text-black/70";
  meta.textContent = product.category
    ? `Personalización corporativa · ${product.category} · Pedidos al por mayor`
    : "Personalización corporativa · Pedidos al por mayor";
  meta.style.whiteSpace = "nowrap";
  meta.style.overflow = "hidden";
  meta.style.textOverflow = "ellipsis";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "mt-2 w-full rounded-xl bg-brand-accent px-4 py-2 text-sm font-normal text-white hover:brightness-95 active:brightness-90";
  btn.textContent = "Añadir a cotización";
  btn.addEventListener("click", () => {
    trackQuoteClick({
      cta_label: "Añadir a cotización",
      cta_location: "product_card",
      product_name: product.name || product.id || "",
      product_category: product.category || ""
    });
    addToCart(
      {
        id: product.id,
        name: product.name,
        image: imageUrl,
        sourceUrl
      },
      1
    );
    btn.textContent = "Agregado";
    setTimeout(() => (btn.textContent = "Añadir a cotización"), 900);
  });

  body.append(title, meta, btn);
  el.append(img, body);
  return el;
}

function isElementMostlyVisible(element) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
  const visibleArea = Math.max(0, visibleHeight) * Math.max(0, visibleWidth);
  const totalArea = Math.max(1, rect.height * rect.width);
  return visibleArea / totalArea >= 0.55;
}

function tryTrackProductCard(card) {
  if (!(card instanceof HTMLElement)) return false;
  const productName = card.dataset.productName || "";
  const productCategory = card.dataset.productCategory || "";
  return trackProductView(productName, {
    product_category: productCategory
  });
}

function flushVisibleProductCards() {
  for (const card of document.querySelectorAll("[data-product-card='1']")) {
    if (!(card instanceof HTMLElement)) continue;
    if (!isElementMostlyVisible(card)) continue;
    const tracked = tryTrackProductCard(card);
    if (tracked) {
      productViewObserver?.unobserve(card);
    }
  }
}

function startProductViewTracking() {
  const cards = Array.from(document.querySelectorAll("[data-product-card='1']"));
  productViewObserver?.disconnect();
  productViewObserver = null;

  if (!cards.length) return;

  if ("IntersectionObserver" in window) {
    productViewObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const tracked = tryTrackProductCard(entry.target);
          if (tracked) {
            productViewObserver?.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.55
      }
    );

    cards.forEach((card) => productViewObserver?.observe(card));
  }

  window.requestAnimationFrame(flushVisibleProductCards);
}

async function loadProducts() {
  const candidates = Array.from(
    new Set([
      fromRoot("data/products.json"),
      new URL("../data/products.json", window.location.href).toString(),
      `${window.location.origin}/data/products.json`,
      `${window.location.origin}/docs/data/products.json`
    ])
  );

  const failures = [];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        failures.push(`${url} -> ${res.status}`);
        continue;
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      failures.push(`${url} -> error`);
      if (err && typeof err === "object" && "message" in err) {
        failures.push(String(err.message));
      }
    }
  }

  const detail = failures.length ? ` (${failures.join(" | ")})` : "";
  throw new Error(`No se pudo cargar products.json${detail}`);
}

function render(products) {
  const grid = document.querySelector("#products-grid");
  if (!grid) return;
  grid.innerHTML = "";
  for (const p of products) grid.append(card(p));
  startProductViewTracking();
}

function categories(products) {
  const set = new Set(products.map((p) => p.category).filter(Boolean));
  return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
}

function mountFilters(all) {
  const search = document.querySelector("#products-search");
  const select = document.querySelector("#products-category");

  if (select) {
    select.innerHTML = "";
    for (const c of categories(all)) {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      select.append(opt);
    }
  }

  function apply() {
    const q = normalize(search?.value ?? "");
    const cat = select?.value ?? "Todas";
    const filtered = all.filter((p) => {
      const matchesText =
        !q || normalize(p.name).includes(q) || normalize(p.category).includes(q);
      const matchesCat = cat === "Todas" || p.category === cat;
      return matchesText && matchesCat;
    });
    render(filtered);
    const countEl = document.querySelector("[data-products-count]");
    if (countEl) countEl.textContent = String(filtered.length);
  }

  search?.addEventListener("input", apply);
  select?.addEventListener("change", apply);
  apply();
}

async function initTienda() {
  const grid = document.querySelector("#products-grid");
  if (!grid) return;
  if (grid.dataset.tiendaInit === "1") return;
  grid.dataset.tiendaInit = "1";

  try {
    const products = await loadProducts();
    mountFilters(products);
  } catch (err) {
    grid.dataset.tiendaInit = "";
    const msg = document.querySelector("#products-error");
    if (msg) msg.textContent = String(err?.message ?? err);
  }
}

function onLoad() {
  void initTienda();
}

window.addEventListener("cousy:cookie-consent-resolved", () => {
  window.requestAnimationFrame(flushVisibleProductCards);
});
window.addEventListener("DOMContentLoaded", onLoad);
document.addEventListener("turbo:load", onLoad);
onLoad();
