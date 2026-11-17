import { describe, expect, it } from "vitest";
import { defaultContent, getContent, profileOf, projectLink, SectionInput, socialsOf } from "./content";

const KEY = "projects/boardui.png";
const RUST = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true" focusable="false"><path d="M0 0h24v24H0z"/></svg>`;
const project = {
  name: "BoardUI",
  status: "live" as const,
  description: "Dashboard kit.",
  site: "https://example.com/boardui",
  github: "https://github.com/example/boardui",
  shot: "Dashboard",
  media: { key: KEY, kind: "image" as const, alt: "The BoardUI dashboard" },
};

describe("getContent", () => {
  it("passes the content of site.ts through the schemas", () => {
    expect(() => getContent()).not.toThrow();
    expect(getContent().profile.name).toBe(defaultContent.profile.name);
  });

  it("accepts the three stages: live, beta and dev", () => {
    for (const status of ["live", "beta", "dev"]) {
      expect(SectionInput.safeParse({ section: "projects", data: [{ ...project, status }] }).success, status).toBe(true);
    }
  });

  it("cleans the content: trims text and reads the old oss status as live", () => {
    const content = getContent({ ...defaultContent, projects: [{ ...project, name: " BoardUI ", status: "oss" as never }] });
    expect(content.projects).toEqual([project]);
  });

  it("stops with the section and the reason when site.ts has a mistake", () => {
    expect(() => getContent({ ...defaultContent, profile: { ...defaultContent.profile, email: "not-an-email" } })).toThrow(
      /section "profile": The email address is not valid/,
    );
    expect(() => getContent({ ...defaultContent, projects: [{ ...project, media: { ...project.media, key: "/abs.png" } }] })).toThrow(
      /section "projects": Item 1: The media path/,
    );
  });
});

describe("SectionInput", () => {
  it("accepts every section in its shape", () => {
    for (const body of [
      { section: "profile", data: defaultContent.profile },
      { section: "projects", data: [project] },
      { section: "skills", data: [{ name: "Astro" }, { name: "Rust", svg: RUST }] },
      { section: "projects", data: [{ ...project, site: undefined }] },
      { section: "projects", data: [{ ...project, github: undefined, media: undefined }] },
      { section: "projects", data: [{ ...project, media: { key: "projects/demo.mp4", kind: "video", alt: "A demo of BoardUI" } }] },
      { section: "now", data: [] },
      { section: "snapshots", data: [{ label: "a", art: "b" }] },
      ...["clear", "cloudy", "rain", "storm", "snow", "fog", "spring"].map((scene) => ({ section: "banner", data: { scene } })),
    ]) {
      expect(SectionInput.safeParse(body).success, JSON.stringify(body)).toBe(true);
    }
  });

  it("lets only a dev project go without a link: its source is not public yet", () => {
    const unlinked = { ...project, site: undefined, github: undefined };
    const parsed = SectionInput.parse({ section: "projects", data: [{ ...unlinked, status: "dev" }] });
    expect(parsed.data).toEqual([{ ...unlinked, status: "dev" }]);
    expect(projectLink({ ...unlinked, status: "dev" })).toBeUndefined();
    for (const status of ["live", "beta"]) {
      expect(SectionInput.safeParse({ section: "projects", data: [{ ...unlinked, status }] }).success, status).toBe(false);
    }
  });

  it("trims text, drops empty list lines and treats an empty link as no link", () => {
    expect(SectionInput.parse({ section: "now", data: [" one ", "", "  "] })).toEqual({ section: "now", data: ["one"] });
    expect(SectionInput.parse({ section: "skills", data: [{ name: " Astro ", svg: " " }] })).toEqual({
      section: "skills",
      data: [{ name: "Astro" }],
    });
    const parsed = SectionInput.parse({ section: "projects", data: [{ ...project, github: "  " }] });
    expect(parsed.data).toEqual([{ ...project, github: undefined }]);
  });

  it("takes an optional booking link on the profile, and an empty one means no link", () => {
    const p = defaultContent.profile;
    const withLink = SectionInput.parse({ section: "profile", data: { ...p, booking: "https://cal.com/franvy/intro" } });
    expect(withLink.data).toMatchObject({ booking: "https://cal.com/franvy/intro" });
    const empty = SectionInput.parse({ section: "profile", data: { ...p, booking: "  " } });
    expect(empty.data).toMatchObject({ booking: undefined });
  });

  it("takes the X following and follower counts as whole numbers, and an empty field means no count", () => {
    const p = defaultContent.profile;
    const withCounts = SectionInput.parse({ section: "profile", data: { ...p, xFollowing: "312", xFollowers: 1024 } });
    expect(withCounts.data).toMatchObject({ xFollowing: 312, xFollowers: 1024 });
    const empty = SectionInput.parse({ section: "profile", data: { ...p, xFollowing: "", xFollowers: " " } });
    expect(empty.data).toMatchObject({ xFollowing: undefined, xFollowers: undefined });
  });

  it("drops the Reddit fields a profile saved before Reddit was removed", () => {
    const p = defaultContent.profile;
    const old = SectionInput.parse({
      section: "profile",
      data: { ...p, reddit: "https://www.reddit.com/user/OwnAssistance1469", redditKarma: 1240, redditTrophy: { name: "Best Comment" } },
    });
    expect(old.data).not.toHaveProperty("reddit");
    expect(old.data).not.toHaveProperty("redditKarma");
    expect(old.data).not.toHaveProperty("redditTrophy");
  });

  it("drops the intro fan images that older saves still hold", () => {
    const peek = [{ key: KEY, kind: "image", alt: "The board" }];
    expect(SectionInput.parse({ section: "projects", data: [{ ...project, peek }] }).data).toEqual([project]);
  });

  it("keeps the leading spaces of a project's ascii preview and treats an empty one as no preview", () => {
    const art = "  .--.\n  |  |  \n\n";
    const parsed = SectionInput.parse({ section: "projects", data: [{ ...project, art }] });
    expect(parsed.data).toEqual([{ ...project, art: "  .--.\n  |  |" }]);
    const empty = SectionInput.parse({ section: "projects", data: [{ ...project, art: " \n " }] });
    expect(empty.data).toEqual([{ ...project, art: undefined }]);
  });

  it("rejects anything else", () => {
    const p = defaultContent.profile;
    for (const body of [
      null,
      {},
      { section: "posts", data: [] },
      { section: "skills" },
      { section: "skills", data: "Astro" },
      { section: "skills", data: ["Astro"] },
      { section: "skills", data: [{ name: "" }] },
      { section: "skills", data: [{ name: "Rust", svg: `<svg viewBox="0 0 1 1" onload="alert(1)"/>` }] },
      { section: "skills", data: [{ name: "Rust", svg: "<div>Rust</div>" }] },
      { section: "projects", data: [{ ...project, site: undefined, github: undefined }] },
      { section: "projects", data: [{ ...project, site: "", github: "" }] },
      { section: "projects", data: [{ ...project, github: "javascript:alert(1)" }] },
      { section: "projects", data: [{ ...project, media: { ...project.media, key: "/x.png" } }] },
      { section: "projects", data: [{ ...project, media: { ...project.media, key: "../x.png" } }] },
      { section: "projects", data: [{ ...project, media: { ...project.media, key: "x.html" } }] },
      { section: "projects", data: [{ ...project, media: { ...project.media, key: "x.mp4" } }] },
      { section: "projects", data: [{ ...project, media: { ...project.media, alt: "" } }] },
      { section: "projects", data: [{ ...project, media: { ...project.media, kind: "audio" } }] },
      { section: "profile", data: { ...p, name: "" } },
      { section: "profile", data: { ...p, email: "not-an-email" } },
      { section: "profile", data: { ...p, github: "javascript:alert(1)" } },
      { section: "profile", data: { ...p, x: "ftp://x.com/example" } },
      { section: "profile", data: { ...p, booking: "javascript:alert(1)" } },
      { section: "profile", data: { ...p, timeZone: "Mars/Olympus" } },
      { section: "profile", data: { ...p, roles: [] } },
      { section: "profile", data: { ...p, xFollowers: -1 } },
      { section: "profile", data: { ...p, xFollowers: 1.5 } },
      { section: "profile", data: { ...p, xFollowing: "many" } },
      { section: "projects", data: [{ ...project, status: "dead" }] },
      { section: "projects", data: [{ ...project, description: "x".repeat(201) }] },
      { section: "projects", data: Array.from({ length: 21 }, () => project) },
      { section: "projects", data: [{ ...project, art: "x".repeat(601) }] },
      { section: "snapshots", data: [{ label: "", art: "b" }] },
      { section: "banner", data: {} },
      { section: "banner", data: { scene: "hail" } },
      { section: "banner", data: "snow" },
    ]) {
      expect(SectionInput.safeParse(body).success, JSON.stringify(body)).toBe(false);
    }
  });
});

