// The home page content. It all comes from src/lib/site.ts. The build checks it against the schemas below,
// so a mistake in site.ts stops the build with a message that says what to fix.
import { z } from "astro/zod";
import { SCENES } from "./garden/themes";
import { isMediaKey, isVideoKey } from "./media";
import { nowText, projects, site, skills, snapshots } from "./site";
import { cleanSvg } from "./svg";

const text = (label: string, max: number) =>
  z
    .string(`${label} must be text`)
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(max, `${label} can be ${max} characters at most`);

// Only http(s): a javascript: link in a profile field would run on the home page.
const link = (label: string) =>
  z.url({ protocol: /^https?$/, error: `${label} must be a URL that starts with http:// or https://` }).max(300, `${label} is too long`);

/** An optional link: an empty field means "no link". */
const optionalLink = (label: string) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim() || undefined : v), link(label).optional());

/** A list of short lines: blank lines are dropped before the limits apply. */
const lines = (label: string, maxLen: number, maxCount: number, minCount = 0) =>
  z
    .array(z.string(`${label} must be text`).trim().max(maxLen, `${label}: each line can be ${maxLen} characters at most`), `${label} must be a list`)
    .transform((list) => list.filter(Boolean))
    .pipe(
      z
        .array(z.string())
        .min(minCount, `${label} needs at least ${minCount} item(s)`)
        .max(maxCount, `${label} can have ${maxCount} items at most`),
    );

/** An optional count typed in /admin: an empty field means "no count". */
const optionalCount = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v.trim().replaceAll(",", ""))) : v),
    z
      .number(`${label} must be a number`)
      .int(`${label} must be a whole number`)
      .min(0, `${label} cannot be negative`)
      .max(1_000_000_000, `${label} is too large`)
      .optional(),
  );

/** An optional line of text: an empty field means "none". */
const optionalText = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim() || undefined : v), schema.optional());

const isTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const Profile = z.object({
  name: text("Name", 40),
  headline: text("Headline", 80),
  roles: lines("Roles", 40, 6, 1),
  email: z.email("The email address is not valid").max(120, "The email address is too long"),
  github: link("GitHub link"),
  /** Without it the home page shows no Twitter chip. */
  x: optionalLink("X link"),
  /** Where "Book an intro call" goes (Cal.com or similar). Without it the home page shows no booking button. */
  booking: optionalLink("Booking link"),
  /** Shown on the Twitter hover card. X has no free API for them, so they are typed in /admin. */
  xFollowing: optionalCount("X following"),
  xFollowers: optionalCount("X followers"),
  repo: link("Source repo link"),
  /** Optional: shown next to the clock. */
  city: optionalText(z.string().max(40, "The city can be 40 characters at most")),
  country: optionalText(z.string().max(40, "The country can be 40 characters at most")),
  timeZone: text("Time zone", 60).refine(isTimeZone, "This time zone does not exist. Enter an IANA time zone name, for example Asia/Shanghai"),
});

// Previews are ascii art: keep the spaces at the start of a line, only drop trailing blank lines.
const art = (label: string) =>
  z
    .string(`${label} must be text`)
    .transform((s) => s.replace(/\s+$/, ""))
    .pipe(z.string().min(1, `${label} cannot be empty`).max(600, `${label} can be 600 characters at most`));

/** Optional ascii art: a blank field means "no preview". */
const optionalArt = (label: string) =>
  z.preprocess((v) => (typeof v === "string" && !v.trim() ? undefined : v), art(label).optional());

/** An image or video in public/. The key is its path inside public/; alt is read aloud in its place. */
export const ProjectMedia = z
  .object({
    key: z
      .string("Set the path of the file inside public/")
      .refine(isMediaKey, "The media path must be a path inside public/, like projects/app.png, with an image or video extension"),
    kind: z.enum(["image", "video"], "Media must be an image or a video"),
    alt: text("Image/video description", 160),
  })
  .refine((m) => (m.kind === "video") === isVideoKey(m.key), "The media kind does not match the file extension. Use kind: \"video\" for .mp4 and .webm files");

export const ProjectItem = z
  .object({
    name: text("Project name", 40),
    // "oss" was a status until the stages became live, beta and dev; a project saved with it was released, so live.
    status: z.preprocess((v) => (v === "oss" ? "live" : v), z.enum(["live", "beta", "dev"], "Status must be live, beta or dev")),
    description: text("Project description", 200),
    site: optionalLink("Website link"),
    github: optionalLink("GitHub link"),
    shot: text("Preview label", 30),
    /** Drawn in the preview frame while there is no image or video. */
    art: optionalArt("Preview art"),
    media: ProjectMedia.optional(),
  })
  // A dev project may have no link yet: its source is not public. The card then shows a greyed-out GitHub mark.
  .refine((p) => p.site || p.github || p.status === "dev", "Fill in the website link, the GitHub link or both. Only a dev project can have no link");

