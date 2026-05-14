import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(process.cwd());
const distDir = path.join(projectRoot, "dist");
const docsDir = path.join(projectRoot, "docs");

function copyDir(fromDir, toDir) {
  fs.mkdirSync(toDir, { recursive: true });
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function removePath(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function normalizeSiteUrl(siteUrl) {
  const raw = String(siteUrl ?? "").trim();
  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function readPublishedSiteUrl() {
  const siteConfigFile = path.join(docsDir, "config", "site.json");
  if (!fs.existsSync(siteConfigFile)) return "";

  try {
    const config = JSON.parse(fs.readFileSync(siteConfigFile, "utf8"));
    return normalizeSiteUrl(config?.siteUrl);
  } catch {
    return "";
  }
}

function rewriteCanonical(filePath, canonicalUrl) {
  if (!fs.existsSync(filePath) || !canonicalUrl) return;

  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}" />`;
  const ogUrlTag = `<meta property="og:url" content="${canonicalUrl}" />`;
  let html = fs.readFileSync(filePath, "utf8");

  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, canonicalTag);
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, ogUrlTag);

  fs.writeFileSync(filePath, html, "utf8");
}

function exportDistToDocs() {
  if (!fs.existsSync(distDir)) {
    console.error("No existe `dist/`. Ejecutá `npm run build` primero.");
    process.exitCode = 1;
    return;
  }

  removePath(docsDir);
  copyDir(distDir, docsDir);
  normalizeVentasGastosRoute();
}

function relativeHref(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile).replaceAll("\\", "/");
  if (rel === "index.html") rel = ".";
  else if (rel.endsWith("/index.html")) rel = rel.slice(0, -"index.html".length);
  if (!rel || rel === ".") return "./";
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function buildRedirectHtml(targetHref) {
  const safeTarget = String(targetHref || "./");
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="robots" content="noindex,follow" />
    <title>Redirecting...</title>
    <link rel="canonical" href="${safeTarget}" />
    <noscript><meta http-equiv="refresh" content="0; url=${safeTarget}" /></noscript>
    <script>
      (function () {
        var target = ${JSON.stringify(safeTarget)};
        window.location.replace(target + window.location.search + window.location.hash);
      })();
    </script>
  </head>
  <body></body>
</html>
`;
}

function normalizeVentasGastosRoute() {
  const esDir = path.join(docsDir, "es");
  const oldDir = path.join(esDir, "ventas-gastos-panel");
  const oldIndex = path.join(oldDir, "index.html");
  const vgDir = path.join(esDir, "vg");
  const vgIndexFile = path.join(vgDir, "index.html");
  const vgCompatFile = path.join(vgDir, "vg.html");
  const oldLegacyFile = path.join(esDir, "ventas-gastos-panel.html");
  const vgAliasFile = path.join(esDir, "vg.html");
  const siteUrl = readPublishedSiteUrl();

  if (!fs.existsSync(oldIndex)) return;

  removePath(vgDir);
  fs.renameSync(oldDir, vgDir);

  // Keep canonical route at /es/vg/
  // and preserve /es/vg/vg.html as legacy alias.
  const compatTarget = relativeHref(vgCompatFile, vgIndexFile);
  fs.writeFileSync(vgCompatFile, buildRedirectHtml(compatTarget), "utf8");

  if (fs.existsSync(oldLegacyFile)) {
    const target = relativeHref(oldLegacyFile, vgIndexFile);
    fs.writeFileSync(oldLegacyFile, buildRedirectHtml(target), "utf8");
  }

  const aliasTarget = relativeHref(vgAliasFile, vgIndexFile);
  fs.writeFileSync(vgAliasFile, buildRedirectHtml(aliasTarget), "utf8");

  if (siteUrl) {
    rewriteCanonical(vgIndexFile, `${siteUrl}/es/vg/`);
  }
}

exportDistToDocs();
