const APP_CFG = Object.freeze({
  CACHE_TTL_SECONDS: 120,
  TOP_LIMIT: 5,
  PROP_DATA_VERSION: "data_version",
  CACHE_KEY_PREFIX: "dashboard:v:",
  SHEETS: Object.freeze({
    USERS_OPTIONS: ["usuarios", "Usuarios"],
    SALES_OPTIONS: ["VENTAS", "Ventas"],
    EXPENSES_OPTIONS: ["GASTOS", "Gastos"],
    SAVINGS_OPTIONS: ["AHORROS", "Ahorros"],
    PERSONAL_OPTIONS: ["Personales", "Gastos personales"],
    MONTHLY_SUMMARY: "RESUMEN MENSUAL"
  }),
  TYPES: Object.freeze({
    SALE: "venta",
    EXPENSE: "gasto",
    PERSONAL_EXPENSE: "gasto_personal",
    SAVINGS: "ahorro"
  }),
  EXPENSE_TYPES: Object.freeze([
    "Gasto Administrativo",
    "Gasto Fijo",
    "Gasto de Produccion",
    "Gastos variables"
  ])
});

function doPost(e) {
  const ss = SpreadsheetApp.getActive();
  try {
    const data = parsePostBody_(e);

    if (data.action === "login") {
      return json_(handleLogin_(ss, data));
    }

    const tz = ss.getSpreadsheetTimeZone();

    const result = withScriptLock_(15000, function () {
      const out = saveRecord_(ss, tz, data);
      const oldVersion = getDataVersion_();
      const newVersion = String(Number(oldVersion) + 1);
      setDataVersion_(newVersion);
      invalidateDashboardCache_(oldVersion, newVersion);
      return out;
    });

    return json_(result);
  } catch (error) {
    return jsonError_(error, ss);
  }
}

function doGet() {
  const ss = SpreadsheetApp.getActive();
  try {
    return json_(getDashboardPayloadCached_(ss));
  } catch (error) {
    return jsonError_(error, ss);
  }
}
