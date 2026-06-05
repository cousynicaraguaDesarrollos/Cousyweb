export const analyticsConfig = Object.freeze({
  gtmId: "GTM-TC7DDC2H",
  // Measurement ID actual de GA4. Cuando integremos GTM, este mismo ID se usará dentro del contenedor.
  ga4MeasurementId: "G-M9D3K3092V",
  dataLayerName: "dataLayer",
  consentStorageKey: "cousy_cookie_consent_v1",
  consentDefaults: Object.freeze({
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  }),
  excludedPathPatterns: Object.freeze([
    /\/es\/vg(?:\/|\/index\.html)?$/i,
    /\/es\/vg\.html$/i,
    /\/es\/ventas-gastos-panel(?:\/|\/index\.html|\.html)?$/i
  ])
});

export function isConfiguredGtmId(value = analyticsConfig.gtmId) {
  return /^GTM-[A-Z0-9]+$/i.test(String(value ?? "").trim()) && String(value).trim() !== "GTM-CONTAINERID";
}

export function isConfiguredGa4MeasurementId(value = analyticsConfig.ga4MeasurementId) {
  return /^G-[A-Z0-9]+$/i.test(String(value ?? "").trim()) && String(value).trim() !== "G-MEASUREMENTID";
}

export function isAnalyticsEnabledForPath(pathname = window.location?.pathname ?? "/") {
  const currentPath = String(pathname ?? "/");
  return !analyticsConfig.excludedPathPatterns.some((pattern) => pattern.test(currentPath));
}
