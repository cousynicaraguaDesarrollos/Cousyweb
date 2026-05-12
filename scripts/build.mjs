import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(process.cwd());
const distDir = path.join(projectRoot, "dist");
const srcPagesDir = path.join(projectRoot, "src", "pages");
const srcDataDir = path.join(projectRoot, "src", "data");
const srcJsDir = path.join(projectRoot, "src", "js");
const srcConfigDir = path.join(projectRoot, "src", "config");
const publicDir = path.join(projectRoot, "public");
const rootCnameFile = path.join(projectRoot, "CNAME");
const rootNoJekyllFile = path.join(projectRoot, ".nojekyll");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeSiteUrl(siteUrl) {
  const u = String(siteUrl ?? "").trim();
  if (!u) return "";
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

function normalizeSitemapPath(rawPath) {
  const trimmed = String(rawPath ?? "").trim();
  if (!trimmed) return "";

  const p = trimmed.replaceAll("\\", "/");
  if (p === "/index.html" || p === "index.html") return "/";
  if (p.endsWith("/index.html")) return `${p.slice(0, -"/index.html".length)}/`;
  return p.startsWith("/") ? p : `/${p}`;
}

function canonicalPathForOutPath(relOutPath) {
  const rel = String(relOutPath).replaceAll("\\", "/").replaceAll(/^\.\//g, "");
  if (!rel || rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"/index.html".length)}/`;
  return `/${rel}`;
}

function toPosixRelPath(filePath) {
  return String(filePath).replaceAll("\\", "/").replaceAll(/^\.\//g, "");
}

function splitUrlParts(urlValue) {
  const match = String(urlValue).match(/^([^?#]*)([?#].*)?$/);
  return {
    pathname: match?.[1] ?? "",
    suffix: match?.[2] ?? ""
  };
}

function isExternalOrSpecialUrl(urlValue) {
  const value = String(urlValue).trim().toLowerCase();
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("javascript:") ||
    value.startsWith("data:") ||
    value.startsWith("#")
  );
}

function toExtensionlessPath(pathname) {
  const p = String(pathname);
  if (!p.endsWith(".html")) return p;
  if (p.endsWith("/index.html")) return p.slice(0, -"index.html".length);
  if (p === "index.html" || p === "./index.html") return "./";
  if (p === "../index.html") return "../";
  return p.slice(0, -".html".length);
}

function rewriteInternalHtmlLinks(html) {
  return String(html).replace(/\b(href|action)=("([^"]*)"|'([^']*)')/gi, (full, attr, quoted, dVal, sVal) => {
    const value = dVal ?? sVal ?? "";
    if (!value || isExternalOrSpecialUrl(value)) return full;

    const { pathname, suffix } = splitUrlParts(value);
    if (!pathname.endsWith(".html")) return full;

    const next = `${toExtensionlessPath(pathname)}${suffix}`;
    if (dVal != null) return `${attr}="${next}"`;
    return `${attr}='${next}'`;
  });
}

function rewriteRelativeAssetPathsForNestedOutput(html) {
  return String(html).replace(
    /\b(href|src|action|poster)=("([^"]*)"|'([^']*)')/gi,
    (full, attr, quoted, dVal, sVal) => {
      const value = dVal ?? sVal ?? "";
      if (!value || isExternalOrSpecialUrl(value)) return full;

      const { pathname, suffix } = splitUrlParts(value);
      if (!pathname || pathname.startsWith("/")) return full;

      // Output pages moved from /foo.html to /foo/index.html are one level deeper.
      // Prefix local relative paths so they keep resolving to the same target.
      const normalizedPath = path.posix.normalize(`../${pathname}`);
      const next = `${normalizedPath}${suffix}`;
      if (dVal != null) return `${attr}="${next}"`;
      return `${attr}='${next}'`;
    }
  );
}

function sourceHtmlRelToOutputRel(sourceHtmlRelPath) {
  const rel = toPosixRelPath(sourceHtmlRelPath);
  if (!rel.endsWith(".html")) return rel;
  if (rel === "index.html" || rel.endsWith("/index.html")) return rel;

  const dir = path.posix.dirname(rel);
  const name = path.posix.basename(rel, ".html");
  return dir === "." ? `${name}/index.html` : `${dir}/${name}/index.html`;
}

function extractHtmlLang(html) {
  const match = String(html).match(/<html[^>]*\blang=(["'])([^"']+)\1/i);
  return match?.[2] || "es";
}

function buildLegacyRedirectHtml({ targetPath, lang }) {
  const safeTarget = String(targetPath || "./");
  const safeLang = String(lang || "es");
  return `<!doctype html>
<html lang="${safeLang}">
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

function applySeoToHtml(html, { relOutPath, siteUrl }) {
  const canonicalPath = canonicalPathForOutPath(relOutPath);
  const canonicalUrl = `${siteUrl}${canonicalPath === "/" ? "/" : canonicalPath}`;

  let out = String(html ?? "");

  // Canonical + OG url (force correct values based on output path).
  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );

  // If there's an Organization JSON-LD, align its url with siteUrl.
  if (out.includes(`"@type": "Organization"`)) {
    out = out.replace(/"url"\s*:\s*"[^"]*"/, `"url": "${siteUrl}"`);
  }

  return out;
}

function ensureEmptyDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyDir(fromDir, toDir) {
  if (!fs.existsSync(fromDir)) return;
  fs.mkdirSync(toDir, { recursive: true });
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function listHtmlFiles(dirPath) {
  const out = [];
  if (!fs.existsSync(dirPath)) return out;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) out.push(...listHtmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(full);
  }

  return out;
}

function copyPages({ siteUrl } = {}) {
  for (const sourceHtmlFile of listHtmlFiles(srcPagesDir)) {
    const sourceRel = toPosixRelPath(path.relative(srcPagesDir, sourceHtmlFile));
    const outputRel = sourceHtmlRelToOutputRel(sourceRel);
    const outputFile = path.join(distDir, outputRel);

    const sourceRaw = fs.readFileSync(sourceHtmlFile, "utf8");
    const outputWasNested = outputRel !== sourceRel;
    let rewritten = rewriteInternalHtmlLinks(sourceRaw);
    if (outputWasNested) {
      rewritten = rewriteRelativeAssetPathsForNestedOutput(rewritten);
    }
    const relOutPath = toPosixRelPath(path.relative(distDir, outputFile));
    const next = siteUrl ? applySeoToHtml(rewritten, { relOutPath, siteUrl }) : rewritten;

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, next, "utf8");

    // Backward compatibility: keep legacy .html URLs and redirect to clean URL.
    if (outputRel !== sourceRel) {
      const legacyOutFile = path.join(distDir, sourceRel);
      const legacyDir = path.posix.dirname(sourceRel);
      const cleanDir = path.posix.dirname(outputRel);
      const relTarget = path.posix.relative(legacyDir === "." ? "" : legacyDir, cleanDir) || ".";
      const targetPath = relTarget.endsWith("/") ? relTarget : `${relTarget}/`;
      const legacyHtml = buildLegacyRedirectHtml({
        targetPath,
        lang: extractHtmlLang(sourceRaw)
      });

      fs.mkdirSync(path.dirname(legacyOutFile), { recursive: true });
      fs.writeFileSync(legacyOutFile, legacyHtml, "utf8");
    }
  }
}

