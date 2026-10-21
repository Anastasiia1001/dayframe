import { useId } from "react";
export type PocketKind = "axolotl" | "penguin" | "dragon" | "otter";
/** Original articulated characters; their colors stay independent of the application theme. */
export function PocketMascot({ kind }: { kind: PocketKind }) {
  const id = useId().replace(/:/g, "");
  const colors = {
    axolotl: ["#ffe5ee", "#eaa7bd"],
    penguin: ["#657b9b", "#304664"],
    dragon: ["#c4f2df", "#78bdaa"],
    otter: ["#e1b58f", "#ae795c"],
  }[kind];
  return (
    <svg
      className={`bunny mascot-art mascot-${kind}`}
      viewBox="0 0 100 110"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={id} cx=".3" cy=".2" r=".9">
          <stop stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </radialGradient>
      </defs>
      <ellipse
        className="mascot-shadow"
        cx="50"
        cy="102"
        rx="29"
        ry="3"
        fill="#66576c"
        opacity=".15"
      />
      <g className="mascot-body">
        {kind === "axolotl" && (
          <>
            <path
              d="M68 90Q95 95 88 72Q81 85 65 80"
              fill="#f4bbce"
              stroke="#d78ca6"
            />
            <g
              className="mascot-ears"
              stroke="#d987a5"
              strokeWidth="5"
              strokeLinecap="round"
            >
              <path d="M24 46L9 33M20 51L5 50M22 57L9 66M76 46L91 33M80 51L95 50M78 57L91 66" />
              <path
                d="M12 35L12 27M10 50L5 43M12 64L8 73M88 35L88 27M90 50L95 43M88 64L92 73"
                strokeWidth="3"
              />
            </g>
          </>
        )}
        {kind === "dragon" && (
          <>
            <path
              d="M68 91Q95 96 89 72Q86 86 73 81"
              fill="#80c7b0"
              stroke="#518e80"
            />
            <g className="little-wing" fill="#b4c0ee" stroke="#7a8cab">
              <path d="M29 67Q8 50 7 77L16 74L20 86L31 81Z" />
              <path d="M71 67Q92 50 93 77L84 74L80 86L69 81Z" />
            </g>
            <g className="mascot-ears" fill="#f8ddad" stroke="#d2b581">
              <path d="M29 33L26 13Q38 17 39 32Z" />
              <path d="M61 32Q62 17 74 13L71 33Z" />
            </g>
          </>
        )}
        {kind === "otter" && (
          <>
            <path d="M66 92Q91 91 85 103Q78 108 64 98" fill="#aa7358" />
            <g className="mascot-ears">
              <circle cx="24" cy="35" r="10" fill="#c69371" />
              <circle cx="76" cy="35" r="10" fill="#c69371" />
              <circle cx="24" cy="35" r="5" fill="#e9bc99" />
              <circle cx="76" cy="35" r="5" fill="#e9bc99" />
            </g>
          </>
        )}
        {kind === "penguin" && (
          <>
            <ellipse cx="35" cy="100" rx="13" ry="5" fill="#eab580" />
            <ellipse cx="65" cy="100" rx="13" ry="5" fill="#eab580" />
            <path
              className="mascot-ears"
              d="M28 60Q5 68 17 91L31 79M72 60Q95 68 83 91L69 79"
              fill="#405a79"
            />
          </>
        )}
        <ellipse cx="50" cy="80" rx="25" ry="22" fill={`url(#${id})`} />
        <ellipse
          cx="50"
          cy="84"
          rx="16"
          ry="17"
          fill={
            kind === "penguin"
              ? "#fff7df"
              : kind === "otter"
                ? "#f5d9b9"
                : "#fff3df"
          }
          opacity=".95"
        />
        <path
          d="M17 49Q17 24 50 24Q83 24 83 49V57Q82 75 50 75Q18 75 17 57Z"
          fill={`url(#${id})`}
        />
        {kind === "penguin" && (
          <path
            d="M24 48Q23 29 39 34Q47 35 50 46Q53 35 61 34Q77 29 76 48V57Q74 70 50 70Q26 70 24 57Z"
            fill="#fff7e6"
          />
        )}
        {kind === "otter" && (
          <path
            d="M22 51Q30 44 41 52Q50 57 59 52Q70 44 78 51V59Q72 74 50 73Q28 74 22 59Z"
            fill="#f6d8b7"
          />
        )}
        {kind === "dragon" && (
          <>
            <path d="M43 28L50 18L57 28" fill="#c8b6ee" />
            <ellipse cx="27" cy="56" rx="4" ry="2.5" fill="#77baa5" />
            <ellipse cx="73" cy="56" rx="4" ry="2.5" fill="#77baa5" />
          </>
        )}
        <g className="mascot-eyes">
          {[36, 64].map((x, i) => (
            <g
              key={x}
              className={i ? "mascot-eye-right" : "mascot-eye-left"}
              style={{ transformOrigin: `${x}px 50px` }}
            >
              <ellipse cx={x} cy="50" rx="5.5" ry="7" fill="#354052" />
              <ellipse cx={x - 1.4} cy="47.6" rx="1.9" ry="2.1" fill="#fff" />
              <circle cx={x + 2} cy="53" r=".8" fill="#fff" opacity=".8" />
            </g>
          ))}
        </g>
        <ellipse cx="26" cy="59" rx="6" ry="3" fill="#efacb7" opacity=".8" />
        <ellipse cx="74" cy="59" rx="6" ry="3" fill="#efacb7" opacity=".8" />
        {kind === "penguin" ? (
          <path d="M44 59Q50 55 56 59L50 65Z" fill="#eab580" />
        ) : kind === "otter" ? (
          <>
            <path
              d="M46 57Q50 54 54 57Q53 62 50 62Q47 62 46 57"
              fill="#65463f"
            />
            <path
              d="M50 62V65M50 65Q45 69 42 65M50 65Q55 69 58 65M25 60L17 58M25 63L17 64M75 60L83 58M75 63L83 64"
              stroke="#94664d"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path
            d="M44 61Q50 68 56 61"
            stroke="#876577"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
        {kind === "otter" ? (
          <>
            <ellipse
              cx="50"
              cy="83"
              rx="10"
              ry="8"
              fill="#8caaa5"
              stroke="#658681"
            />
            <path
              d="M45 80Q48 77 51 79"
              stroke="#c3d4c9"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <g className="mascot-paw" fill="#c18b67">
              <ellipse
                cx="37"
                cy="82"
                rx="8"
                ry="5"
                transform="rotate(30 37 82)"
              />
              <ellipse
                cx="63"
                cy="82"
                rx="8"
                ry="5"
                transform="rotate(-30 63 82)"
              />
            </g>
          </>
        ) : (
          <g className="mascot-paw" fill={colors[0]}>
            <ellipse
              cx="30"
              cy="81"
              rx="7"
              ry="5"
              transform="rotate(25 30 81)"
            />
            <ellipse
              cx="70"
              cy="81"
              rx="7"
              ry="5"
              transform="rotate(-25 70 81)"
            />
          </g>
        )}
        {kind !== "penguin" && (
          <g fill={colors[0]} stroke={colors[1]} strokeWidth=".7">
            <ellipse cx="36" cy="99" rx="11" ry="5" />
            <ellipse cx="64" cy="99" rx="11" ry="5" />
          </g>
        )}
      </g>
    </svg>
  );
}
