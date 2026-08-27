# Plan maestro SEO, conversión y expansión bilingüe de Cousy Web

Este documento reúne en un solo recorrido las tareas necesarias para mejorar la versión actual en español y publicar una versión inglesa orientada a compradores B2B de Estados Unidos y otros mercados internacionales.

## 1. Auditar el estado inicial

1. Confirmar el dominio canónico, la rama de publicación de GitHub Pages, el `CNAME`, el sitemap y el archivo `robots.txt`.
2. Revisar Google Analytics 4, Google Tag Manager y Search Console para confirmar que la propiedad, el Measurement ID y el contenedor correspondan al dominio publicado.
3. Establecer una línea base mensual con usuarios, sesiones, tráfico orgánico, páginas de entrada, eventos de cotización y clics de WhatsApp.
4. Separar datos de producción, pruebas, documentación y desarrollo antes de interpretar las métricas.

## 2. Consolidar URLs y limpiar rutas antiguas

5. Mantener una única URL canónica para cada página: `/es/`, `/es/tienda/`, `/es/cotizacion/` y sus equivalentes.
6. Redirigir las rutas legacy `.html` cuando la plataforma de publicación lo permita; cuando no sea posible, conservar el archivo compatible con `canonical` coherente y enlaces internos hacia la ruta limpia.
7. Eliminar del entorno público las rutas `/pruebas-web/`, `/docs/` y `/src/pages/` cuando sean copias o fuentes internas.
8. Si alguna ruta técnica debe permanecer accesible, marcarla con `noindex,nofollow,noarchive`, retirarla del sitemap y evitar enlazarla desde páginas indexables.
9. No bloquear `/docs/` en `robots.txt` sin confirmar antes que GitHub Pages no use esa carpeta como origen de publicación.
10. Revisar que los enlaces internos apunten a las rutas canónicas y no a versiones `.html`, copias de desarrollo o archivos de origen.
11. Mantener `/es/cotizacion/` accesible para usuarios, pero fuera del índice mediante `noindex,follow`, porque es una herramienta de conversión y no una página SEO de captación.

## 3. Corregir canonical, Open Graph, sitemap y robots

12. Mantener `canonical` y `og:url` con el mismo dominio, protocolo y ruta canónica.
13. Generar el sitemap únicamente con páginas públicas indexables y contenido real.
14. Excluir del sitemap páginas de cotización, paneles internos, archivos de prueba y redirecciones.
15. Mantener `robots.txt` alineado con el sitemap y sin bloquear recursos necesarios para renderizar CSS, JavaScript o imágenes.
16. Validar títulos, meta descriptions, idioma HTML, un solo H1, imágenes con `alt` descriptivo y datos estructurados cuando correspondan.
17. Solicitar en Search Console la validación de URLs nuevas y revisar errores de cobertura, duplicados y páginas excluidas.

## 4. Medir correctamente el embudo B2B

18. Mantener un único nombre para cada evento en ambos idiomas: `quote_click`, `quote_add_item`, `whatsapp_click`, `catalog_download` y `contact_submit`.
19. Configurar en GTM las etiquetas de evento de GA4 con activadores de evento personalizado exactos.
20. Validar primero en Tag Assistant y DebugView; publicar únicamente después de comprobar que la etiqueta aparece como activada.
21. Marcar `whatsapp_click` como evento clave si representa una oportunidad comercial real.
22. Añadir parámetros útiles y no sensibles, como `cta_location`, `cta_label`, `page_path`, `page_language`, `product_name` y `items_count`.
23. No enviar a Analytics el texto privado escrito por el usuario ni el contenido completo de la conversación de WhatsApp.
24. Revisar mensualmente el recorrido: visita → vista de producto → producto añadido → cotización → WhatsApp.

## 5. Mejorar las páginas SEO B2B en español

25. Crear o fortalecer una página principal para “productos promocionales para empresas”.
26. Crear páginas específicas para “tote bags personalizadas al por mayor”, “regalos corporativos sostenibles” y “productos promocionales ecológicos”.
27. Crear páginas por intención B2B: empresas, universidades, colegios, hoteles, restaurantes y ONG.
28. En cada página explicar materiales, personalización, pedidos por volumen, proceso de cotización, cobertura de envío y tiempos sin prometer información que no esté confirmada.
29. Enlazar cada página sectorial con tienda, categorías relacionadas, sostenibilidad y cotización.
30. Añadir preguntas frecuentes visibles cuando respondan dudas reales de compradores B2B.
31. Utilizar títulos y descripciones únicos, orientados a la intención comercial y no a repetir palabras clave.

## 6. Mejorar la página de cotización y la conversión

