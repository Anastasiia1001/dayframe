import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { type MascotId } from "../appearance";
import { Mascot } from "./Mascot";
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
  const button = useRef<HTMLButtonElement>(null);
  const [interaction, setInteraction] = useState(0);
  useEffect(() => {
    if (greeting < 0) return;
    const timer = setTimeout(() => setGreeting(-1), 2600);
    return () => clearTimeout(timer);
  }, [greeting]);
  return (
    <>
      <button
        ref={button}
        className={`calendar-companion ${greeting >= 0 ? "is-greeting" : ""}`}
        aria-label="Привітатися з помічником"
        onClick={() => {
          setGreeting(count.current++ % greetings.length);
          setInteraction((value) => value + 1);
        }}
      >
        <div
          className="theme-mascot-vignette"
          data-decoration={theme}
          aria-hidden="true"
        >
          <Mascot key={`${mascot}:${interaction}`} kind={mascot} />
        </div>
      </button>
      {greeting >= 0 &&
        button.current &&
        createPortal(
          <div className="companion-reply" role="status">
            <span className="companion-reply-bubble">
              {greetings[greeting]}
            </span>
          </div>,
          button.current.closest(".studio-header,.planner-cover") ||
            button.current.parentElement!,
        )}
    </>
  );
}
