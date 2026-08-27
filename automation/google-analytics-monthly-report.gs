/**
 * Reporte mensual personalizado de Google Analytics 4 para Cousy Nicaragua.
 *
 * Requisitos de una sola vez en Google Apps Script:
 * 1. Activar el servicio avanzado "Google Analytics Data API".
 * 2. En el proyecto de Google Cloud asociado, activar
 *    analyticsdata.googleapis.com.
 * 3. Ejecutar setupMonthlyTrigger() y conceder permisos.
 */

const CONFIG = Object.freeze({
  propertyId: '454329627',
  timezone: 'America/Managua',
  recipients: [
    'margelgabriel@gmail.com',
    'cousynicaragua@gmail.com'
  ],
  whatsappEventName: 'whatsapp_click',
  trackingStartDate: '2026-08-27',
  siteName: 'Cousy Nicaragua'
});

/** Crea el disparador mensual: día 1, aproximadamente a las 08:00. */
function setupMonthlyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'sendMonthlyAnalyticsReport')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('sendMonthlyAnalyticsReport')
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .inTimezone(CONFIG.timezone)
    .create();
}

/** Ejecuta el reporte del mes calendario anterior y lo envía por correo. */
function sendMonthlyAnalyticsReport() {
  const period = previousCalendarMonth_();
  const summary = runReport_([
    metric_('activeUsers'),
    metric_('newUsers'),
    metric_('sessions'),
    metric_('screenPageViews'),
    metric_('engagementRate'),
    metric_('averageSessionDuration'),
    metric_('eventCount')
  ], [], period);

  const channels = runReport_([
    metric_('sessions'),
    metric_('activeUsers'),
    metric_('engagementRate')
  ], [dimension_('sessionDefaultChannelGroup')], period);

  const pages = runReport_([
    metric_('screenPageViews'),
    metric_('activeUsers'),
    metric_('engagementRate')
  ], [dimension_('pagePath'), dimension_('pageTitle')], period, 10, {
    excludePrefixes: ['/pruebas-web/', '/docs/', '/src/pages/']
  });

  const whatsapp = runReport_([
    metric_('eventCount'),
    metric_('totalUsers')
  ], [dimension_('eventName')], period, 1, {
    fieldName: 'eventName',
    stringValue: CONFIG.whatsappEventName
  });

  const quoteEvents = runReport_([
    metric_('eventCount'),
    metric_('totalUsers')
  ], [dimension_('eventName')], period, 5, {
    fieldName: 'eventName',
    inListValues: ['quote_click', 'contact_submit', 'catalog_download']
  });

  const html = buildEmailHtml_(period, summary, channels, pages, whatsapp, quoteEvents);
  const subject = `${CONFIG.siteName} | Reporte GA4 | ${period.label}`;

  MailApp.sendEmail({
    to: CONFIG.recipients.join(','),
    subject,
    htmlBody: html,
    body: stripHtml_(html)
  });
}

function previousCalendarMonth_() {
  const now = new Date();
  const year = Number(Utilities.formatDate(now, CONFIG.timezone, 'yyyy'));
  const month = Number(Utilities.formatDate(now, CONFIG.timezone, 'M'));
  const previous = new Date(year, month - 2, 1);
  const start = Utilities.formatDate(previous, CONFIG.timezone, 'yyyy-MM-dd');
  const endDate = new Date(year, month - 1, 0);
  const end = Utilities.formatDate(endDate, CONFIG.timezone, 'yyyy-MM-dd');
  const label = Utilities.formatDate(previous, CONFIG.timezone, 'MMMM yyyy');
  return { start, end, label };
}

function runReport_(metrics, dimensions, period, limit, filter) {
  const request = {
    dateRanges: [{ startDate: period.start, endDate: period.end }],
    metrics,
    dimensions,
    limit: String(limit || 100),
    orderBys: metrics.length ? [{ metric: { metricName: metrics[0].name }, desc: true }] : []
  };

  if (filter?.excludePrefixes?.length) {
    request.dimensionFilter = {
      andGroup: {
        expressions: filter.excludePrefixes.map(prefix => ({
          notExpression: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: { matchType: 'BEGINS_WITH', value: prefix }
            }
          }
        }))
      }
    };
  } else if (filter) {
    request.dimensionFilter = {
      filter: {
        fieldName: filter.fieldName,
        inListFilter: filter.inListValues
          ? { values: filter.inListValues }
          : undefined,
        stringFilter: filter.stringValue
          ? { matchType: 'EXACT', value: filter.stringValue }
          : undefined
      }
    };
  }

  return AnalyticsData.Properties.runReport(
    request,
    `properties/${CONFIG.propertyId}`
  );
}

function metric_(name) {
  return { name };
}

function dimension_(name) {
  return { name };
}

