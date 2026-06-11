import { addToCart } from "./cart.js";
import { trackProductView, trackQuoteClick } from "./analytics.js";

const siteBaseUrl = new URL("../", import.meta.url);
const siteBasePath = siteBaseUrl.pathname.replace(/\/$/, "");
let productViewObserver = null;
let productGallery = null;
const productGalleryState = {
  products: [],
  currentIndex: 0,
  lastTrigger: null
};

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

function getGalleryProduct(indexOffset = 0) {
  const { products, currentIndex } = productGalleryState;
  if (!products.length) return null;
  const nextIndex = (currentIndex + indexOffset + products.length) % products.length;
  return products[nextIndex] ?? null;
}

function syncGalleryButtons() {
  if (!productGallery) return;
  const multiProduct = productGalleryState.products.length > 1;
  productGallery.prevButton.hidden = !multiProduct;
  productGallery.nextButton.hidden = !multiProduct;
}

function renderGalleryItem() {
  if (!productGallery) return;
  const current = getGalleryProduct();
  if (!current) return;

  const imageUrl = resolveSiteUrl(current.image) || fromRoot("assets/placeholder.svg");
  productGallery.image.src = imageUrl;
  productGallery.image.alt = current.name
    ? `${current.name} | vista ampliada del producto`
    : "Vista ampliada del producto";
  productGallery.title.textContent = current.name || "Producto";
  productGallery.meta.textContent = current.category
    ? `${current.category} · ${productGalleryState.currentIndex + 1} de ${productGalleryState.products.length}`
    : `${productGalleryState.currentIndex + 1} de ${productGalleryState.products.length}`;
  syncGalleryButtons();
}

function closeProductGallery() {
  if (!productGallery) return;
  productGallery.overlay.classList.add("hidden");
  productGallery.overlay.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
  document.removeEventListener("keydown", handleGalleryKeydown);

  if (productGalleryState.lastTrigger instanceof HTMLElement) {
    productGalleryState.lastTrigger.focus();
  }
}

function stepProductGallery(direction) {
  if (productGalleryState.products.length < 2) return;
  productGalleryState.currentIndex =
    (productGalleryState.currentIndex + direction + productGalleryState.products.length) %
    productGalleryState.products.length;
  renderGalleryItem();
}

function handleGalleryKeydown(event) {
  if (!productGallery || productGallery.overlay.classList.contains("hidden")) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeProductGallery();
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    stepProductGallery(-1);
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    stepProductGallery(1);
  }
}

function ensureProductGallery() {
  if (productGallery) return productGallery;

  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-[90] hidden items-center justify-center bg-black/80 p-4 sm:p-8";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "product-gallery-title");

  const panel = document.createElement("div");
  panel.className =
    "relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl";

  const toolbar = document.createElement("div");
  toolbar.className =
    "flex items-start justify-between gap-4 border-b border-black/10 px-4 py-3 sm:px-6 sm:py-4";

  const headingWrap = document.createElement("div");
  headingWrap.className = "min-w-0";

  const title = document.createElement("h2");
  title.id = "product-gallery-title";
  title.className = "truncate text-lg font-semibold text-brand-ink sm:text-xl";

  const meta = document.createElement("p");
  meta.className = "mt-1 text-sm text-black/60";

  headingWrap.append(title, meta);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className =
    "inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-2xl leading-none text-brand-ink transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent";
  closeButton.setAttribute("aria-label", "Cerrar vista ampliada");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", closeProductGallery);

  toolbar.append(headingWrap, closeButton);

  const viewport = document.createElement("div");
  viewport.className = "relative flex min-h-[320px] flex-1 items-center justify-center bg-[#f8f6f1] p-4 sm:min-h-[520px] sm:p-6";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.className =
    "absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl text-brand-ink shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:left-5";
  prevButton.setAttribute("aria-label", "Ver producto anterior");
  prevButton.textContent = "‹";
  prevButton.addEventListener("click", () => stepProductGallery(-1));

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className =
    "absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl text-brand-ink shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent sm:right-5";
  nextButton.setAttribute("aria-label", "Ver siguiente producto");
  nextButton.textContent = "›";
  nextButton.addEventListener("click", () => stepProductGallery(1));

  const image = document.createElement("img");
  image.className = "max-h-[72vh] w-full object-contain";

  viewport.append(prevButton, image, nextButton);
  panel.append(toolbar, viewport);
  overlay.append(panel);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeProductGallery();
    }
  });

  document.body.append(overlay);

  productGallery = {
    overlay,
    title,
    meta,
    image,
    prevButton,
    nextButton,
    closeButton
  };

  return productGallery;
}

function openProductGallery(products, productId, trigger) {
  if (!Array.isArray(products) || !products.length) return;

  const selectedIndex = Math.max(
    0,
    products.findIndex((product) => product.id === productId)
  );

  productGalleryState.products = products.slice();
  productGalleryState.currentIndex = selectedIndex;
  productGalleryState.lastTrigger = trigger instanceof HTMLElement ? trigger : null;

  const gallery = ensureProductGallery();
  renderGalleryItem();
  gallery.overlay.classList.remove("hidden");
  gallery.overlay.classList.add("flex");
  document.body.classList.add("overflow-hidden");
  document.addEventListener("keydown", handleGalleryKeydown);
  gallery.closeButton.focus();
}

function card(product, products) {
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

  const previewButton = document.createElement("button");
  previewButton.type = "button";
  previewButton.className =
    "block w-full cursor-zoom-in overflow-hidden bg-[#f8f6f1] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent";
  previewButton.setAttribute(
    "aria-label",
    `Ver imagen ampliada de ${product.name || "este producto"}`
  );
  previewButton.title = "Ver imagen ampliada";
  previewButton.addEventListener("click", () => {
    openProductGallery(products, product.id, previewButton);
  });
  previewButton.append(img);

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
  el.append(previewButton, body);
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
  for (const p of products) grid.append(card(p, products));
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
