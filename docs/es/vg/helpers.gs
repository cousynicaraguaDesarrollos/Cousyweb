function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(error, ss) {
  const hojas = ss ? ss.getSheets().map(s => s.getName()) : [];
  return json_({
    success: false,
    error: error && error.message ? error.message : String(error),
    hojas: hojas
  });
}

function parsePostBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("La solicitud no contiene datos POST");
  }
  try {
    return JSON.parse(e.postData.contents);
  } catch (_) {
    throw new Error("JSON inválido en POST");
  }
}

function withScriptLock_(timeoutMs, fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(timeoutMs);
  try {
    return fn();
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function obtenerHoja(ss, nombres) {
  const lista = Array.isArray(nombres) ? nombres : [nombres];
  for (let i = 0; i < lista.length; i++) {
    const sheet = ss.getSheetByName(lista[i]);
    if (sheet) return sheet;
  }
  throw new Error("No existe ninguna de estas hojas: " + lista.join(", "));
}

function getSheetValues_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow === 0 || lastCol === 0) return [];
  return sheet.getRange(1, 1, lastRow, lastCol).getValues();
}

function getDataVersion_() {
  return PropertiesService.getScriptProperties().getProperty(APP_CFG.PROP_DATA_VERSION) || "0";
}

function setDataVersion_(v) {
  PropertiesService.getScriptProperties().setProperty(APP_CFG.PROP_DATA_VERSION, v);
}

function cacheKey_(version) {
  return APP_CFG.CACHE_KEY_PREFIX + version;
}

function invalidateDashboardCache_(oldVersion, newVersion) {
  const cache = CacheService.getScriptCache();
  cache.remove(cacheKey_(oldVersion));
  if (newVersion !== oldVersion) cache.remove(cacheKey_(newVersion));
}

function cachePutSafe_(key, value, ttlSeconds) {
  try {
    CacheService.getScriptCache().put(key, value, ttlSeconds);
  } catch (_) {
    // Ignorar fallo de cache para no romper respuesta.
  }
}
