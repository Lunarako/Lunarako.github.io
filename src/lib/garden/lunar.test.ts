import { describe, expect, it } from "vitest";
import { lunarTable } from "../lunar-calendar";
import { chinaDate, daysToFull, isLit, litFraction, lunarMonthOf, moonRows, nextTerm } from "./lunar";
import { SYNODIC } from "./moon";

describe("litFraction", () => {
  it("is 0 at new moon, 1 at full moon and half at the quarters", () => {
    expect(litFraction(0)).toBeCloseTo(0);
    expect(litFraction(SYNODIC / 2)).toBeCloseTo(1);
    expect(litFraction(SYNODIC / 4)).toBeCloseTo(0.5);
    expect(litFraction((3 * SYNODIC) / 4)).toBeCloseTo(0.5);
  });
});

describe("daysToFull", () => {
  it("counts whole days to the next full moon, 0 on the night itself", () => {
    expect(daysToFull(SYNODIC / 2)).toBe(0);
    expect(daysToFull(SYNODIC / 2 - 5)).toBe(5);
    expect(daysToFull(SYNODIC / 2 + 1)).toBe(Math.round(SYNODIC - 1));
  });
});

describe("isLit", () => {
  it("lights the right half at first quarter and the left half at last quarter", () => {
    expect(isLit(0.5, 0, SYNODIC / 4)).toBe(true);
    expect(isLit(-0.5, 0, SYNODIC / 4)).toBe(false);
    expect(isLit(-0.5, 0, (3 * SYNODIC) / 4)).toBe(true);
    expect(isLit(0.5, 0, (3 * SYNODIC) / 4)).toBe(false);
  });

  it("lights nothing at new moon and everything at full moon", () => {
    for (const [x, y] of [[0, 0], [0.9, 0], [-0.9, 0.2], [0.3, -0.8]]) {
      expect(isLit(x, y, 0.01)).toBe(false);
      expect(isLit(x, y, SYNODIC / 2)).toBe(true);
    }
  });
});

describe("moonRows", () => {
  const count = (rows: string[], c: string) => rows.join("").split(c).length - 1;

  it("draws a round disc 2r + 1 cells wide", () => {
    const rows = moonRows(10, SYNODIC / 2);
    expect(rows).toHaveLength(21);
    expect(rows.every((r) => r.length === 21)).toBe(true);
    expect(rows[10].trim()).toHaveLength(21); // the middle row spans the disc
    expect(rows[0].trim().length).toBeLessThan(11); // the top row is short
  });

  it("is all dark at new moon, and lit with grey maria at full moon", () => {
    expect(count(moonRows(10, 0.01), "#") + count(moonRows(10, 0.01), "+")).toBe(0);
    const full = moonRows(10, SYNODIC / 2);
    expect(count(full, ".")).toBe(0);
    expect(count(full, "+")).toBeGreaterThan(20);
  });

  it("leaves the maria off a small moon, so a full one reads white", () => {
    expect(count(moonRows(4, SYNODIC / 2), "+")).toBe(0);
    expect(count(moonRows(4, SYNODIC / 2), "#")).toBeGreaterThan(40);
  });

  it("lights more of the disc as the moon waxes", () => {
    const lit = (age: number) => {
      const rows = moonRows(12, age);
      return count(rows, "#") + count(rows, "+");
    };
    expect(lit(3)).toBeLessThan(lit(7));
    expect(lit(7)).toBeLessThan(lit(11));
    expect(lit(11)).toBeLessThan(lit(14.5));
  });
});

describe("chinaDate", () => {
  it("gives the date in China, which is UTC+8", () => {
    expect(chinaDate(Date.parse("2026-11-17T15:59:00Z"))).toBe("2026-11-17");
    expect(chinaDate(Date.parse("2026-11-17T16:00:00Z"))).toBe("2026-11-18");
  });
});

describe("the lunar month of a date", () => {
  // Built from the calendar library, as at build time. The expected names come from lunar-typescript 1.8.6.
  const table = lunarTable(new Date("2026-11-17T04:00:00Z"), 60);

  it("finds the month, its length and every day", () => {
    const found = lunarMonthOf(table, "2026-11-17")!;
    expect(found.month).toEqual({ start: "2026-11-09", name: "十月", days: 30 });
    expect(found.days).toHaveLength(30);
    const today = found.days[8];
    expect(today).toMatchObject({ date: "2026-11-17", day: 9, label: "十月初九", moonName: "九夜" });
    expect(found.days[0]).toMatchObject({ date: "2026-11-09", label: "十月初一", moonName: "朔" });
    expect(found.days[29].date).toBe("2026-12-08");
  });

  it("starts the next month on its day 1", () => {
    expect(lunarMonthOf(table, "2026-12-09")!.month).toMatchObject({ start: "2026-12-09", name: "冬月" });
  });

  it("gives the moon's age for each day, growing by one a day", () => {
    const { days } = lunarMonthOf(table, "2026-11-17")!;
    expect(days[9].age - days[8].age).toBeCloseTo(1);
  });

  it("finds the next solar term on or after a date", () => {
    expect(nextTerm(table, "2026-11-17")).toEqual({ name: "小雪", date: "2026-11-22" });
    expect(nextTerm(table, "2026-11-22")).toEqual({ name: "小雪", date: "2026-11-22" });
    expect(nextTerm(table, "2026-11-23")?.name).toBe("大雪");
  });

  it("answers null outside the table", () => {
    expect(lunarMonthOf(table, "2030-01-01")).toBeNull();
  });
});