export const SkillItem = z
  .object({
    name: text("Skill name", 30),
    // SVG code pasted in /admin. The home page puts it inline, so it is cleaned here (src/lib/svg.ts). Empty means no icon.
    svg: optionalText(z.string("The icon must be SVG code")),
  })
  .transform((skill, ctx) => {
    if (skill.svg === undefined) return { name: skill.name };
    const check = cleanSvg(skill.svg);
    if (check.ok) return { name: skill.name, svg: check.svg };
    ctx.addIssue({ code: "custom", path: ["svg"], message: `${skill.name}: ${check.error}` });
    return z.NEVER;
  });

export const SnapshotItem = z.object({
  label: text("Snapshot title", 40),
  art: art("Snapshot art"),
});

/** The garden theme the top banner shows. */
export const Banner = z.object({ scene: z.enum(SCENES, "Unknown banner theme. Choose one from the list") });

export const SectionInput = z.discriminatedUnion(
  "section",
  [
    z.object({ section: z.literal("profile"), data: Profile }),
    z.object({ section: z.literal("projects"), data: z.array(ProjectItem).max(20, "You can have 20 projects at most") }),
    z.object({ section: z.literal("skills"), data: z.array(SkillItem, "Skills must be a list").max(60, "You can have 60 skills at most") }),
    z.object({ section: z.literal("now"), data: lines("Now", 120, 12) }),
    z.object({ section: z.literal("snapshots"), data: z.array(SnapshotItem).max(20, "You can have 20 snapshots at most") }),
    z.object({ section: z.literal("banner"), data: Banner }),
  ],
  "Unknown section",
);

export type SectionInput = z.infer<typeof SectionInput>;
export type SectionName = SectionInput["section"];
export type SiteContent = { [S in SectionInput as S["section"]]: S["data"] };

export const defaultContent: SiteContent = {
  profile: {
    name: site.name,
    headline: site.headline,
    roles: site.roles,
    email: site.email,
    github: site.github,
    x: site.x,
    booking: site.booking,
    repo: site.repo,
    city: site.city,
    country: site.country,
    timeZone: site.timeZone,
  },
  projects,
  skills,
  now: nowText,
  snapshots,
  banner: { scene: "clear" },
};

/**
 * The content of src/lib/site.ts, checked and cleaned by the schemas (trimmed text, empty links dropped).
 * Throws when a section does not fit, so the build stops and says which section and what to fix.
 */
export function getContent(source: SiteContent = defaultContent): SiteContent {
  const content = { ...source };
  for (const [section, data] of Object.entries(source)) {
    const parsed = SectionInput.safeParse({ section, data });
    if (!parsed.success) throw new Error(`src/lib/site.ts, section "${section}": ${describeError(parsed.error)}`);
    Object.assign(content, { [parsed.data.section]: parsed.data.data });
  }
  return content;
}

/** The first problem in a rejected input, in words the editor can act on. */
export function describeError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "The content is not valid. Check it, then save again.";
  const index = issue.path.find((p) => typeof p === "number");
  return typeof index === "number" ? `Item ${index + 1}: ${issue.message}` : issue.message;
}

export type Project = SiteContent["projects"][number];
export type Skill = SiteContent["skills"][number];

/** Where the card itself links: the website when there is one, otherwise GitHub. */
/** Where the card goes: the website, else GitHub. A dev project with neither has no link. */
export const projectLink = (p: Project): string | undefined => p.site ?? p.github;

/** Path words in front of the handle: duolingo.com/profile/<handle>. */
const PROFILE_PREFIXES = new Set(["profile"]);

/**
 * The handle in a profile link (github.com/franvy -> "franvy") and the link without its scheme, for the hover cards.
 * Extra pages after the handle (github.com/<handle>/glyph) are dropped.
 */
export function profileOf(href: string): { handle: string | null; label: string } {
  const url = new URL(href);
  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  const path = PROFILE_PREFIXES.has(parts[0]) && parts[1] ? parts.slice(0, 2) : parts.slice(0, 1);
  const handle = path.at(-1) ?? null;
  return { handle, label: [host, ...path].join("/") };
}

/** The full site record with the checked profile on top. */
export const siteWith = (profile: SiteContent["profile"]) => ({ ...site, ...profile });

export type Social = { label: string; href: string; icon: "github" | "x" };

export const socialsOf = (profile: SiteContent["profile"]): Social[] => [
  { label: "GitHub", href: profile.github, icon: "github" },
  ...(profile.x ? [{ label: "Twitter", href: profile.x, icon: "x" as const }] : []),
];
