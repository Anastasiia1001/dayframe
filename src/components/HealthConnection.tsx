import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Heart, RefreshCw } from "lucide-react";
import {
  mergeHealth,
  validateHealthSnapshot,
  type HealthSnapshot,
} from "../domain/health";
import { writeBackup } from "../domain/backup";
import type { FitnessData } from "../domain/fitness";
import { useLocal } from "../useLocal";
const Health = registerPlugin<{
  authorize(): Promise<{ requestCompleted: boolean }>;
  read(): Promise<HealthSnapshot>;
}>("DayframeHealth");
export function HealthConnection({
  onData,
  compact = false,
}: {
  compact?: boolean;
  onData: (update: (old: FitnessData) => FitnessData) => void;
}) {
  const available =
    Capacitor.getPlatform() === "ios" &&
    Capacitor.isPluginAvailable("DayframeHealth");
  const [enabled, setEnabled] = useLocal("dayframe-health-enabled", false);
  const [last, setLast] = useLocal("dayframe-health-last-read", "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [empty, setEmpty] = useState(false);
  const locked = useRef(false),
    callback = useRef(onData);
  callback.current = onData;
  const sync = useCallback(
    async (authorize = false) => {
      if (!available || locked.current) return;
      locked.current = true;
      setBusy(true);
      setError("");
      try {
        if (authorize) await Health.authorize();
        const value = await Health.read();
        // Validate before passing into React's state updater so a rejected response is a recoverable error.
        validateHealthSnapshot(value);
        const old = JSON.parse(
          localStorage.getItem("dayframe-fitness") || "null",
        ) || { goal: 8000, days: {} };
        const merged = mergeHealth(old, value);
        writeBackup(localStorage, { "dayframe-fitness": merged });
        callback.current(() => merged);
        window.dispatchEvent(new Event("dayframe-import"));
        setEnabled(true);
        setLast(value.readAt);
        setEmpty(!value.days.length && !value.workouts.length);
      } catch {
        setError(
          "Не вдалося прочитати або зберегти дані. Розблокуй iPhone, перевір вільне місце та доступ до кроків і тренувань у налаштуваннях «Здоров’я».",
        );
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
    [available, setEnabled, setLast],
  );
  // useLocal setters are stable. Refresh only while this view is open and visible, never a hidden background promise.
  useEffect(() => {
    if (!enabled || !available) return;
    const refresh = () => {
      if (!document.hidden) void sync();
    };
    refresh();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    const timer = setInterval(refresh, 5 * 60 * 1000);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [enabled, available, sync]);
  if (compact && !available) return null;
  return (
    <aside className="health-connection">
      <div>
        <Heart size={20} />
        <strong>Apple «Здоров’я»</strong>
      </div>
      {available ? (
        <>
          <p>
            Кроки та тренування за 30 днів. Лише читання, без сервера. Під час
            оновлення кроки за ці дні замінюються даними «Здоров’я»; ручні
            вправи залишаються.
          </p>
          <button disabled={busy} onClick={() => void sync(!enabled)}>
            <RefreshCw size={16} />
            {busy
              ? "Читаємо…"
              : enabled
                ? "Оновити зі Здоров’я"
                : "Дозволити читання зі Здоров’я"}
          </button>
          {enabled && (
            <button
              disabled={busy}
              onClick={() => {
                setEnabled(false);
                setLast("");
                setEmpty(false);
              }}
            >
              Зупинити оновлення
            </button>
          )}
          {last && (
            <small>
              Останнє читання: {new Date(last).toLocaleString("uk-UA")}. Доступ
              до окремих типів даних визначає iOS.
            </small>
          )}
          {empty && (
            <p role="status">
              Доступних даних немає. Перевір дозволи на кроки й тренування.
              Ручні записи збережено.
            </p>
          )}
          {error && <p role="alert">{error}</p>}
        </>
      ) : (
        <p>
          Автоматичне читання доступне в iOS-застосунку Dayframe. У Safari та
          версії «На початковий екран» Apple не надає доступу до «Здоров’я».
          iOS-версію ще потрібно зібрати й установити на iPhone; тут доступний
          ручний трекер.
        </p>
      )}
    </aside>
  );
}
