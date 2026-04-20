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

function copyHtmlDir(fromDir, toDir) {
  if (!fs.existsSync(fromDir)) return;
  fs.mkdirSync(toDir, { recursive: true });
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);
    if (entry.isDirectory()) copyHtmlDir(from, to);
    else if (entry.isFile() && entry.name.endsWith(".html")) fs.copyFileSync(from, to);
  }
}

function copyPages() {
  if (fs.existsSync(rootIndexHtml)) fs.copyFileSync(rootIndexHtml, path.join(distDir, "index.html"));
  copyHtmlDir(esPagesDir, path.join(distDir, "es"));
  copyHtmlDir(enPagesDir, path.join(distDir, "en"));
}

ensureEmptyDir(distDir);
fs.mkdirSync(path.join(distDir, "assets"), { recursive: true });
fs.mkdirSync(path.join(distDir, "data"), { recursive: true });
fs.mkdirSync(path.join(distDir, "js"), { recursive: true });
fs.mkdirSync(path.join(distDir, "config"), { recursive: true });

copyPages();
copyDir(srcDataDir, path.join(distDir, "data"));
copyDir(srcJsDir, path.join(distDir, "js"));
copyDir(srcConfigDir, path.join(distDir, "config"));
copyDir(publicDir, distDir);
