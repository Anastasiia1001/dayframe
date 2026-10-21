import { useEffect, useRef, useState, type CSSProperties } from "react";
type Pulse = {
  id: number;
  x: number;
  y: number;
  motif: string;
  strong: boolean;
};
const motifFor = (theme: string) =>
  ["Green", "Pistachio", "Lagoon", "Vintage", "Warm"].includes(theme)
    ? "leaf"
    : ["Dark", "Moonlight", "Blueberry", "Parchment", "NeonAzure", "NeonOcean", "NeonCobalt", "NeonAurora", "NeonIce"].includes(theme)
      ? "star"
      : ["Blue", "Graphite"].includes(theme)
        ? "cloud"
        : ["Purple", "Blossom"].includes(theme)
          ? "flower"
          : "heart";
function Glyph({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {kind === "heart" ? (
        <path d="M12 21C8 18 2 13 2 8C2 2 9 1 12 6C15 1 22 2 22 8C22 13 16 18 12 21Z" />
      ) : kind === "leaf" ? (
        <>
          <path d="M20 3C4 0 0 12 7 18C15 24 23 14 20 3Z" />
          <path
            d="M4 21L17 7"
            fill="none"
            stroke="var(--surface)"
            strokeWidth="1.5"
          />
        </>
      ) : kind === "cloud" ? (
        <path d="M6 19C-1 19 0 10 6 10C6 0 18 1 18 10C26 9 26 19 19 19Z" />
      ) : kind === "flower" ? (
        <>
          <path d="M12 9C1-4-3 13 9 14C-2 23 15 29 14 16C24 28 30 10 16 10C27-1 9-6 12 9Z" />
          <circle cx="13" cy="13" r="2" fill="var(--surface)" />
        </>
      ) : (
        <path d="M12 1L15 8L23 12L15 15L12 23L9 15L1 12L9 9Z" />
      )}
    </svg>
  );
}
export function TouchFeedback() {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const sequence = useRef(0);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let pressed: HTMLElement | null = null;
    let origin: { x: number; y: number; id: number } | null = null;
    const clearPress = () => {
      if (pressed) delete pressed.dataset.touchPressed;
      pressed = null;
    };
    const addPulse = (target: HTMLElement, x: number, y: number) => {
      if (reduced.matches) return;
      const strong = target.matches("input[type=checkbox]")
        ? !(target as HTMLInputElement).checked
        : /^Виконати/.test(target.getAttribute("aria-label") || "");
      const id = ++sequence.current;
      setPulses((all) => [
        ...all.slice(-4),
        {
          id,
          x,
          y,
          motif: motifFor(document.documentElement.dataset.theme || "Default"),
          strong,
        },
      ]);
      const timer = setTimeout(() => {
        setPulses((all) => all.filter((p) => p.id !== id));
        timers.delete(timer);
      }, 850);
      timers.add(timer);
      return id;
    };
    const down = (event: PointerEvent) => {
      if (
        event.button !== 0 ||
        !event.isPrimary ||
        !(event.target instanceof Element)
      )
        return;
      const target = event.target.closest<HTMLElement>(
        "button,summary,input[type=checkbox],a[href]",
      );
      if (
        !target ||
        !target.isConnected ||
        target.matches(":disabled,[aria-disabled=true]")
      )
        return;
      clearPress();
      pressed = target;
      target.dataset.touchPressed = "true";
      const id = addPulse(target, event.clientX, event.clientY);
      if (id) origin = { x: event.clientX, y: event.clientY, id };
    };
    const move = (event: PointerEvent) => {
      if (
        origin &&
        Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 12
      ) {
        const id = origin.id;
        setPulses((all) => all.filter((p) => p.id !== id));
        origin = null;
        clearPress();
      }
    };
    const up = () => {
      clearPress();
      origin = null;
    };
    const keyboard = (event: MouseEvent) => {
      if (event.detail !== 0 || !(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>(
        "button,summary,input[type=checkbox],a[href]",
      );
      if (
        !target ||
        !target.isConnected ||
        target.matches(":disabled,[aria-disabled=true]")
      )
        return;
      const rect = target.getBoundingClientRect();
      addPulse(target, rect.x + rect.width / 2, rect.y + rect.height / 2);
    };
    const reset = () => {
      up();
      if (reduced.matches) setPulses([]);
    };
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointercancel", up, { passive: true });
    document.addEventListener("dragstart", up);
    document.addEventListener("click", keyboard);
    window.addEventListener("blur", up);
    reduced.addEventListener("change", reset);
    return () => {
      up();
      timers.forEach(clearTimeout);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("dragstart", up);
      document.removeEventListener("click", keyboard);
      window.removeEventListener("blur", up);
      reduced.removeEventListener("change", reset);
    };
  }, []);
  return (
    <div className="touch-feedback" aria-hidden="true">
      {pulses.map((p) => (
        <div
          key={p.id}
          className={`touch-pulse ${p.strong ? "touch-success" : ""}`}
          data-motif={p.motif}
          style={{ left: p.x, top: p.y } as CSSProperties}
        >
          <span className="touch-ring" />
          {Array.from({ length: p.strong ? 7 : 4 }, (_, i) => (
            <span
              className="touch-mote"
              key={i}
              style={
                {
                  "--angle": `${(i * 360) / (p.strong ? 7 : 4)}deg`,
                  "--flight": `${p.strong ? 42 : 25}px`,
                  "--turn": `${i * 65}deg`,
                } as CSSProperties
              }
            >
              <Glyph kind={p.motif} />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
