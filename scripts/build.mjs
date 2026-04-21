import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(process.cwd());
const distDir = path.join(projectRoot, "dist");
const rootIndexHtml = path.join(projectRoot, "index.html");
const esPagesDir = path.join(projectRoot, "es");
const enPagesDir = path.join(projectRoot, "en");
const srcDataDir = path.join(projectRoot, "src", "data");
const srcJsDir = path.join(projectRoot, "src", "js");
const srcConfigDir = path.join(projectRoot, "src", "config");
const publicDir = path.join(projectRoot, "public");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeSiteUrl(siteUrl) {
  const u = String(siteUrl ?? "").trim();
  if (!u) return "";
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

function canonicalPathForOutPath(relOutPath) {
  const rel = String(relOutPath).replaceAll("\\", "/").replaceAll(/^\.\//g, "");
  if (!rel || rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"/index.html".length)}/`;
  return `/${rel}`;
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

function copyHtmlDir(fromDir, toDir, { siteUrl } = {}) {
  if (!fs.existsSync(fromDir)) return;
  fs.mkdirSync(toDir, { recursive: true });
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) copyHtmlDir(from, to, { siteUrl });
    else if (entry.isFile() && entry.name.endsWith(".html")) {
      const raw = fs.readFileSync(from, "utf8");
      const relOutPath = path.relative(distDir, to);
      const next = siteUrl ? applySeoToHtml(raw, { relOutPath, siteUrl }) : raw;
      fs.writeFileSync(to, next, "utf8");
    }
  }
}

function copyPages({ siteUrl } = {}) {
  if (fs.existsSync(rootIndexHtml)) fs.copyFileSync(rootIndexHtml, path.join(distDir, "index.html"));
  copyHtmlDir(esPagesDir, path.join(distDir, "es"), { siteUrl });
  copyHtmlDir(enPagesDir, path.join(distDir, "en"), { siteUrl });
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

function writeSitemapAndRobots({ siteUrl }) {
  if (!siteUrl) return;

  const relHtml = listHtmlRelPaths(distDir)
    .map((p) => String(p).replaceAll("\\", "/"))
    .filter((p) => p === "index.html" || p.startsWith("es/") || p.startsWith("en/"));

  const indexable = relHtml.filter((rel) => {
    const full = path.join(distDir, rel);
    const html = fs.readFileSync(full, "utf8");
    return !/<meta\s+name="robots"\s+content="[^"]*\bnoindex\b/i.test(html);
  });

  const paths = Array.from(
    new Set(indexable.map((p) => canonicalPathForOutPath(p)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

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

copyPages({ siteUrl });
copyDir(srcDataDir, path.join(distDir, "data"));
copyDir(srcJsDir, path.join(distDir, "js"));
copyDir(srcConfigDir, path.join(distDir, "config"));
copyDir(publicDir, distDir);

// These must be generated from config (so we don't depend on hardcoded files in /public).
writeSitemapAndRobots({ siteUrl });
