import {
  buildWhatsappText,
  cartCount,
  clearCart,
  readCart,
  readNotes,
  removeItem,
  updateQty,
  whatsappLink,
  writeNotes
} from "./cart.js";

function rootPrefix() {
  const p = String(window.location?.pathname ?? "");
  return p.includes("/es/") || p.includes("/en/") ? ".." : ".";
}

function fromRoot(relPath) {
  return `${rootPrefix()}/${String(relPath).replace(/^\.?\//, "")}`;
}

async function loadConfig() {
  const res = await fetch(fromRoot("config/site.json"), { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar site.json");
  return await res.json();
}

let cfgPromise = null;
function loadConfigCached() {
  if (!cfgPromise) cfgPromise = loadConfig();
  return cfgPromise;
}

function itemRow(item) {
  const row = document.createElement("div");
  row.className =
    "flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5 sm:flex-row sm:items-center";

  const left = document.createElement("div");
  left.className = "flex items-center gap-4";

  const img = document.createElement("img");
  img.src = item.image || fromRoot("assets/placeholder.svg");
  img.alt = item.name || "Producto";
  img.loading = "lazy";
  img.className = "h-16 w-16 rounded-xl object-cover ring-1 ring-black/10";

  const meta = document.createElement("div");
  const title = document.createElement("p");
  title.className = "font-normal text-brand-ink";
  title.textContent = item.name || item.id;

  const link = document.createElement("a");
  link.className = "text-sm text-black/60 hover:text-brand-accent";
  link.href = item.sourceUrl || "#";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = item.sourceUrl ? "Ver producto" : "";

  meta.append(title, link);
  left.append(img, meta);

  const right = document.createElement("div");
  right.className = "flex items-center gap-3 sm:ml-auto";

  const qty = document.createElement("input");
  qty.type = "number";
  qty.min = "1";
  qty.step = "1";
  qty.value = String(item.qty ?? 1);
  qty.className =
    "w-20 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-accent";
  qty.addEventListener("input", () => {
    const next = Math.max(1, Number(qty.value || 1));
    updateQty(item.id, next);
  });

  const del = document.createElement("button");
  del.type = "button";
  del.className =
    "rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-brand-ink hover:bg-black/5";
  del.textContent = "Quitar";
  del.addEventListener("click", () => removeItem(item.id));

  right.append(qty, del);
  row.append(left, right);
  return row;
}

function render(items) {
  const list = document.querySelector("#quote-items");
  const empty = document.querySelector("#quote-empty");
  const total = document.querySelector("[data-cart-count-total]");
  if (total) total.textContent = String(cartCount());

  if (!list || !empty) return;

  list.innerHTML = "";
  if (!items.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  for (const item of items) list.append(itemRow(item));
}

let cartListenerBound = false;
function ensureCartListener() {
  if (cartListenerBound) return;
  cartListenerBound = true;
  window.addEventListener("cousy:cart-changed", () => render(readCart()));
}

async function initCotizacion() {
  const list = document.querySelector("#quote-items");
  const empty = document.querySelector("#quote-empty");
  if (!list || !empty) return;

  render(readCart());
  ensureCartListener();

  const notes = document.querySelector("#quote-notes");
  if (notes instanceof HTMLTextAreaElement) {
    notes.value = readNotes();
    if (!notes.dataset.bound) {
      notes.dataset.bound = "1";
      notes.addEventListener("input", () => writeNotes(notes.value));
    }
  }

  const sendBtn = document.querySelector("#quote-send");
  const clearBtn = document.querySelector("#quote-clear");
  const error = document.querySelector("#quote-error");

  let cfg = null;
  try {
    cfg = await loadConfigCached();
  } catch (e) {
    if (error) error.textContent = String(e?.message ?? e);
  }

  if (sendBtn instanceof HTMLElement && !sendBtn.dataset.bound) {
    sendBtn.dataset.bound = "1";
    sendBtn.addEventListener("click", () => {
      const current = readCart();
      if (!current.length) return;
      const greeting = cfg?.whatsappGreeting || "";
      const number = cfg?.whatsappNumber || "";
      const message = buildWhatsappText({
        greeting,
        items: current,
        notes: readNotes()
      });
      const url = whatsappLink({ number, text: message });
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  if (clearBtn instanceof HTMLElement && !clearBtn.dataset.bound) {
    clearBtn.dataset.bound = "1";
    clearBtn.addEventListener("click", () => clearCart());
  }
}

function onLoad() {
  void initCotizacion();
}

window.addEventListener("DOMContentLoaded", onLoad);
document.addEventListener("turbo:load", onLoad);
onLoad();
