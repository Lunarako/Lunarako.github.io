import { LunarMonth, Solar } from "lunar-typescript";
import { chinaDate, type LunarTable } from "./garden/lunar";

// The Chinese lunar calendar for the side panels, computed at build time so the browser never loads the
// calendar library. The site builds again every day; the table covers a few months either side of the build,
// so a missed build or two changes nothing.

const DAY_MS = 86_400_000;

const solarOf = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return Solar.fromYmd(y, m, d);
};

/** Lunar months, day names, moon names and solar terms from `days` days before `from` to `days` days after it. */
export function lunarTable(from: Date, days: number): LunarTable {
  const start = from.getTime() - days * DAY_MS;
  const months: LunarTable["months"] = [];
  const terms: LunarTable["terms"] = [];
  const dayNames: string[] = [];
  const moonNames: string[] = [];

  for (let i = 0; i <= days * 2; i++) {
    const date = chinaDate(start + i * DAY_MS);
    const lunar = solarOf(date).getLunar();
    const day = lunar.getDay();
    // Day 1 opens a month. The first date of the range opens one too, so the month it falls in is complete.
    if (day === 1 || i === 0) {
      const first = chinaDate(start + (i - (day - 1)) * DAY_MS);
      months.push({
        start: first,
        name: `${lunar.getMonthInChinese()}月`,
        days: LunarMonth.fromYm(lunar.getYear(), lunar.getMonth())!.getDayCount(),
      });
    }
    // Day names and moon names depend only on the day of the month: keep the first 30 met.
    dayNames[day - 1] ??= lunar.getDayInChinese();
    moonNames[day - 1] ??= lunar.getYueXiang();
    const term = lunar.getJieQi();
    if (term) terms.push({ name: term, date });
  }
  if (dayNames.length !== 30 || dayNames.some((n) => !n)) throw new Error("The lunar table needs a range with a 30-day month.");
  return { months, dayNames, moonNames, terms };
}
