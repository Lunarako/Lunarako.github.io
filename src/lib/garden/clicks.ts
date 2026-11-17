import type { SceneName } from "./themes";

// What a click in the banner's sky draws. The site has no sound.

export type SkyCue = "firework" | "paper" | "drop" | "firefly";

/** What a click in the sky adds to the garden, or null where it draws nothing. */
export function skyCue(scene: SceneName, night: boolean): SkyCue | null {
  if (scene === "spring") return night ? "firework" : "paper";
  if (scene === "rain" || scene === "storm") return "drop";
  if (night && (scene === "clear" || scene === "cloudy")) return "firefly";
  return null;
}
