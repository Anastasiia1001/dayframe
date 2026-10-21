import { useEffect, useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import { Mascot } from "./Mascot";
import { mascots, type MascotId } from "../appearance";
const notes = [
  "Маленькі кроки теж ведуть уперед. Ти молодець.",
  "Ковток води, глибокий вдих. У тебе все вийде.",
  "Щоб день був хорошим, не обов’язково встигнути все.",
  "Маленька перемога заслуговує на маленький танець радості.",
  "Ти заслуговуєш на перерву й щось смачненьке.",
  "Не поспішай. Ми рухаємося у твоєму ритмі.",
];
export function CozyCompanion({
  mascot = "bunny",
  burst = 0,
}: {
  mascot?: MascotId;
  burst?: number;
}) {
  const [note, setNote] = useState(0),
    [play, setPlay] = useState(false);
  useEffect(() => {
    if (!burst && !note) return;
    setPlay(true);
    const timer = setTimeout(() => setPlay(false), 2200);
    return () => clearTimeout(timer);
  }, [burst, note]);
  return (
    <div className={`cozy-note ${play ? "companion-celebrating" : ""}`}>
      <button
        className={`bunny-button ${play ? "is-playing" : ""}`}
        aria-label="Трохи підтримки"
        title={mascots.find((m) => m.id === mascot)?.name}
        onClick={() => {
          setNote((n) => n + 1);
          setPlay(true);
        }}
        onAnimationEnd={(e) => {
          if (e.animationName === "storybook-bounce") setPlay(false);
        }}
      >
        <Mascot key={mascot + ":" + note + ":" + burst} kind={mascot} />
        <span className="bunny-heart" aria-hidden="true">
          ♡
        </span>
      </button>
      <div className="cozy-copy">
        <span className="cozy-label">
          <Sparkles size={12} /> СПРАВИ З ТУРБОТОЮ ПРО СЕБЕ
        </span>
        <p key={note} aria-live="polite">
          {notes[note % notes.length]}
        </p>
      </div>
      <span className="cozy-signoff">
        <Heart size={13} /> Одна маленька справа за раз
      </span>
    </div>
  );
}
export function HappyPetals({ burst }: { burst: number }) {
  if (!burst) return null;
  return (
    <div
      className="happy-petals storybook-petals"
      key={burst}
      aria-hidden="true"
    >
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--i": i,
              "--x": `${(i - 6.5) * 24}px`,
              "--y": `${-95 - Math.sin((i / 13) * Math.PI) * 65}px`,
              "--spin": `${(i - 6) * 32}deg`,
            } as import("react").CSSProperties
          }
        >
          {["♡", "✦", "✿", "✧"][i % 4]}
        </span>
      ))}
    </div>
  );
}
