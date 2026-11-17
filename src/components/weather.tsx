import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, type LucideIcon, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { isStale, parseWeather, type Place, type Weather, type WeatherKind, weatherUrl } from "@/lib/weather";

/** Open-Meteo updates every 15 minutes. */
const REFRESH_MS = 15 * 60_000;

const ICONS: Record<Exclude<WeatherKind, "clear">, LucideIcon> = {
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  thunder: CloudLightning,
  unknown: Cloud,
};

async function load(place: Place): Promise<Weather | null> {
  try {
    const res = await fetch(weatherUrl(place), { signal: AbortSignal.timeout(8000) });
    return res.ok ? parseWeather(await res.json(), place.city) : null;
  } catch {
    return null;
  }
}

/**
 * The weather at `place`, asked of Open-Meteo by the browser: loaded after the page, then every 15 minutes
 * while the tab is visible. Null when there is no place, until it loads, when it fails, or when the reading is
 * over two hours old.
 */
export function useWeather(place: Place | undefined): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    if (!place) return; // no place set: no live weather
    let alive = true;
    let last = 0;
    const refresh = async () => {
      if (document.hidden) return;
      last = Date.now();
      const next = await load(place);
      if (alive) setWeather(next);
    };
    // Back on a tab that missed a refresh: catch up at once.
    const onShow = () => {
      if (!document.hidden && Date.now() - last >= REFRESH_MS) void refresh();
    };
    void refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", onShow);
    return () => {
      alive = false;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [place?.latitude, place?.longitude, place?.city]);

  return weather && !isStale(weather.observedAt, new Date()) ? weather : null;
}

/** The banner's weather readout (Paper: Banner · overlay → Weather). No reading, no readout: the banner never shows an error. */
export function WeatherReadout({ weather }: { weather: Weather | null }) {
  if (!weather) return null;
  const Icon = weather.kind === "clear" ? (weather.isDay ? Sun : Moon) : ICONS[weather.kind];
  const reading = `${weather.temperature}°C`;
  return (
    // data-live: the layout screenshot masks it, as the reading changes.
    // Centred on the soil under the grass line, by the capitals, like the theme name.
    // right: less one letter-spacing, the gap after the last letter, so the glyphs end as far in as the theme name starts.
    <p
      data-testid="weather"
      data-live
      role="img"
      aria-label={`Weather in ${weather.city}: ${weather.condition}, ${reading}`}
      title={`${weather.condition} · updated ${weather.observedAt.slice(11, 16)}`}
      className="absolute top-[calc(100%*192/220)] right-[calc(7px-0.08em)] bottom-0 flex items-center gap-1.5 text-[11px] leading-[14px] tracking-[0.08em] text-dim max-sm:right-[calc(3px-0.06em)] max-sm:gap-1 max-sm:text-[9px] max-sm:leading-[10px] max-sm:tracking-[0.06em]"
    >
      <Icon data-kind={weather.kind} aria-hidden className="size-[11px] shrink-0 text-accent max-sm:size-[9px]" />
      <span className="[text-box:trim-both_cap_alphabetic]">{reading}</span>
    </p>
  );
}
