import { useEffect, useMemo, useRef, useState } from "react";
import { useShaderMood } from "@/components/shaders";
import { chinaDate, daysToFull, litFraction, type LunarDay, lunarMonthOf, type LunarTable, moonRows, nextTerm, PHASE_NAMES } from "@/lib/garden/lunar";
import { phaseOfAge } from "@/lib/garden/moon";
import { PALETTES } from "@/lib/garden/palette";
import { hash } from "@/lib/garden/scene";

// The side panels on a wide screen, for "Luna" in Lunarako: tonight's moon on the left, this lunar month on the
// right. Pointing at a day on the right shows its moon on the left. Drawn on canvas in 5 px and 2 px cells, in the
// banner's palette, so they belong to the same pixel world. Nothing moves but a few stars, a few times a second.

type Theme = "dark" | "light";

const BIG_CELL = 5;
const BIG_SIZE = 36; // cells across: the moon and some sky around it
const BIG_R = 13;
const SMALL_CELL = 2;
const SMALL_R = 4;

/** Stars around the big moon: fixed places, so the sky looks the same on every visit. */
const STARS = Array.from({ length: 40 }, (_, i) => ({ x: Math.floor(hash(i, 1, 7) * BIG_SIZE), y: Math.floor(hash(i, 2, 7) * BIG_SIZE), i }))
  .filter(({ x, y }) => (x - BIG_SIZE / 2) ** 2 + (y - BIG_SIZE / 2) ** 2 > (BIG_R + 3) ** 2)
  .slice(0, 12);

function colors(theme: Theme) {
  const p = PALETTES[theme];
  // By day the dark side would vanish into the page: give it the faint soil tone so the disc still reads.
  return { "#": p.moon, "+": p.moon2, ".": theme === "light" ? p.soil2 : p.moonDark };
}

function paintMoon(canvas: HTMLCanvasElement, rows: string[], theme: Theme, offset = 0) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const map = colors(theme);
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const c = rows[y][x] as keyof typeof map | " ";
      if (c === " ") continue;
      ctx.fillStyle = map[c];
      ctx.fillRect(x + offset, y + offset, 1, 1);
    }
  }
}

function BigMoon({ age, theme, still }: { age: number; theme: Theme; still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rows = moonRows(BIG_R, age);
    const p = PALETTES[theme];
    const draw = (t: number) => {
      ctx.clearRect(0, 0, BIG_SIZE, BIG_SIZE);
      // Stars only at night: in the light theme the star colours are the page itself.
      if (theme === "dark") {
        for (const s of STARS) {
          const level = Math.floor(hash(s.i, Math.floor(t), 3) * 6);
          ctx.fillStyle = level === 0 ? p.star3 : level < 3 ? p.star2 : p.star;
          ctx.fillRect(s.x, s.y, 1, 1);
        }
      }
      paintMoon(canvas, rows, theme, BIG_SIZE / 2 - BIG_R);
    };
    draw(0);
    if (still || theme !== "dark") return;
    // Twinkle: a new star pattern every 0.7 s, and only while the tab is in view.
    let tick = 0;
    const id = window.setInterval(() => {
      if (!document.hidden) draw(++tick);
    }, 700);
    return () => window.clearInterval(id);
  }, [age, theme, still]);
  return (
    <canvas
      ref={ref}
      width={BIG_SIZE}
      height={BIG_SIZE}
      aria-hidden
      className="[image-rendering:pixelated]"
      style={{ width: BIG_SIZE * BIG_CELL, height: BIG_SIZE * BIG_CELL }}
    />
  );
}

function SmallMoon({ age, theme }: { age: number; theme: Theme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const size = SMALL_R * 2 + 1;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, size, size);
    paintMoon(canvas, moonRows(SMALL_R, age), theme);
  }, [age, theme, size]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      aria-hidden
      className="block [image-rendering:pixelated]"
      style={{ width: size * SMALL_CELL, height: size * SMALL_CELL }}
    />
  );
}

/** "11-17" from "2026-11-17". */
const shortDate = (ymd: string) => ymd.slice(5);

