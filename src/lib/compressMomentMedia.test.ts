import { describe, expect, it } from "vitest";
import { scaleToMaxLongEdge } from "@/lib/compressMomentMedia";

describe("scaleToMaxLongEdge", () => {
  it("keeps dimensions when already within the cap", () => {
    expect(scaleToMaxLongEdge(800, 600, 1920)).toEqual({ width: 800, height: 600 });
  });

  it("scales down preserving aspect ratio", () => {
    expect(scaleToMaxLongEdge(4000, 2000, 960)).toEqual({ width: 960, height: 480 });
  });

  it("handles portrait images", () => {
    expect(scaleToMaxLongEdge(1080, 2400, 960)).toEqual({ width: 432, height: 960 });
  });
});
