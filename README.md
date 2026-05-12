<h1 align="center">Cousy Nicaragua Web</h1>

<p align="center">
  Sitio web estatico B2B para cotizaciones por WhatsApp, SEO bilingue y experiencia mobile-first.
</p>

<p align="center">
  <img src="./public/assets/logo-cousy.png" alt="Cousy Nicaragua" width="96" />
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-en%20desarrollo-ec1665" />
  <img alt="Stack" src="https://img.shields.io/badge/stack-HTML%20%2B%20JS%20%2B%20Tailwind-73a35a" />
  <img alt="Hosting" src="https://img.shields.io/badge/hosting-GitHub%20Pages-dde0e1" />
</p>

<hr />

<h2>Estado Actual</h2>

<p>
  Estamos trabajando en la evolucion del sitio de Cousy Nicaragua para mejorar conversion B2B,
  rendimiento movil, SEO tecnico y experiencia como PWA instalable.
</p>

<h2>Tecnologias Que Utilizamos</h2>

<table>
  <thead>
    <tr>
      <th>Tecnologia</th>
      <th>Uso en el proyecto</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>HTML + JavaScript (Vanilla)</td>
      <td>Estructura de paginas, logica de UI y flujo de cotizacion.</td>
    </tr>
    <tr>
      <td>Tailwind CSS</td>
      <td>Estilos utilitarios compilados en <code>assets/app.css</code>.</td>
    </tr>
    <tr>
      <td>Node.js + scripts custom</td>
      <td>Build, exportacion a <code>docs/</code> y tareas de desarrollo.</td>
    </tr>
    <tr>
      <td>GitHub Pages</td>
      <td>Hosting estatico publicando desde <code>/docs</code>.</td>
    </tr>
    <tr>
      <td>PWA (Manifest + Service Worker)</td>
      <td>Instalacion en celular y cache para carga mas rapida.</td>
    </tr>
    <tr>
      <td>Google Apps Script (proxy)</td>
      <td>Proteccion de key de Google Reviews fuera del frontend.</td>
    </tr>
  </tbody>
</table>

<h2>Metodos De Trabajo</h2>

<ul>
  <li><strong>Mobile-first:</strong> primero en pantallas 360-430px, luego escalado a desktop.</li>
  <li><strong>SEO bilingue:</strong> arquitectura equivalente en <code>/es/</code> y <code>/en/</code>.</li>
  <li><strong>Accesibilidad:</strong> enfoque visible, targets tactiles amplios y contraste AA.</li>
  <li><strong>Performance:</strong> assets optimizados, carga eficiente y rutas relativas seguras.</li>
  <li><strong>Seguridad:</strong> secretos fuera del cliente y consumo controlado de APIs externas.</li>
  <li><strong>Conversion B2B:</strong> CTA claros para cotizar por WhatsApp en todo el flujo.</li>
</ul>

<h2>Estructura Del Repo</h2>

<ul>
  <li><code>src/pages/</code>: paginas fuente (index, ES y EN).</li>
  <li><code>src/</code>: fuentes de JS, estilos, data y configuracion.</li>
  <li><code>public/</code>: assets fuente, parciales y archivos PWA.</li>
  <li><code>dist/</code>: salida temporal de build.</li>
  <li><code>docs/</code>: salida publicada para GitHub Pages.</li>
  <li><code>scripts/</code>: build, dev y exportacion para Pages.</li>
</ul>

<h2>Comandos De Trabajo</h2>

```bash
# Desarrollo local
npm run dev

# Build a dist/
npm run build

# Exportar dist/ a docs/ (publicacion)
npm run export:docs

# Build + export para GitHub Pages
npm run build:pages
```

<h2>Publicacion En GitHub Pages</h2>

<ol>
  <li>Configurar Pages en <strong>main / docs</strong>.</li>
  <li>Ejecutar <code>npm run build:pages</code> antes de push.</li>
  <li>Confirmar que exista <code>.nojekyll</code> dentro de <code>docs/</code>.</li>
</ol>

<h2>Documentacion Interna</h2>

<ul>
  <li><code>AGENTS.md</code>: reglas del proyecto, SEO, UX y validacion.</li>
  <li><code>dev-docs/apps-script/README.md</code>: guia del proxy de reseñas.</li>
</ul>
