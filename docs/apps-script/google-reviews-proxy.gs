/**
 * Cousy Nicaragua - Google Reviews proxy (Apps Script)
 *
 * Required Script Properties:
 * - GOOGLE_PLACES_API_KEY
 * - COUSY_PLACE_ID
 *
 * Optional Script Properties:
 * - COUSY_PUBLIC_TOKEN (if present, requests must send ?token=VALUE)
 * - COUSY_ALLOWED_PLACE_IDS (comma-separated allowlist)
 * - REVIEWS_CACHE_SECONDS (default 900)
 */

const PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

function doGet(e) {
  try {
    const payload = handleRequest_(e || {});
    return jsonOutput_(payload);
  } catch (error) {
    return jsonOutput_({
      ok: false,
      error: "INTERNAL_ERROR",
      message: safeMessage_(error)
    });
  }
}

function handleRequest_(e) {
  const params = e.parameter || {};

  if (String(params.action || "") === "ping") {
    return {
      ok: true,
      service: "cousy-google-reviews-proxy",
      timestamp: new Date().toISOString()
    };
  }

  validatePublicToken_(params);

  const placeId = resolvePlaceId_(params);
  const language = resolveLanguage_(params);
  const reviewsSort = resolveReviewsSort_(params);
  const cacheSeconds = resolveCacheSeconds_();

  const cacheKey = ["reviews", placeId, language, reviewsSort].join(":");
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = fetchPlaceReviews_({
    placeId: placeId,
    language: language,
    reviewsSort: reviewsSort
  });

  cache.put(cacheKey, JSON.stringify(result), cacheSeconds);
  return result;
}

function fetchPlaceReviews_(requestConfig) {
  const apiKey = requiredProperty_("GOOGLE_PLACES_API_KEY");
  const query = toQueryString_({
    place_id: requestConfig.placeId,
    fields: "rating,reviews",
    language: requestConfig.language,
    reviews_sort: requestConfig.reviewsSort,
    key: apiKey
  });

  const response = UrlFetchApp.fetch(PLACES_DETAILS_URL + "?" + query, {
    method: "get",
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  if (statusCode !== 200) {
    throw new Error("GOOGLE_HTTP_" + statusCode);
  }

  const raw = JSON.parse(response.getContentText() || "{}");
  const status = String(raw.status || "");
  if (status !== "OK") {
    throw new Error("GOOGLE_STATUS_" + status);
  }

  const result = raw.result || {};
  const reviews = Array.isArray(result.reviews) ? result.reviews : [];

  return {
    ok: true,
    placeId: requestConfig.placeId,
    language: requestConfig.language,
    rating: Number(result.rating || 0),
    reviews: reviews
      .map(normalizeReview_)
      .filter(function (review) {
        return review.text && review.author_name;
      }),
    source: "google_places_legacy",
    fetchedAt: new Date().toISOString()
  };
}

function normalizeReview_(review) {
  return {
    author_name: String((review && review.author_name) || "").trim(),
    profile_photo_url: String((review && review.profile_photo_url) || "").trim(),
    rating: Number((review && review.rating) || 0),
    text: String((review && review.text) || "").trim(),
    relative_time_description: String((review && review.relative_time_description) || "").trim(),
    time: Number((review && review.time) || 0)
  };
}

function validatePublicToken_(params) {
  const requiredToken = String(getProperty_("COUSY_PUBLIC_TOKEN") || "").trim();
  if (!requiredToken) {
    return;
  }

  const providedToken = String((params && params.token) || "").trim();
  if (!constantTimeEquals_(requiredToken, providedToken)) {
    throw new Error("UNAUTHORIZED");
  }
}

function resolvePlaceId_(params) {
  const defaultPlaceId = requiredProperty_("COUSY_PLACE_ID");
  const requestedPlaceId = String((params && params.placeId) || "").trim();
  const placeId = requestedPlaceId || defaultPlaceId;

  if (!/^[A-Za-z0-9_-]+$/.test(placeId)) {
    throw new Error("INVALID_PLACE_ID");
  }

  const allowlist = String(getProperty_("COUSY_ALLOWED_PLACE_IDS") || "")
    .split(",")
    .map(function (item) {
      return String(item).trim();
    })
    .filter(Boolean);

  if (allowlist.length > 0 && allowlist.indexOf(placeId) === -1) {
    throw new Error("PLACE_ID_NOT_ALLOWED");
  }

  return placeId;
}

function resolveLanguage_(params) {
  const raw = String((params && params.lang) || "es").trim().toLowerCase();
  if (/^[a-z]{2}(-[a-z]{2})?$/.test(raw)) {
    return raw;
  }
  return "es";
}

function resolveReviewsSort_(params) {
  const raw = String((params && params.sort) || "most_relevant").trim().toLowerCase();
  if (raw === "newest") {
    return "newest";
  }
  return "most_relevant";
}

function resolveCacheSeconds_() {
  const fromProps = Number(getProperty_("REVIEWS_CACHE_SECONDS") || 900);
  if (!Number.isFinite(fromProps)) {
    return 900;
  }
  return Math.min(3600, Math.max(60, Math.floor(fromProps)));
}

function requiredProperty_(name) {
  const value = String(getProperty_(name) || "").trim();
  if (!value) {
    throw new Error("MISSING_PROPERTY_" + name);
  }
  return value;
}

function getProperty_(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

function toQueryString_(params) {
  return Object.keys(params)
    .map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(String(params[key]));
    })
    .join("&");
}

function constantTimeEquals_(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function safeMessage_(error) {
  if (!error || typeof error.message !== "string") {
    return "Unexpected error";
  }
  return error.message.slice(0, 160);
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
