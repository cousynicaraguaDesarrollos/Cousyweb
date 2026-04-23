const MOBILE_BREAKPOINT = 640;
const CLOSE_ANIMATION_MS = 260;

function getCloseLabel(toggle) {
  const current = String(toggle.getAttribute("aria-label") ?? "").toLowerCase();
  return current.includes("open") ? "Close menu" : "Cerrar menú";
}

function getOpenLabel(toggle) {
  const current = String(toggle.getAttribute("aria-label") ?? "").toLowerCase();
  return current.includes("open") ? "Open menu" : "Abrir menú";
}

export function initHeaderView(root = document) {
  const scope = root instanceof Element ? root : document;
  const toggle = scope.querySelector("[data-mobile-menu-toggle]");
  const menu = scope.querySelector("[data-mobile-menu]");
  const panel = scope.querySelector("[data-mobile-menu-panel]");

  if (!(toggle instanceof HTMLButtonElement)) return;
  if (!(menu instanceof HTMLElement)) return;
  if (!(panel instanceof HTMLElement)) return;
  if (toggle.dataset.mobileMenuInit === "1") return;

  const openIcon = toggle.querySelector('[data-menu-icon="open"]');
  const closeIcon = toggle.querySelector('[data-menu-icon="close"]');
  let closeTimer = null;

  const isDesktop = () => window.innerWidth >= MOBILE_BREAKPOINT;

  const setIconState = (open) => {
    if (openIcon instanceof HTMLElement) openIcon.classList.toggle("hidden", open);
    if (closeIcon instanceof HTMLElement) closeIcon.classList.toggle("hidden", !open);
  };

  const setPanelOpen = (open) => {
    panel.classList.toggle("max-h-0", !open);
    panel.classList.toggle("opacity-0", !open);
    panel.classList.toggle("max-h-[calc(100dvh-5rem)]", open);
    panel.classList.toggle("opacity-100", open);
  };

  const setOpen = (open, instant = false) => {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? getCloseLabel(toggle) : getOpenLabel(toggle));
    setIconState(open);
    document.body.classList.toggle("overflow-hidden", open);

    if (open) {
      menu.classList.remove("hidden");
      setPanelOpen(true);
      return;
    }

    setPanelOpen(false);
    if (instant) {
      menu.classList.add("hidden");
      return;
    }

    closeTimer = window.setTimeout(() => {
      menu.classList.add("hidden");
      closeTimer = null;
    }, CLOSE_ANIMATION_MS);
  };

  setOpen(false, true);
  toggle.dataset.mobileMenuInit = "1";

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!open);
  });

  for (const link of menu.querySelectorAll("a")) {
    if (!(link instanceof HTMLAnchorElement)) continue;
    link.addEventListener("click", () => setOpen(false, true));
  }

  window.addEventListener("resize", () => {
    if (isDesktop()) setOpen(false, true);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false, true);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (scope.contains(target)) return;
    setOpen(false, true);
  });
}
