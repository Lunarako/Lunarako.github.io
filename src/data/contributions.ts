import { type CalendarDay, fetchCalendar } from "@/lib/github";
import { type ContributionYear, yearFromDays } from "@/lib/contributions";
import { githubLogin, sampleContributions } from "@/lib/site";

// One fetch per build: / and /index.md both ask, and they get the same days.
let pending: Promise<CalendarDay[]> | null = null;

function loadDays(): Promise<CalendarDay[]> {
  // import.meta.env has the values from a local .env file; process.env has the ones the deploy workflow sets.
  const token =
    import.meta.env.CONTRIBUTIONS_TOKEN || import.meta.env.GITHUB_TOKEN || process.env.CONTRIBUTIONS_TOKEN || process.env.GITHUB_TOKEN || "";
  if (!token) {
    console.warn("No GITHUB_TOKEN: the contribution calendar is empty. The deploy workflow sets it for you.");
    return Promise.resolve([]);
  }
  return fetchCalendar({ token, login: githubLogin, timeoutMs: 15_000 }).catch((error) => {
    console.warn("Could not load the GitHub contribution calendar. It is empty in this build.", error);
    return [];
  });
}

/**
 * The contribution calendar for / and /index.md, read from GitHub at build time.
 * The deploy workflow builds the site again every day, so the calendar stays current.
 * Without a token, or when GitHub fails, the calendar is empty and ends today in China time (UTC+8).
 */
export async function homeContributions(): Promise<ContributionYear> {
  if (import.meta.env.E2E_FIXTURES) return sampleContributions;
  pending ??= loadDays();
  return yearFromDays(await pending, new Date(Date.now() + 8 * 3600_000));
}
