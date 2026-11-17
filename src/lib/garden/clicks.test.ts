import { describe, expect, it } from "vitest";
import { SCENES } from "./themes";
import { skyCue } from "./clicks";

describe("skyCue", () => {
  it("launches a firework on a Lunar New Year night, drops red paper by day", () => {
    expect(skyCue("spring", true)).toBe("firework");
    expect(skyCue("spring", false)).toBe("paper");
  });

  it("drops rain in rain and storm, day or night", () => {
    for (const night of [true, false]) {
      expect(skyCue("rain", night)).toBe("drop");
      expect(skyCue("storm", night)).toBe("drop");
    }
  });

  it("adds a firefly on a clear or cloudy night", () => {
    expect(skyCue("clear", true)).toBe("firefly");
    expect(skyCue("cloudy", true)).toBe("firefly");
  });

  it("draws nothing where the scene has no sky click", () => {
    expect(skyCue("clear", false)).toBeNull();
    expect(skyCue("cloudy", false)).toBeNull();
    for (const night of [true, false]) {
      expect(skyCue("snow", night)).toBeNull();
      expect(skyCue("fog", night)).toBeNull();
    }
  });

  it("knows every scene", () => {
    for (const scene of SCENES) expect(() => skyCue(scene, true)).not.toThrow();
  });
});
