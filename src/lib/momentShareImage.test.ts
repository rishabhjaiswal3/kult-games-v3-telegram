import { describe, expect, it, vi } from "vitest";
import {
  buildMomentShareImageProxyUrl,
  momentHasShareImage,
  resolveMomentShareImageUrl,
} from "./momentShareImage";
import type { Moment } from "@/types/api";

const baseMoment: Moment = {
  momentId: "abc123",
  playerWalletAddress: "0x1",
  title: "Test",
  tags: [],
  relatedGames: [],
  numLikes: 0,
  numComments: 0,
  aiHighlights: [],
};

describe("momentShareImage", () => {
  it("detects image moments regardless of file extension", () => {
    expect(
      momentHasShareImage({
        ...baseMoment,
        assetUrl: "https://cdn.example/moment.webp",
        assetMetadata: { fileType: "image/webp", mediaType: "image" },
      }),
    ).toBe(true);

    expect(
      momentHasShareImage({
        ...baseMoment,
        assetUrl: "https://cdn.example/moment",
        assetMetadata: { fileType: "image/png" },
      }),
    ).toBe(true);

    expect(momentHasShareImage({ ...baseMoment, assetUrl: undefined })).toBe(false);
  });

  it("uses JPEG proxy for video thumbnails", () => {
    expect(
      momentHasShareImage({
        ...baseMoment,
        assetUrl: "https://cdn.example/clip.mp4",
        assetMetadata: {
          fileType: "video/mp4",
          mediaType: "video",
          thumbnailUrl: "https://cdn.example/thumb.webp",
        },
      }),
    ).toBe(true);
  });

  it("always returns share-image.jpg proxy URL", () => {
    const host = "https://kult-browser-rust-l2lwg.ondigitalocean.app";
    expect(buildMomentShareImageProxyUrl("abc123", host)).toBe(
      `${host}/api/moments/abc123/share-image.jpg`,
    );

    vi.stubGlobal("window", { location: { origin: host } });
    expect(
      resolveMomentShareImageUrl(
        {
          ...baseMoment,
          assetUrl: "https://cdn.example/photo.avif",
          assetMetadata: { fileType: "image/avif" },
        },
        host,
      ),
    ).toBe(`${host}/api/moments/abc123/share-image.jpg`);
  });
});
