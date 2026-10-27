import { SeasonalOutfit } from "./SeasonalOutfit";
import { useId } from "react";
import type { MascotId } from "../appearance";
// Atlas is generated as a coherent set; coordinates refer to each 100×100 cell.
const friends = {
  axolotl: [0, 0, 35.4, 72, 47.4, 7, "#f4c2c6", 59, 47.2],
  penguin: [1, 0, 36.6, 65.5, 40.6, 6.8, "#eee2cf", 55, 38.4],
  dragon: [2, 0, 34, 64.9, 41.9, 8, "#a6d2b2", 54, 41.3],
  otter: [3, 0, 39.1, 69.1, 39, 7, "#bd9675", 51, 33.8],
  bunny: [0, 1, 36, 65.6, 42, 7, "#e8dac6", 56, 36],
  cat: [1, 1, 36, 61.5, 39.9, 7, "#eee1cd", 56, 42.3],
  fox: [2, 1, 34.8, 61.7, 41.9, 7.3, "#d69253", 55, 42.4],
  bear: [3, 1, 38.4, 65.1, 37.6, 6.2, "#c99051", 55, 40.3],
  frog: [0, 2, 29.1, 68, 20.4, 9, "#9ab77a", 39, 18.1],
  star: [1, 2, 39.5, 63.1, 44.3, 5.6, "#f9dba0", 56, 43.9],
  "fluffy-cat": [2, 2, 29.4, 54.4, 34.1, 6.5, "#ede6df", 49, 33.7],
  "ginger-cat": [3, 2, 33.8, 59.3, 34, 6.8, "#d39b62", 50, 34.9],
} as const;
export function PlushMascot({ kind }: { kind: Exclude<MascotId, "pug"> }) {
  const id = useId().replace(/:/g, ""),
    [col, row, left, right, eyeY, radius, , , rightEyeY] = friends[kind];
  const eyes = [
    [left, eyeY],
    [right, rightEyeY],
  ];
  const art = (
    <image
      href={`${import.meta.env.BASE_URL}assets/mascots/plush-friends.png`}
      x={-col * 100}
      y={5 - row * 100}
      width="400"
      height="300"
      preserveAspectRatio="none"
    />
  );
  return (
    <svg
      className={`bunny mascot-art mascot-${kind} mascot-plush-friend`}
      viewBox="0 0 100 110"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <filter
          id={id + "lid-feather"}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur stdDeviation=".8" />
        </filter>
        <clipPath id={id + "cell"}>
          <rect
            x={
              kind === "penguin"
                ? 12
                : kind === "bear" || kind === "cat"
                  ? 6
                  : kind === "ginger-cat"
                    ? 3
                    : 0
            }
            y="5"
            width={
              kind === "penguin"
                ? 85
                : kind === "bear" || kind === "cat" || kind === "star"
                  ? 94
                  : kind === "ginger-cat"
                    ? 97
                    : 100
            }
            height="100"
          />
        </clipPath>
        <mask
          id={id + "face"}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100"
          height="110"
        >
          <rect width="100" height="110" fill="white" />
          {eyes.map(([x, y], i) => (
            <ellipse
              key={i}
              cx={x}
              cy={y + 5}
              rx={radius + 2.5}
              ry={radius + 3.5}
              filter={`url(#${id}lid-feather)`}
              fill="black"
            />
          ))}
        </mask>
        {eyes.map(([x, y], i) => (
          <clipPath id={id + "eye" + i} key={i}>
            <ellipse cx={x} cy={y + 5} rx={radius + 4} ry={radius + 5} />
          </clipPath>
        ))}
        {eyes.map(([x, y], i) => (
          <clipPath
            id={id + "shutter" + i}
            key={i}
            clipPathUnits="userSpaceOnUse"
          >
            <rect
              className={i ? "mascot-eye-right" : "mascot-eye-left"}
              x={x - radius - 5}
              y={y + 5 - radius - 6}
              width={radius * 2 + 10}
              height={radius * 2 + 12}
              style={{ transformOrigin: `${x}px ${y + 5}px` }}
            />
          </clipPath>
        ))}
      </defs>
      <ellipse
        className="mascot-shadow"
        cx="50"
        cy="105"
        rx="30"
        ry="2"
        fill="#675044"
        opacity=".12"
      />
      <g className="mascot-body">
        <g className="mascot-idle-pose">
          <g clipPath={`url(#${id}cell)`}>
            {eyes.map(([x, y], i) => (
              <g key={i}>
                <g
                  className="mascot-lid-texture"
                  clipPath={`url(#${id}eye${i})`}
                >
                  <g
                    transform={`translate(0, ${kind === "frog" || kind === "penguin" ? -2 * (radius + 1) : 2 * (radius + 1)})`}
                  >
                    {art}
                  </g>
                </g>
                <path
                  d={`M${x - radius + 1} ${y + 5}q${radius - 1} 4 ${2 * radius - 2} 0`}
                  stroke="#655048"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              </g>
            ))}
            <g mask={`url(#${id}face)`}>{art}</g>
            <g className="mascot-eyes bunny-eyes">
              {eyes.map(([x, y], i) => (
                <g key={i} clipPath={`url(#${id}shutter${i})`}>
                  <g clipPath={`url(#${id}eye${i})`}>{art}</g>
                </g>
              ))}
            </g>
          </g>
          <SeasonalOutfit kind={kind} />
        </g>
      </g>
    </svg>
  );
}
