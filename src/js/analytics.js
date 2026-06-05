import {
  analyticsConfig,
  isAnalyticsEnabledForPath,
  isConfiguredGa4MeasurementId,
  isConfiguredGtmId
} from "./analytics.config.js";
import { CookieConsentBanner } from "./CookieConsentBanner.js";

const CONSENT_ACCEPTED = "accepted";
const CONSENT_REJECTED = "rejected";
const CONSENT_EVENT_NAME = "cousy:cookie-consent-resolved";

let analyticsInitialized = false;
let consentBanner = null;
let lifecycleBound = false;
let quoteDelegationBound = false;
let pageViewSequence = 0;
let lastPageKey = "";
let scrollTrackedForPageView = -1;
const trackedProductViews = new Set();

function normalizePathname(pathname) {
  let normalized = String(pathname ?? "/").replace(/\/+/g, "/");
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized.endsWith("/index.html")) normalized = normalized.slice(0, -"index.html".length);
  if (normalized.endsWith(".html")) normalized = normalized.slice(0, -".html".length);
  if (normalized.length > 1 && normalized.endsWith("/")) normalized = normalized.slice(0, -1);
  return normalized || "/";
}

function isCurrentRouteEnabled() {
  return isAnalyticsEnabledForPath(window.location?.pathname ?? "/");
}

function getDataLayerName() {
  return analyticsConfig.dataLayerName || "dataLayer";
}

function getDataLayer() {
  const layerName = getDataLayerName();
  const layer = (window[layerName] = window[layerName] || []);
  if (layerName !== "dataLayer" && !window.dataLayer) {
    window.dataLayer = layer;
  }
  return layer;
}

function gtagShim(...args) {
  getDataLayer().push(args);
}

function ensureGlobalGtag() {
  if (typeof window.gtag !== "function") {
    window.gtag = gtagShim;
  }
}

function shouldUseDirectGa4() {
  return isConfiguredGa4MeasurementId() && !isConfiguredGtmId();
}

function readStoredConsent() {
  try {
    const raw = localStorage.getItem(analyticsConfig.consentStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.status === CONSENT_ACCEPTED || parsed?.status === CONSENT_REJECTED) {
      return parsed;
    }
  } catch {
    // noop
  }
  return null;
}

function writeStoredConsent(status) {
  try {
    localStorage.setItem(
      analyticsConfig.consentStorageKey,
      JSON.stringify({
        status,
        updatedAt: new Date().toISOString()
      })
    );
  } catch {
    // noop
  }
}

export function getConsentStatus() {
  return readStoredConsent()?.status ?? null;
}

export function hasConsentDecision() {
  return getConsentStatus() === CONSENT_ACCEPTED || getConsentStatus() === CONSENT_REJECTED;
}

function buildConsentUpdate(status) {
  if (status === CONSENT_ACCEPTED) {
    return {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted"
    };
  }

  return {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  };
}

function ensureConsentDefaults() {
  if (window.__cousyConsentDefaultsSet) return;
  ensureGlobalGtag();
  window.gtag("consent", "default", analyticsConfig.consentDefaults);
  window.__cousyConsentDefaultsSet = true;
}