function listHtmlRelPaths(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listHtmlRelPaths(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) out.push(path.relative(distDir, full));
  }
  return out;
}

function writeSitemapAndRobots({ siteUrl, manualPaths = [] }) {
  if (!siteUrl) return;

  const relHtml = listHtmlRelPaths(distDir)
    .map((p) => String(p).replaceAll("\\", "/"))
    .filter((p) => p === "index.html" || p.startsWith("es/") || p.startsWith("en/"));

  const indexable = relHtml.filter((rel) => {
    const full = path.join(distDir, rel);
    const html = fs.readFileSync(full, "utf8");
    return !/<meta\s+name="robots"\s+content="[^"]*\bnoindex\b/i.test(html);
  });

  const discoveredPaths = indexable.map((p) => canonicalPathForOutPath(p)).filter(Boolean);
  const normalizedManualPaths = manualPaths.map((p) => normalizeSitemapPath(p)).filter(Boolean);
  const paths = Array.from(new Set([...discoveredPaths, ...normalizedManualPaths])).sort((a, b) =>
    a.localeCompare(b)
  );

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.map((p) => `  <url>\n    <loc>${siteUrl}${p === "/" ? "/" : p}</loc>\n  </url>`).join("\n") +
    `\n</urlset>\n`;

  fs.writeFileSync(path.join(distDir, "sitemap.xml"), xml, "utf8");

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
  fs.writeFileSync(path.join(distDir, "robots.txt"), robots, "utf8");
}

ensureEmptyDir(distDir);
fs.mkdirSync(path.join(distDir, "assets"), { recursive: true });
fs.mkdirSync(path.join(distDir, "data"), { recursive: true });
fs.mkdirSync(path.join(distDir, "js"), { recursive: true });
fs.mkdirSync(path.join(distDir, "config"), { recursive: true });

const siteConfig = readJson(path.join(srcConfigDir, "site.json"));
const siteUrl = normalizeSiteUrl(siteConfig.siteUrl);
const manualSitemapPaths = Array.isArray(siteConfig.manualSitemapPaths)
  ? siteConfig.manualSitemapPaths
  : [];

copyPages({ siteUrl });
copyDir(srcDataDir, path.join(distDir, "data"));
copyDir(srcJsDir, path.join(distDir, "js"));
copyDir(srcConfigDir, path.join(distDir, "config"));
copyDir(publicDir, distDir);

if (fs.existsSync(rootCnameFile)) fs.copyFileSync(rootCnameFile, path.join(distDir, "CNAME"));
if (fs.existsSync(rootNoJekyllFile)) fs.copyFileSync(rootNoJekyllFile, path.join(distDir, ".nojekyll"));

// These must be generated from config (so we don't depend on hardcoded files in /public).
writeSitemapAndRobots({ siteUrl, manualPaths: manualSitemapPaths });
