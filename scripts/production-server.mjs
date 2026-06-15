/**
 * Production static server with social-crawler OG support for /moments/:id.
 *
 * Humans  → SPA index.html
 * Crawlers (Twitter, Facebook, WhatsApp, Reddit, Pinterest, TikTok) →
 *   proxied to the backend's /api/share/moments/:id which returns per-moment
 *   OG HTML with a JPEG image proxy. The backend owns all image conversion
 *   (via sharp), so we never duplicate that logic here.
 *
 * /api/share/* (including /api/share/moments/:id/og-image.jpg) →
 *   proxied to the backend. Social bots fetch the og:image URL immediately
 *   after crawling the OG HTML; those requests must reach the backend's
 *   JPEG proxy, which converts WebP/AVIF/other formats and returns image/jpeg.
 */
import { createServer } from "http";
import { createReadStream, existsSync, readFileSync, statSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "../dist");
const PORT = Number(process.env.PORT || 8080);

/**
 * Backend origin — no trailing slash, /api suffix stripped.
 * Used for proxying API calls and share-preview requests.
 */
const API_ORIGIN = (
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  "https://kult-browser-rust-l2lwg.ondigitalocean.app"
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

const CRAWLER_UA =
  /twitterbot|facebookexternalhit|facebot|discordbot|slackbot|telegrambot|whatsapp|linkedinbot|googlebot|bingbot|applebot|pinterest|redditbot|vkshare|bot\/|spider\/|crawler\//i;

const MOMENT_PAGE = /^\/moments\/([A-Za-z0-9_-]+)\/?$/;
/** Legacy share URLs — redirect humans to the public moment page. */
const LEGACY_SHARE_MOMENT_PAGE = /^\/share\/moments\/([A-Za-z0-9_-]+)\/?$/;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
};

function requestOrigin(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  return host ? `${proto}://${host}` : "";
}

/**
 * Proxy a request to the backend.
 *
 * @param {import("http").IncomingMessage} req   - original request (headers forwarded)
 * @param {import("http").ServerResponse}  res   - response to write into
 * @param {string}                         [path] - override path; defaults to req.url
 */
async function proxyToBackend(req, res, path) {
  const url = path ?? req.url;
  const backendUrl = `${API_ORIGIN}${url}`;

  // Forward origin-related headers so the backend can build correct absolute URLs
  // (e.g. og:image proxy URL uses the public app hostname, not an internal address).
  const forwardHeaders = {};
  const fwdHost = req.headers["x-forwarded-host"] || req.headers.host;
  const fwdProto = req.headers["x-forwarded-proto"] || "https";
  if (fwdHost) forwardHeaders["x-forwarded-host"] = String(fwdHost).split(",")[0].trim();
  if (fwdProto) forwardHeaders["x-forwarded-proto"] = String(fwdProto).split(",")[0].trim();
  if (req.headers["user-agent"]) forwardHeaders["user-agent"] = req.headers["user-agent"];

  try {
    const upstream = await fetch(backendUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: forwardHeaders,
    });

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const cacheControl = upstream.headers.get("cache-control") || "no-store";
    const buf = await upstream.arrayBuffer();

    res.writeHead(upstream.ok ? 200 : upstream.status, {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    });
    res.end(Buffer.from(buf));
  } catch (err) {
    console.error("[production-server] backend proxy failed", { url: backendUrl, err: String(err) });
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Backend unavailable");
  }
}

function trySendStatic(req, res) {
  const urlPath = req.url?.split("?")[0] || "/";
  const rel = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = join(DIST, rel);

  if (!filePath.startsWith(DIST) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    return false;
  }

  const ext = extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
  return true;
}

function sendSpaIndex(res) {
  const indexPath = join(DIST, "index.html");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
  res.end(readFileSync(indexPath));
}

createServer((req, res) => {
  if (!req.url || req.method !== "GET") {
    res.writeHead(405);
    res.end();
    return;
  }

  const pathname = req.url.split("?")[0];
  const momentMatch = pathname.match(MOMENT_PAGE);
  const legacyShareMatch = pathname.match(LEGACY_SHARE_MOMENT_PAGE);
  const ua = req.headers["user-agent"] || "";

  // ── /api/share/* ─────────────────────────────────────────────────────────────
  // All share API calls go to the backend — this includes:
  //   /api/share/moments/:id          → per-moment OG HTML
  //   /api/share/moments/:id/og-image.jpg → JPEG proxy (social bots fetch this)
  //   /api/share/default-og.jpg       → JPEG-converted app branding image
  if (pathname.startsWith("/api/share/")) {
    void proxyToBackend(req, res);
    return;
  }

  // ── Legacy /share/moments/:id (kult-moment share links) ─────────────────────
  // Always proxy to backend OG HTML — humans get JS redirect to /moments/:id;
  // crawlers receive og:image + twitter:card meta tags.
  if (legacyShareMatch) {
    void proxyToBackend(req, res, `/api/share/moments/${legacyShareMatch[1]}`);
    return;
  }

  // ── /moments/:id for social crawlers ─────────────────────────────────────────
  // Proxy to the backend's authoritative share preview endpoint.
  // The backend:
  //   • queries the moment from the DB
  //   • builds per-moment OG HTML (title, description, og:image)
  //   • og:image always uses the /api/share/moments/:id/og-image.jpg JPEG proxy
  //     (guarantees image/jpeg Content-Type regardless of the original file format)
  //   • includes a JS redirect so human browsers immediately go to the SPA
  const momentId = momentMatch?.[1] ?? legacyShareMatch?.[1];
  if (momentId && CRAWLER_UA.test(ua)) {
    void proxyToBackend(req, res, `/api/share/moments/${momentId}`);
    return;
  }

  // ── Static assets ─────────────────────────────────────────────────────────────
  if (trySendStatic(req, res)) return;

  // ── SPA fallback ──────────────────────────────────────────────────────────────
  sendSpaIndex(res);
}).listen(PORT, () => {
  console.log(`[production-server] listening on :${PORT} (API ${API_ORIGIN})`);
});
