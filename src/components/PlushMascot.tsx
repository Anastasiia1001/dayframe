import { useId } from "react";
import type { MascotId } from "../appearance";
// Atlas is generated as a coherent set; coordinates refer to each 100×100 cell.
const friends = {
  axolotl: [0, 0, 35, 73, 48, 7, "#f4c2c6", 59],
  penguin: [1, 0, 36, 65, 40, 6, "#eee2cf", 55],
  dragon: [2, 0, 35, 65, 42, 7, "#a6d2b2", 54],
  otter: [3, 0, 40, 70, 38, 6, "#bd9675", 51],
  bunny: [0, 1, 36, 65, 42, 6, "#e8dac6", 56],
  cat: [1, 1, 36, 65, 42, 6, "#eee1cd", 56],
  fox: [2, 1, 36, 63, 43, 6, "#d69253", 55],
  bear: [3, 1, 37, 67, 40, 6, "#c99051", 55],
  frog: [0, 2, 29, 70, 23, 7, "#9ab77a", 39],
  star: [1, 2, 39, 64, 44, 5, "#f9dba0", 56],
  "fluffy-cat": [2, 2, 31, 57, 37, 5, "#ede6df", 49],
  "ginger-cat": [3, 2, 31, 57, 39, 5, "#d39b62", 50],
} as const;
export function PlushMascot({ kind }: { kind: Exclude<MascotId, "pug"> }) {
  const id = useId().replace(/:/g, ""),
    [col, row, left, right, eyeY, radius, fur, mouthY] = friends[kind];
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
          {[left, right].map((x, i) => (
            <ellipse
              key={i}
              cx={x}
              cy={eyeY + 5}
              rx={radius}
              ry={radius + 1}
              fill="black"
            />
          ))}
        </mask>
        {[left, right].map((x, i) => (
          <clipPath id={id + "eye" + i} key={i}>
            <ellipse cx={x} cy={eyeY + 5} rx={radius} ry={radius + 1} />
          </clipPath>
        ))}
        {[left, right].map((x, i) => (
          <clipPath
            id={id + "shutter" + i}
            key={i}
            clipPathUnits="userSpaceOnUse"
          >
            <rect
              className={i ? "mascot-eye-right" : "mascot-eye-left"}
              x={x - radius - 1}
              y={eyeY + 5 - radius - 2}
              width={radius * 2 + 2}
              height={radius * 2 + 4}
              style={{ transformOrigin: `${x}px ${eyeY + 5}px` }}
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
        <g clipPath={`url(#${id}cell)`}>
          <g mask={`url(#${id}face)`}>{art}</g>
          {[left, right].map((x, i) => (
            <g key={i}>
              <ellipse
                cx={x}
                cy={eyeY + 5}
                rx={radius + 0.25}
                ry={radius + 1.25}
                fill={fur}
              />
              <path
                d={`M${x - radius + 1} ${eyeY + 5}q${radius - 1} 4 ${2 * radius - 2} 0`}
                stroke="#655048"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </g>
          ))}
          <g className="mascot-eyes bunny-eyes">
            {[left, right].map((x, i) => (
              <g key={i} clipPath={`url(#${id}shutter${i})`}>
                <g clipPath={`url(#${id}eye${i})`}>{art}</g>
              </g>
            ))}
          </g>
        </g>
        <path
          className="mascot-mouth-rest"
          d={`M48 ${mouthY + 5}q2 1 4 0`}
          stroke="#825d52"
          strokeWidth=".35"
        />
        <path
          className="mascot-smile"
          d={`M46 ${mouthY + 4}q4 7 8 0q-4 2-8 0`}
          fill="#ad6c70"
        />
      </g>
    </svg>
  );
}