32. Mostrar arriba del formulario qué información acelera la cotización: cantidad, colores, logo, fecha de entrega y ciudad.
33. Mantener el catálogo → añadir a cotización → ajustar cantidades → notas → WhatsApp como flujo principal.
34. Usar un CTA claro y consistente: “Cotizar por WhatsApp” o “Request a quote” en la versión inglesa.
35. Mantener targets táctiles de al menos 44 px, foco visible, contraste AA y mensajes de error comprensibles.
36. Mostrar el número de productos seleccionados en el encabezado móvil y en la página de cotización.
37. Medir por separado los CTA del encabezado, tienda, páginas sectoriales y página de cotización.

## 7. Optimizar rendimiento y experiencia móvil

38. Probar primero en 360–430 px y después en tablet y escritorio.
39. Reservar dimensiones o proporciones para imágenes para evitar saltos de layout.
40. Mantener imágenes optimizadas en WebP, `loading="lazy"` fuera del primer bloque y tamaños adecuados para el dispositivo.
41. Reducir JavaScript no esencial, revisar scripts de terceros y validar que el banner de consentimiento no bloquee la navegación.
42. Revisar Core Web Vitals, accesibilidad, navegación con teclado y targets táctiles.
43. Corregir enlaces rotos, recursos 404, rutas relativas incorrectas y errores de consola antes de publicar.

## 8. Configurar la arquitectura bilingüe

44. Mantener español bajo `/es/` e inglés bajo `/en/`, usando subdirectorios del mismo dominio.
45. No redirigir automáticamente según IP, navegador o cookies; mostrar un selector de idioma visible.
46. Crear equivalencias claras: `/es/` ↔ `/en/`, `/es/tienda/` ↔ `/en/store/`, `/es/cotizacion/` ↔ `/en/quote/`, `/es/nosotros/` ↔ `/en/about/`, `/es/sostenibilidad/` ↔ `/en/sustainability/` y `/es/casos-de-exito/` ↔ `/en/case-studies/`.
47. Mantener el atributo `lang` correcto en cada documento y no mezclar idiomas dentro del contenido principal.
48. Añadir `hreflang="es"`, `hreflang="en"` y `hreflang="x-default"` en HTML y sitemap, con enlaces recíprocos y URLs absolutas.
49. Mantener canonical propio para cada versión lingüística.
50. Crear navegación, footer, textos dinámicos, catálogo y mensaje de WhatsApp localizados.
51. Usar la versión inglesa para términos como “custom promotional products”, “custom tote bags”, “eco-friendly promotional products”, “corporate gifts” y “bulk orders”, siempre que el contenido corresponda al servicio real.

## 9. Publicar el MVP inglés

52. Publicar primero Home, Store, Quote, About, Sustainability y Case Studies para validar la arquitectura antes de traducir el resto.
53. Adaptar el copy para compradores internacionales: producción en Nicaragua, personalización, pedidos al por mayor, proceso de cotización y envíos disponibles.
54. Mantener los mismos productos e imágenes solo cuando las descripciones estén traducidas y las URLs de fuente apunten a `/en/store/`.
55. Revisar que el carrito use los nombres ingleses y que el mensaje de WhatsApp no mezcle español e inglés.
56. Publicar el sitemap con las páginas inglesas solo después de comprobar que cada URL responde correctamente y tiene contenido indexable.

## 10. Medir Search Console, UTMs y rendimiento comercial

57. Verificar la propiedad del dominio en Search Console y enviar el sitemap actualizado.
58. Revisar consultas, impresiones, CTR y posición separando páginas `/es/` y `/en/`.
59. Etiquetar redes sociales, newsletters y campañas con UTMs consistentes en minúsculas.
60. Crear un reporte mensual separado por idioma, país, canal, página de entrada, `quote_add_item` y `whatsapp_click`.
61. Comparar periodos únicamente cuando la configuración de tracking haya estado activa durante ambos periodos.
62. No interpretar como fallo los eventos inexistentes en periodos anteriores a su fecha real de publicación.

## 11. Validar, publicar y mantener

63. Ejecutar `npm run build`.
64. Ejecutar comprobaciones de sintaxis JavaScript y `git diff --check`.
65. Revisar manualmente Home, Store, Quote, navegación ES/EN, imágenes, filtros, carrito y apertura de WhatsApp.
66. Revisar sitemap, robots, canonical, `hreflang`, títulos, descripciones, `noindex` y enlaces internos.
67. Crear un commit descriptivo con solo los cambios intencionales.
68. Subir siempre el commit a `origin/main` después de validar el build.
69. Confirmar que el repositorio quede limpio y registrar el hash del commit.
70. Revisar el siguiente reporte mensual después de que exista un periodo completo con la nueva medición.
