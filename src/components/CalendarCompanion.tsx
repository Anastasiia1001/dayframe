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
  const [greeting, setGreeting] = useState(0);
  const [host, setHost] = useState<Element | null>(null);
  const [playing, setPlaying] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const [interaction, setInteraction] = useState(0);
  useEffect(() => {
    setHost(button.current?.closest(".studio-header,.planner-cover") ||
      button.current?.parentElement || null);
    const timer = setInterval(() => {
      setGreeting((value) => (value + 1) % greetings.length);
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setPlaying(false), 2200);
    return () => clearTimeout(timer);
  }, [playing, interaction]);
  return (
    <>
      <button
        ref={button}
        className={`calendar-companion ${playing ? "is-greeting" : ""}`}
        aria-label="Привітатися з помічником"
        onClick={() => {
          setPlaying(true);
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
      {host &&
        createPortal(
          <div className="companion-reply">
            <span className="companion-phrase">
              {greetings[greeting]}
            </span>
          </div>,
          host,
        )}
    </>
  );
}
