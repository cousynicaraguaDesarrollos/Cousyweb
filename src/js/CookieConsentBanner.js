function applyUnderlyingInertState(root, shouldBlock) {
  const siblings = Array.from(document.body?.children ?? []);
  for (const node of siblings) {
    if (!(node instanceof HTMLElement) || node === root) continue;
    if (!("inert" in node)) continue;

    if (shouldBlock) {
      if (!node.inert) {
        node.inert = true;
        node.dataset.cookieConsentInert = "1";
      }
      continue;
    }

    if (node.dataset.cookieConsentInert === "1") {
      node.inert = false;
      delete node.dataset.cookieConsentInert;
    }
  }
}

export class CookieConsentBanner {
  constructor({ onAccept, onReject, onConfigure } = {}) {
    this.onAccept = typeof onAccept === "function" ? onAccept : () => {};
    this.onReject = typeof onReject === "function" ? onReject : () => {};
    this.onConfigure = typeof onConfigure === "function" ? onConfigure : () => {};
    this.root = null;
    this.details = null;
    this.configureButton = null;
  }

  mount() {
    if (this.root?.isConnected) {
      this.blockPage();
      return this.root;
    }

    const root = document.createElement("div");
    root.dataset.cookieConsentRoot = "1";
    root.className =
      "fixed inset-0 z-[120] flex items-end bg-white/80 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6";
    root.innerHTML = `
      <div class="w-full max-w-3xl rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-soft sm:p-7">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[#73a35a]">Consentimiento de cookies</p>
            <h2 class="text-2xl tracking-tight text-brand-ink sm:text-3xl">Queremos medir mejor tus visitas sin romper tu experiencia</h2>
            <p class="text-sm leading-relaxed text-black/70 sm:text-base">
              Usamos Google Tag Manager, Google Analytics 4 y Consent Mode v2 para medir interacciones del sitio.
              Mientras no elijas, el contenido queda bloqueado para respetar tu decisión.
            </p>
          </div>

          <div class="rounded-2xl bg-[#dde0e1]/45 p-4 text-sm text-black/75">
            <p class="font-semibold text-brand-ink">Resumen rápido</p>
            <p class="mt-2">Si aceptas, activamos analítica y señales publicitarias.</p>
            <p class="mt-1">Si rechazas, esas señales quedan denegadas y el sitio sigue funcionando.</p>
          </div>

          <div data-cookie-consent-details class="hidden rounded-2xl border border-black/10 bg-white p-4 text-sm text-black/75">
            <p class="font-semibold text-brand-ink">Preferencias disponibles</p>
            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl bg-[#dde0e1]/35 p-3">
                <p class="font-semibold text-brand-ink">Necesarias</p>
                <p class="mt-1 text-black/70">Seguridad y funcionamiento básico del sitio. Siempre activas.</p>
              </div>
              <div class="rounded-2xl bg-[#73a35a]/10 p-3">
                <p class="font-semibold text-brand-ink">Analítica y anuncios</p>
                <p class="mt-1 text-black/70">Controla <code>analytics_storage</code>, <code>ad_storage</code>, <code>ad_user_data</code> y <code>ad_personalization</code>.</p>
              </div>
            </div>
            <p class="mt-3 text-black/70">Usa Aceptar o Rechazar para guardar tu decisión.</p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              data-cookie-action="accept"
              class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#ec1665] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 active:brightness-90"
            >
              Aceptar cookies
            </button>
            <button
              type="button"
              data-cookie-action="reject"
              class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-black/5"
            >
              Rechazar cookies
            </button>
            <button
              type="button"
              data-cookie-action="configure"
              aria-expanded="false"
              class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#73a35a] bg-[#73a35a]/10 px-5 py-3 text-sm font-semibold text-brand-ink transition hover:bg-[#73a35a]/15"
            >
              Configurar preferencias
            </button>
          </div>
        </div>
      </div>
    `;

    this.root = root;
    this.details = root.querySelector("[data-cookie-consent-details]");
    this.configureButton = root.querySelector("[data-cookie-action='configure']");

    root.querySelector("[data-cookie-action='accept']")?.addEventListener("click", () => {
      this.onAccept();
    });

    root.querySelector("[data-cookie-action='reject']")?.addEventListener("click", () => {
      this.onReject();
    });

    this.configureButton?.addEventListener("click", () => {
      const shouldOpen = this.details?.classList.contains("hidden") ?? false;
      this.togglePreferences(shouldOpen);
      this.onConfigure(shouldOpen);
    });

    document.body.append(root);
    this.blockPage();
    root.querySelector("[data-cookie-action='accept']")?.focus();
    return root;
  }

  togglePreferences(forceOpen) {
    if (!this.details || !this.configureButton) return;
    const nextOpen = typeof forceOpen === "boolean" ? forceOpen : this.details.classList.contains("hidden");
    this.details.classList.toggle("hidden", !nextOpen);
    this.configureButton.setAttribute("aria-expanded", String(nextOpen));
  }

  blockPage() {
    if (!this.root?.isConnected) return;
    document.documentElement.classList.add("overflow-hidden");
    document.body?.classList.add("overflow-hidden");
    applyUnderlyingInertState(this.root, true);
  }

  destroy() {
    if (!this.root) return;
    applyUnderlyingInertState(this.root, false);
    document.documentElement.classList.remove("overflow-hidden");
    document.body?.classList.remove("overflow-hidden");
    this.root.remove();
    this.root = null;
    this.details = null;
    this.configureButton = null;
  }
}
