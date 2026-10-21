import { useEffect, useRef, useState } from "react";
import { type MascotId, isPlannerTheme } from "../appearance";
import { Mascot } from "./Mascot";
import { PlannerDecoration } from "./PlannerDecoration";
const greetings = [
  "Я поруч. Одна справа за раз!",
  "Маленький крок — теж перемога.",
  "Твоєму дню пасує трохи радості.",
  "Потягнись, усміхнись — і далі разом.",
];
export function CalendarCompanion({
  theme,
  mascot,
}: {
  theme: string;
  mascot: MascotId;
}) {
  const [greeting, setGreeting] = useState(-1);
  const count = useRef(0);
  useEffect(() => {
    if (greeting < 0) return;
    const timer = setTimeout(() => setGreeting(-1), 2600);
    return () => clearTimeout(timer);
  }, [greeting]);
  const clay = ["Pastel", "CutePlanner"].includes(theme);
  return (
    <button
      className={`calendar-companion ${clay ? "clay-companion" : ""} ${greeting >= 0 ? "is-greeting" : ""}`}
      aria-label="Привітатися з помічником"
      onClick={() => {
        setGreeting(count.current++ % greetings.length);
      }}
    >
      {greeting >= 0 && (
        <span className="companion-greeting" role="status">
          {greetings[greeting]}
        </span>
      )}
      {clay ? (
        <img
          className="planner-hero-art"
          data-decoration={theme}
          src={`${import.meta.env.BASE_URL}assets/planner/bunny-calendar.png`}
          alt=""
          aria-hidden="true"
        />
      ) : isPlannerTheme(theme) ? (
        <PlannerDecoration theme={theme} />
      ) : (
        <div className="theme-mascot-vignette" aria-hidden="true">
          <Mascot kind={mascot} />
        </div>
      )}
    </button>
  );
}
