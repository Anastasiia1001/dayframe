import { useId } from "react";

/** One consistent textured illustration, articulated with SVG masks rather than recoloured. */
export function PugMascot() {
  const id = useId().replace(/:/g, "");
  const art = (
    <image
      href={`${import.meta.env.BASE_URL}assets/mascots/pug-plush.png`}
      x="4"
      y="2"
      width="92"
      height="102"
    />
  );
  const tail = "M79 67Q92 61 95 72Q98 80 82 85L78 79Z";
  return (
    <svg
      className="bunny mascot-art mascot-pug mascot-pug-plush"
      viewBox="0 0 100 110"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <filter
          id={`${id}-lid-feather`}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feGaussianBlur stdDeviation=".8" />
        </filter>
        <mask
          id={`${id}-body`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100"
          height="110"
        >
          <rect width="100" height="110" fill="white" />
          <path d={tail} fill="black" />
        </mask>
        <clipPath id={`${id}-tail`}>
          <path d={tail} />
        </clipPath>
        <clipPath id={`${id}-left-eye`}>
          <ellipse cx="31.7" cy="34" rx="12.4" ry="13.4" />
        </clipPath>
        <clipPath id={`${id}-right-eye`}>
          <ellipse cx="68.6" cy="35.2" rx="12.4" ry="13.4" />
        </clipPath>
        <mask
          id={`${id}-face`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100"
          height="110"
        >
          <rect width="100" height="110" fill="white" />
          <ellipse
            cx="31.7"
            cy="34"
            rx="10.8"
            ry="11.8"
            fill="black"
            filter={`url(#${id}-lid-feather)`}
          />
          <ellipse
            cx="68.6"
            cy="35.2"
            rx="10.8"
            ry="11.8"
            fill="black"
            filter={`url(#${id}-lid-feather)`}
          />
        </mask>
        {[
          [31.7, 34],
          [68.6, 35.2],
        ].map(([x, y], i) => (
          <clipPath
            key={i}
            id={`${id}-shutter-${i}`}
            clipPathUnits="userSpaceOnUse"
          >
            <rect
              className={i ? "mascot-eye-right" : "mascot-eye-left"}
              x={x - 15}
              y={y - 16}
              width="30"
              height="32"
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          </clipPath>
        ))}
      </defs>
      <ellipse
        className="mascot-shadow"
        cx="50"
        cy="104"
        rx="30"
        ry="2.5"
        fill="#6c5445"
        opacity=".12"
      />
      <g className="mascot-body">
        <g className="pug-tail">
          <g clipPath={`url(#${id}-tail)`}>{art}</g>
        </g>
        <g mask={`url(#${id}-body)`}>
          {["left", "right"].map((side) => (
            <g
              key={side}
              className="mascot-lid-texture"
              clipPath={`url(#${id}-${side}-eye)`}
            >
              <g transform="translate(0, 19)">{art}</g>
            </g>
          ))}
          <path
            d="M25 35Q31.7 38 38 35M62 36Q68.6 39 75 36"
            stroke="#2e2323"
            strokeWidth=".7"
            strokeLinecap="round"
          />
          <g mask={`url(#${id}-face)`}>{art}</g>
          <g className="mascot-eyes">
            <g clipPath={`url(#${id}-shutter-0)`}>
              <ellipse cx="31.7" cy="34" rx="8.4" ry="9.4" fill="#473b38" />
              <g clipPath={`url(#${id}-left-eye)`}>{art}</g>
            </g>
            <g clipPath={`url(#${id}-shutter-1)`}>
              <ellipse cx="68.6" cy="35.2" rx="8.4" ry="9.4" fill="#473b38" />
              <g clipPath={`url(#${id}-right-eye)`}>{art}</g>
            </g>
          </g>
        </g>
        <path
          className="mascot-mouth-rest"
          d="M47 51.2Q50 49.9 53 51.2"
          stroke="#392c2b"
          strokeWidth=".5"
          strokeLinecap="round"
        />
        <path
          className="mascot-smile"
          d="M46 50.8Q50 53.1 54 50.8"
          stroke="#392c2b"
          strokeWidth=".65"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
