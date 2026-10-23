import { useEffect, useRef } from "react";
export function PlannerMonthRail({
  date,
  onSelect,
}: {
  date: Date;
  onSelect: (date: Date) => void;
}) {
  const rail = useRef<HTMLElement>(null);
  const month = date.getMonth(),
    year = date.getFullYear();
  useEffect(() => {
    const active = rail.current?.querySelector<HTMLElement>(
      "[aria-pressed=true]",
    );
    if (active && rail.current)
      rail.current.scrollLeft = Math.max(
        0,
        active.offsetLeft -
          rail.current.offsetLeft -
          rail.current.clientWidth / 2 +
          active.clientWidth / 2,
      );
  }, [month, year]);
  return (
    <nav
      className="planner-month-rail"
      aria-label={`Місяці планера ${year}`}
      ref={rail}
    >
      {Array.from({ length: 12 }, (_, i) => {
        const d = new Date(year, i, 1, 12);
        return (
          <button
            key={i}
            aria-label={`Перейти: ${d.toLocaleDateString("uk-UA", { month: "long", year: "numeric" })}`}
            aria-pressed={month === i}
            onClick={() => onSelect(d)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {d.toLocaleDateString("uk-UA", { month: "long" })}
          </button>
        );
      })}
    </nav>
  );
}
