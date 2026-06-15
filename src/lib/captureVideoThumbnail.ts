/**
 * Captures a JPEG frame from a video for og:image on share preview pages.
 */
export function captureVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    const cleanup = () => URL.revokeObjectURL(objectUrl);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = Math.max(0.1, video.duration * 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Canvas 2D not available"));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          cleanup();
          if (!blob) {
            reject(new Error("Failed to encode thumbnail"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.85,
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not load video for thumbnail capture"));
    };

    video.src = objectUrl;
  });
}
