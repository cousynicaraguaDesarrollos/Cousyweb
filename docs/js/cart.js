const CART_KEY = "cousy_quote_cart_v1";
const NOTES_KEY = "cousy_quote_notes_v1";

export function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cousy:cart-changed"));
}

export function cartCount() {
  return readCart().reduce((sum, item) => sum + Number(item.qty ?? 0), 0);
}

export function addToCart(product, qty = 1) {
  const items = readCart();
  const existing = items.find((x) => x.id === product.id);
  if (existing) existing.qty = Number(existing.qty ?? 0) + qty;
  else items.push({ ...product, qty });
  writeCart(items);
}

export function updateQty(id, qty) {
  const items = readCart().map((x) => (x.id === id ? { ...x, qty } : x));
  writeCart(items.filter((x) => Number(x.qty) > 0));
}

export function removeItem(id) {
  writeCart(readCart().filter((x) => x.id !== id));
}

export function clearCart() {
  writeCart([]);
  localStorage.removeItem(NOTES_KEY);
}

export function readNotes() {
  return localStorage.getItem(NOTES_KEY) ?? "";
}

export function writeNotes(text) {
  localStorage.setItem(NOTES_KEY, text);
}

export function buildWhatsappText({ greeting, items, notes }) {
  const lines = [];
  if (greeting) lines.push(greeting.trim());
  lines.push("");
  lines.push("Productos para cotizar:");
  for (const item of items) {
    const qty = Number(item.qty ?? 1);
    const name = String(item.name ?? item.id ?? "").trim();
    const url = item.sourceUrl ? ` (${item.sourceUrl})` : "";
    lines.push(`- ${qty} x ${name}${url}`);
  }
  if (notes?.trim()) {
    lines.push("");
    lines.push("Notas:");
    lines.push(notes.trim());
  }
  return lines.join("\n");
}

export function whatsappLink({ number, text }) {
  const cleaned = String(number ?? "").replaceAll(/[^\d]/g, "");
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

