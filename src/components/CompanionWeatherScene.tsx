import { useId } from "react";
import type { WeatherKind } from "../domain/weather";
/** A background window, separate from the character and the readable forecast. */
export function CompanionWeatherScene({
  kind,
  isDay,
}: {
  kind: WeatherKind;
  isDay: boolean;
}) {
  const cloudId = useId().replace(/:/g, "");
  return (
    <div
      className="companion-weather-scene"
      data-kind={kind}
      data-night={!isDay}
      aria-hidden="true"
    >
      <svg viewBox="0 0 320 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={cloudId} x2="0" y2="1">
            <stop stopColor="var(--weather-cloud-light)" />
            <stop offset="1" stopColor="var(--weather-cloud-paint)" />
          </linearGradient>
        </defs>
        {(kind === "sun" || kind === "cloud") && (
          <g className="companion-sky-orb" transform="translate(44 0)">
            {isDay ? (
              <>
                <circle cx="190" cy="24" r="25" className="sky-halo" />
                <circle cx="190" cy="24" r="15" className="sky-orb" />
              </>
            ) : (
              <>
                <path
                  d="M202 8a19 19 0 1 0 9 32 16 16 0 0 1-9-32"
                  className="sky-orb"
                />
                <path
                  d="M145 10v6m-3-3h6M247 15v5m-2.5-2.5h5M280 33v4m-2-2h4"
                  className="sky-stars"
                />
              </>
            )}
          </g>
        )}
        {kind !== "sun" && (
          <>
            <g className="companion-sky-cloud cloud-far">
              <path
                fill={`url(#${cloudId})`}
                d="M117 40c-16 0-19-18-5-23 3-20 30-20 37-5 12-11 32-2 33 10 18-1 19 19 3 20Z"
              />
            </g>
            <g className="companion-sky-cloud cloud-near">
              <path
                fill={`url(#${cloudId})`}
                d="M210 58c-20 0-23-23-5-29 4-25 36-28 46-8 15-14 40-4 42 13 22-2 25 24 5 25Z"
              />
            </g>
          </>
        )}
        {kind === "fog" && (
          <g className="companion-sky-fog">
            <path d="M107 58h155M131 68h161M100 77h130" />
          </g>
        )}
        {kind === "storm" && (
          <path
            className="companion-sky-lightning"
            d="M235 48l-14 21h10l-5 17 24-25h-13l8-13Z"
          />
        )}
        <path
          className="companion-scene-ground ground-back"
          d="M0 95Q60 73 120 87T240 85T320 79V100H0Z"
        />
        <path
          className="companion-scene-ground ground-front"
          d="M0 99Q100 81 164 96T320 91V100H0Z"
        />
      </svg>
      {(kind === "rain" || kind === "storm" || kind === "snow") && (
        <div
          className={`companion-precipitation ${kind === "snow" ? "is-snow" : "is-rain"}`}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${28 + i * 7}%`,
                animationDelay: `${-i * 0.43}s`,
                animationDuration: `${kind === "snow" ? 4.8 + (i % 3) : 1.3 + (i % 3) * 0.17}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
