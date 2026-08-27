# Reporte mensual personalizado de GA4

El proyecto ya contiene la medición de Google Analytics 4 con el Measurement ID `G-M9D3K3092V`, correspondiente a la propiedad numérica `454329627` de `cousynicaragua.com`. También existe el evento `whatsapp_click`, que se dispara al pulsar **Enviar a WhatsApp** desde la página de cotización, siempre que el visitante haya dado consentimiento analítico.

El archivo `google-analytics-monthly-report.gs` genera un informe del mes calendario anterior y lo envía a `margelgabriel@gmail.com` y `cousynicaragua@gmail.com`. El informe incluye usuarios activos, usuarios nuevos, sesiones, vistas, tasa de interacción, duración media, canales de adquisición, páginas principales, clics en WhatsApp y otros eventos comerciales disponibles. Las rutas `/pruebas-web/`, `/docs/` y `/src/pages/` se excluyen del bloque de páginas para evitar que entornos no productivos distorsionen el análisis.

El tracking de conversiones (`whatsapp_click` y `quote_add_item`) quedó publicado el `2026-08-27`. Por ese motivo, los reportes de periodos anteriores mostrarán una nota indicando que esos eventos todavía no son comparables.

## Activación única

1. Accede a [Google Apps Script](https://script.google.com/) con la cuenta que tiene acceso de lectura a la propiedad de GA4.
2. Crea un proyecto nuevo y copia el contenido de `google-analytics-monthly-report.gs` en el editor.
3. En **Servicios**, añade el servicio avanzado **Google Analytics Data API** con el identificador `AnalyticsData`.
4. En el proyecto de Google Cloud asociado, habilita **Google Analytics Data API** (`analyticsdata.googleapis.com`).
5. Ejecuta `testMonthlyAnalyticsReport` una vez. Google solicitará autorización; acepta el acceso a Analytics y el envío de correo.
6. Comprueba que llega el reporte de prueba a las dos direcciones.
7. Ejecuta `installMonthlyAnalyticsTrigger` una vez. Esto crea el disparador mensual para el día 1, dentro de la franja de las 8:00 a. m., usando la zona horaria `America/Managua`.

Los disparadores horarios de Google Apps Script pueden ejecutarse en cualquier minuto dentro de la hora seleccionada, por lo que el envío será aproximadamente a las 8:00 a. m., no necesariamente a las 8:00 exactas.

## Validación en GA4

En **Administrador → Visualización de datos → Eventos**, confirma que `whatsapp_click` aparece como evento recibido después de probar el botón de cotización. Si el evento debe contar como conversión B2B, márcalo como **evento clave** en GA4; el reporte lo mostrará como evento aunque no se marque como conversión.

No se deben incluir credenciales, contraseñas, tokens ni archivos JSON de OAuth dentro del repositorio. La autorización queda gestionada por Google Apps Script y la cuenta autorizada.

## Referencias oficiales

- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Google Apps Script: disparadores instalables](https://developers.google.com/apps-script/guides/triggers/installable)
- [Google Analytics Data API en Apps Script](https://developers.google.com/apps-script/advanced/analyticsdata)
