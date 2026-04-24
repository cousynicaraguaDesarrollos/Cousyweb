# Guía del proyecto (Cousy Web)

Este repo es un sitio estático pensado para **GitHub Pages** y para posicionamiento SEO en **ES (LatAm)** y **EN (US/Global)**.

## Objetivo del proyecto

- Generar leads **B2B** y solicitudes de **cotización** (regalos corporativos / producción textil sostenible / personalización).
- Soportar **envíos a todo el mundo**, envíos **locales en Nicaragua**, y comunicarlo claramente.
- Mantener un **SEO excelente** (técnico + contenido) en dos idiomas:
  - Español: posicionamiento en Latinoamérica.
  - Inglés: posicionamiento en Estados Unidos.
- Experiencia **mobile-first**, tema **claro** (light), rápida y accesible.

## Alcance (cotizador B2B por WhatsApp)

- Esto **NO** es una tienda en línea: no hay checkout, pagos, ni “comprar ahora”.
- Flujo actual (se debe preservar):
  - Catálogo de productos → “Añadir a cotización” (carrito de cotización).
  - Página de cotización → ajustar cantidades + notas.
  - Envío → abrir WhatsApp con el mensaje prearmado para cotizar.

## Stack usado

- Sitio estático: **HTML + JS** (vanilla).
- Estilos: **Tailwind CSS** (compilado a `assets/app.css`).
- Build: **Node.js** (scripts propios en `scripts/`).
- Hosting: **GitHub Pages** publicando desde la **raíz** del repo.

## Estructura de carpetas

- `index.html`: página principal publicada en la raíz para GitHub Pages.
- `src/js/`: JS fuente.
- `src/styles/`: CSS fuente (Tailwind input).
- `src/data/`: data JSON para render o consumo en el frontend.
- `src/config/`: configuración del sitio (JSON).
- `public/`: assets fuente (imágenes, fonts, descargas, etc).
- `public/partials/`: parciales HTML (header/footer) inyectados por `src/js/layout.js`.
- `scripts/`: scripts de build/dev.
- `dist/`: salida temporal de build (generada).
- `es/`: páginas publicadas en español (LatAm).
- `en/`: páginas publicadas en inglés (US/Global).
- `assets/`: CSS, JS compilado, imágenes optimizadas, íconos y otros assets publicados.
- `partials/`: parciales publicados (copiados desde `public/partials/`).

### Estructura publicada esperada

```text
/index.html
/es/
  index.html
  about.html
  products.html
  categories.html
  contact.html
  quote.html
  blog.html
  shipping.html
  sustainability.html
  why-cousy.html
  manufacturing-process.html
  personalization.html
  faq.html
  products-for-companies.html
  products-for-universities.html
  products-for-schools.html
  products-for-hotels.html
  products-for-restaurants.html
  products-for-ngos.html
  tote-bags-personalizadas.html
  mochilas-promocionales.html
  cartucheras-personalizadas.html
  loncheras-corporativas.html
  neceseres-promocionales.html
/en/
  index.html
  about.html
  products.html
  categories.html
  contact.html
  quote.html
  blog.html
  shipping.html
  sustainability.html
  why-cousy.html
  manufacturing-process.html
  custom-branding.html
  faq.html
  products-for-companies.html
  products-for-universities.html
  products-for-schools.html
  products-for-hotels.html
  products-for-restaurants.html
  products-for-ngos.html
  custom-tote-bags.html
  promotional-backpacks.html
  custom-pencil-cases.html
  corporate-lunch-bags.html
  promotional-toiletry-bags.html
/assets/
```

Además, **ya no usar `/pages/` como carpeta publicada principal** si la meta fuerte es SEO bilingüe. Conviene más:

- `/es/` para español
- `/en/` para inglés

La estructura base recomendada sería:

```text
/index.html
/es/
/en/
/assets/
  css/
  js/
  images/
  icons/
  fonts/
  downloads/
```

## Convenciones de código

- **Mobile-first**: diseñar y probar primero en 360–430px; luego escalar con breakpoints.
- **Tema claro**: fondos claros por defecto; contraste AA mínimo para texto; evitar overlays oscuros salvo hero.
- **HTML**
  - Semántico (`header`, `nav`, `main`, `section`, `footer`) y headings en orden.
  - `lang` correcto por idioma (`es` / `en`) y metadatos coherentes.
  - Links relativos tipo `./pagina.html` para navegación interna.
