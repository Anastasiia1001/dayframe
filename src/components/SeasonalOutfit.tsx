import { useId } from "react";
import type { MascotId } from "../appearance";
const neck: Record<MascotId, number> = {
  pug: 63,
  bunny: 70,
  cat: 65,
  fox: 65,
  bear: 65,
  frog: 48,
  star: 64,
  axolotl: 65,
  penguin: 65,
  dragon: 68,
  otter: 66,
  "fluffy-cat": 60,
  "ginger-cat": 65,
};
/** Accessories live inside the existing character SVG: no recolouring or facial overlays. */
export function SeasonalOutfit({ kind }: { kind: MascotId }) {
  const id = useId().replace(/:/g, ""),
    y = neck[kind];
  return (
    <g className="seasonal-outfit" aria-hidden="true" pointerEvents="none">
      <defs>
        <linearGradient id={`${id}-knit`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--seasonal-knit-light)" />
          <stop offset="1" stopColor="var(--seasonal-knit)" />
        </linearGradient>
        <linearGradient id={`${id}-hat`} x1="0" x2="1">
          <stop stopColor="var(--seasonal-hat-light)" />
          <stop offset="1" stopColor="var(--seasonal-hat)" />
        </linearGradient>
      </defs>
      <g className="seasonal-scarf" transform={`translate(0 ${y})`}>
        <path
          d={
            kind === "pug"
              ? "M30 0Q50 8 70 0L70 8Q50 18 30 8Z"
              : "M36 0Q50 7 65 0L65 8Q50 15 35 7Z"
          }
          fill={`url(#${id}-knit)`}
        />
        <path
          d="M58 7Q57 18 63 25L71 21Q64 14 65 5Z"
          fill={`url(#${id}-knit)`}
        />
        <path
          d="M38 4Q50 9 62 4M62 11L67 22M61 22L63 25M65 21L67 24M69 20L71 22"
          stroke="var(--seasonal-thread)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity=".8"
        />
      </g>
      <g
        className="seasonal-autumn"
        transform={`translate(${kind === "frog" ? 91 : 80} 5) scale(${kind === "frog" ? 0.55 : 0.8}) rotate(23)`}
      >
        <path
          d="M1 18C-9 9-4 0 8-3C11 9 10 15 1 18Z"
          fill="var(--seasonal-leaf)"
          stroke="var(--seasonal-knit)"
          strokeWidth=".7"
        />
        <path
          d="M1 19L5 2M3 10L-1 6M4 7L8 4"
          stroke="var(--seasonal-thread)"
          strokeWidth=".8"
          strokeLinecap="round"
        />
      </g>
      <g
        className="seasonal-halloween"
        transform={`translate(${kind === "frog" ? 91 : 80} ${kind === "frog" ? 8 : 12}) scale(${kind === "frog" ? 0.55 : 0.8}) rotate(17)`}
      >
        <path
          d="M-10 10L0-8Q1-15 10-14L5-7L13 10Z"
          fill={`url(#${id}-hat)`}
          stroke="var(--seasonal-hat-rim)"
          strokeWidth=".8"
        />
        <path d="M-5 3L10 3L12 8L-8 8Z" fill="var(--seasonal-knit-light)" />
        <rect
          x="0"
          y="3"
          width="4"
          height="4"
          rx=".7"
          fill="none"
          stroke="var(--seasonal-hat)"
          strokeWidth="1.1"
        />
        <path
          d="M-14 11Q1 5 16 11Q18 16 1 16Q-16 16-14 11Z"
          fill={`url(#${id}-hat)`}
          stroke="var(--seasonal-hat-rim)"
          strokeWidth=".8"
        />
      </g>
    </g>
  );
}
