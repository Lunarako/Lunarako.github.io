import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PX, POSES, spriteSvg } from "@/lib/meiqiu";
import { mountMeiqiu } from "./meiqiu-engine";

// Drawn at build time so the cat is already asleep before the island wakes up.
const SLEEPING = spriteSvg([POSES.sleep.frames[0]]);
const fmt = (n: number | undefined) => (n === undefined ? "--" : n.toLocaleString("en-US"));

// A static site has no server to keep a total, so each visitor's pets are kept in their own browser.
const PETS_KEY = "meiqiu-pets";
function readPets(): number {
  try {
    const n = Number(localStorage.getItem(PETS_KEY));
    return Number.isSafeInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}
function savePets(n: number) {
  try {
    localStorage.setItem(PETS_KEY, String(n));
  } catch {
    // Private mode or storage full: the count still shows on this page.
  }
}

type Props = { year: number; owner: string; repo: string };

/** The footer: Meiqiu and its yarn ball, then the copyright, your pets and the source. */
export function Meiqiu({ year, owner, repo }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const heart = useRef<HTMLSpanElement>(null);
  const [pets, setPets] = useState<number>();

  useEffect(() => {
    setPets(readPets());
    const area = root.current;
    const s = stage.current;
    if (!area || !s) return;
    const onPet = () => {
      setPets((n) => {
        const next = (n ?? readPets()) + 1;
        savePets(next);
        return next;
      });
      const h = heart.current;
      if (h) {
        h.classList.remove("mq-beat");
        void h.offsetWidth;
        h.classList.add("mq-beat");
      }
    };
    return mountMeiqiu({ area, stage: s, onPet });
  }, []);

  return (
    <div ref={root} className="mq">
      <div ref={stage} className="mq-stage" data-testid="meiqiu-stage" data-live>
        <span
          data-ssr
          className="mq-ssr"
          style={{ left: 60 - (SLEEPING.w * PX) / 2 }}
          dangerouslySetInnerHTML={{ __html: SLEEPING.html }}
        />
      </div>
      <div className="mq-foot">
        <span>
          © {year} {owner}
        </span>
        <span className="mq-totals tabular-nums">
          <span className="mq-total" title="Times you petted Meiqiu">
            <span ref={heart} className="mq-heart">
              <Heart size={14} aria-hidden="true" />
            </span>
            <span className="sr-only">Times you petted Meiqiu</span>
            <span data-testid="meiqiu-pets">{fmt(pets)}</span>
          </span>
        </span>
        <a href={repo} className="mq-src" aria-label="Source on GitHub" title="Source on GitHub">
          {/* Lucide 1.x dropped brand icons: the last Lucide drawing (0.577), as in brand-icon.astro. */}
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        </a>
      </div>
    </div>
  );
}
