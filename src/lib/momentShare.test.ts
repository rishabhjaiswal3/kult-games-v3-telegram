import { describe, expect, it, vi } from "vitest";

describe("buildMomentShareUrl", () => {
  it("builds the public moment page URL on the current origin", async () => {
    vi.stubGlobal("window", { location: { origin: "https://kult-browser-rust-l2lwg.ondigitalocean.app" } });
    vi.stubEnv("VITE_API_URL", "https://kult-browser-rust-l2lwg.ondigitalocean.app");

    const { buildMomentShareUrl, buildMomentSharePayload, buildMomentShareOgImageUrl } = await import("./momentShare");
    const momentId = "IZugAtUEl7LHQTbWzjpMG";

    expect(buildMomentShareUrl(momentId)).toBe(
      `https://kult-browser-rust-l2lwg.ondigitalocean.app/moments/${momentId}`,
    );

    const payload = buildMomentSharePayload({
      momentId,
      title: "New Trash Talk",
      description: "Test",
      tags: [],
      relatedGames: [],
      playerWalletAddress: "0x1",
      numLikes: 0,
      numComments: 0,
      aiHighlights: [],
    });

    expect(payload.url).toBe(
      `https://kult-browser-rust-l2lwg.ondigitalocean.app/moments/${momentId}`,
    );
    expect(payload.previewUrl).toBe(
      `https://kult-browser-rust-l2lwg.ondigitalocean.app/api/share/moments/${momentId}`,
    );
    expect(buildMomentShareOgImageUrl(momentId)).toBe(
      `https://kult-browser-rust-l2lwg.ondigitalocean.app/api/moments/${momentId}/share-image.jpg`,
    );
  });
});

describe("resolvePlatformShareUrl", () => {
  it("uses preview URL for social crawlers by default", async () => {
    vi.stubGlobal("window", { location: { origin: "https://kult-browser-rust-l2lwg.ondigitalocean.app" } });

    const { buildMomentSharePayload, resolvePlatformShareUrl } = await import("./momentShare");
    const payload = buildMomentSharePayload({
      momentId: "abc",
      title: "Test",
      description: "Desc",
      tags: [],
      relatedGames: [],
      playerWalletAddress: "0x1",
      numLikes: 0,
      numComments: 0,
      aiHighlights: [],
    });

    expect(resolvePlatformShareUrl(payload)).toBe(payload.previewUrl);
  });
});

describe("buildRedditSubmitParams", () => {
  it("merges title and description for Reddit link posts", async () => {
    const { buildRedditSubmitParams, buildRedditSubmitTitle } = await import("./momentShare");

    const payload = {
      title: "New Trash Talk",
      teaser: "Let's try to wrap up early because you are not good enough to compete",
      url: "https://kult-browser-rust-l2lwg.ondigitalocean.app/moments/abc",
    };

    expect(buildRedditSubmitTitle(payload)).toContain("New Trash Talk —");
    expect(buildRedditSubmitTitle(payload)).toContain("wrap up early");

    const params = buildRedditSubmitParams(payload);
    expect(params.url).toBe(payload.url);
    expect(params.title).toContain(" — ");
    expect(params.text).toBe(payload.teaser);
  });
});
