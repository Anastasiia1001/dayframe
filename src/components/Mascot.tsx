import type { MascotId } from "../appearance";
/** Original little characters drawn as SVG; all movement is local CSS. */
export function Mascot({ kind }: { kind: MascotId }) {
  const fill =
    kind === "fox"
      ? "#edb17c"
      : kind === "bear"
        ? "#d3ae8e"
        : kind === "frog"
          ? "#acd5a1"
          : kind === "star"
            ? "#f5d586"
            : "#fffaf8";
  const ink = "#493648";
  return (
    <svg
      className={`bunny mascot-art mascot-${kind}`}
      viewBox="0 0 100 110"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        className="mascot-shadow"
        cx="50"
        cy="100"
        rx="25"
        ry="4"
        fill="#a43b79"
        opacity=".12"
      />
      <g className="mascot-body">
        {kind === "bunny" && (
          <g className="mascot-ears">
            <ellipse
              cx="37"
              cy="29"
              rx="10"
              ry="23"
              fill={fill}
              stroke="#cc8fa7"
              strokeWidth="1.6"
              transform="rotate(-12 37 29)"
            />
            <ellipse
              cx="63"
              cy="29"
              rx="10"
              ry="23"
              fill={fill}
              stroke="#cc8fa7"
              strokeWidth="1.6"
              transform="rotate(12 63 29)"
            />
            <ellipse
              cx="37"
              cy="28"
              rx="4"
              ry="15"
              fill="#f3a8c3"
              transform="rotate(-12 37 28)"
            />
            <ellipse
              cx="63"
              cy="28"
              rx="4"
              ry="15"
              fill="#f3a8c3"
              transform="rotate(12 63 28)"
            />
          </g>
        )}
        {kind === "cat" && (
          <g className="mascot-ears">
            <path
              d="M20 57L20 24Q20 19 25 23L43 40M57 40L75 23Q80 19 80 25L80 57"
              fill={fill}
              stroke="#cc8fa7"
              strokeWidth="1.6"
            />
            <path
              d="M26 39L26 29L36 39M64 39L74 29L74 39"
              fill="#f3a8c3"
            />
          </g>
        )}
        {kind === "fox" && (
          <g className="mascot-ears">
            <path
              d="M20 55L19 20L44 39M56 39L81 20L80 55"
              fill={fill}
              stroke="#b67d51"
              strokeWidth="1.6"
            />
            <path d="M25 38L24 28L35 39M65 39L76 28L75 39" fill="#724f52" />
          </g>
        )}
        {kind === "bear" && (
          <g className="mascot-ears">
            <circle
              cx="25"
              cy="39"
              r="13"
              fill={fill}
              stroke="#ad856c"
              strokeWidth="1.6"
            />
            <circle
              cx="75"
              cy="39"
              r="13"
              fill={fill}
              stroke="#ad856c"
              strokeWidth="1.6"
            />
            <circle cx="25" cy="39" r="7" fill="#f3a8c3" />
            <circle cx="75" cy="39" r="7" fill="#f3a8c3" />
          </g>
        )}
        {kind === "frog" && (
          <g className="mascot-ears">
            <circle
              cx="30"
              cy="40"
              r="14"
              fill={fill}
              stroke="#719e65"
              strokeWidth="1.6"
            />
            <circle
              cx="70"
              cy="40"
              r="14"
              fill={fill}
              stroke="#719e65"
              strokeWidth="1.6"
            />
          </g>
        )}
        {kind === "star" ? (
          <path
            d="M50 15Q53 15 57 28L63 40L84 42Q96 43 88 52L73 66L77 87Q79 99 68 92L50 82L32 92Q21 99 23 87L27 66L12 52Q4 43 16 42L37 40L44 22Q47 15 50 15Z"
            fill={fill}
            stroke="#c5a04c"
            strokeWidth="1.6"
          />
        ) : (
          <ellipse
            cx="50"
            cy="66"
            rx="34"
            ry="29"
            fill={fill}
            stroke={
              kind === "fox"
                ? "#b67d51"
                : kind === "bear"
                  ? "#ad856c"
                  : kind === "frog"
                    ? "#719e65"
                    : "#cc8fa7"
            }
            strokeWidth="1.6"
          />
        )}
        {kind === "fox" && (
          <path
            d="M17 63Q32 59 50 78Q68 59 83 63Q77 92 50 94Q23 92 17 63"
            fill="#fff5e5"
          />
        )}
        {kind === "bear" && (
          <ellipse cx="50" cy="75" rx="16" ry="12" fill="#f7e5cf" />
        )}
        <g
          className="bunny-eyes mascot-eyes"
          style={{ transformOrigin: "50px 60px" }}
        >
          <ellipse
            cx={kind === "frog" ? 30 : 38}
            cy={kind === "frog" ? 41 : 60}
            rx="2.7"
            ry="3.6"
            fill={ink}
          />
          <ellipse
            cx={kind === "frog" ? 70 : 62}
            cy={kind === "frog" ? 41 : 60}
            rx="2.7"
            ry="3.6"
            fill={ink}
          />
          <circle
            cx={kind === "frog" ? 31 : 39}
            cy={kind === "frog" ? 40 : 59}
            r=".85"
            fill="white"
          />
          <circle
            cx={kind === "frog" ? 71 : 63}
            cy={kind === "frog" ? 40 : 59}
            r=".85"
            fill="white"
          />
        </g>
        <ellipse cx="28" cy="71" rx="7" ry="4" fill="#f3a8c3" />
        <ellipse cx="72" cy="71" rx="7" ry="4" fill="#f3a8c3" />
        <path
          d={
            kind === "frog"
              ? "M39 68Q50 79 61 68"
              : kind === "star"
                ? "M44 70Q50 77 56 70"
                : "M47 69Q50 73 53 69M50 72Q47 77 44 74M50 72Q53 77 56 74"
          }
          stroke={ink}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {kind === "cat" && (
          <path
            d="M13 67L29 69M12 75L28 73M71 69L87 67M72 73L88 75"
            stroke="#cc8fa7"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
        <g className="mascot-paw">
          <ellipse
            cx="78"
            cy="84"
            rx="9"
            ry="11"
            fill={fill}
            stroke="#cc8fa7"
            strokeWidth="1.4"
          />
          <path
            d="M75 82L75 85M80 81L80 84"
            stroke="#cc8fa7"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </g>
      </g>
      <path
        className="mascot-glint"
        d="M88 12l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"
        fill="#a43b79"
        opacity=".7"
      />
    </svg>
  );
}
