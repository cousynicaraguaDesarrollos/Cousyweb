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

async function inject(targetSelector, partialPath) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  const res = await fetch(fromRoot(partialPath), { cache: "no-store" });
  if (!res.ok) return;
  target.innerHTML = await res.text();
}

function setYear() {
  const y = String(new Date().getFullYear());
  for (const el of document.querySelectorAll("[data-year]")) {
    el.textContent = y;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const path = String(window.location?.pathname ?? "");
  const lang = path.includes("/en/") ? "en" : "es";

  // Por ahora, solo hay parciales ES/EN (y las páginas actuales viven en /es).
  await inject("[data-site-header]", `partials/header-${lang}.html`);
  await inject("[data-site-footer]", `partials/footer-${lang}.html`);

  setActiveNav();
  setYear();

  // Recalcular badge del carrito si el header se inyectó después.
  window.dispatchEvent(new CustomEvent("cousy:cart-changed"));
});
