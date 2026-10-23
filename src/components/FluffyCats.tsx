import { useId } from "react";
/** Fixed fur palettes; independent head, chest, eyelids, ears and tail. */
export function FluffyCat({ ginger = false }: { ginger?: boolean }) {
  const id = useId().replace(/:/g, ""),
    fur = ginger ? "#efb36d" : "#fffdf9",
    shade = ginger ? "#bd7543" : "#d6dce6",
    light = ginger ? "#ffe0a6" : "#ffffff",
    ink = "#55444c";
  return (
    <svg
      className={`bunny mascot-art plush-cat mascot-${ginger ? "ginger-cat" : "fluffy-cat"}`}
      viewBox="0 0 100 110"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={id + "fur"} cx=".35" cy=".25" r=".85">
          <stop stopColor={light} />
          <stop offset=".65" stopColor={fur} />
          <stop offset="1" stopColor={shade} />
        </radialGradient>
        <radialGradient id={id + "eye"} cx=".3" cy=".2">
          <stop stopColor={ginger ? "#b27d42" : "#73b7bd"} />
          <stop offset="1" stopColor={ginger ? "#6d4935" : "#376a80"} />
        </radialGradient>
      </defs>
      <ellipse
        className="mascot-shadow"
        cx="50"
        cy="101"
        rx="30"
        ry="4"
        fill="#59526d"
        opacity=".12"
      />
      <path
        className="mascot-tail"
        d="M71 91C98 96 98 65 87 63C77 62 88 76 77 78"
        fill={`url(#${id}fur)`}
        stroke={shade}
        strokeWidth="1"
      />
      <g className="mascot-body">
        <path
          d="M30 65Q16 76 23 91L19 92L25 96L28 99H74L79 94L75 91Q83 77 69 65Z"
          fill={`url(#${id}fur)`}
          stroke={shade}
          strokeWidth=".7"
        />
        <path
          d="M37 68L33 78L38 77L35 86L43 82L49 92L55 82L63 86L61 77L67 79L63 68"
          fill={light}
          opacity=".7"
        />
        <path
          d="M34 84Q31 92 34 97M65 84Q68 92 65 97"
          stroke={shade}
          strokeLinecap="round"
        />
      </g>
      <g
        className="cat-feet"
        fill={`url(#${id}fur)`}
        stroke={shade}
        strokeWidth=".7"
      >
        <ellipse cx="36" cy="98" rx="11" ry="5" />
        <ellipse cx="64" cy="98" rx="11" ry="5" />
        <path d="M33 98v3m5-3v3m24-3v3m5-3v3" strokeLinecap="round" />
      </g>
      <g className="mascot-head-idle">
        <g className="mascot-ear-left">
          <path
            d="M23 45Q11 31 19 13Q34 15 40 30"
            fill={`url(#${id}fur)`}
            stroke={shade}
          />
          <path d="M24 32L23 20Q31 24 33 32" fill="#e7b7b6" />
        </g>
        <g className="mascot-ear-right">
          <path
            d="M62 30Q70 15 82 13Q91 31 77 45"
            fill={`url(#${id}fur)`}
            stroke={shade}
          />
          <path d="M68 32Q73 24 78 20L77 34" fill="#e7b7b6" />
        </g>
        <path
          d={
            ginger
              ? "M19 41Q19 24 37 24L34 20L46 24L51 19L56 24Q79 23 83 42L89 47L85 51L90 57L85 60L87 66L79 68Q75 79 50 80Q26 79 21 69L13 67L16 61L10 57L15 51L11 47Z"
              : "M19 40Q18 26 35 25L31 19L44 23L49 17L55 23L64 19L63 25Q82 27 82 41L89 44L85 49L92 53L85 58L89 63L81 66L83 71L73 72Q50 90 27 73L17 73L19 67L11 65L16 59L9 55L15 50L11 45Z"
          }
          fill={`url(#${id}fur)`}
          stroke={shade}
          strokeWidth=".65"
        />
        {ginger && (
          <g
            stroke="#bf7b49"
            strokeWidth="2.3"
            strokeLinecap="round"
            opacity=".65"
          >
            <path d="M43 27l3 8m6-9v8m7-7-3 8M21 45l6 3m-7 4 6 2m53-9-6 3m7 4-6 2" />
          </g>
        )}
        <g className="mascot-eyes bunny-eyes">
          {[34, 66].map((x, i) => (
            <g
              key={x}
              className={i === 0 ? "mascot-eye-left" : "mascot-eye-right"}
            >
              <ellipse
                cx={x}
                cy={ginger ? 49 : 47}
                rx={ginger ? 10 : 8.5}
                ry="11"
                fill={`url(#${id}eye)`}
                stroke={ginger ? "#bd875e" : "#d0c4c6"}
                strokeWidth="1.2"
              />
              <ellipse
                cx={x}
                cy={ginger ? 49 : 47}
                rx="5"
                ry="9"
                fill="#292735"
              />
              <ellipse cx={x - 2} cy="43" rx="3" ry="3.5" fill="#fff" />
              <circle cx={x + 4} cy="52" r="1.4" fill="#fff" />
            </g>
          ))}
        </g>
        <g fill={light}>
          <ellipse cx="43" cy={ginger ? 61 : 63} rx="10" ry="7" />
          <ellipse cx="57" cy={ginger ? 61 : 63} rx="10" ry="7" />
        </g>
        <path
          d={ginger ? "M46 57Q50 55 54 57L50 61Z" : "M46 59Q50 57 54 59L50 63Z"}
          fill="#ce9695"
        />
        <path
          className="mascot-mouth-rest"
          d={
            ginger
              ? "M50 61v3m-6 0q3 4 6 0q3 4 6 0"
              : "M50 63v3m-6 0q3 4 6 0q3 4 6 0"
          }
          stroke={ink}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path
          className="mascot-smile"
          d="M44 65Q50 74 56 65Q50 68 44 65Z"
          fill="#b16f7c"
        />
        <g className="mascot-cheek" fill="#edb1ad" opacity=".6">
          <ellipse cx="25" cy="61" rx="5" ry="2.5" />
          <ellipse cx="75" cy="61" rx="5" ry="2.5" />
        </g>
        <g stroke={shade} strokeWidth=".8" strokeLinecap="round">
          <path d="M29 64L15 62m15 6-14 3m55-7 14-2m-15 6 14 3" />
        </g>
      </g>
    </svg>
  );
}
