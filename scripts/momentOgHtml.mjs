/**
 * Builds crawler-facing Open Graph HTML for a moment.
 * Used by production-server.mjs when social bots request /moments/:id.
 */

const SITE_NAME = "Kult Moments";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(text, max) {
  const value = String(text ?? "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function isVideoMoment(moment) {
  const fileType = String(moment.assetMetadata?.fileType ?? "").toLowerCase();
  return fileType.startsWith("video/") || moment.assetMetadata?.mediaType === "video";
}

/**
 * Always returns the JPEG proxy URL when any image source is available.
 * The backend converts every format (WebP, PNG, GIF, AVIF, HEIC, TIFF, JPEG…) to image/jpeg.
 */
function resolveOgImageUrl(moment, pageOrigin, momentId) {
  const meta = moment.assetMetadata ?? {};
  const proxyUrl = `${(pageOrigin || "").replace(/\/+$/, "")}/api/moments/${momentId}/share-image.jpg`;

  const ogImageUrl = typeof meta.ogImageUrl === "string" ? meta.ogImageUrl.trim() : "";
  if (ogImageUrl) return proxyUrl;

  if (isVideoMoment(moment)) {
    const thumbnailUrl = typeof meta.thumbnailUrl === "string" ? meta.thumbnailUrl.trim() : "";
    if (thumbnailUrl) return proxyUrl;
    return undefined;
  }

  const assetUrl = typeof moment.assetUrl === "string" ? moment.assetUrl.trim() : "";
  if (assetUrl) return proxyUrl;

  const zgUrl = typeof moment.assetZgUrl === "string" ? moment.assetZgUrl.trim() : "";
  if (zgUrl) return proxyUrl;

  return undefined;
}

function pickDimensions(moment) {
  const meta = moment.assetMetadata ?? {};
  const width = Number(meta.width);
  const height = Number(meta.height);
  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  return { width: 1200, height: 630 };
}

export function buildMomentOgHtml(moment, publicMomentUrl) {
  const momentId = moment.momentId || publicMomentUrl.split("/").pop();
  const title = escapeHtml(truncate(moment.title?.trim() || "Kult Moment", 70));
  const description = escapeHtml(
    truncate(
      moment.description?.trim() ||
        moment.aiCaption?.trim() ||
        "A gaming moment shared on Kult — verified on the 0G Network.",
      155,
    ),
  );
  const safeUrl = escapeHtml(publicMomentUrl);
  const pageOrigin = publicMomentUrl.replace(/\/moments\/[^/]+\/?$/, "");
  const ogImageRaw = resolveOgImageUrl(moment, pageOrigin, momentId);
  const ogImage = ogImageRaw ? escapeHtml(ogImageRaw) : "";
  const ogImageMime = ogImageRaw?.includes("/share-image.jpg") ? "image/jpeg" : undefined;
  const { width, height } = pickDimensions(moment);
  const isVideo = isVideoMoment(moment);

  const imageTags = ogImage
    ? `
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:url" content="${ogImage}" />
  <meta property="og:image:secure_url" content="${ogImage}" />${
    ogImageMime ? `\n  <meta property="og:image:type" content="${escapeHtml(ogImageMime)}" />` : ""
  }
  <meta property="og:image:width" content="${width}" />
  <meta property="og:image:height" content="${height}" />
  <meta property="og:image:alt" content="${title}" />`
    : "";

  const twitterTags = `
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />${
    ogImage
      ? `\n  <meta name="twitter:image" content="${ogImage}" />\n  <meta name="twitter:image:alt" content="${title}" />`
      : ""
  }`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — ${SITE_NAME}</title>
  <meta name="description" content="${description}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${safeUrl}" />
  <link rel="canonical" href="${safeUrl}" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="${isVideo ? "video.other" : "article"}" />${imageTags}${twitterTags}
</head>
<body>
  <p><a href="${safeUrl}">${title}</a> on ${SITE_NAME}</p>
</body>
</html>`;
}
