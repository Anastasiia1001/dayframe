import { useEffect, useState, type CSSProperties } from "react";
const motifs: Record<string, string> = {
  Default: "flower", Blossom: "flower", Strawberry: "flower", Peach: "flower",
  Green: "leaf", Pistachio: "leaf", Lagoon: "leaf", Warm: "leaf",
  Blue: "cloud", Blueberry: "cloud", Graphite: "cloud",
  Purple: "star", Dark: "star", Moonlight: "star",
};
export function ThemeAtmosphere({ theme }: { theme: string }) {
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const motif = motifs[theme] || "flower";
  return <div className="theme-atmosphere" data-motif={motif} data-paused={hidden} aria-hidden="true">
    {Array.from({ length: 12 }, (_, i) => <svg key={`${motif}-${i}`} viewBox="0 0 40 40" style={{ "--x": `${(i * 37 + 5) % 100}%`, "--delay": `${-i * 3.7}s`, "--duration": `${26 + i % 5 * 4}s`, "--size": `${18 + i % 4 * 7}px` } as CSSProperties}>
      {motif === "leaf" ? <><path d="M32 5C8 3 2 19 12 29C23 39 37 24 32 5Z"/><path className="ambient-vein" d="M9 34L27 13M18 24L17 16M22 20L29 20"/></> : motif === "cloud" ? <path d="M10 30C-1 30 0 16 10 16C9 2 30 1 31 16C43 14 44 30 32 30Z"/> : motif === "star" ? <path d="M20 2L25 14L38 20L25 25L20 38L15 25L2 20L15 14Z"/> : <><path d="M20 17C0-5 0 20 15 22C-4 38 21 44 22 26C40 46 45 18 26 19C43 0 18-5 20 17Z"/><circle cx="21" cy="21" r="3" className="ambient-center"/></>}
    </svg>)}
  </div>;
}