- **CSS/Tailwind**
  - Preferir utilidades Tailwind; si se necesita CSS custom, mantenerlo mínimo y en `src/styles/`.
  - Evitar “magic numbers” repetidos; usar tokens/variables del diseño cuando existan.
- **JS**
  - Preferir `type="module"` y funciones pequeñas.
  - Usar `data-*` para hooks de UI (ej: `data-cart-count`) en vez de clases de estilo.
  - No depender de APIs que rompan en Safari iOS sin polyfills.
- **Contenido**
  - Copy orientado a B2B: beneficios, tiempos, personalización, MOQ si aplica, proceso de cotización y contacto.
  - Evitar texto “placeholder” en producción.

## Qué NO debe tocar (sin pedir confirmación)

- `CNAME`: define el dominio en GitHub Pages.
- `.nojekyll`: necesario para servir carpetas que empiezan con `_` (ej: `assets/_...`).
- Estructura de salida publicada en `/` (`assets/`, `js/`, etc) salvo que el build lo regenere.
- Archivos dentro de `assets/_*-download/` (se sirven tal cual; cuidado con rutas y nombres).
- Flujo/formato de cotización por WhatsApp:
  - `src/js/cart.js`: `CART_KEY`, `NOTES_KEY`, `buildWhatsappText()`, `whatsappLink()`.
  - `src/js/tienda.js`: objeto producto `{ id, name, image, sourceUrl }` que se agrega al carrito.
  - `src/js/cotizacion.js`: IDs/selectores de UI (ej: `#quote-send`, `#quote-items`, `#quote-notes`) y evento `cousy:cart-changed`.
  - `src/config/site.json`: claves `whatsappNumber` y `whatsappGreeting`.

## Cómo correr tests

- Actualmente **no hay tests automatizados**.
- Validación se hace con build + smoke-check manual.

## Cómo validar cambios (checklist)

- Build: `npm run build` (genera `dist/`).
- Publicación: `npm run build:pages` (build + export a `/`).
- Smoke test local: `npm run dev` y revisar:
  - Navegación entre páginas, carga de imágenes, y flujo de cotización:
    - `tienda.html` → “Añadir a cotización” → `cotizacion.html` → “Enviar por WhatsApp”.
  - 404s en consola/network (paths relativos).
  - Performance percibida en móvil.
- SEO técnico:
  - `sitemap.xml`, `robots.txt`, títulos y meta descriptions.
  - Canonical + dominio consistente (importante: `CNAME`, canonical en HTML y `sitemap.xml` deben alinearse).

## Reglas UI/UX

- Mobile-first, sin “saltos” de layout: reservar alturas (`width/height`, `aspect-*`) en imágenes.
- Accesibilidad:
  - Targets táctiles >= 44px, foco visible, `aria-label` donde corresponda.
  - Contraste suficiente; no comunicar solo por color.
- Conversión B2B:
  - CTA claro (“Cotizar por WhatsApp”, “Añadir a cotización”, “Solicitar catálogo”, “Hablar con ventas”).
  - Propuesta de valor arriba del fold, con prueba social/credenciales donde aplique.
- Internacionalización:
  - Mantener estructura equivalente ES/EN (misma arquitectura + URLs claras).
  - Evitar mezclar idiomas en una misma página.

## Bilingüe (EN/ES) y páginas recomendadas

- Estrategia sugerida:
  - Español en raíz (actual): `/index.html`, `/tienda.html` (catálogo/cotizador), `/cotizacion.html`, etc.
  - Inglés bajo `/en/`: `en/index.html`, `en/store.html` (catálogo/cotizador; no checkout), `en/quote.html`, etc.
- Cuando existan páginas EN:
  - Agregar `hreflang` (`es` y `en`) y alternates por página.
  - Incluir URLs EN en `sitemap.xml` (solo si están publicadas y con contenido real).

## Formato de respuestas / documentación (para cambios en el repo)

- Describir cambios en bullets cortos.
- Incluir cómo validar: comando(s) exactos (`npm run ...`) y qué revisar.
- Si el cambio afecta SEO/i18n, listar explícitamente: canonical, sitemap, robots y navegación ES/EN.


# Colores que debes utilizar
- #ffffff principal
- #ec1665 secundario (para botones o donde se requiera la atencion del cliente)
- #73a35a secundario Para destacar ecologia en secmentos
- #dde0e1 secundario
