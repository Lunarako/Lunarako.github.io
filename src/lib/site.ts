// Everything the home page says lives here. Edit this file to change the site.
// A line marked EDIT holds a value to check. The build checks this file (src/lib/content.ts):
// when a value is not valid, the build stops and tells you which section to fix.

import type { Project, Skill } from "./content";
import { buildYear, sampleCounts } from "./contributions";
import { SKILL_MARKS } from "./skill-marks";
import { cleanSvg } from "./svg";
import type { Place } from "./weather";

/** Your GitHub username. The avatar, the contribution calendar and the links use it. */
export const githubLogin = "Lunarako";

export const site = {
  name: "Kaixin Tan",
  /** Shown on the page. This is the public email on the GitHub profile. */
  email: "kaixintanmath@163.com",
  github: `https://github.com/${githubLogin}`,
  /** The source of this site: the link in the footer. */
  repo: `https://github.com/${githubLogin}/${githubLogin}.github.io`, // change it if the repo has another name
  /** Optional: your X (Twitter) profile. Set undefined for no Twitter chip. */
  x: undefined as string | undefined,
  /** Optional: a booking link (Cal.com or similar). Set undefined for no "Book an intro call" button. */
  booking: undefined as string | undefined,
  /** Optional: a city shown next to the clock. Leave undefined to show the time only. */
  city: undefined as string | undefined,
  country: undefined as string | undefined,
  /** The clock in the Who band. The festivals and the moon always use China time (UTC+8). */
  timeZone: "Asia/Shanghai",
  /** The line under the name in the Who band. */
  headline: "LLM post-training & agents",
  roles: ["developer"],
  /** The About band: one string per paragraph. */
  about: [
    "Hi, I'm Kaixin Tan. I work on large language models: post-training and evaluating LLM agents, and building Transformer language models from scratch.",
    "I built ShopAlign, a reproducible pipeline that trains and evaluates long-horizon shopping agents with LoRA SFT and online GRPO. Feel free to email me.",
  ],
  /**
   * Optional: live weather in the banner, from Open-Meteo (no key needed). Without it the banner shows the clear garden;
   * the moon, the festivals and day/night still work. The page never shows the coordinates as text, but anyone who
   * reads the page source can see them. To turn it on, set for example:
   *   weather: { city: "Nanjing", latitude: 32.06, longitude: 118.8 },
   * Find the latitude and longitude of a city at https://open-meteo.com/en/docs (search box at the top).
   */
  weather: undefined as Place | undefined,
};

// The E2E build shows these fixed sample counts, so no test depends on GitHub or on today's date.
const lastDay = new Date("2026-10-20T00:00:00Z");
export const sampleContributions = buildYear(sampleCounts(985, lastDay), lastDay);

// The order on the home page. A project card shows its image or video when it has one (put the file in public/),
// else its ASCII art.
export const projects: Project[] = [
  {
    name: "ShopAlign",
    status: "beta",
    description:
      "Reproducible post-training and evaluation for long-horizon shopping agents: teacher rollouts and LoRA SFT, then online GRPO with veRL, evaluated on Final-200.",
    github: "https://github.com/Lunarako/shopalign",
    shot: "Agent",
    art: [
      " task: earbuds, black",
      " > search  wireless earbuds",
      " > open    item 3  [specs]",
      " > choose  color: black",
      " > buy     ok",
    ].join("\n"),
  },
  {
    name: "CS336 · Basics",
    status: "live",
    description:
      "Stanford CS336 assignment 1: a BPE tokenizer, a Transformer language model and its optimizer, written from scratch and trained on TinyStories.",
    github: "https://github.com/Lunarako/CS336-Spring-2026-a1",
    shot: "Tokenizer",
    art: [
      " t h e _ c a t",
      " th e _ c a t   (t,h)",
      " the _ c a t    (th,e)",
      " the _ c at     (a,t)",
      " the _ cat      (c,at)",
    ].join("\n"),
  },
  {
    name: "CS224N · A3",
    status: "live",
    description:
      "Stanford CS224N assignment 3: a small Transformer decoder (attention, MLP and decoder blocks) that generates text, trained on TinyStories.",
    github: "https://github.com/Lunarako/CS224N-Winter-2026-a3",
    shot: "Attention",
    art: [
      "        Once upon  a  time",
      " Once    #",
      " upon    +    #",
      " a       .    +   #",
      " time    .    .   +   #",
    ].join("\n"),
  },
  {
    name: "This site",
    status: "live",
    description: "My home page: a pixel garden under the real sky of my city. Based on glyph by franvy.",
    github: site.repo,
    shot: "Garden",
    art: [
      "  *      .       (    *",
      "      .     *     )",
      "    /\\_/\\       /\\",
      "   ( o.o )     /  \\",
      "    > ^ <     | [] |",
      " ,,,,,,,,,,,,,,,,,,,,,,,",
    ].join("\n"),
  },
  // A card with an image: put the file at public/projects/my-app.png, then add
  //   media: { key: "projects/my-app.png", kind: "image", alt: "The home screen of My app" },
];

/** A built-in mark from skill-marks.ts, cleaned the way the build cleans any SVG icon. */
const mark = (name: string) => {
  const check = cleanSvg(SKILL_MARKS[name]);
  if (!check.ok) throw new Error(`The built-in mark for ${name} is not valid: ${check.error}`);
  return check.svg;
};

/**
 * Tech chips. Built-in icons: TypeScript, React, Next.js, Tailwind, Motion, Node, Cloudflare, Workers, Drizzle,
 * SQLite, Astro, WebGL, Playwright, Vitest, Paper, Git, Linux. A chip can also have no icon, or your own SVG code.
 */
export const skills: Skill[] = [
  { name: "Python" },
  { name: "PyTorch" },
  { name: "Transformers" },
  { name: "veRL" },
  { name: "LoRA" },
  { name: "GRPO" },
  { name: "uv" },
  { name: "Git", svg: mark("Git") },
];

export type Snapshot = { label: string; art: string };

/** Not shown on the home page at the moment. */
export const snapshots: Snapshot[] = [];

/** Not shown on the home page at the moment. */
export const nowText: string[] = [];
