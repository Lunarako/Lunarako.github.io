import { describe, expect, it } from "vitest";
import { defaultContent, type SiteContent } from "./content";
import { homeMarkdown } from "./markdown";
import { sampleContributions as contributions, site } from "./site";

// Fixed content, so the tests do not change when you edit src/lib/site.ts.
const content: SiteContent = {
  ...defaultContent,
  profile: {
    ...defaultContent.profile,
    name: "Ada",
    roles: ["tool maker"],
    city: "Nanjing",
    country: "China",
    email: "ada@example.com",
    github: "https://github.com/ada",
    x: "https://x.com/ada",
    booking: "https://cal.com/ada",
  },
  projects: [
    { name: "garden", status: "live", description: "This site.", site: "https://ada.dev", github: "https://github.com/ada/garden", shot: "Home" },
    { name: "notes", status: "beta", description: "A notes app.", github: "https://github.com/ada/notes", shot: "List" },
    { name: "secret", status: "dev", description: "Not public yet.", shot: "Soon" },
  ],
  skills: [{ name: "Rust" }, { name: "Zig" }],
};

describe("homeMarkdown", () => {
  const md = homeMarkdown(content, contributions);

  it("starts with the name as the only h1, then the role and the place", () => {
    expect(md.startsWith("# Ada\n\nTool maker in Nanjing, China.\n")).toBe(true);
    expect(md.match(/^# /gm)).toHaveLength(1);
  });

  it("links every project that has a link, names the others, and reports the contribution total", () => {
    expect(md).toContain("- [notes](https://github.com/ada/notes) (beta): A notes app.\n");
    expect(md).toContain("- secret (dev): Not public yet.\n");
    expect(md).toContain(`${contributions.total} in the last 12 months`);
    expect(md).toContain("Rust, Zig");
  });

  it("adds the GitHub link when a project also has a website", () => {
    expect(md).toContain("- [garden](https://ada.dev) (live): This site. · [GitHub](https://github.com/ada/garden)\n");
  });

  it("lists the X and booking links only when they are set", () => {
    expect(md).toContain("- GitHub: https://github.com/ada\n- X: https://x.com/ada\n- Email: ada@example.com\n- Intro call: https://cal.com/ada\n");
    const bare = homeMarkdown({ ...content, profile: { ...content.profile, x: undefined, booking: undefined } }, contributions);
    expect(bare).not.toContain("- X:");
    expect(bare).not.toContain("- Intro call:");
  });

  it("leaves the place out when there is no city", () => {
    const placeless = homeMarkdown({ ...content, profile: { ...content.profile, city: undefined, country: undefined } }, contributions);
    expect(placeless.startsWith("# Ada\n\nTool maker.\n")).toBe(true);
  });

  it("renders the defaults from site.ts", () => {
    expect(homeMarkdown().startsWith(`# ${site.name}\n`)).toBe(true);
  });
});
