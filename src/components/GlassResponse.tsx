import { useEffect } from "react";
/** Local pointer lighting, no transforms: calendar drag coordinates stay stable. */
export function GlassResponse() {
  useEffect(() => {
    const media = matchMedia(
      "(hover:hover) and (prefers-reduced-motion:no-preference)",
    );
    const selector =
      ".today-card,.card,.habit-sheet,.today-board-column,.fitness-card,.studio-navigation,.studio-backlog";
    let frame = 0,
      point = { x: -1000, y: -1000 };
    const lit = new Set<HTMLElement>();
    const clear = () => {
      lit.forEach((el) => {
        delete el.dataset.glassNear;
        el.style.removeProperty("--glass-x");
        el.style.removeProperty("--glass-y");
      });
      lit.clear();
    };
    const paint = () => {
      frame = 0;
      if (!media.matches) {
        clear();
        return;
      }
      const next = new Set<HTMLElement>();
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
        const dx = Math.max(r.left - point.x, 0, point.x - r.right),
          dy = Math.max(r.top - point.y, 0, point.y - r.bottom);
        if (Math.hypot(dx, dy) < 65) {
          next.add(el);
          el.dataset.glassNear = "true";
          el.style.setProperty("--glass-x", `${point.x - r.left}px`);
          el.style.setProperty("--glass-y", `${point.y - r.top}px`);
        }
      });
      lit.forEach((el) => {
        if (!next.has(el)) delete el.dataset.glassNear;
      });
      lit.clear();
      next.forEach((el) => lit.add(el));
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      point = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", clear);
    window.addEventListener("blur", clear);
    return () => {
      cancelAnimationFrame(frame);
      clear();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", clear);
      window.removeEventListener("blur", clear);
    };
  }, []);
  return null;
}
