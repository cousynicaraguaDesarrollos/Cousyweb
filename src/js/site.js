import { cartCount } from "./cart.js";

function updateBadge() {
  const count = cartCount();
  for (const el of document.querySelectorAll("[data-cart-count]")) {
    el.textContent = String(count);
    el.classList.toggle("hidden", count <= 0);
  }
}

window.addEventListener("cousy:cart-changed", updateBadge);
window.addEventListener("storage", updateBadge);
window.addEventListener("DOMContentLoaded", updateBadge);

