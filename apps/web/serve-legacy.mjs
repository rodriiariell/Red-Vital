import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const port = Number(process.env.WEB_PORT ?? 8000);
const mimeTypes = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".png": "image/png" };

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  const candidate = resolve(root, `.${normalize(pathname === "/" ? "/index.html" : pathname)}`);
  if (!candidate.startsWith(`${root}\\`) || !existsSync(candidate) || statSync(candidate).isDirectory()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": mimeTypes[extname(candidate)] ?? "application/octet-stream" });
  createReadStream(candidate).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`RedVital web MVP: http://127.0.0.1:${port}`));
