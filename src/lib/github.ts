import { z } from "astro/zod";

// The GitHub contribution calendar. GraphQL is the only API that has it, and GraphQL needs a token.
// The deploy workflow passes the token that GitHub Actions makes for each run; it sees public contributions.
// A personal token of your own (secret CONTRIBUTIONS_TOKEN) also counts your private contributions.

export type CalendarDay = { date: string; count: number };

const QUERY = `query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

const GraphQLBody = z.object({
  data: z.object({
    user: z.object({
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), contributionCount: z.number().int().min(0) }),
              ),
            }),
          ),
        }),
      }),
    }),
  }),
});

/** The days in the API response, or null when it does not have the expected shape. */
export function parseCalendar(body: unknown): CalendarDay[] | null {
  const parsed = GraphQLBody.safeParse(body);
  if (!parsed.success) return null;
  return parsed.data.data.user.contributionsCollection.contributionCalendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount })),
  );
}

interface FetchOptions {
  token: string;
  login: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

/** The last year of days for `login`. Throws with the reason when GitHub does not give them. */
export async function fetchCalendar({ token, login, fetcher = fetch, timeoutMs = 5000 }: FetchOptions): Promise<CalendarDay[]> {
  const res = await fetcher("https://api.github.com/graphql", {
    method: "POST",
    headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "glyph-pages" },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status} ${res.statusText}`.trim());
  const days = parseCalendar(await res.json());
  if (!days) throw new Error(`GitHub sent an unexpected body for ${login}`);
  return days;
}
