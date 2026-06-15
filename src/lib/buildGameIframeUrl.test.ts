import { describe, expect, it } from "vitest";
import { buildGameIframeUrl } from "./buildGameIframeUrl";
import type { Game } from "@/types/api";

const highwayGame: Game = {
  _id: "highwayhustle-oneway",
  identification: "highwayhustle-oneway",
  name: { en: "Highway Hustle — One Way" },
  category: "Racing",
  metadata: {
    play_url: "https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/OneWay/7/index.html",
    highway_mode: "one-way",
  },
};

describe("buildGameIframeUrl", () => {
  it("appends kult jwt and source when token present", () => {
    const url = buildGameIframeUrl("https://game.example/play", { token: "tok123" });
    expect(url).toContain("jwt=tok123");
    expect(url).toContain("source=browser");
  });

  it("appends highway mode and wallet for hustle builds", () => {
    const url = buildGameIframeUrl(
      "https://pub-0025cff360c44334b8cc47c146e9c55c.r2.dev/OneWay/7/index.html",
      {
        token: "jwt-abc",
        walletAddress: "0xabc",
        game: highwayGame,
      },
    );
    expect(url).toContain("mode=one-way");
    expect(url).toContain("wallet=0xabc");
    expect(url).toContain("jwt=jwt-abc");
    expect(url).toContain("source=browser");
  });
});