function Readout({ day, today }: { day: LunarDay; today: boolean }) {
  const lit = Math.round(litFraction(day.age) * 100);
  const full = daysToFull(day.age);
  return (
    <div className="flex flex-col gap-1 text-[11px] leading-4 tracking-[0.04em]">
      <span className="text-dim">{today ? "tonight" : shortDate(day.date)}</span>
      <span className="text-[13px] leading-5 text-body">
        {day.label} · {day.moonName}
      </span>
      <span className="text-dim">{PHASE_NAMES[phaseOfAge(day.age)]}</span>
      <span className="text-mute tabular-nums">
        lit ≈ {lit}% · {full === 0 ? "full tonight" : `full in ${full} d`}
      </span>
    </div>
  );
}

/** Fixed panels in the empty sides of a wide screen. The table comes from the build (src/lib/lunar-calendar.ts). */
export function LunarGutters({ table, handle }: { table: LunarTable; handle: string }) {
  const mood = useShaderMood();
  const [today, setToday] = useState(() => chinaDate(Date.now()));
  const [picked, setPicked] = useState<string | null>(null);

  // A page left open past midnight moves on to the new day.
  useEffect(() => {
    const id = window.setInterval(() => setToday(chinaDate(Date.now())), 10 * 60_000);
    return () => window.clearInterval(id);
  }, []);

  const month = useMemo(() => lunarMonthOf(table, today), [table, today]);
  const term = useMemo(() => nextTerm(table, today), [table, today]);
  if (!mood || !month) return null;

  const todayDay = month.days.find((d) => d.date === today)!;
  const shown = month.days.find((d) => d.date === picked) ?? todayDay;
  // Both panels hang from the same line, a little above the middle of the screen, so their tops align.
  const side = "fixed top-[max(72px,calc(50%-200px))] hidden w-[180px] flex-col gap-4 font-mono min-[1240px]:flex";

  return (
    <>
      {/* The fade goes on an inner box: an animated transform on an ancestor would pin a fixed panel to that ancestor. */}
      <aside className={side} style={{ right: "calc(50% + 345px + 56px)" }} aria-label="The moon">
        <div className="shader-fade flex flex-col gap-4">
          <BigMoon age={shown.age} theme={mood.theme} still={mood.still} />
          <div className="flex flex-col gap-3 border-t border-dashed border-edge pt-3">
            <span className="text-[12px] leading-4 tracking-[0.32em] text-ink">{handle.toUpperCase()}</span>
            <Readout day={shown} today={shown.date === today} />
          </div>
        </div>
      </aside>

      <aside className={side} style={{ left: "calc(50% + 345px + 56px)" }} aria-label="This lunar month">
        <div className="shader-fade flex flex-col gap-4">
        <div className="flex items-baseline justify-between text-[11px] leading-4 tracking-[0.08em] text-mute">
          <span>LUNAR MONTH</span>
          <span className="text-[13px] tracking-normal text-body">{month.month.name}</span>
        </div>
        <ul className="grid grid-cols-6 gap-[3px]" onPointerLeave={() => setPicked(null)}>
          {month.days.map((d) => (
            <li key={d.date}>
              <button
                type="button"
                aria-label={`${d.label}, ${d.moonName}, ${PHASE_NAMES[phaseOfAge(d.age)]}`}
                aria-current={d.date === today ? "date" : undefined}
                title={`${d.label} · ${d.moonName}`}
                onPointerEnter={() => setPicked(d.date)}
                onFocus={() => setPicked(d.date)}
                onBlur={() => setPicked(null)}
                className={`flex size-[27px] items-center justify-center border ${
                  d.date === today ? "border-accent" : d.date === shown.date ? "border-edge" : "border-transparent"
                }`}
              >
                <SmallMoon age={d.age} theme={mood.theme} />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1 border-t border-dashed border-edge pt-3 text-[11px] leading-4 tracking-[0.04em]">
          <span className="text-dim tabular-nums">
            day {todayDay.day} of {month.month.days}
          </span>
          {term && (
            <span className="text-mute tabular-nums">
              next term · <span className="text-body">{term.name}</span> {shortDate(term.date)}
            </span>
          )}
        </div>
        </div>
      </aside>
    </>
  );
}
