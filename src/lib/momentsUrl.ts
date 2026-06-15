const trimTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/** Standalone Kult Moments app — override with `VITE_MOMENTS_URL` in `.env`. */
export const MOMENTS_IFRAME_URL = trimTrailingSlash(
  import.meta.env.VITE_MOMENTS_URL ?? "https://kult-browser-moments-p5wgi.ondigitalocean.app",
);
