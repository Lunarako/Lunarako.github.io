import { describe, expect, it, vi } from "vitest";
import { fetchCalendar, parseCalendar } from "./github";

// The shape GitHub's GraphQL API answers with, trimmed to what the query asks for.
const body = (days: [string, number][]) => ({
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: [{ contributionDays: days.map(([date, contributionCount]) => ({ date, contributionCount })) }],
        },
      },
    },
  },
});

const reply = (status: number, json: unknown) => vi.fn(async () => Response.json(json, { status })) as unknown as typeof fetch;

describe("parseCalendar", () => {
  it("flattens the weeks into days", () => {
    expect(parseCalendar(body([["2026-10-20", 3], ["2026-10-21", 0]]))).toEqual([
      { date: "2026-10-20", count: 3 },
      { date: "2026-10-21", count: 0 },
    ]);
  });

  it("returns null for an unknown user or a body of the wrong shape", () => {
    expect(parseCalendar({ data: { user: null }, errors: [{ message: "Could not resolve to a User" }] })).toBeNull();
    expect(parseCalendar({ message: "Bad credentials" })).toBeNull();
    expect(parseCalendar(body([["20 Oct", 1]]))).toBeNull();
    expect(parseCalendar(body([["2026-10-20", -1]]))).toBeNull();
  });
});

describe("fetchCalendar", () => {
  it("asks the GraphQL API for the login, with the token", async () => {
    const fetcher = reply(200, body([["2026-10-20", 3]]));
    expect(await fetchCalendar({ token: "t0k", login: "franvy", fetcher })).toEqual([{ date: "2026-10-20", count: 3 }]);
    const [url, init] = vi.mocked(fetcher).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/graphql");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("authorization")).toBe("bearer t0k");
    expect(new Headers(init.headers).get("user-agent")).toBeTruthy(); // GitHub refuses a request without one
    expect(JSON.parse(init.body as string).variables).toEqual({ login: "franvy" });
  });

  it("says what went wrong on an HTTP error or a bad body", async () => {
    await expect(fetchCalendar({ token: "bad", login: "franvy", fetcher: reply(401, { message: "Bad credentials" }) })).rejects.toThrow(/401/);
    await expect(fetchCalendar({ token: "t0k", login: "nobody", fetcher: reply(200, { data: { user: null } }) })).rejects.toThrow(
      /unexpected/i,
    );
  });
});