describe("projectLink", () => {
  it("opens the website when there is one, otherwise GitHub", () => {
    expect(projectLink(project)).toBe(project.site);
    expect(projectLink({ ...project, site: undefined })).toBe(project.github);
  });
});

describe("socialsOf", () => {
  const profile = { ...defaultContent.profile, github: "https://github.com/ada", x: "https://x.com/ada" };

  it("names the X profile Twitter and gives it the X mark", () => {
    expect(socialsOf(profile)[1]).toEqual({ label: "Twitter", href: "https://x.com/ada", icon: "x" });
  });

  it("lists GitHub and Twitter only: email has its own button", () => {
    expect(socialsOf(profile).map((s) => s.label)).toEqual(["GitHub", "Twitter"]);
  });

  it("leaves Twitter out when there is no X link", () => {
    expect(socialsOf({ ...profile, x: undefined }).map((s) => s.label)).toEqual(["GitHub"]);
  });
});

describe("profileOf", () => {
  it("reads the handle and a short label from a profile link", () => {
    expect(profileOf("https://github.com/franvy")).toEqual({ handle: "franvy", label: "github.com/franvy" });
    expect(profileOf("https://www.x.com/franvy/")).toEqual({ handle: "franvy", label: "x.com/franvy" });
    expect(profileOf("https://www.duolingo.com/profile/001023.6354OwBA")).toEqual({
      handle: "001023.6354OwBA",
      label: "duolingo.com/profile/001023.6354OwBA",
    });
  });

  it("has no handle when the link has no path", () => {
    expect(profileOf("https://example.com")).toEqual({ handle: null, label: "example.com" });
  });
});

describe("skill icons", () => {
  it("cleans SVG code before the page uses it, and says what is wrong when it cannot", () => {
    const parsed = SectionInput.parse({
      section: "skills",
      data: [{ name: "Rust", svg: `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><title>Rust</title><path d="M0 0h24v24H0z"/></svg>` }],
    });
    expect(parsed.data).toEqual([{ name: "Rust", svg: RUST }]);

    const refused = SectionInput.safeParse({ section: "skills", data: [{ name: "Rust", svg: `<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>` }] });
    expect(refused.success).toBe(false);
    expect(refused.error?.issues[0].message).toMatch(/Rust.*<script>/);
  });

  it("shows each default skill with the icon the home page renders", () => {
    for (const skill of defaultContent.skills.filter((s) => s.svg)) {
      expect(skill.svg, skill.name).toMatch(/^<svg viewBox=/);
    }
  });
});
