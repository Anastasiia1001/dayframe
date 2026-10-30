import { Mascot } from "./Mascot";
import type { MascotId } from "../appearance";
import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, ExternalLink, Pause, Play } from "lucide-react";
import { askAssistant, type AssistantMessage } from "../domain/assistant";
import { useLocal } from "../useLocal";
import type { CareEntry as Entry } from "../domain/selfCare";
export function PlannerCare({ today }: { today: string }) {
  const [entries, setEntries] = useLocal<Record<string, Entry>>(
    "dayframe-self-care",
    {},
  );
  const [snoozed, setSnoozed] = useLocal("dayframe-care-snoozed", 0);
  const [seconds, setSeconds] = useState(0),
    [running, setRunning] = useState(false);
  const entry = entries[today] || { mood: 0, need: "rest", notes: "" };
  const save = (patch: Partial<Entry>) =>
    setEntries((all) => ({
      ...all,
      [today]: {
        ...(all[today] || { mood: 0, need: "rest", notes: "" }),
        ...patch,
      },
    }));
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setSeconds((n) => Math.max(0, n - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (running && seconds === 0) setRunning(false);
  }, [seconds, running]);
  const suggestions: Record<string, string> = {
    rest: "Можна зробити паузу. Влаштуйся зручніше й на хвилину відклади вимоги до себе. Відпочинок не потрібно заслужити.",
    focus:
      "Обери одну невелику справу. Який перший крок можна зробити за дві хвилини? Решту поки залишимо у планах.",
    talk: "Спробуй назвати те, що відчуваєш, без оцінки: «Зараз я…». За бажанням запиши думку або поговори з близькою людиною.",
  };
  return (
    <section
      className="today-card planner-care"
      aria-label="Турбота про себе"
      id="planner-care"
    >
      <header className="weather-top">
        <h2>
          <Heart size={19} />
          Тут можна видихнути
        </h2>
        <span className="care-label">Помічник самопідтримки</span>
      </header>
      <p>
        Як ти сьогодні? Це простір для власних відчуттів, не психотерапія чи
        діагностика. Записи залишаються у твоєму браузері.
      </p>
      {Date.now() < snoozed ? (
        <button onClick={() => setSnoozed(0)}>Я готова поговорити</button>
      ) : (
        <>
          <div className="care-moods" role="group" aria-label="Як я почуваюся">
            {["Важко", "Втомлено", "Нейтрально", "Добре", "Чудово"].map(
              (label, i) => (
                <button
                  key={label}
                  aria-pressed={entry.mood === i + 1}
                  onClick={() => save({ mood: i + 1 })}
                >
                  <span aria-hidden="true">{["◔", "◕", "◒", "◑", "●"][i]}</span>
                  {label}
                </button>
              ),
            )}
          </div>
          <label>
            Що зараз було б корисно?
            <select
              value={entry.need}
              onChange={(e) => save({ need: e.target.value })}
            >
              <option value="rest">Пауза й відпочинок</option>
              <option value="focus">Допомога з фокусом</option>
              <option value="talk">Проговорити свої думки</option>
            </select>
          </label>
          {entry.mood > 0 && (
            <p className="care-response">
              {entry.mood <= 2
                ? "Дякую, що помітила свій стан. Не обов’язково зараз бути продуктивною. "
                : ""}
              {suggestions[entry.need]}
            </p>
          )}
          <label>
            Місце для думок
            <textarea
              aria-label="Місце для думок"
              rows={3}
              maxLength={10000}
              value={entry.notes}
              onChange={(e) => save({ notes: e.target.value })}
              placeholder="Що забирає сили, а що могло б підтримати?"
            />
          </label>
          <div className="care-actions">
            <button
              onClick={() => {
                if (!seconds) setSeconds(60);
                setRunning(!running);
              }}
            >
              {running ? <Pause size={16} /> : <Play size={16} />}{" "}
              {running
                ? `Пауза для себе · ${seconds} с`
                : seconds
                  ? "Продовжити паузу"
                  : "Хвилина для себе"}
            </button>
            <button onClick={() => setSnoozed(Date.now() + 2 * 60 * 60 * 1000)}>
              Запитати мене пізніше
            </button>
          </div>
          {running && (
            <div className="care-breath" role="status">
              <span aria-hidden="true" />
              Можна просто посидіти спокійно. Нічого виконувати не потрібно.
            </div>
          )}
        </>
      )}
    </section>
  );
}
export function ChatGPTQuestions({
  apiKey,
  onKey,
  mascot = "bunny",
  onSettings,
}: {
  apiKey: string;
  onKey: (key: string) => void;
  mascot?: MascotId;
  onSettings?: () => void;
}) {
  const [question, setQuestion] = useState(""),
    [messages, setMessages] = useState<AssistantMessage[]>([]),
    [mode, setMode] = useState<"planning" | "care">("planning"),
    [model, setModel] = useLocal("dayframe-openai-model", "gpt-4.1-mini"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const submit = async () => {
    if (!question.trim() || busy) return;
    setError("");
    const prompt = question.trim();
    const previous =
      messages.at(-1)?.role === "user" && messages.at(-1)?.content === prompt
        ? messages.slice(0, -1)
        : messages;
    const next: AssistantMessage[] = [
      ...previous,
      { role: "user", content: prompt },
    ];
    setMessages(next);
    setBusy(true);
    const request = new AbortController();
    controller.current = request;
    const timer = setTimeout(() => request.abort(), 90000);
    try {
      const answer = await askAssistant({
        apiKey,
        model,
        messages: next,
        mode,
        signal: request.signal,
      });
      if (!request.signal.aborted) {
        setMessages([...next, { role: "assistant", content: answer }]);
        setQuestion((current) => (current.trim() === prompt ? "" : current));
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не вдалося отримати відповідь.",
      );
    } finally {
      clearTimeout(timer);
      if (controller.current === request) {
        setBusy(false);
        controller.current = null;
      }
    }
  };
  return (
    <section
      className="today-card planner-chat"
      aria-label="Запитати ChatGPT"
      id="planner-chat"
    >
      <header className="weather-top">
        <h2>
          <span className="assistant-chat-mascot" aria-hidden="true">
            <Mascot kind={mascot} />
          </span>
          Чат із помічником
        </h2>
        <span className="care-label">OpenAI API · всередині Dayframe</span>
      </header>
      <p>
        Відповіді з’являються тут. На запит до OpenAI передається лише текст
        цього чату; завдання, щоденник та дані здоров’я автоматично не
        додаються.
      </p>
      <button onClick={onSettings}>
        Налаштування помічника · API та модель
      </button>
      <label>
        Як допомогти?
        <select
          aria-label="Режим помічника"
          value={mode}
          onChange={(e) => setMode(e.target.value as "planning" | "care")}
        >
          <option value="planning">Плани та запитання</option>
          <option value="care">Підтримка й самопочуття</option>
        </select>
      </label>
      <div
        className="assistant-conversation"
        role="log"
        aria-label="Розмова з помічником"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <article key={i} className={`assistant-message message-${m.role}`}>
            <strong>{m.role === "user" ? "Ти" : "Помічник"}</strong>
            <p>{m.content}</p>
          </article>
        ))}
        {!messages.length && (
          <p>
            Можна почати з «Як спростити мій день?» або просто розповісти, як ти
            почуваєшся.
          </p>
        )}
        {busy && <p role="status">Помічник готує відповідь…</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label>
          Питання для ChatGPT
          <textarea
            aria-label="Питання для ChatGPT"
            required
            maxLength={6000}
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Напиши своє запитання або думку"
          />
        </label>
        <div className="care-actions">
          <button
            type="submit"
            disabled={busy || !question.trim() || !apiKey.trim()}
          >
            <MessageCircle size={16} />
            Надіслати помічнику
          </button>
          {busy && (
            <button type="button" onClick={() => controller.current?.abort()}>
              Зупинити відповідь
            </button>
          )}
          {messages.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMessages([]);
                setError("");
                setQuestion("");
              }}
            >
              Очистити розмову
            </button>
          )}
        </div>
      </form>
      {!apiKey && <p>Додай API-ключ у підключенні вище, щоб почати розмову.</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
