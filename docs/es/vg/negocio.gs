function handleLogin_(ss, data) {
  const sheet = obtenerHoja(ss, APP_CFG.SHEETS.USERS_OPTIONS);
  const rows = getSheetValues_(sheet);
  const usuarioInput = String((data && data.usuario) || "").trim();
  const passwordInput = String((data && data.password) || "").trim();

  for (let i = 1; i < rows.length; i++) {
    const usuario = String(rows[i][0] || "").trim();
    const password = String(rows[i][1] || "").trim();
    const activo = String(rows[i][2] || "").trim().toUpperCase();
    if (usuario === usuarioInput && password === passwordInput && activo === "SI") {
      return { success: true, usuario: usuario };
    }
  }

  return { success: false };
}

function saveRecord_(ss, tz, data) {
  if (!data || !data.tipo) throw new Error("Tipo de registro no enviado");

  const tipo = String(data.tipo || "").trim();

  if (tipo === APP_CFG.TYPES.SALE) return saveVentasRecord_(ss, tz, data);
  if (tipo === APP_CFG.TYPES.EXPENSE) return saveGastosRecord_(ss, tz, data);
  if (tipo === APP_CFG.TYPES.PERSONAL_EXPENSE) return savePersonalesRecord_(ss, tz, data);
  if (tipo === APP_CFG.TYPES.SAVINGS) return saveAhorrosRecord_(ss, tz, data);

  throw new Error("Tipo no válido: " + tipo);
}

function saveVentasRecord_(ss, tz, data) {
  const fecha = parseFechaOrThrow_(data.fecha, tz);
  const usuario = getUsuarioRegistro_(data);
  const sheet = obtenerHoja(ss, APP_CFG.SHEETS.SALES_OPTIONS);

  sheet.appendRow([
    Utilities.getUuid(),
    fecha,
    String(data.cliente || "").trim(),
    String(data.descripcion || "").trim(),
    Number(data.monto) || 0,
    Utilities.formatDate(fecha, tz, "yyyy-MM"),
    usuario
  ]);

  return { success: true, tipo: APP_CFG.TYPES.SALE };
}

function saveGastosRecord_(ss, tz, data) {
  const fecha = parseFechaOrThrow_(data.fecha, tz);
  const usuario = getUsuarioRegistro_(data);
  const tipoGasto = String(data.tipoGasto || "").trim();

  if (!tipoGasto) {
    throw new Error("Debes seleccionar un tipo de gasto");
  }
  if (!APP_CFG.EXPENSE_TYPES.includes(tipoGasto)) {
    throw new Error("Tipo de gasto no valido: " + tipoGasto);
  }

  const sheet = obtenerHoja(ss, APP_CFG.SHEETS.EXPENSES_OPTIONS);
  sheet.appendRow([
    Utilities.getUuid(),
    fecha,
    String(data.descripcion || "").trim(),
    Number(data.monto) || 0,
    Utilities.formatDate(fecha, tz, "yyyy-MM"),
    tipoGasto,
    usuario
  ]);

  return { success: true, tipo: APP_CFG.TYPES.EXPENSE };
}

function savePersonalesRecord_(ss, tz, data) {
  const fecha = parseFechaOrThrow_(data.fecha, tz);
  const sheet = obtenerHoja(ss, APP_CFG.SHEETS.PERSONAL_OPTIONS);

  sheet.appendRow([
    fecha,
    String(data.descripcion || "").trim(),
    Number(data.monto) || 0,
    Utilities.formatDate(fecha, tz, "yyyy-MM")
  ]);

  return { success: true, tipo: APP_CFG.TYPES.PERSONAL_EXPENSE };
}

function saveAhorrosRecord_(ss, tz, data) {
  const fecha = parseFechaOrThrow_(data.fecha, tz);
  const usuario = getUsuarioRegistro_(data);
  const sheet = obtenerHoja(ss, APP_CFG.SHEETS.SAVINGS_OPTIONS);

  sheet.appendRow([
    fecha,
    String(data.cliente || "").trim(),
    String(data.descripcion || "").trim(),
    Number(data.monto) || 0,
    Utilities.formatDate(fecha, tz, "yyyy-MM"),
    usuario
  ]);

  return { success: true, tipo: APP_CFG.TYPES.SAVINGS };
}

function getDashboardPayloadCached_(ss) {
  const version = getDataVersion_();
  const key = cacheKey_(version);
  const cache = CacheService.getScriptCache();

  const hit = cache.get(key);
  if (hit) return JSON.parse(hit);

  const payload = withScriptLock_(10000, function () {
    const secondHit = cache.get(key);
    if (secondHit) return JSON.parse(secondHit);

    const data = buildDashboardPayload_(ss);
    cachePutSafe_(key, JSON.stringify(data), APP_CFG.CACHE_TTL_SECONDS);
    return data;
  });

  return payload;
}

