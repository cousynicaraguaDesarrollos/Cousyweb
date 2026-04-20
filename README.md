# webCousyNicaragua

Proyecto web estático para Cousy Nicaragua.

## Guía de trabajo

Reglas de UI/UX, SEO, convenciones y checklist de validación en `AGENTS.md`.

## Estructura

- `src/`: código fuente (HTML, JS, estilos, data/config).
- `public/`: archivos estáticos fuente (imágenes, fonts, `robots.txt`, `sitemap.xml`, etc).
- `/` (raíz del repo): build listo para GitHub Pages.
- `scripts/`: scripts de desarrollo/build.

## Desarrollo / Build

- Dev: `npm run dev`
- Build: `npm run build` (genera `dist/`)
- Export a raíz: `npm run export:root` (copia `dist/` a `/`)
- Build + export (GitHub Pages): `npm run build:pages`

## GitHub Pages

GitHub Pages permite publicar desde la raíz del repo o desde `/docs`. Este repo publica desde la raíz.

1. En GitHub: **Settings → Pages → Build and deployment**: selecciona **Deploy from a branch** y luego **Branch: `main` / Folder: `/(root)`**.
2. Antes de hacer push, ejecutá `npm run build:pages` para dejar el build actualizado en la raíz.

Nota: `.nojekyll` está incluido para que GitHub Pages sirva carpetas que empiezan con `_` dentro de `assets/`.
