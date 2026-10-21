import { useState, useEffect } from "react";
export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    const refresh = () => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) setValue(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener("dayframe-import", refresh);
    return () => window.removeEventListener("dayframe-import", refresh);
  }, [key]);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(
        new CustomEvent("dayframe-storage", { detail: { key, ok: true } }),
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent("dayframe-storage", { detail: { key, ok: false } }),
      );
    }
  }, [key, value]);
  return [value, setValue] as const;
}