function buildDashboardPayload_(ss) {
  const tz = ss.getSpreadsheetTimeZone();
  const resumenByMes = {};
  const gastosByDescripcion = {};
  const clientesByNombre = {};

  const ventasRows = getSheetValues_(obtenerHoja(ss, APP_CFG.SHEETS.SALES_OPTIONS));
  const gastosRows = getSheetValues_(obtenerHoja(ss, APP_CFG.SHEETS.EXPENSES_OPTIONS));
  const personalesRows = getSheetValues_(obtenerHoja(ss, APP_CFG.SHEETS.PERSONAL_OPTIONS));
  const ahorrosRows = getSheetValues_(obtenerHoja(ss, APP_CFG.SHEETS.SAVINGS_OPTIONS));

  for (let i = 1; i < ventasRows.length; i++) {
    const monto = Number(ventasRows[i][4]) || 0;
    const mes = normalizeMonth_(ventasRows[i][5], ventasRows[i][1], tz);
    const cliente = String(ventasRows[i][2] || "").trim();

    if (!mes || !monto) continue;
    ensureResumenMes_(resumenByMes, mes).ventas += monto;
    if (cliente) clientesByNombre[cliente] = (clientesByNombre[cliente] || 0) + monto;
  }

  for (let i = 1; i < gastosRows.length; i++) {
    const descripcion = String(gastosRows[i][2] || "").trim();
    const monto = Number(gastosRows[i][3]) || 0;
    const mes = normalizeMonth_(gastosRows[i][4], gastosRows[i][1], tz);
    const tipoGasto = String(gastosRows[i][5] || "").trim() || "Sin tipo";
    const key = tipoGasto + " - " + (descripcion || "Sin descripcion");

    if (!mes || !monto) continue;
    ensureResumenMes_(resumenByMes, mes).gastos += monto;
    gastosByDescripcion[key] = (gastosByDescripcion[key] || 0) + monto;
  }

  for (let i = 1; i < ahorrosRows.length; i++) {
    const descripcion = String(ahorrosRows[i][2] || "").trim() || "Ahorro";
    const monto = Number(ahorrosRows[i][3]) || 0;
    const mes = normalizeMonth_(ahorrosRows[i][4], ahorrosRows[i][0], tz);

    if (!mes || !monto) continue;
    ensureResumenMes_(resumenByMes, mes).gastos += monto;
    gastosByDescripcion["Ahorro - " + descripcion] =
      (gastosByDescripcion["Ahorro - " + descripcion] || 0) + monto;
  }

  for (let i = 1; i < personalesRows.length; i++) {
    const monto = Number(personalesRows[i][2]) || 0;
    const mes = normalizeMonth_(personalesRows[i][3], personalesRows[i][0], tz);
    if (!mes || !monto) continue;
    ensureResumenMes_(resumenByMes, mes).personales += monto;
  }

  const resumen = Object.keys(resumenByMes)
    .sort()
    .map(function (mes) {
      const item = resumenByMes[mes];
      return {
        mes: mes,
        ventas: item.ventas,
        gastos: item.gastos,
        personales: item.personales,
        utilidad: item.ventas - item.gastos - item.personales
      };
    });

  return {
    resumen: resumen,
    gastosAltos: convertirTop_(gastosByDescripcion, APP_CFG.TOP_LIMIT),
    clientesTop: convertirTop_(clientesByNombre, APP_CFG.TOP_LIMIT)
  };
}

function parseFechaOrThrow_(fechaRaw, tz) {
  const fechaTexto = String(fechaRaw || "").trim();
  const match = fechaTexto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error("Fecha inválida");

  // Se fija al mediodía en la zona horaria del spreadsheet para evitar desfases de día.
  const fecha = Utilities.parseDate(fechaTexto + " 12:00:00", tz, "yyyy-MM-dd HH:mm:ss");
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) throw new Error("Fecha inválida");
  return fecha;
}

function getUsuarioRegistro_(data) {
  const usuario = String((data && data.usuario) || "").trim();
  return usuario || "sin_usuario";
}

function ensureResumenMes_(resumenByMes, mes) {
  if (!resumenByMes[mes]) resumenByMes[mes] = { ventas: 0, gastos: 0, personales: 0 };
  return resumenByMes[mes];
}

function normalizeMonth_(monthCellValue, dateCellValue, tz) {
  const rawMonth = String(monthCellValue || "").trim();
  if (/^\d{4}-\d{2}$/.test(rawMonth)) return rawMonth;

  if (dateCellValue instanceof Date && !isNaN(dateCellValue.getTime())) {
    return Utilities.formatDate(dateCellValue, tz, "yyyy-MM");
  }

  const fromText = String(dateCellValue || "").trim();
  const match = fromText.match(/^(\d{4})-(\d{2})/);
  if (match) return match[1] + "-" + match[2];

  return "";
}

function convertirTop_(obj, limite) {
  return Object.entries(obj)
    .map(([nombre, monto]) => ({ nombre: nombre, monto: monto }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, limite);
}
