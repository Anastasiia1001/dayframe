import { useId } from "react";
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
        <linearGradient
          id={id}
          x1="20"
          y1="20"
          x2="75"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f7dfb9" />
          <stop offset="1" stopColor="#d6b384" />
        </linearGradient>
      </defs>
      <ellipse
        className="mascot-shadow"
        cx="50"
        cy="101"
        rx="29"
        ry="4"
        fill="#8e6f66"
        opacity=".15"
      />
      <g className="mascot-body">
        <path
          className="pug-tail"
          d="M76 83C96 94 99 72 87 76C81 79 88 87 92 82"
          stroke="#d1ab79"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <ellipse
          cx="49"
          cy="78"
          rx="29"
          ry="24"
          fill={`url(#${id})`}
          stroke="#bf966d"
          strokeWidth="1.5"
        />
        <path d="M41 80Q49 86 57 80L60 97H37Z" fill="#fff0d7" />
        <ellipse
          cx="50"
          cy="50"
          rx="34"
          ry="29"
          fill={`url(#${id})`}
          stroke="#bf966d"
          strokeWidth="1.5"
        />
        <g className="mascot-ears">
          <path
            d="M25 27Q6 20 14 53Q23 60 29 35Z"
            fill="#63514a"
            stroke="#483b38"
            strokeWidth="1.4"
          />
          <path
            d="M75 27Q94 20 86 53Q77 60 71 35Z"
            fill="#63514a"
            stroke="#483b38"
            strokeWidth="1.4"
          />
        </g>
        <path
          d="M24 45Q27 29 42 41Q50 48 58 41Q73 29 77 47L76 65Q65 81 50 75Q35 82 24 65Z"
          fill="#64524a"
        />
        <path
          d="M39 30Q50 25 61 30M41 34Q50 30 59 34"
          stroke="#bb976f"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <g
          className="mascot-eyes bunny-eyes"
          style={{ transformOrigin: "50px 48px" }}
        >
          <ellipse cx="35" cy="48" rx="7.5" ry="9" fill="#fff7e9" />
          <ellipse cx="65" cy="48" rx="7.5" ry="9" fill="#fff7e9" />
          <ellipse cx="36" cy="49" rx="5.5" ry="7" fill="#382d2c" />
          <ellipse cx="64" cy="49" rx="5.5" ry="7" fill="#382d2c" />
          <circle cx="34" cy="46" r="2.3" fill="white" />
          <circle cx="62" cy="46" r="2.3" fill="white" />
        </g>
        <ellipse cx="42" cy="63" rx="12" ry="9" fill="#8c7666" />
        <ellipse cx="58" cy="63" rx="12" ry="9" fill="#8c7666" />
        <path d="M44 58Q50 55 56 58Q57 64 50 64Q43 64 44 58Z" fill="#332c2d" />
        <path
          d="M46 58L50 57"
          stroke="#ffffff70"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M50 64V68M50 68Q43 74 38 68M50 68Q57 74 62 68"
          stroke="#332c2d"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          className="mascot-tongue"
          d="M46 72Q50 74 54 72V77Q50 85 46 77Z"
          fill="#e99d9c"
          stroke="#c78083"
        />
        <path d="M50 75V79" stroke="#c78083" strokeWidth="1" />
        <ellipse cx="27" cy="62" rx="4" ry="2.5" fill="#eab1a1" opacity=".7" />
        <ellipse cx="73" cy="62" rx="4" ry="2.5" fill="#eab1a1" opacity=".7" />
        <g className="mascot-paw">
          <ellipse
            cx="34"
            cy="95"
            rx="11"
            ry="7"
            fill="#eed2ab"
            stroke="#bf966d"
            strokeWidth="1.3"
          />
          <path d="M31 94V97M35 94V98" stroke="#bf966d" strokeLinecap="round" />
        </g>
        <ellipse
          cx="65"
          cy="95"
          rx="11"
          ry="7"
          fill="#eed2ab"
          stroke="#bf966d"
          strokeWidth="1.3"
        />
        <path d="M62 94V97M66 94V98" stroke="#bf966d" strokeLinecap="round" />
      </g>
      <path
        className="mascot-glint"
        d="M89 12L91 18L97 20L91 22L89 28L87 22L81 20L87 18Z"
        fill="#d9b572"
      />
    </svg>
  );
}
