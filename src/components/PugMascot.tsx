import { useId } from "react";

/** Independently articulated eyes, ears and tail keep the puppy expressive at small sizes. */
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
        <radialGradient id={id} cx=".3" cy=".2" r=".95">
          <stop stopColor="#fff2ce" />
          <stop offset="1" stopColor="#cfaa7b" />
        </radialGradient>
        <radialGradient id={`${id}-mask`} cx=".35" cy=".15" r=".9">
          <stop stopColor="#71615d" />
          <stop offset="1" stopColor="#3e3435" />
        </radialGradient>
        <radialGradient id={`${id}-iris`} cx=".5" cy=".8" r=".8">
          <stop stopColor="#d6a05e" />
          <stop offset=".5" stopColor="#744f36" />
          <stop offset="1" stopColor="#241f23" />
        </radialGradient>
      </defs>
      <ellipse
        className="mascot-shadow"
        cx="50"
        cy="103"
        rx="30"
        ry="3"
        fill="#a2837a"
        opacity=".16"
      />
      <g className="mascot-body">
        <path
          className="pug-tail"
          d="M73 85C91 92 98 77 89 76C79 74 81 87 89 83"
          stroke="#d5b794"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <ellipse
          cx="30"
          cy="88"
          rx="12"
          ry="14"
          fill={`url(#${id})`}
          stroke="#b99e80"
        />
        <ellipse
          cx="70"
          cy="88"
          rx="12"
          ry="14"
          fill={`url(#${id})`}
          stroke="#b99e80"
        />
        <path
          d="M28 69Q50 59 72 69L70 94Q65 104 50 101Q34 104 30 94Z"
          fill={`url(#${id})`}
          stroke="#b99e80"
        />
        <path
          d="M39 78Q36 90 41 99M61 78Q64 90 59 99M50 83V98"
          stroke="#b99e80"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path d="M26 68Q50 80 74 68L73 74Q50 86 27 74Z" fill="#69b7b3" />
        <path
          d="M29 69Q50 79 71 69"
          stroke="#a5d9cc"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M50 77V81" stroke="#b79a63" strokeWidth="2" />
        <path
          d="M50 89C47 87 43 84 45 81C47 79 49 80 50 82C52 78 57 80 56 83C55 86 52 88 50 89Z"
          fill="#e76d92"
          stroke="#f6b3bd"
          strokeWidth=".8"
        />
        <g className="mascot-head-idle">
          <g className="pug-head" transform="rotate(3 50 44)">
            <g className="mascot-ears">
              <path
                className="pug-ear-left"
                d="M28 18Q13 12 7 31Q5 39 16 44L29 28Z"
                fill="#484440"
                stroke="#353330"
                strokeWidth="1.3"
              />
              <path
                className="pug-ear-right"
                d="M74 20Q90 20 94 38Q97 51 86 53Q79 49 74 35Z"
                fill="#484440"
                stroke="#353330"
                strokeWidth="1.3"
              />
            </g>
            <path
              d="M15 42C15 21 30 12 50 12C72 12 85 24 85 45C86 67 73 75 51 75C28 75 14 65 15 42Z"
              fill={`url(#${id})`}
              stroke="#b99e80"
              strokeWidth="1.2"
            />
            <path
              d="M35 23Q39 16 46 23Q50 32 50 34M65 23Q61 16 54 23Q51 27 51 30M49 16Q46 21 49 25"
              stroke="#bd966e"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity=".6"
            />
            <path
              d="M36 21Q40 17 45 22M56 22Q60 17 64 21"
              stroke="#fff5da"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M29 25Q36 21 43 24M56 24Q63 21 70 26M29 66Q49 76 70 66"
              stroke="#fff0d9"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity=".7"
            />
            <path
              d="M17 43Q17 27 33 27Q44 26 50 34Q58 25 70 30Q85 34 83 50Q84 63 72 65Q63 68 53 61Q44 70 30 65Q15 63 17 43Z"
              fill={`url(#${id}-mask)`}
            />
            <g className="mascot-eyes">
              {[33, 67].map((x, i) => (
                <g
                  key={x}
                  className={i === 0 ? "mascot-eye-left" : "mascot-eye-right"}
                  style={{ transformOrigin: `${x}px 41px` }}
                >
                  <ellipse cx={x} cy="41" rx="13" ry="13.5" fill="#f7efdf" />
                  <ellipse
                    cx={x}
                    cy="41"
                    rx="11.1"
                    ry="11.6"
                    fill={`url(#${id}-iris)`}
                    stroke="#9a8c7b"
                    strokeWidth=".9"
                  />
                  <ellipse cx={x} cy="39.5" rx="7.4" ry="9" fill="#17171d" />
                  <ellipse
                    cx={x - 3}
                    cy="36.5"
                    rx="4.8"
                    ry="3.8"
                    transform={`rotate(-20 ${x - 3} 36.5)`}
                    fill="#fffdf7"
                  />
                  <circle
                    cx={x + 4.3}
                    cy="45.8"
                    r="2"
                    fill="#fffdf7"
                    opacity=".88"
                  />
                  <path
                    d={`M${x - 6} 47Q${x - 2} 51 ${x + 3} 49`}
                    stroke="#bac8c3"
                    strokeWidth=".8"
                    strokeLinecap="round"
                    opacity=".65"
                  />
                </g>
              ))}
            </g>
            <path
              d="M45 46Q50 43 55 46Q56 50 50 52Q44 50 45 46Z"
              fill="#282928"
            />
            <path
              d="M47 46.5L50 46"
              stroke="#827b70"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <ellipse
              cx="43"
              cy="59"
              rx="13"
              ry="10"
              fill={`url(#${id}-mask)`}
            />
            <ellipse
              cx="59"
              cy="59"
              rx="13"
              ry="10"
              fill={`url(#${id}-mask)`}
            />
            <path
              d="M34 58Q40 53 45 55M33 62Q40 57 45 59M57 55Q64 53 69 58M57 59Q64 57 70 62"
              stroke="#99837c"
              strokeWidth=".8"
              strokeLinecap="round"
              opacity=".45"
            />
            <g
              className="mascot-mouth"
              style={{ transformOrigin: "50px 69px" }}
            >
              <path
                className="mascot-mouth-rest"
                d="M44 69Q50 72 56 69"
                stroke="#302d30"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <g className="mascot-smile">
                <path
                  d="M41 67Q50 75 59 67Q57 78 50 78Q43 78 41 67"
                  fill="#302d30"
                />
                <path
                  d="M46 75Q50 72 54 75"
                  stroke="#e8a5b3"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            </g>
            <path
              className="mascot-tongue"
              d="M57 60Q60 62 65 61L66 70Q66 78 60 77Q55 76 57 69Z"
              fill="#e97598"
              stroke="#c65577"
              strokeWidth=".6"
            />
            <path
              d="M61 65V71"
              stroke="#c65577"
              strokeWidth=".8"
              strokeLinecap="round"
            />
            <path
              d="M25 55L26 55M29 58L30 58M72 56L73 56M69 59L70 59"
              stroke="#252928"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </g>
        </g>
        <g className="mascot-paw">
          <ellipse
            cx="37"
            cy="100"
            rx="10"
            ry="5"
            fill="#e3ccac"
            stroke="#b99e80"
          />
          <path
            d="M33 99V102M38 99V103"
            stroke="#b99e80"
            strokeLinecap="round"
          />
        </g>
        <ellipse
          cx="63"
          cy="100"
          rx="10"
          ry="5"
          fill="#e3ccac"
          stroke="#b99e80"
        />
        <path d="M60 99V102M65 99V103" stroke="#b99e80" strokeLinecap="round" />
      </g>
    </svg>
  );
}
