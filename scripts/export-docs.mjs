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
}

exportDistToDocs();