function buildEmailHtml_(period, summary, channels, pages, whatsapp, quoteEvents) {
  const totals = firstValues_(summary);
  const whatsappValues = firstValues_(whatsapp);
  const recommendations = recommendations_(totals, whatsappValues, channels, pages);

  return `
  <div style="font-family:Arial,sans-serif;max-width:900px;color:#1d1e20">
    <h1 style="color:#ec1665">${escapeHtml_(CONFIG.siteName)} — Reporte mensual de GA4</h1>
    <p><strong>Periodo:</strong> ${escapeHtml_(period.label)} (${period.start} a ${period.end})</p>
    ${period.end < CONFIG.trackingStartDate
      ? `<p style="background:#fff3cd;border-left:4px solid #ec1665;padding:10px"><strong>Nota de medición:</strong> este periodo terminó antes de la publicación del tracking de conversiones (${CONFIG.trackingStartDate}). Los eventos de WhatsApp y cotización no son comparables todavía.</p>`
      : ''}
    <h2>Resumen ejecutivo</h2>
    ${kpiTable_(summary)}
    <h2>Canales de adquisición</h2>
    ${dataTable_(channels, ['sessionDefaultChannelGroup', 'sessions', 'activeUsers', 'engagementRate'])}
    <h2>Páginas principales</h2>
    ${dataTable_(pages, ['pagePath', 'pageTitle', 'screenPageViews', 'activeUsers', 'engagementRate'])}
    <h2>Eventos comerciales</h2>
    <p><strong>Clics en WhatsApp:</strong> ${escapeHtml_(String(whatsappValues[0] || '0'))} eventos.</p>
    ${dataTable_(quoteEvents, ['eventName', 'eventCount', 'totalUsers'])}
    <h2>Recomendaciones priorizadas</h2>
    <ol>${recommendations.map(item => `<li>${escapeHtml_(item)}</li>`).join('')}</ol>
    <p style="color:#666;font-size:12px">Reporte generado automáticamente con la Google Analytics Data API.</p>
  </div>`;
}

function kpiTable_(report) {
  const headers = report.dimensionHeaders || [];
  const metricHeaders = (report.metricHeaders || []).map(header => header.name);
  const row = report.rows && report.rows[0];
  if (!row) return '<p>No hay datos disponibles para este periodo.</p>';
  const cells = row.metricValues.map((value, index) => `<td>${escapeHtml_(formatMetric_(metricHeaders[index], value.value))}</td>`).join('');
  const labels = metricHeaders.map(name => `<th>${escapeHtml_(name)}</th>`).join('');
  return `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%"><tr>${labels}</tr><tr>${cells}</tr></table>`;
}

function dataTable_(report, preferredColumns) {
  if (!report || !report.rows || !report.rows.length) return '<p>No hay datos disponibles.</p>';
  const dimensions = (report.dimensionHeaders || []).map(header => header.name);
  const metrics = (report.metricHeaders || []).map(header => header.name);
  const columns = preferredColumns.filter(column => dimensions.includes(column) || metrics.includes(column));
  const header = columns.map(column => `<th>${escapeHtml_(column)}</th>`).join('');
  const body = report.rows.map(row => {
    const values = {};
    (row.dimensionValues || []).forEach((value, index) => values[dimensions[index]] = value.value);
    (row.metricValues || []).forEach((value, index) => values[metrics[index]] = formatMetric_(metrics[index], value.value));
    return `<tr>${columns.map(column => `<td>${escapeHtml_(String(values[column] || '0'))}</td>`).join('')}</tr>`;
  }).join('');
  return `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%"><tr>${header}</tr>${body}</table>`;
}

function firstValues_(report) {
  return report && report.rows && report.rows[0]
    ? report.rows[0].metricValues.map(value => value.value)
    : [];
}

function recommendations_(totals, whatsappValues, channels, pages) {
  const activeUsers = Number(totals[0] || 0);
  const engagementRate = Number(totals[4] || 0);
  const whatsappClicks = Number(whatsappValues[0] || 0);
  const items = [];
  if (whatsappClicks === 0) {
    items.push('Revisar la visibilidad y el texto de los llamados a la acción de WhatsApp, especialmente en móvil.');
  }
  else items.push(`Mantener y probar nuevas variantes de los CTA: se registraron ${whatsappClicks} clics en WhatsApp.`);
  if (engagementRate < 0.5) items.push('Mejorar el contenido de las páginas de entrada y reforzar el enlazado interno para aumentar la interacción.');
  else items.push('Replicar en otras páginas los patrones de contenido de las páginas con mayor interacción.');
  if (activeUsers < 100) items.push('Priorizar SEO de contenidos y páginas de intención B2B para aumentar el tráfico cualificado.');
  items.push('Comparar estas métricas con el siguiente periodo y validar que los eventos quote_click y contact_submit representen correctamente los leads.');
  return items.slice(0, 4);
}

function formatMetric_(name, value) {
  const number = Number(value || 0);
  if (name === 'engagementRate') return `${(number * 100).toFixed(1)}%`;
  if (name === 'averageSessionDuration') return `${Math.round(number)} s`;
  return Number.isFinite(number) ? number.toLocaleString('es-NI') : value;
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function stripHtml_(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Ejecutar manualmente para validar permisos y el formato sin esperar al día 1. */
function testMonthlyAnalyticsReport() {
  sendMonthlyAnalyticsReport();
}

/** Ejecutar manualmente para crear o recrear el disparador mensual. */
function installMonthlyAnalyticsTrigger() {
  setupMonthlyTrigger();
}
