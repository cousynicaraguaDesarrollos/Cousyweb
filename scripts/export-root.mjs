import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(process.cwd());
const distDir = path.join(projectRoot, "dist");

const allowedTopLevelDirs = new Set(["assets", "config", "data", "fonts", "js", "es", "en", "partials"]);
const allowedTopLevelFiles = new Set(["robots.txt", "sitemap.xml"]);

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

function exportDistToRoot() {
  if (!fs.existsSync(distDir)) {
    console.error("No existe `dist/`. Ejecutá `npm run build` primero.");
    process.exitCode = 1;
    return;
  }

  const entries = fs.readdirSync(distDir, { withFileTypes: true });
  for (const entry of entries) {
    const isHtml = entry.isFile() && entry.name.endsWith(".html");
    const isAllowedFile = entry.isFile() && (allowedTopLevelFiles.has(entry.name) || isHtml);
    const isAllowedDir = entry.isDirectory() && allowedTopLevelDirs.has(entry.name);
    if (!isAllowedFile && !isAllowedDir) continue;

    const from = path.join(distDir, entry.name);
    const to = path.join(projectRoot, entry.name);

    removePath(to);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }

  if (!fs.existsSync(path.join(projectRoot, ".nojekyll"))) {
    fs.writeFileSync(path.join(projectRoot, ".nojekyll"), "");
  }
}

exportDistToRoot();
