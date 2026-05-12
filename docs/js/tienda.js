import { addToCart } from "./cart.js";

function rootPrefix() {
  const p = String(window.location?.pathname ?? "");
  return p.includes("/es/") || p.includes("/en/") ? ".." : ".";
}

function fromRoot(relPath) {
  return `${rootPrefix()}/${String(relPath).replace(/^\.?\//, "")}`;
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

  const img = document.createElement("img");
  img.src = product.image || fromRoot("assets/placeholder.svg");
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
    addToCart(
      {
        id: product.id,
        name: product.name,
        image: product.image,
        sourceUrl: product.sourceUrl
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

async function loadProducts() {
  const res = await fetch(fromRoot("data/products.json"), { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar products.json");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function render(products) {
  const grid = document.querySelector("#products-grid");
  if (!grid) return;
  grid.innerHTML = "";
  for (const p of products) grid.append(card(p));
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

window.addEventListener("DOMContentLoaded", onLoad);
document.addEventListener("turbo:load", onLoad);
onLoad();
