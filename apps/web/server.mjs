import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const port = Number(process.env.WEB_PORT ?? 8000);
const apiOrigin = process.env.WEB_API_TARGET ?? "http://127.0.0.1:3001";
const mimeTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
const hopByHop = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
]);

const bodyOf = (request) =>
  new Promise((resolveBody, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolveBody(Buffer.concat(chunks)));
    request.on("error", reject);
  });

async function proxy(request, response, url) {
  try {
    const body = ["GET", "HEAD"].includes(request.method ?? "GET")
      ? undefined
      : await bodyOf(request);
    const headers = {};
    for (const [name, value] of Object.entries(request.headers))
      if (
        (!hopByHop.has(name) &&
          name !== "content-length" &&
          name !== "cookie") ||
        name === "cookie"
      )
        headers[name] = value;
    const upstream = await fetch(
      `${apiOrigin}${url.pathname.slice(4)}${url.search}`,
      { method: request.method, headers, body, redirect: "manual" },
    );
    const responseHeaders = {};
    for (const [name, value] of upstream.headers)
      if (!hopByHop.has(name) && name !== "set-cookie")
        responseHeaders[name] = value;
    const cookies = upstream.headers.getSetCookie?.() ?? [];
    if (cookies.length) responseHeaders["set-cookie"] = cookies;
    response.writeHead(upstream.status, responseHeaders);
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    response.writeHead(502, {
      "content-type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify({ message: "Web proxy could not reach API" }));
  }
}

function serveStatic(request, response, url) {
  const pathname = decodeURIComponent(
    url.pathname === "/" ? "/index.html" : url.pathname,
  );
  const candidate = resolve(root, `.${normalize(pathname)}`);
  if (
    !candidate.startsWith(`${root}\\`) ||
    !existsSync(candidate) ||
    statSync(candidate).isDirectory()
  ) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, {
    "content-type": mimeTypes[extname(candidate)] ?? "application/octet-stream",
  });
  createReadStream(candidate).pipe(response);
}

createServer((request, response) => {
  const url = new URL(
    request.url ?? "/",
    `http://${request.headers.host ?? "127.0.0.1:8000"}`,
  );
  if (url.pathname === "/api" || url.pathname.startsWith("/api/"))
    return proxy(request, response, url);
  return serveStatic(request, response, url);
}).listen(port, "127.0.0.1", () =>
  console.log(
    `RedVital web with same-origin API proxy: http://127.0.0.1:${port}`,
  ),
);
