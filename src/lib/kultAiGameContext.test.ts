import { describe, expect, it, vi } from "vitest";

import { gamesApi } from "@/api/gamesApi";
import { buildCatalogGroundedPrompt, mergeWithKnownKultGames, selectClosestCatalogGames } from "@/lib/kultAiGameContext";
import type { Game } from "@/types/api";

vi.mock("@/api/gamesApi", () => ({
  gamesApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

const highway: Game = {
  _id: "1",
  identification: "highway-hustle",
  name: { en: "Highway Hustle" },
  category: "Racing",
  rating: 4.8,
  slogan: "Race through neon traffic.",
};

const robo: Game = {
  _id: "2",
  identification: "robo-wars",
  name: { en: "Robo Wars" },
  category: "Arena Combat",
  rating: 4.7,
  slogan: "Build bots and battle.",
};

const mage: Game = {
  _id: "3",
  identification: "mage-quest",
  name: { en: "Mage Quest" },
  category: "Adventure",
  rating: 4.9,
};

const guess: Game = {
  _id: "4",
  identification: "guesstheai",
  name: { en: "Guess the AI" },
  category: "Puzzle",
  rating: 4.5,
};

describe("kultAiGameContext", () => {
  it("selects closest catalog games from approximate names", () => {
    const selected = selectClosestCatalogGames("compare highway hustle and robowar", [mage, highway, robo], 2);

    expect(selected.map((game) => game.identification)).toEqual(["highway-hustle", "robo-wars"]);
  });

  it("only selects specifically requested games when exact names are present", () => {
    const selected = selectClosestCatalogGames("compare zerogpool and zerodash", mergeWithKnownKultGames([]));

    expect(selected.map((game) => game.identification).sort()).toEqual(["zerodash", "zerogpool"]);
  });

  it("builds an enriched prompt for the AI agent using catalog details", async () => {
    vi.mocked(gamesApi.getAll).mockResolvedValue({
      games: [highway, robo],
      totalCount: 2,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });
    vi.mocked(gamesApi.getById).mockImplementation(async (id) => ({
      ...(id === "highway-hustle" ? highway : robo),
      about: id === "highway-hustle" ? "High-speed traffic dodging and reflex racing." : "Robot arena battles with upgrades.",
    }));

    const prompt = await buildCatalogGroundedPrompt("Which is better Highway Hustle vs Robo Wars?");

    expect(prompt).toMatch(/^KULT GAME CATALOG CONTEXT/);
    expect(prompt).toContain("Game name: Highway Hustle");
    expect(prompt).toContain("Game name: Robo Wars");
    expect(prompt).toContain("High-speed traffic dodging");
    expect(prompt).toContain("Do not say \"I don't have the full catalog\"");
    expect(prompt).toContain("User question:\nWhich is better Highway Hustle vs Robo Wars?");
  });

  it("includes all catalog games for a generic compare-games request", async () => {
    vi.mocked(gamesApi.getAll).mockResolvedValue({
      games: [highway, robo, mage],
      totalCount: 3,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });
    vi.mocked(gamesApi.getById).mockImplementation(async (id) => {
      const game = [highway, robo, mage].find((entry) => entry.identification === id);
      return game ?? highway;
    });

    const prompt = await buildCatalogGroundedPrompt("compare games for me");

    expect(prompt).toContain("Game name: Highway Hustle");
    expect(prompt).toContain("Game name: Robo Wars");
    expect(prompt).toContain("Game name: Mage Quest");
    expect(prompt).toContain("compare every game listed in this catalog context");
    expect(prompt).toContain("Available game count in this context:");
  });

  it("supplements the prompt with the known app roster when the API only returns one game", async () => {
    vi.mocked(gamesApi.getAll).mockResolvedValue({
      games: [guess],
      totalCount: 1,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });
    vi.mocked(gamesApi.getById).mockImplementation(async (id) => {
      if (id === "guesstheai") return guess;
      throw new Error("not found");
    });

    const prompt = await buildCatalogGroundedPrompt("compare games for me");

    expect(prompt).toContain("Game name: Guess the AI");
    expect(prompt).toContain("Game name: Highway Hustle");
    expect(prompt).toContain("Game name: Robo Wars");
    expect(prompt).toContain("Game name: Warzone Warriors");
    expect(prompt).toContain("Game name: ZeroG Pool");
    expect(prompt).toContain("Game name: ZeroDash");
    expect(prompt).toContain("Do not say \"I only have information about one game\" when Available game count is greater than 1.");
  });

  it("deduplicates known games that already exist in the API catalog", () => {
    const merged = mergeWithKnownKultGames([guess]);
    const guessEntries = merged.filter((game) => game.identification === "guesstheai");

    expect(guessEntries).toHaveLength(1);
  });

  it("uses the known app roster when the catalog is unavailable", async () => {
    vi.mocked(gamesApi.getAll).mockRejectedValue(new Error("offline"));

    const prompt = await buildCatalogGroundedPrompt("compare games");

    expect(prompt).toContain("Available game count in this context: 6");
    expect(prompt).toContain("Game name: Guess the AI");
    expect(prompt).toContain("Game name: Highway Hustle");
    expect(prompt).toContain("Game name: Robo Wars");
    expect(prompt).toContain("User question:\ncompare games");
  });
});
