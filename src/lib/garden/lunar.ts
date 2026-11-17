import { moonAge, phaseOfAge, SYNODIC } from "./moon";

// The moon in the wide-screen side panels: a large pixel moon with a continuous terminator, and the days of
// this lunar month. Pure, so it runs in the browser and in the tests. The moon's age comes from the mean
// synodic month (moon.ts), the same source as the banner's moon, so it can be up to about a day off: the page
// shows the lit share with "≈". The lunar calendar itself (month names, lengths, solar terms) is exact; it is
// computed at build time (src/lib/lunar-calendar.ts) and passed in.

/** Share of the disc that is lit, 0 (new) to 1 (full). */
export function litFraction(age: number): number {
  return (1 - Math.cos((2 * Math.PI * age) / SYNODIC)) / 2;
}

/** Days until the next full moon: 0 on the night of the full moon. */
export function daysToFull(age: number): number {
  const d = (SYNODIC / 2 - age + SYNODIC) % SYNODIC;
  return d > SYNODIC - 0.5 ? 0 : Math.round(d);
}

/**
 * True when the point (x, y) of the unit disc is lit at `age`. Northern hemisphere: the right side lights
 * first while the moon waxes, and the left side stays lit last while it wanes.
 */
export function isLit(x: number, y: number, age: number): boolean {
  const edge = Math.cos((2 * Math.PI * age) / SYNODIC) * Math.sqrt(Math.max(0, 1 - y * y));
  return age < SYNODIC / 2 ? x > edge : x < -edge;
}

/** The large maria, as circles on the unit disc (x right, y down). A sketch of the near side, not a map. */
const MARIA: [x: number, y: number, r: number][] = [
  [-0.28, -0.36, 0.24], // Imbrium
  [0.12, -0.3, 0.14], // Serenitatis
  [0.3, -0.04, 0.17], // Tranquillitatis
  [0.62, -0.2, 0.1], // Crisium
  [0.5, 0.24, 0.11], // Fecunditatis
  [-0.14, 0.42, 0.14], // Nubium
  [-0.58, 0.02, 0.26], // Procellarum
];

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * The lit share of one cell: the part of its row span [x - h, x + h] that is lit, out of the part inside the disc.
 * Measured along the row, which is the direction the terminator moves.
 */
function cellLight(x: number, y: number, h: number, age: number): number {
  const w = Math.sqrt(Math.max(0, 1 - y * y));
  const k = Math.cos((2 * Math.PI * age) / SYNODIC);
  const [lo, hi] = age < SYNODIC / 2 ? [k * w, w] : [-w, -k * w];
  const inside = Math.min(w, x + h) - Math.max(-w, x - h);
  if (inside <= 0) return 0;
  return Math.max(0, Math.min(hi, x + h) - Math.max(lo, x - h)) / inside;
}

/**
 * The moon as rows of cells, 2r + 1 wide: "#" lit, "+" the maria and the dithered terminator,
 * "." the dark side (earthshine), " " sky. A small moon has no maria: at a few cells they read as a grey disc.
 */
export function moonRows(r: number, age: number, maria = r >= 8): string[] {
  const rows: string[] = [];
  const h = 0.5 / (r + 0.5);
  for (let j = -r; j <= r; j++) {
    let row = "";
    for (let i = -r; i <= r; i++) {
      if (i * i + j * j > (r + 0.35) ** 2) {
        row += " ";
        continue;
      }
      const x = i / (r + 0.5);
      const y = j / (r + 0.5);
      // A cell the terminator crosses is dithered: the more of it is lit, the more likely it is drawn lit.
      const light = cellLight(x, y, h, age);
      let lit = light >= 0.7;
      let soft = false;
      if (light > 0.3 && light < 0.7) {
        lit = BAYER[(j + 64) & 3][(i + 64) & 3] / 16 < (light - 0.3) / 0.4;
        soft = lit;
      }
      if (!lit) row += ".";
      else if (soft || (maria && MARIA.some(([mx, my, mr]) => (x - mx) ** 2 + (y - my) ** 2 < mr * mr))) row += "+";
      else row += "#";
    }
    rows.push(row);
  }
  return rows;
}

/** Names of the eight phases, for the readout. */
export const PHASE_NAMES: Record<ReturnType<typeof phaseOfAge>, string> = {
  new: "new moon",
  waxingCrescent: "waxing crescent",
  firstQuarter: "first quarter",
  waxingGibbous: "waxing gibbous",
  full: "full moon",
  waningGibbous: "waning gibbous",
  lastQuarter: "last quarter",
  waningCrescent: "waning crescent",
};

// ---------- the lunar calendar (computed at build time, read in the browser) ----------

export type LunarMonth = { start: string; name: string; days: number };
export type LunarTable = {
  /** Lunar months in date order. `start` is the China date of day 1. */
  months: LunarMonth[];
  /** The 30 day names, 初一 to 三十. */
  dayNames: string[];
  /** The traditional name of the moon on each lunar day, 朔 to 晦. */
  moonNames: string[];
  /** Solar terms (节气) in date order. */
  terms: { name: string; date: string }[];
};

const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" in China. China has one zone and no daylight saving, so a fixed +8 h is exact. */
export function chinaDate(t: Date | number): string {
  return new Date(+t + 8 * 3600_000).toISOString().slice(0, 10);
}

const addDays = (ymd: string, n: number) => chinaDate(Date.parse(`${ymd}T12:00:00+08:00`) + n * DAY_MS);
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY_MS);

export type LunarDay = {
  date: string;
  /** 1 to 30. */
  day: number;
  /** "十月初九". */
  label: string;
  /** "九夜". */
  moonName: string;
  /** The moon's age at 21:00 China time that evening. */
  age: number;
};

/** The lunar month that `date` falls in, with each of its days. Null when the table does not reach that date. */
export function lunarMonthOf(table: LunarTable, date: string): { month: LunarMonth; days: LunarDay[] } | null {
  const month = table.months.find((m) => date >= m.start && daysBetween(m.start, date) < m.days);
  if (!month) return null;
  const days = Array.from({ length: month.days }, (_, i) => {
    const d = addDays(month.start, i);
    return {
      date: d,
      day: i + 1,
      label: `${month.name}${table.dayNames[i]}`,
      moonName: table.moonNames[i],
      age: moonAge(new Date(`${d}T12:00:00+08:00`), "Asia/Shanghai"),
    };
  });
  return { month, days };
}

/** The first solar term on or after `date`. */
export function nextTerm(table: LunarTable, date: string) {
  return table.terms.find((t) => t.date >= date) ?? null;
}
