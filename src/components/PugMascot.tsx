import { useId } from "react";
/** A cream, round-faced puppy. Eyes and ears are separate for restrained character animation. */
export function PugMascot() {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className="bunny mascot-art mascot-pug"
      viewBox="0 0 100 110"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={id} cx=".35" cy=".2" r=".9">
          <stop stopColor="#fff0d8" />
          <stop offset="1" stopColor="#e4c399" />
        </radialGradient>
      </defs>
      <ellipse
        className="mascot-shadow"
        cx="50"
        cy="101"
        rx="26"
        ry="3"
        fill="#a2837a"
        opacity=".12"
      />
      <g className="mascot-body">
        <path
          className="pug-tail"
          d="M73 85C91 92 98 77 89 76C79 74 81 87 89 83"
          stroke="#e1bb8e"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <ellipse
          cx="50"
          cy="81"
          rx="24"
          ry="20"
          fill={`url(#${id})`}
          stroke="#cba983"
          strokeWidth="1.1"
        />
        <ellipse cx="50" cy="86" rx="13" ry="13" fill="#fff3df" />
        <g className="pug-head">
          <path
            d="M15 48C15 25 29 18 50 18C71 18 85 25 85 48V54C85 76 69 82 50 82C31 82 15 76 15 54Z"
            fill={`url(#${id})`}
            stroke="#cba983"
            strokeWidth="1.1"
          />
          <g className="mascot-ears">
            <path
              className="pug-ear-left"
              d="M24 25C17 19 8 27 13 42C15 49 21 47 25 36Z"
              fill="#a98b77"
              stroke="#987b68"
              strokeWidth="1.2"
            />
            <path
              className="pug-ear-right"
              d="M76 25C83 19 92 27 87 42C85 49 79 47 75 36Z"
              fill="#a98b77"
              stroke="#987b68"
              strokeWidth="1.2"
            />
          </g>
          <path
            d="M41 29Q50 26 59 29M44 33Q50 31 56 33"
            stroke="#d6b58e"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <ellipse
            cx="34"
            cy="49"
            rx="11"
            ry="12"
            fill="#bd9e83"
            opacity=".48"
          />
          <ellipse
            cx="66"
            cy="49"
            rx="11"
            ry="12"
            fill="#bd9e83"
            opacity=".48"
          />
          <g className="mascot-eyes" style={{ transformOrigin: "50px 49px" }}>
            <g
              className="mascot-eye-left"
              style={{ transformOrigin: "34px 49px" }}
            >
              <ellipse cx="34" cy="49" rx="5.1" ry="6.4" fill="#4d3d36" />
              <circle cx="32.6" cy="47.1" r="1.8" fill="#fffdf5" />
              <circle cx="35.7" cy="51.1" r=".75" fill="#fffdf5" opacity=".8" />
            </g>
            <g
              className="mascot-eye-right"
              style={{ transformOrigin: "66px 49px" }}
            >
              <ellipse cx="66" cy="49" rx="5.1" ry="6.4" fill="#4d3d36" />
              <circle cx="64.6" cy="47.1" r="1.8" fill="#fffdf5" />
              <circle cx="67.7" cy="51.1" r=".75" fill="#fffdf5" opacity=".8" />
            </g>
          </g>
          <ellipse cx="25" cy="60" rx="7" ry="4" fill="#edb9af" opacity=".75" />
          <ellipse cx="75" cy="60" rx="7" ry="4" fill="#edb9af" opacity=".75" />
          <ellipse cx="44" cy="62" rx="10" ry="8" fill="#e0c7ad" />
          <ellipse cx="56" cy="62" rx="10" ry="8" fill="#e0c7ad" />
          <path
            d="M45 56Q50 53 55 56Q56 60 50 61Q44 60 45 56Z"
            fill="#6b5143"
          />
          <path
            d="M47 56L50 55.5"
            stroke="#fff0db"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M50 61V65M50 65Q45 70 41 65M50 65Q55 70 59 65"
            stroke="#816250"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <path
            className="mascot-tongue"
            d="M47 69Q50 70 53 69V72Q50 77 47 72Z"
            fill="#e8a5a5"
          />
        </g>
        <g className="mascot-paw">
          <ellipse
            cx="37"
            cy="96"
            rx="10"
            ry="6"
            fill="#f5dfbf"
            stroke="#cba983"
            strokeWidth="1.1"
          />
          <path d="M34 95V97M38 95V98" stroke="#d4b18a" strokeLinecap="round" />
        </g>
        <ellipse
          cx="63"
          cy="96"
          rx="10"
          ry="6"
          fill="#f5dfbf"
          stroke="#cba983"
          strokeWidth="1.1"
        />
        <path d="M60 95V97M64 95V98" stroke="#d4b18a" strokeLinecap="round" />
      </g>
    </svg>
  );
}
