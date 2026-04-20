import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const projectRoot = path.resolve(process.cwd());
const distDir = path.join(projectRoot, "dist");
const port = Number(process.env.PORT ?? 4321);

function build() {
  execSync("npm run build", { stdio: "inherit" });
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".xml")) return "application/xml; charset=utf-8";
  if (filePath.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function safeJoin(root, urlPath) {
  const normalized = urlPath.replaceAll("\\", "/");
  const withoutQuery = normalized.split("?")[0];
  const rel = withoutQuery.startsWith("/") ? withoutQuery.slice(1) : withoutQuery;
  const resolved = path.resolve(root, rel);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

build();

http
  .createServer((req, res) => {
    const urlPath = req.url ?? "/";
    const localPath = safeJoin(distDir, urlPath === "/" ? "/index.html" : urlPath);
    if (!localPath) {
      res.statusCode = 400;
      res.end("Bad request");
      return;
    }

    const finalPath = fs.existsSync(localPath)
      ? localPath
      : fs.existsSync(localPath + ".html")
        ? localPath + ".html"
        : null;

    if (!finalPath) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    res.setHeader("Content-Type", contentType(finalPath));
    res.end(fs.readFileSync(finalPath));
  })
  .listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Dev server: http://localhost:${port}`);
  });

