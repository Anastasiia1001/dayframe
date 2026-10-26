import { MascotCharms } from "./MascotCharms";
import type { PersonalTask } from "../types";
import type { TaskReminder } from "../useTaskReminders";
import { useLocal } from "../useLocal";
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
  tasks = [],
  today = "",
  alerts = [],
  onOpenTask,
  onOpenChat,
}: {
  mascot?: MascotId;
  burst?: number;
  tasks?: PersonalTask[];
  today?: string;
  alerts?: TaskReminder[];
  onOpenTask?: (task: PersonalTask) => void;
  onOpenChat?: () => void;
}) {
  const [note, setNote] = useState(0),
    [play, setPlay] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const [snoozed, setSnoozed] = useLocal<Record<string, number>>(
    "dayframe-assistant-snoozed",
    {},
  );
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  const pending = tasks.filter(
    (t) =>
      !t.completed &&
      !t.disabled &&
      !t.isTemplate &&
      !t.inBacklog &&
      t.date === today &&
      (snoozed[t.id] || 0) <= tick,
  );
  const reminder = alerts.find((alert) => (snoozed[alert.id] || 0) <= tick);
  const current = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(tick);
  const upcoming = pending
    .filter((t) => t.scheduledStart && t.scheduledStart >= current)
    .sort((a, b) =>
      (a.scheduledStart || "").localeCompare(b.scheduledStart || ""),
    )[0];
  const focus = reminder
    ? tasks.find(
        (t) =>
          (reminder.taskId
            ? t.id === reminder.taskId
            : t.title === reminder.title) && !t.completed,
      )
    : upcoming || pending.find((t) => t.priority === "High") || pending[0];
  const suggestion = focus
    ? reminder
      ? `Нагадую: ${reminder.time} — ${reminder.title}`
      : upcoming
        ? `Найближча справа о ${upcoming.scheduledStart}: ${upcoming.title}`
        : `Можемо почати з маленького кроку: ${focus.title}`
    : "";
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
        {play && <MascotCharms key={`charms:${note}:${burst}`} />}
      </button>
      <div className="cozy-copy">
        <span className="cozy-label">
          <Sparkles size={12} /> СПРАВИ З ТУРБОТОЮ ПРО СЕБЕ
        </span>
        <p key={note} aria-live="polite">
          {suggestion || notes[note % notes.length]}
        </p>
      </div>
      {focus && (
        <div className="mascot-assistant-actions">
          <button onClick={() => onOpenTask?.(focus)}>Відкрити справу</button>
          <button
            onClick={() => {
              setSnoozed((old) => ({
                ...old,
                [focus.id]: Date.now() + 15 * 60000,
                ...(reminder ? { [reminder.id]: Date.now() + 15 * 60000 } : {}),
              }));
              setTick(Date.now());
            }}
          >
            Нагадати за 15 хв
          </button>
        </div>
      )}
      {onOpenChat && (
        <div className="mascot-assistant-actions">
          <button onClick={onOpenChat}>Поговорити з помічником</button>
        </div>
      )}
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
