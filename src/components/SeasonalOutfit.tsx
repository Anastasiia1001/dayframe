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
const hats: Record<MascotId, [number, number, number, number]> = {
  pug: [54, 16, .94, -9], bunny: [54, 24, .88, 8],
  cat: [51, 18, .9, -8], fox: [51, 18, .88, -9],
  bear: [52, 20, .92, 6], frog: [50, 12, .68, -7],
  star: [53, 23, .76, 8], axolotl: [53, 25, .9, -7],
  penguin: [51, 18, .9, 7], dragon: [53, 20, .82, -9],
  otter: [52, 19, .9, 7], "fluffy-cat": [49, 18, .88, -8],
  "ginger-cat": [49, 19, .9, 8],
};
/** Accessories live inside the existing character SVG: no recolouring or facial overlays. */
export function SeasonalOutfit({ kind }: { kind: MascotId }) {
  const id = useId().replace(/:/g, ""),
    y = neck[kind],
    [hatX, hatY, hatScale, hatTilt] = hats[kind];
  return (
    <g className="seasonal-outfit" aria-hidden="true" pointerEvents="none">
      <defs>
        <linearGradient id={`${id}-knit`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--seasonal-knit-light)" />
          <stop offset="1" stopColor="var(--seasonal-knit)" />
        </linearGradient>
        <linearGradient id={`${id}-hat`} x1="0" y1="0" x2="1" y2=".7">
          <stop stopColor="#8d79a6" />
          <stop offset=".35" stopColor="#574364" />
          <stop offset=".78" stopColor="#30283f" />
          <stop offset="1" stopColor="#211b30" />
        </linearGradient>
        <linearGradient id={`${id}-brim`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#88729c" />
          <stop offset=".5" stopColor="#4c3b5f" />
          <stop offset="1" stopColor="#292137" />
        </linearGradient>
        <linearGradient id={`${id}-ribbon`} x1="0" x2="0" y2="1">
          <stop stopColor="#f5c48a" />
          <stop offset="1" stopColor="#b97843" />
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
        transform={`translate(${hatX} ${hatY}) rotate(${hatTilt}) scale(${hatScale * 1.6})`}
      >
        {/* A soft brim rests on the crown; the bent felt tip has no hard outline. */}
        <ellipse cx="0" cy="3.5" rx="17" ry="3.8" fill="#201629" opacity=".22" />
        <path d="M-20 0Q-11-6 0-5Q13-5 20 1Q22 6 5 7Q-15 8-20 3Q-22 2-20 0Z"
          fill={`url(#${id}-brim)`} />
        <path d="M-12 0Q-8-10-6-17Q-4-26 4-25Q12-25 15-19Q10-20 6-17Q7-10 12 0Q1 5-12 0Z"
          fill={`url(#${id}-hat)`} />
        <path d="M-9-4Q0 0 10-4L12 0Q1 5-12 0Z" fill={`url(#${id}-ribbon)`} />
        <path d="M-5-17Q-4-22 2-23" stroke="#bc9ed1" strokeWidth="1.1" strokeLinecap="round" opacity=".55" />
        <path d="M-18 1Q-8 5 3 5" stroke="#a48bb8" strokeWidth=".8" strokeLinecap="round" opacity=".55" />
        <rect x="-1" y="-3.3" width="5.2" height="5" rx="1.2" fill="#f4cf8c" />
        <rect x=".3" y="-2.1" width="2.6" height="2.6" rx=".45" fill="#75503f" />
      </g>
    </g>
  );
}