function ensureGtmLoaded() {
  if (!isConfiguredGtmId()) return;
  if (window.google_tag_manager) return;
  if (document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${analyticsConfig.gtmId}"]`)) return;

  getDataLayer().push({
    "gtm.start": Date.now(),
    event: "gtm.js",
    ga4_measurement_id: analyticsConfig.ga4MeasurementId
  });

  const script = document.createElement("script");
  script.async = true;
  script.dataset.cousyGtm = "1";

  const layerName = getDataLayerName();
  const layerQuery = layerName !== "dataLayer" ? `&l=${encodeURIComponent(layerName)}` : "";
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(analyticsConfig.gtmId)}${layerQuery}`;
  document.head.append(script);
}

function ensureGa4Loaded() {
  if (!shouldUseDirectGa4()) return;
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${analyticsConfig.ga4MeasurementId}"]`)) {
    if (!window.__cousyGa4JsInitialized) {
      window.gtag("js", new Date());
      window.__cousyGa4JsInitialized = true;
    }
    return;
  }

  ensureGlobalGtag();

  if (!window.__cousyGa4JsInitialized) {
    window.gtag("js", new Date());
    window.__cousyGa4JsInitialized = true;
  }

  const script = document.createElement("script");
  script.async = true;
  script.dataset.cousyGa4 = "1";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsConfig.ga4MeasurementId)}`;
  document.head.append(script);
}

function sanitizeParams(params = {}) {
  const safe = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (["string", "number", "boolean"].includes(typeof value)) {
      safe[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      safe[key] = value.join(", ");
    }
  }
  return safe;
}

function currentPageContext() {
  return {
    page_path: window.location?.pathname ?? "/",
    page_title: document.title,
    page_language: document.documentElement.lang || "es"
  };
}

export function trackEvent(eventName, params = {}) {
  if (!isCurrentRouteEnabled()) return false;
  if (!hasConsentDecision()) return false;

  const payload = {
    event: eventName,
    ...currentPageContext(),
    ...sanitizeParams(params)
  };

  getDataLayer().push(payload);
  return true;
}

export function trackWhatsAppClick(params = {}) {
  return trackEvent("whatsapp_click", params);
}

export function trackQuoteClick(params = {}) {
  return trackEvent("quote_click", params);
}

export function trackCatalogDownload(params = {}) {
  return trackEvent("catalog_download", params);
}

export function trackContactSubmit(params = {}) {
  return trackEvent("contact_submit", params);
}

export function trackProductView(productName, params = {}) {
  if (!hasConsentDecision()) return false;

  const normalizedName = String(productName ?? "").trim();
  if (!normalizedName) return false;

  const productKey = `${pageViewSequence}:${normalizedName.toLowerCase()}`;
  if (trackedProductViews.has(productKey)) return true;

  const tracked = trackEvent("product_view", {
    product_name: normalizedName,
    ...params
  });

  if (tracked) {
    trackedProductViews.add(productKey);
  }

  return tracked;
}

export function trackScroll75(params = {}) {
  return trackEvent("scroll_75", params);
}

function updateConsent(status, { persist = true } = {}) {
  ensureGlobalGtag();
  window.gtag("consent", "update", buildConsentUpdate(status));

  if (persist) {
    writeStoredConsent(status);
  }

  consentBanner?.destroy();
  consentBanner = null;

  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT_NAME, {
      detail: {
        status
      }
    })
  );
}

function ensureStoredConsentApplied() {
  const stored = getConsentStatus();
  if (!stored) return;
  updateConsent(stored, { persist: false });
}

function ensureConsentBanner() {
  if (hasConsentDecision()) {
    consentBanner?.destroy();
    consentBanner = null;
    return;
  }

  if (!consentBanner) {
    consentBanner = new CookieConsentBanner({
      onAccept: () => updateConsent(CONSENT_ACCEPTED),
      onReject: () => updateConsent(CONSENT_REJECTED),
      onConfigure: () => {}
    });
  }

  consentBanner.mount();
}

function resolveElementLabel(element) {
  const explicit = element.getAttribute("aria-label") || element.getAttribute("title");
  if (explicit) return explicit.trim();
  return String(element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
}

function isQuoteHref(element) {
  if (!(element instanceof HTMLAnchorElement)) return false;
  const href = element.getAttribute("href");
  if (!href || href.startsWith("#")) return false;

  try {
    const url = new URL(href, window.location.origin);
    const normalized = normalizePathname(url.pathname);
    return normalized === "/es/cotizacion";
  } catch {
    return false;
  }
}

function bindQuoteDelegation() {
  if (quoteDelegationBound) return;
  quoteDelegationBound = true;

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    if (!isQuoteHref(link)) return;
    if (link.closest("[data-cookie-consent-root='1']")) return;

    trackQuoteClick({
      cta_label: resolveElementLabel(link),
      cta_location: link.closest("header") ? "header" : "content_link"
    });
  });
}

function maybeTrackScrollDepth() {
  if (!hasConsentDecision()) return;
  if (!isCurrentRouteEnabled()) return;
  if (scrollTrackedForPageView === pageViewSequence) return;

  const doc = document.documentElement;
  const body = document.body;
  const scrollTop = window.scrollY || doc.scrollTop || body?.scrollTop || 0;
  const viewportHeight = window.innerHeight || doc.clientHeight || 0;
  const scrollHeight = Math.max(doc.scrollHeight || 0, body?.scrollHeight || 0);
  if (scrollHeight <= 0) return;

  const scrolledRatio = ((scrollTop + viewportHeight) / scrollHeight) * 100;
  if (scrolledRatio < 75) return;

  const tracked = trackScroll75({
    scroll_percent: 75
  });

  if (tracked) {
    scrollTrackedForPageView = pageViewSequence;
  }
}

function syncGa4PageView() {
  if (!shouldUseDirectGa4()) return;

  const pageKey = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (window.__cousyGa4LastPageKey === pageKey) return;

  ensureGlobalGtag();
  window.gtag("config", analyticsConfig.ga4MeasurementId, {
    page_title: document.title,
    page_path: window.location.pathname + window.location.search,
    page_location: window.location.href
  });
  window.__cousyGa4LastPageKey = pageKey;
}

function handleRouteLifecycle() {
  if (!isCurrentRouteEnabled()) {
    consentBanner?.destroy();
    consentBanner = null;
    return;
  }

  const pageKey = `${window.location.pathname}${window.location.search}`;
  if (pageKey !== lastPageKey) {
    pageViewSequence += 1;
    lastPageKey = pageKey;
    scrollTrackedForPageView = -1;
  }

  ensureConsentBanner();
  syncGa4PageView();
  window.requestAnimationFrame(maybeTrackScrollDepth);
}

function bindLifecycle() {
  if (lifecycleBound) return;
  lifecycleBound = true;

  window.addEventListener("scroll", maybeTrackScrollDepth, { passive: true });
  window.addEventListener("resize", maybeTrackScrollDepth, { passive: true });
  window.addEventListener(CONSENT_EVENT_NAME, maybeTrackScrollDepth);
  document.addEventListener("turbo:load", handleRouteLifecycle);
}

function exposeAnalyticsApi() {
  window.CousyAnalytics = {
    trackEvent,
    trackWhatsAppClick,
    trackQuoteClick,
    trackCatalogDownload,
    trackContactSubmit,
    trackProductView,
    trackScroll75,
    hasConsentDecision,
    getConsentStatus,
    openCookiePreferences() {
      ensureConsentBanner();
      consentBanner?.togglePreferences(true);
    }
  };
}

export function initAnalytics() {
  if (!isCurrentRouteEnabled()) return;

  ensureGlobalGtag();
  ensureConsentDefaults();
  ensureStoredConsentApplied();
  ensureGa4Loaded();
  ensureGtmLoaded();
  bindLifecycle();
  bindQuoteDelegation();
  exposeAnalyticsApi();
  handleRouteLifecycle();

  if (analyticsInitialized) return;
  analyticsInitialized = true;

  if (!isConfiguredGtmId()) {
    console.info(
      "[Cousy analytics] Falta configurar el contenedor GTM en src/js/analytics.config.js (GTM-XXXXXXX)."
    );
  }

  if (!isConfiguredGa4MeasurementId()) {
    console.info(
      "[Cousy analytics] Falta configurar el Measurement ID de GA4 en src/js/analytics.config.js."
    );
  }
}
