import { CompanionWeatherScene } from "./CompanionWeatherScene";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { useLocal } from "../useLocal";
import {
  parseWeather,
  weatherKind,
  weatherLabels,
  type WeatherData,
} from "../domain/weather";
import "../today.css";
type Place = { name: string; lat: number; lon: number };
export function WeatherCard({
  compact = false,
  companion,
}: {
  compact?: boolean;
  companion?: ReactNode;
}) {
  const [opened, setOpened] = useState(false);
  const weatherDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (opened) weatherDialog.current?.showModal();
    else weatherDialog.current?.close();
  }, [opened]);
  const [place, setPlace] = useLocal<Place>("dayframe-weather-place", {
    name: "Київ",
    lat: 50.45,
    lon: 30.52,
  });
  const [weather, setWeather] = useState<WeatherData | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [results, setResults] = useState<Place[]>([]),
    [editing, setEditing] = useState(false),
    [attempt, setAttempt] = useState(0),
    [locating, setLocating] = useState(false),
    [finding, setFinding] = useState(false);
  const searchController = useRef<AbortController | null>(null);
  useEffect(() => {
    setWeather(null);
  }, [place.lat, place.lon]);
  useEffect(() => {
    let controller: AbortController | null = null,
      alive = true;
    const load = async () => {
      if (document.hidden) return;
      controller?.abort();
      controller = new AbortController();
      const request = controller;
      const timeout = setTimeout(() => request.abort(), 10000);
      setBusy(true);
      try {
        const url = new URL("https://api.open-meteo.com/v1/forecast");
        url.search = new URLSearchParams({
          latitude: String(place.lat),
          longitude: String(place.lon),
          current: "temperature_2m,apparent_temperature,weather_code,is_day",
          timezone: "auto",
        }).toString();
        const response = await fetch(url, { signal: request.signal });
        if (!response.ok) throw Error();
        const parsed = parseWeather(await response.json());
        if (alive && !request.signal.aborted) {
          setWeather(parsed);
          setError("");
        }
      } catch {
        if (alive && controller === request)
          setError("Не вдалося оновити погоду. Спробуй ще раз.");
      } finally {
        clearTimeout(timeout);
        if (alive && controller === request) setBusy(false);
      }
    };
    void load();
    const timer = setInterval(() => void load(), 15 * 60 * 1000);
    const visible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive = false;
      controller?.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [place.lat, place.lon, attempt]);
  useEffect(() => () => searchController.current?.abort(), []);
  const kind = weather ? weatherKind(weather.code) : "cloud";
  const scene = (
    <div
      className={`weather-scene weather-${kind} ${weather && !weather.isDay ? "weather-night" : ""}`}
      aria-hidden="true"
      data-weather={weather ? kind : "unavailable"}
    >
      {weather && (
        <svg viewBox="0 0 180 110">
          <defs>
            <linearGradient id="weather-cloud" x2="0" y2="1">
              <stop stopColor="#fffef4" />
              <stop offset="1" stopColor="#c5d4e5" />
            </linearGradient>
            <radialGradient id="weather-sun">
              <stop stopColor="#fff5ba" />
              <stop offset="1" stopColor="#f2bf66" />
            </radialGradient>
          </defs>
          {(kind === "sun" || kind === "cloud") &&
            (weather.isDay ? (
              <g className="weather-sun-shape">
                <circle cx="112" cy="43" r="26" fill="url(#weather-sun)" />
                {Array.from({ length: 8 }, (_, i) => (
                  <path
                    key={i}
                    d="M112 7v-5"
                    stroke="#e9be79"
                    strokeWidth="3"
                    strokeLinecap="round"
                    transform={`rotate(${i * 45} 112 43)`}
                  />
                ))}
              </g>
            ) : (
              <path
                d="M128 18a28 28 0 1 0 11 43 24 24 0 0 1-11-43"
                fill="#f8e7ac"
              />
            ))}
          {kind !== "sun" && (
            <path
              className="weather-cloud-shape"
              d="M46 73C22 73 22 44 43 42C44 16 81 12 92 35C116 19 145 38 140 57C160 78 125 85 113 80H49Z"
              fill="url(#weather-cloud)"
              stroke="#ffffffaa"
              strokeWidth="2"
            />
          )}
          {(kind === "rain" || kind === "storm") &&
            Array.from({ length: 8 }, (_, i) => (
              <path
                className="weather-drop"
                key={i}
                d={`M${43 + i * 12} 76l-4 9`}
                stroke="#81b9d7"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ animationDelay: `${i * 0.14}s` }}
              />
            ))}
          {kind === "snow" &&
            Array.from({ length: 7 }, (_, i) => (
              <g
                className="weather-flake"
                key={i}
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                <path
                  d={`M${40 + i * 15} 81v10m-4-5h8m-7-3 6 6m0-6-6 6`}
                  stroke="#8fb5ca"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </g>
            ))}
          {kind === "storm" && (
            <path
              className="weather-lightning"
              d="M99 68l-17 24h13l-4 16 24-28h-15l8-12"
              fill="#f7d17c"
            />
          )}
          {kind === "fog" && (
            <g stroke="#d2e2df" strokeWidth="5" strokeLinecap="round">
              <path d="M25 85h125" />
              <path d="M40 97h104" />
            </g>
          )}
        </svg>
      )}
    </div>
  );
  const fullCard = (
    <article
      className={`today-card weather-card weather-surface-${weather ? kind : "unavailable"}`}
      data-night={weather ? !weather.isDay : undefined}
      aria-label="Погода"
      id="planner-weather"
    >
      {weather && (
        <div className="weather-atmosphere" aria-hidden="true">
          <svg
            className="weather-landscape"
            viewBox="0 0 800 360"
            preserveAspectRatio="xMidYMid slice"
          >
            {(kind === "sun" || kind === "cloud") && (
              <g className="landscape-orb">
                <circle
                  cx="650"
                  cy="88"
                  r="86"
                  fill={weather.isDay ? "#ffd786" : "#dce9ff"}
                  opacity=".22"
                />
                <circle
                  cx="650"
                  cy="88"
                  r="58"
                  fill={weather.isDay ? "#ffdf9a" : "#e8f0ff"}
                />
                {!weather.isDay && (
                  <circle cx="674" cy="65" r="51" fill="#728ba5" />
                )}
              </g>
            )}
            {kind !== "sun" && (
              <>
                <g
                  className="landscape-cloud landscape-cloud-far"
                  fill="#c4d8e9"
                >
                  <path d="M330 168c-45 0-51-60-7-67 2-65 91-82 121-30 40-40 107-16 111 34 56-10 72 63 20 68Z" />
                </g>
                <g
                  className="landscape-cloud landscape-cloud-near"
                  fill="#edf5fc"
                >
                  <path d="M440 225c-53 0-63-64-13-78 3-67 94-91 130-37 45-44 119-15 119 39 61-4 70 76 12 80Z" />
                </g>
              </>
            )}
            <path
              className="landscape-hill"
              d="M0 342Q150 255 340 324T800 290V360H0Z"
              fill="#80adbc"
              opacity=".15"
            />
            <path
              className="landscape-hill"
              d="M0 360Q240 288 470 340T800 321V360Z"
              fill="#719bb3"
              opacity=".16"
            />
          </svg>
          {Array.from({ length: kind === "snow" ? 18 : 14 }, (_, i) => (
            <span
              key={i}
              style={
                {
                  "--wx": `${(i * 37) % 100}%`,
                  "--wd": `${(i % 7) * 0.37}s`,
                  "--ws": `${3 + (i % 4)}px`,
                } as import("react").CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div className="weather-top">
        <h2>Погода сьогодні</h2>
        <button
          aria-label="Оновити погоду"
          disabled={busy}
          onClick={() => setAttempt((n) => n + 1)}
        >
          <RefreshCw size={15} />
        </button>
      </div>
      <div className="weather-main">
        {scene}
        <div>
          <strong className="weather-temp">
            {weather ? `${Math.round(weather.temperature)}°` : "—"}
          </strong>
          <p>
            {weather
              ? weather.isDay
                ? weatherLabels[kind]
                : kind === "sun"
                  ? "Ясна ніч"
                  : weatherLabels[kind]
              : busy
                ? "Оновлюємо…"
                : "Немає даних"}
          </p>
          {weather && (
            <small>Відчувається як {Math.round(weather.feels)}°</small>
          )}
        </div>
      </div>
      <button className="weather-place" onClick={() => setEditing((v) => !v)}>
        <MapPin size={14} />
        {place.name}
      </button>
      <small className="weather-source">
        Open-Meteo
        {weather
          ? ` · ${new Date(weather.at).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`
          : ""}
        {error && weather ? " · попередні дані" : ""}
      </small>
      {error && <p role="status">{error}</p>}
      {editing && (
        <div className="weather-location">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!search.trim()) return;
              searchController.current?.abort();
              const controller = new AbortController();
              searchController.current = controller;
              setFinding(true);
              setResults([]);
              const timer = setTimeout(() => controller.abort(), 10000);
              try {
                const response = await fetch(
                  `https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: search.trim(), count: "5", language: "uk", format: "json" })}`,
                  { signal: controller.signal },
                );
                if (!response.ok) throw Error();
                const value = await response.json();
                if (searchController.current !== controller) return;
                const places = (
                  Array.isArray(value.results) ? value.results : []
                )
                  .filter(
                    (r: {
                      latitude: number;
                      longitude: number;
                      name: string;
                    }) =>
                      Number.isFinite(r.latitude) &&
                      Number.isFinite(r.longitude) &&
                      typeof r.name === "string",
                  )
                  .map(
                    (r: {
                      name: string;
                      country?: string;
                      latitude: number;
                      longitude: number;
                    }) => ({
                      name: [r.name, r.country].filter(Boolean).join(", "),
                      lat: r.latitude,
                      lon: r.longitude,
                    }),
                  );
                setResults(places);
                setError(
                  places.length ? "" : "Місто не знайдено. Уточни назву.",
                );
              } catch {
                if (searchController.current === controller)
                  setError("Не вдалося знайти місто.");
              } finally {
                clearTimeout(timer);
                if (searchController.current === controller) setFinding(false);
              }
            }}
          >
            <label>
              Місто
              <input
                maxLength={100}
                required
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Назва міста"
              />
            </label>
            <button disabled={finding}>
              {finding ? "Шукаємо…" : "Знайти місто"}
            </button>
          </form>
          {results.map((r) => (
            <button
              key={`${r.lat}:${r.lon}`}
              onClick={() => {
                setPlace(r);
                setEditing(false);
                setResults([]);
                setError("");
              }}
            >
              {r.name}
            </button>
          ))}
          <button
            disabled={locating}
            onClick={() => {
              if (!navigator.geolocation) {
                setError("Геолокація недоступна. Введи місто.");
                return;
              }
              setLocating(true);
              navigator.geolocation.getCurrentPosition(
                (p) => {
                  setPlace({
                    name: "Моя геолокація",
                    lat: p.coords.latitude,
                    lon: p.coords.longitude,
                  });
                  setLocating(false);
                  setEditing(false);
                  setError("");
                },
                () => {
                  setLocating(false);
                  setError("Геолокацію не надано. Місто можна ввести вручну.");
                },
                { timeout: 10000, maximumAge: 300000 },
              );
            }}
          >
            {locating ? "Визначаємо…" : "Визначити моє місце"}
          </button>
        </div>
      )}
    </article>
  );
  if (!compact) return fullCard;
  return (
    <section
      className="weather-buddy"
      aria-label="Погода й помічник"
      data-weather={weather ? kind : "unavailable"}
      data-night={weather ? !weather.isDay : undefined}
    >
      {weather && <CompanionWeatherScene kind={kind} isDay={weather.isDay} />}
      <div className="weather-buddy-stage">{companion}</div>
      <button
        className="weather-buddy-summary"
        aria-label="Відкрити погоду"
        aria-haspopup="dialog"
        onClick={() => setOpened(true)}
      >
        <strong>{weather ? `${Math.round(weather.temperature)}°` : "—"}</strong>
        <span>
          {weather
            ? weather.isDay
              ? weatherLabels[kind]
              : kind === "sun"
                ? "Ясна ніч"
                : weatherLabels[kind]
            : busy
              ? "Оновлюємо…"
              : "Немає даних"}
        </span>
        <small>
          {error
            ? weather
              ? "Попередні дані"
              : "Погода недоступна"
            : place.name}
        </small>
      </button>
      <dialog
        ref={weatherDialog}
        className="weather-buddy-dialog"
        aria-label="Погода і місто"
        onCancel={() => setOpened(false)}
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpened(false);
        }}
      >
        <button
          className="weather-buddy-close"
          aria-label="Закрити погоду"
          onClick={() => setOpened(false)}
        >
          ×
        </button>
        {opened && fullCard}
      </dialog>
    </section>
  );
}
