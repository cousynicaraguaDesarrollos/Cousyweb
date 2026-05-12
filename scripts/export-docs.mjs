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
  const vgFile = path.join(vgDir, "vg.html");
  const oldLegacyFile = path.join(esDir, "ventas-gastos-panel.html");
  const vgAliasFile = path.join(esDir, "vg.html");

  if (!fs.existsSync(oldIndex)) return;

  removePath(vgDir);
  fs.renameSync(oldDir, vgDir);

  const movedIndex = path.join(vgDir, "index.html");
  if (fs.existsSync(movedIndex)) {
    fs.renameSync(movedIndex, vgFile);
  }

  if (fs.existsSync(oldLegacyFile)) {
    const target = relativeHref(oldLegacyFile, vgFile);
    fs.writeFileSync(oldLegacyFile, buildRedirectHtml(target), "utf8");
  }

  const aliasTarget = relativeHref(vgAliasFile, vgFile);
  fs.writeFileSync(vgAliasFile, buildRedirectHtml(aliasTarget), "utf8");
}

exportDistToDocs();
