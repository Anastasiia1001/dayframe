import { PlannerMonthRail } from "./PlannerMonthRail";
import { KeepImport } from "./KeepImport";
import { ManualAssistant } from "./ManualAssistant";
import { taskHorizon } from "../domain/horizons";
import { parseBackup, writeBackup } from "../domain/backup";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  PanelLeftClose,
  PanelRightClose,
  Search,
  Download,
  Upload,
  Undo2,
  Clock,
  Check,
  GripVertical,
  Palette,
  NotebookPen,
} from "lucide-react";
import type { CalendarEvent, PersonalTask } from "../types";
import { useLocal } from "../useLocal";
import { useDailyPlan } from "../dailyPlans";
import {
  addDays,
  dateKey,
  fromDate,
  layoutEvents,
  minutes,
  moveDate,
  eventOnDay,
} from "../domain/planning";
import {
  initialSections,
  quickEntry,
  scheduledEvents,
  timeString,
  type Section,
  type LocalOccurrence,
} from "../domain/studio";
import { CalendarCompanion } from "./CalendarCompanion";
import { themes, type MascotId } from "../appearance";

type Props = {
  tasks: PersonalTask[];
  onTasks: (tasks: PersonalTask[]) => void;
  events: CalendarEvent[];
  onExternal: (e: CalendarEvent) => void;
  date: Date;
  onDate: (d: Date) => void;
  view: string;
  onView: (v: string) => void;
  theme: string;
  mascot: MascotId;
  onLegacy: () => void;
  onTheme: (theme: string) => void;
  loading: boolean;
};
const localEvent = (e: CalendarEvent): e is LocalOccurrence => "taskId" in e;
const styleColor = (color: string) =>
  ({ "--section-color": color }) as CSSProperties;
export function CalendarStudio(p: Props) {
  const [sections, setSections] = useLocal<Section[]>(
    "dayframe-sections",
    initialSections,
  );
  const [leftPreference, setLeftPreference] = useLocal(
    "dayframe-calendar-left",
    true,
  );
  const [rightPreference, setRightPreference] = useLocal(
    "dayframe-calendar-right",
    innerWidth >= 1300,
  );
  const [mobile, setMobile] = useState(() => innerWidth < 760);
  const [mobilePanel, setMobilePanel] = useState<"left" | "right" | null>(null);
  const left = mobile ? mobilePanel === "left" : leftPreference;
  const right = mobile ? mobilePanel === "right" : rightPreference;
  const setLeft = (value: boolean) => {
    if (mobile)
      setMobilePanel((current) =>
        value ? "left" : current === "left" ? null : current,
      );
    else setLeftPreference(value);
  };
  const setRight = (value: boolean) => {
    if (mobile)
      setMobilePanel((current) =>
        value ? "right" : current === "right" ? null : current,
      );
    else setRightPreference(value);
  };
  const [inspected, setInspected] = useState<string | null>(null);
  const inspectedTask = p.tasks.find((t) => t.id === inspected);
  const [query, setQuery] = useState(""),
    [sectionEdit, setSectionEdit] = useState(false),
    [message, setMessage] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [storageErrors, setStorageErrors] = useState<string[]>([]);
  const storageError = storageErrors.length > 0;
  const [undo, setUndo] = useState<PersonalTask[] | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  const [bulkDate, setBulkDate] = useState("");
  const [draft, setDraft] = useState<PersonalTask | null>(null),
    [occurrence, setOccurrence] = useState<string | null>(null),
    [scope, setScope] = useState("one");
  const [quick, setQuick] = useState(""),
    [checkTitle, setCheckTitle] = useState(""),
    [attachmentError, setAttachmentError] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  const selection = useRef<{ day: string; start: number; y: number } | null>(
    null,
  );
  const suppressClick = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null),
    titleInput = useRef<HTMLInputElement>(null),
    importInput = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(new Date());
  const drag = useRef<{
    id: string;
    occurrence: string;
    date: string;
    start: number;
    duration: number;
    action: "move" | "resize";
    x: number;
    y: number;
    node: HTMLElement;
    kind?: "task" | "event";
    grabOffset?: number;
    captureRoot?: boolean;
    moved?: boolean;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    id: string;
    date: string;
    start: number;
    duration: number;
  } | null>(null);
  const previewRef = useRef<{
    id: string;
    date: string;
    start: number;
    duration: number;
    timed: boolean;
    x: number;
    y: number;
  } | null>(null);
  const [dragGhost, setDragGhost] = useState<{
    title: string;
    x: number;
    y: number;
    date: string;
    start: number;
    timed: boolean;
  } | null>(null);
  const key = dateKey(p.date),
    view = mobile && p.view === "Week" ? "Day" : p.view;
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Kyiv",
  }).format(now);
  const { plan, update } = useDailyPlan(key);
  const first = new Date(p.date);
  if (view === "Month") first.setDate(1);
  if (view === "Month" || view === "Week")
    first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const days = Array.from(
    { length: view === "Month" ? 42 : view === "Week" ? 7 : 1 },
    (_, i) => addDays(dateKey(first), i),
  );
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 8 * 60;
  }, [view]);
  const sectionOf = (t: PersonalTask) =>
    sections.find((s) => s.id === (t.sectionId || "personal")) || sections[0];
  const visibleTasks = p.tasks.filter(
    (t) => !t.isTemplate && !t.disabled && sectionOf(t)?.visible !== false,
  );
  const locals = scheduledEvents(visibleTasks, days[0], days.at(-1)!);
  const allEvents: CalendarEvent[] = [...p.events, ...locals];
  const [externalVisible, setExternalVisible] = useLocal(
    "dayframe-studio-external",
    true,
  );
  const events = allEvents.filter(
    (e) =>
      (localEvent(e) || externalVisible) &&
      (!query ||
        (
          e.title +
          " " +
          (localEvent(e)
            ? p.tasks.find((t) => t.id === e.taskId)?.notes || ""
            : "")
        )
          .toLocaleLowerCase("uk")
          .includes(query.toLocaleLowerCase("uk"))),
  );
  const scopeGroups = [
    { id: "year", name: "Рік" },
    { id: "quarter", name: "Квартал" },
    { id: "month", name: "Місяць" },
    { id: "week", name: "Тиждень" },
  ];
  const scopeOf = (task: PersonalTask) => {
    const horizon = taskHorizon(task);
    return horizon === "year" && task.category === "Quarter"
      ? "quarter"
      : horizon;
  };
  const scopedTasks = p.tasks.filter(
    (t) =>
      !t.completed &&
      !t.disabled &&
      sectionOf(t)?.visible !== false &&
      scopeGroups.some((group) => group.id === scopeOf(t)),
  );
  const createScope = (scope: string) => {
    create("");
    setDraft((task) =>
      task
        ? {
            ...task,
            inBacklog: true,
            planningHorizon:
              scope === "quarter"
                ? "year"
                : (scope as PersonalTask["planningHorizon"]),
            planningAnchor: key,
            category:
              scope === "quarter"
                ? "Quarter"
                : scope === "year"
                  ? "Year"
                  : scope === "month"
                    ? "Month"
                    : "Day",
          }
        : task,
    );
  };
  const unscheduled = visibleTasks.filter(
    (t) =>
      !t.completed &&
      (!t.date || t.inBacklog) &&
      !t.scheduledStart &&
      taskHorizon(t) === "backlog",
  );
  const dayTasks = visibleTasks.filter(
    (t) =>
      !t.completed &&
      !t.inBacklog &&
      t.date === key &&
      !t.scheduledStart &&
      !t.allDay,
  );
  const save = (next: PersonalTask[]) => {
    setUndo(p.tasks);
    p.onTasks(next);
  };
  const patchTask = (id: string, patch: Partial<PersonalTask>) =>
    save(p.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  useEffect(() => {
    const mq = matchMedia("(max-width:759px)");
    const fn = () => {
      setMobile(mq.matches);
    };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    const connection = () => setOnline(navigator.onLine);
    const storage = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (
        [
          "dayframe-tasks",
          "dayframe-sections",
          "dayframe-daily-plans",
        ].includes(d.key)
      )
        setStorageErrors((keys) =>
          d.ok
            ? keys.filter((k) => k !== d.key)
            : [...new Set([...keys, d.key])],
        );
    };
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    window.addEventListener("dayframe-storage", storage);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      window.removeEventListener("dayframe-storage", storage);
    };
  }, []);
  useEffect(() => {
    if (draft) {
      dialog.current?.showModal();
      titleInput.current?.focus();
    } else dialog.current?.close();
  }, [!!draft]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 6000);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    if (!mobile || (!left && !right)) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = document.querySelector<HTMLElement>(
      left ? ".studio-navigation" : ".studio-day-panel",
    );
    panel?.querySelector<HTMLElement>("button,input")?.focus();
    const keys = (e: KeyboardEvent) => {
      if (dialog.current?.open) return;
      if (e.key === "Escape") {
        setLeft(false);
        setRight(false);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not([type=hidden]),textarea,select,a[href]",
        ),
      ).filter((el) => el.offsetParent !== null);
      const first = focusable[0],
        last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      previous?.isConnected && previous.focus();
    };
  }, [mobile, left, right]);
  const open = (task: PersonalTask, day?: string) => {
    setDraft(structuredClone(task));
    setOccurrence(day || null);
    setScope("one");
    setQuick("");
    setCheckTitle("");
    setAttachmentError("");
  };
  const create = (day = key, start = "") =>
    open({
      id: crypto.randomUUID(),
      title: "",
      category: "Day",
      date: day,
      recurrence: "once",
      priority: "Normal",
      notes: "",
      completed: false,
      disabled: false,
      inBacklog: !day,
      planningHorizon: day ? "day" : "backlog",
      planningAnchor: day || key,
      sectionId: "personal",
      scheduledStart: start,
      scheduledDuration: 30,
    });
  const openEvent = (event: CalendarEvent) => {
    if (localEvent(event)) {
      const task = p.tasks.find((t) => t.id === event.taskId);
      if (task) {
        setInspected(task.id);
        p.onDate(fromDate(event.date));
        if (!mobile) setRight(true);
        open(
          {
            ...task,
            date: event.date,
            scheduledStart: event.start,
            scheduledDuration:
              minutes(event.end) - minutes(event.start) ||
              task.scheduledDuration,
          },
          event.occurrence,
        );
      }
    } else p.onExternal(event);
  };
  const moveOccurrence = (
    task: PersonalTask,
    original: string,
    date: string,
    start: string,
    duration: number,
  ) => {
    if (task.recurrence !== "once")
      patchTask(task.id, {
        seriesExceptions: {
          ...task.seriesExceptions,
          [original]: { date, start, duration },
        },
      });
    else
      patchTask(task.id, {
        date,
        scheduledStart: start,
        scheduledDuration: duration,
        inBacklog: false,
        planningHorizon: "day",
        planningAnchor: date,
      });
  };
  const beginTaskDrag = (
    event: ReactPointerEvent<HTMLElement>,
    task: PersonalTask,
  ) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const captureRoot =
      mobile &&
      !!event.currentTarget.closest(".studio-navigation,.studio-day-panel");
    const captureNode = captureRoot
      ? event.currentTarget.closest<HTMLElement>(".calendar-studio")!
      : event.currentTarget;
    captureNode.setPointerCapture(event.pointerId);
    drag.current = {
      captureRoot,
      id: task.id,
      occurrence: task.date,
      date: task.date,
      start: minutes(task.scheduledStart || "09:00"),
      duration: task.scheduledDuration || 30,
      action: "move",
      x: event.clientX,
      y: event.clientY,
      node: event.currentTarget,
      kind: "task",
    };
  };
  const beginDrag = (
    event: ReactPointerEvent<HTMLElement>,
    item: CalendarEvent,
    action: "move" | "resize",
  ) => {
    if (!localEvent(item) || event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const day = event.currentTarget.closest<HTMLElement>(".studio-time-day");
    drag.current = {
      id: item.taskId,
      occurrence: item.occurrence,
      date: item.date,
      start: minutes(item.start),
      duration: (minutes(item.end) - minutes(item.start) + 1440) % 1440 || 30,
      action,
      x: event.clientX,
      y: event.clientY,
      node: event.currentTarget,
      kind: "event",
      grabOffset: day
        ? event.clientY - day.getBoundingClientRect().top - minutes(item.start)
        : 0,
    };
  };
  const cancelDrag = () => {
    drag.current = null;
    previewRef.current = null;
    setDragPreview(null);
    setDragGhost(null);
  };
  const pointerMove = (event: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || Math.hypot(event.clientX - d.x, event.clientY - d.y) < 5) return;
    d.moved = true;
    if (d.captureRoot && mobilePanel) setMobilePanel(null);
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-studio-day]");
    if (!target) {
      previewRef.current = null;
      setDragGhost(null);
      return;
    }
    const timed = target.dataset.dropKind === "time";
    const date = target.dataset.studioDay!;
    let start = d.start,
      duration = d.duration;
    if (d.action === "resize")
      duration = Math.max(
        15,
        Math.min(
          1440 - start,
          d.duration + Math.round((event.clientY - d.y) / 15) * 15,
        ),
      );
    else if (timed)
      start = Math.max(
        0,
        Math.min(
          1440 - duration,
          Math.round(
            (event.clientY -
              target.getBoundingClientRect().top -
              (d.kind === "event" ? d.grabOffset || 0 : 0)) /
              15,
          ) * 15,
        ),
      );
    const next = {
      id: d.id,
      date: d.action === "resize" ? d.date : date,
      start,
      duration,
      timed,
      x: event.clientX,
      y: event.clientY,
    };
    previewRef.current = next;
    setDragPreview(next);
    setDragGhost({
      title: p.tasks.find((t) => t.id === d.id)?.title || "Справа",
      ...next,
    });
  };
  const finishDrag = () => {
    const d = drag.current,
      next = previewRef.current;
    if (d && next) {
      const task = p.tasks.find((t) => t.id === d.id);
      if (task) {
        suppressClick.current = true;
        if (d.kind === "event")
          moveOccurrence(
            task,
            d.occurrence,
            next.date,
            timeString(next.start),
            next.duration,
          );
        else if (task.isTemplate)
          save([
            ...p.tasks,
            {
              ...task,
              id: crypto.randomUUID(),
              isTemplate: false,
              inBacklog: false,
              planningHorizon: "day",
              planningAnchor: next.date,
              date: next.date,
              scheduledStart: next.timed
                ? timeString(next.start)
                : task.scheduledStart,
              scheduledDuration: next.duration,
            },
          ]);
        else
          patchTask(task.id, {
            date: next.date,
            inBacklog: false,
            planningHorizon: "day",
            planningAnchor: next.date,
            scheduledStart: next.timed
              ? timeString(next.start)
              : task.scheduledStart,
            scheduledDuration: next.duration,
          });
        setTimeout(() => {
          suppressClick.current = false;
        }, 150);
      }
    }
    if (d?.captureRoot && !d.moved) {
      const task = p.tasks.find((t) => t.id === d.id);
      if (task) open(task);
    }
    cancelDrag();
  };
  const submit = () => {
    if (!draft?.title.trim()) return;
    const original = p.tasks.find((t) => t.id === draft.id);
    if (
      original &&
      occurrence &&
      scope === "one" &&
      original.recurrence !== "once"
    ) {
      // Occurrence content becomes a detached copy; the original instance is skipped.
      const detached = {
        ...draft,
        title: draft.title.trim(),
        id: crypto.randomUUID(),
        recurrence: "once",
        seriesExceptions: undefined,
      };
      save([
        ...p.tasks.map((t) =>
          t.id === original.id
            ? {
                ...t,
                seriesExceptions: {
                  ...t.seriesExceptions,
                  [occurrence]: {
                    date: draft.date,
                    start: draft.scheduledStart || "09:00",
                    duration: draft.scheduledDuration || 30,
                    cancelled: true,
                  },
                },
              }
            : t,
        ),
        detached,
      ]);
    } else
      save(
        original
          ? p.tasks.map((t) =>
              t.id === draft.id
                ? {
                    ...draft,
                    title: draft.title.trim(),
                    date:
                      occurrence && scope === "all"
                        ? addDays(
                            original.date,
                            Math.round(
                              (fromDate(draft.date).getTime() -
                                fromDate(occurrence).getTime()) /
                                86400000,
                            ),
                          )
                        : draft.date,
                  }
                : t,
            )
          : [...p.tasks, { ...draft, title: draft.title.trim() }],
      );
    setDraft(null);
  };
  const remove = () => {
    if (!draft) return;
    if (occurrence && scope === "one" && draft.recurrence !== "once")
      patchTask(draft.id, {
        seriesExceptions: {
          ...draft.seriesExceptions,
          [occurrence]: {
            date: draft.date,
            start: draft.scheduledStart || "09:00",
            duration: draft.scheduledDuration || 30,
            cancelled: true,
          },
        },
      });
    else save(p.tasks.filter((t) => t.id !== draft.id));
    setDraft(null);
  };
  const exportBackup = () => {
    try {
      const data: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (k.startsWith("dayframe-") && !/token|secret|session/i.test(k))
          data[k] = JSON.parse(localStorage.getItem(k)!);
      }
      data["dayframe-tasks"] = p.tasks;
      data["dayframe-sections"] = sections;
      data["dayframe-daily-plans"] = {
        ...((data["dayframe-daily-plans"] as object) || {}),
        [key]: plan,
      };
      const url = URL.createObjectURL(
        new Blob(
          [
            JSON.stringify(
              { format: "dayframe-backup", version: 1, data },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `dayframe-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage("Не вдалося створити резервну копію.");
    }
  };
  const importBackup = async (file: File) => {
    try {
      if (file.size > 12 * 1024 * 1024) throw Error();
      const incoming = parseBackup(JSON.parse(await file.text()));
      const merged = [
        ...p.tasks,
        ...incoming.tasks.filter(
          (t) => !p.tasks.some((old) => old.id === t.id),
        ),
      ];
      const mergedSections = [
        ...sections,
        ...(incoming.sections || []).filter(
          (s) => !sections.some((old) => old.id === s.id),
        ),
      ];
      const currentPlans = JSON.parse(
        localStorage.getItem("dayframe-daily-plans") || "{}",
      );
      writeBackup(localStorage, {
        ...(incoming.care
          ? {
              "dayframe-self-care": {
                ...incoming.care,
                ...JSON.parse(
                  localStorage.getItem("dayframe-self-care") || "{}",
                ),
              },
            }
          : {}),
        ...(incoming.habits
          ? {
              "dayframe-habits": [
                ...JSON.parse(localStorage.getItem("dayframe-habits") || "[]"),
                ...incoming.habits.filter(
                  (h) =>
                    !JSON.parse(
                      localStorage.getItem("dayframe-habits") || "[]",
                    ).some((old: { id: string }) => old.id === h.id),
                ),
              ],
            }
          : {}),
        "dayframe-tasks": merged,
        "dayframe-sections": mergedSections,
        "dayframe-daily-plans": { ...incoming.plans, ...currentPlans },
        ...(incoming.fitness
          ? {
              "dayframe-fitness": {
                ...incoming.fitness,
                ...(JSON.parse(
                  localStorage.getItem("dayframe-fitness") || "null",
                ) || {}),
                days: {
                  ...incoming.fitness.days,
                  ...(JSON.parse(
                    localStorage.getItem("dayframe-fitness") || "null",
                  )?.days || {}),
                },
              },
            }
          : {}),
      });
      setSections(mergedSections);
      save(merged);
      window.dispatchEvent(new Event("dayframe-import"));
      setMessage("Копію імпортовано без дублювання. Наявні записи збережено.");
    } catch {
      setMessage(
        "Не вдалося імпортувати: перевір формат копії або вільне місце.",
      );
    }
  };
  const taskRow = (task: PersonalTask) => (
    <div
      key={task.id}
      className="studio-task-row"
      style={styleColor(sectionOf(task)?.color || "#795875")}
    >
      <button
        className="studio-drag-grip"
        aria-label={`Перетягнути ${task.title}`}
        title="Перетягни на день або час"
        onPointerDown={(e) => beginTaskDrag(e, task)}
        onClick={() => {
          if (!suppressClick.current) open(task);
        }}
      >
        <GripVertical size={16} />
      </button>
      {!task.isTemplate && (
        <input
          type="checkbox"
          aria-label={`Вибрати ${task.title}`}
          checked={selected.includes(task.id)}
          onChange={() =>
            setSelected((s) =>
              s.includes(task.id)
                ? s.filter((id) => id !== task.id)
                : [...s, task.id],
            )
          }
        />
      )}
      <button
        onPointerDown={(e) => beginTaskDrag(e, task)}
        className="studio-task-title"
        onClick={() => {
          if (!suppressClick.current) open(task);
        }}
      >
        <strong>{task.title}</strong>
        <small>
          {sectionOf(task)?.name}
          {task.deadline
            ? ` · До ${fromDate(task.deadline).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}`
            : ""}
        </small>
        {task.deadline && task.deadline < today && (
          <span className="studio-overdue">Термін минув</span>
        )}
      </button>
      {!task.isTemplate && (
        <button
          aria-label={`Виконати ${task.title}`}
          onClick={() =>
            patchTask(task.id, { completed: true, completedOn: today })
          }
        >
          <Check size={15} />
        </button>
      )}
    </div>
  );
  const miniFirst = fromDate(key);
  miniFirst.setDate(1);
  miniFirst.setDate(miniFirst.getDate() - ((miniFirst.getDay() + 6) % 7));
  const timeNow = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const upcoming = [
    ...p.events.filter(() => externalVisible),
    ...scheduledEvents(visibleTasks, key, addDays(key, 7)),
  ]
    .filter(
      (e) =>
        e.date >= key && (e.date !== today || e.allDay || e.start >= timeNow),
    )
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .slice(0, 5);
  const searchTasks = visibleTasks.filter(
    (t) =>
      !t.completed &&
      (t.title + " " + t.notes)
        .toLocaleLowerCase("uk")
        .includes(query.toLocaleLowerCase("uk")),
  );
  return (
    <section
      className={`calendar-studio ${left ? "has-left" : ""} ${right ? "has-right" : ""}`}
      aria-label="Творчий календар"
      data-view={view.toLowerCase()}
      // Suppress only the click produced by the completed drag, never a new gesture.
      onPointerDownCapture={() => {
        suppressClick.current = false;
      }}
      onKeyDownCapture={() => {
        suppressClick.current = false;
      }}
      onPointerMove={pointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={cancelDrag}
    >
      <header className="studio-header">
        <div>
          <span className="studio-eyebrow">МІСЦЕ ДЛЯ ВАЖЛИВОГО</span>
          <h1>
            {view === "Week"
              ? `${fromDate(days[0]).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })} – ${fromDate(days[6]).toLocaleDateString("uk-UA", { day: "numeric", month: "long" })}`
              : p.date.toLocaleDateString(
                  "uk-UA",
                  view === "Month"
                    ? { month: "long", year: "numeric" }
                    : { weekday: "long", day: "numeric", month: "long" },
                )}
          </h1>
        </div>
        <div className="studio-header-art">
          <label className="studio-theme-label">
            Оформлення
            <select
              aria-label="Оформлення планера"
              value={p.theme}
              onChange={(e) => p.onTheme(e.target.value)}
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <CalendarCompanion theme={p.theme} mascot={p.mascot} />
        </div>
      </header>
      {(p.view === "Month" || !mobile) && (
        <PlannerMonthRail
          date={p.date}
          onSelect={(date) => {
            p.onDate(date);
            p.onView("Month");
          }}
        />
      )}
      <div className="studio-tools">
        <button
          aria-label="Показати або сховати навігацію календаря"
          aria-expanded={left}
          onClick={() => {
            setLeft(!left);
            if (mobile) setRight(false);
          }}
        >
          <PanelLeftClose size={18} />
        </button>
        <div className="studio-date-tools">
          <button
            aria-label="Попередній період"
            onClick={() => p.onDate(moveDate(p.date, view, -1))}
          >
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => p.onDate(fromDate(today))}>Сьогодні</button>
          <button
            aria-label="Наступний період"
            onClick={() => p.onDate(moveDate(p.date, view, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="studio-modes">
          {[
            ["Day", "День"],
            ["Week", "Тиждень"],
            ["Month", "Місяць"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={view === id}
              onClick={() => p.onView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="studio-search">
          <Search size={16} />
          <input
            aria-label="Пошук у календарі"
            placeholder="Події, справи, нотатки"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label="Очистити пошук" onClick={() => setQuery("")}>
              <X size={14} />
            </button>
          )}
        </label>
        <button className="primary" onClick={() => create()}>
          <Plus size={17} />
          Додати
        </button>
        <ManualAssistant
          tasks={p.tasks}
          date={key}
          today={today}
          onCreate={(task) => save([...p.tasks, task])}
        />
        <KeepImport
          tasks={p.tasks}
          sections={sections}
          onImport={(nextTasks, nextSections, count) => {
            try {
              writeBackup(localStorage, {
                "dayframe-tasks": nextTasks,
                "dayframe-sections": nextSections,
              });
            } catch {
              throw new Error(
                "Не вдалося зберегти імпорт. Перевір вільне місце в браузері; наявні дані не замінено.",
              );
            }
            setSections(nextSections);
            p.onTasks(nextTasks);
            setUndo(null);
            window.dispatchEvent(new Event("dayframe-import"));
            setMessage(
              `Імпортовано нотаток Keep: ${count}. Відсутні розділи створено.`,
            );
          }}
        />
        <button
          className="studio-panel-toggle"
          aria-label="Показати або сховати панель дня"
          aria-expanded={right}
          onClick={() => {
            setRight(!right);
            if (mobile) setLeft(false);
          }}
        >
          <PanelRightClose size={18} />
        </button>
      </div>
      <div className="studio-status" role="status">
        {storageError ? (
          <span className="studio-error">
            Не вдалося записати зміни на пристрої. Зроби експорт перед закриттям
            сторінки.
          </span>
        ) : !online ? (
          "Без інтернету · зміни зберігаються на цьому пристрої"
        ) : (
          "Локальний календар · Europe/Kyiv"
        )}
        {p.loading && <span>Завантажуємо підключені календарі…</span>}
        {undo && (
          <button
            onClick={() => {
              p.onTasks(undo);
              setUndo(null);
            }}
          >
            <Undo2 size={14} />
            Скасувати дію
          </button>
        )}
      </div>
      {storageError && (
        <div className="studio-message">
          <span>Зміни ще в пам’яті відкритої сторінки.</span>
          <button onClick={exportBackup}>
            <Download size={14} />
            Експорт незбережених змін
          </button>
          <button
            onClick={() => {
              try {
                const stored = JSON.parse(
                  localStorage.getItem("dayframe-daily-plans") || "{}",
                );
                writeBackup(localStorage, {
                  "dayframe-tasks": p.tasks,
                  "dayframe-sections": sections,
                  "dayframe-daily-plans": { ...stored, [key]: plan },
                });
                setStorageErrors([]);
              } catch {
                setMessage(
                  "Місця для збереження все ще недостатньо. Експортуй записи у файл.",
                );
              }
            }}
          >
            Спробувати зберегти
          </button>
        </div>
      )}
      {message && (
        <div className="studio-message" role="status">
          {message}
          <button
            aria-label="Закрити повідомлення"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {mobile && (left || right) && (
        <button
          className="studio-panel-backdrop"
          aria-label="Закрити бічну панель"
          onClick={() => {
            setLeft(false);
            setRight(false);
          }}
        />
      )}
      <div className="studio-workspace">
        {left && (
          <aside
            className="studio-navigation"
            aria-label="Навігація календаря"
            role={mobile ? "dialog" : undefined}
            aria-modal={mobile ? true : undefined}
          >
            <div className="studio-panel-top">
              <h2>Твій ритм</h2>
              <button
                aria-label="Згорнути навігацію"
                onClick={() => setLeft(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="studio-mini-title">
              <strong>
                {p.date.toLocaleDateString("uk-UA", {
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              <input
                type="date"
                aria-label="Обрати дату календаря"
                value={key}
                onChange={(e) =>
                  e.target.value && p.onDate(fromDate(e.target.value))
                }
              />
            </div>
            <div className="studio-mini">
              <div>
                {["П", "В", "С", "Ч", "П", "С", "Н"].map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
              <div>
                {Array.from({ length: 42 }, (_, i) =>
                  addDays(dateKey(miniFirst), i),
                ).map((d) => (
                  <button
                    key={d}
                    className={`${d === key ? "selected" : ""} ${d === today ? "today" : ""} ${fromDate(d).getMonth() !== p.date.getMonth() ? "outside" : ""}`}
                    aria-label={`Обрати ${d}`}
                    aria-pressed={d === key}
                    onClick={() => p.onDate(fromDate(d))}
                  >
                    {fromDate(d).getDate()}
                  </button>
                ))}
              </div>
            </div>
            <div className="studio-panel-top">
              <h2>Мої розділи</h2>
              <button
                aria-label="Редагувати розділи"
                aria-pressed={sectionEdit}
                onClick={() => setSectionEdit(!sectionEdit)}
              >
                <Palette size={16} />
              </button>
            </div>
            {sections.map((s) => (
              <div
                className="studio-section"
                key={s.id}
                style={styleColor(s.color)}
              >
                <input
                  type="checkbox"
                  aria-label={`Показати розділ ${s.name}`}
                  checked={s.visible}
                  onChange={() =>
                    setSections(
                      sections.map((x) =>
                        x.id === s.id ? { ...x, visible: !x.visible } : x,
                      ),
                    )
                  }
                />
                {sectionEdit ? (
                  <>
                    <input
                      aria-label={`Колір розділу ${s.name}`}
                      type="color"
                      value={s.color}
                      onChange={(e) =>
                        setSections(
                          sections.map((x) =>
                            x.id === s.id ? { ...x, color: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <input
                      aria-label={`Назва розділу ${s.name}`}
                      value={s.name}
                      maxLength={40}
                      onChange={(e) =>
                        setSections(
                          sections.map((x) =>
                            x.id === s.id ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </>
                ) : (
                  <>
                    <i />
                    <span>{s.name}</span>
                    <small>
                      {
                        visibleTasks.filter(
                          (t) =>
                            (t.sectionId || "personal") === s.id &&
                            !t.completed,
                        ).length
                      }
                    </small>
                  </>
                )}
              </div>
            ))}
            {sectionEdit && (
              <button
                className="studio-text-action"
                onClick={() =>
                  setSections([
                    ...sections,
                    {
                      id: crypto.randomUUID(),
                      name: "Новий розділ",
                      color: "#795875",
                      visible: true,
                    },
                  ])
                }
              >
                <Plus size={14} />
                Додати розділ
              </button>
            )}
            <label className="studio-external">
              <input
                type="checkbox"
                checked={externalVisible}
                onChange={(e) => setExternalVisible(e.target.checked)}
              />
              Підключені календарі та Jira
            </label>
            <div className="studio-panel-top">
              <h2>
                Без дати <small>{unscheduled.length}</small>
              </h2>
              <button
                aria-label="Додати справу без дати"
                onClick={() => create("")}
              >
                <Plus size={17} />
              </button>
            </div>
            <p className="studio-helper">
              Перетягни справу на час у календарі або признач дату в її
              редакторі.
            </p>
            {unscheduled.map(taskRow)}
            {!unscheduled.length && (
              <p className="studio-empty-small">
                Ідеї можуть зачекати тут, доки знайдеться час.
              </p>
            )}
            <div className="studio-backup">
              <button onClick={exportBackup}>
                <Download size={14} />
                Резервна копія
              </button>
              <button onClick={() => importInput.current?.click()}>
                <Upload size={14} />
                Імпорт
              </button>
              <input
                ref={importInput}
                hidden
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importBackup(file);
                  e.target.value = "";
                }}
              />
              <button onClick={p.onLegacy}>
                <NotebookPen size={14} />
                Затишний планер
              </button>
            </div>
          </aside>
        )}
        <div className="studio-center">
          {selected.length > 0 && (
            <div className="studio-bulk">
              <span>Вибрано: {selected.length}</span>
              <input
                aria-label="Дата перенесення вибраних справ"
                type="date"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
              />
              <button
                disabled={!bulkDate}
                onClick={() => {
                  save(
                    p.tasks.map((t) =>
                      selected.includes(t.id)
                        ? {
                            ...t,
                            date: bulkDate,
                            inBacklog: false,
                            planningHorizon: "day",
                            planningAnchor: bulkDate,
                          }
                        : t,
                    ),
                  );
                  setSelected([]);
                }}
              >
                Перенести
              </button>
              <button onClick={() => setSelected([])}>Скасувати вибір</button>
            </div>
          )}
          {query ? (
            <div className="studio-results">
              <h2>Результати пошуку</h2>
              {searchTasks.map(taskRow)}
              {p.events
                .filter((e) =>
                  e.title
                    .toLocaleLowerCase("uk")
                    .includes(query.toLocaleLowerCase("uk")),
                )
                .map((e) => (
                  <button key={e.id} onClick={() => p.onExternal(e)}>
                    {e.title} · {e.date}
                  </button>
                ))}
              {Object.entries(
                JSON.parse(
                  localStorage.getItem("dayframe-daily-plans") || "{}",
                ) as Record<string, { notes?: string }>,
              )
                .filter(([, v]) =>
                  v.notes
                    ?.toLocaleLowerCase("uk")
                    .includes(query.toLocaleLowerCase("uk")),
                )
                .map(([date, v]) => (
                  <button
                    key={date}
                    onClick={() => {
                      p.onDate(fromDate(date));
                      setQuery("");
                      setRight(true);
                    }}
                  >
                    {date} · {v.notes}
                  </button>
                ))}
            </div>
          ) : view === "Month" ? (
            <div className="studio-month">
              <div className="studio-month-labels">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="studio-month-grid">
                {days.map((day) => (
                  <div
                    key={day}
                    data-studio-day={day}
                    data-drop-kind="date"
                    className={`${day === today ? "today" : ""} ${day === key ? "selected" : ""} ${fromDate(day).getMonth() !== p.date.getMonth() ? "outside" : ""}`}
                  >
                    <button
                      className="studio-month-date"
                      aria-label={`День ${day}`}
                      onClick={() => {
                        p.onDate(fromDate(day));
                        setRight(true);
                      }}
                    >
                      {fromDate(day).getDate()}
                    </button>
                    {events
                      .filter((e) => eventOnDay(e, day))
                      .map((e) => (
                        <button
                          key={e.id}
                          className="studio-month-event"
                          style={styleColor(
                            localEvent(e)
                              ? sectionOf(
                                  p.tasks.find((t) => t.id === e.taskId)!,
                                )?.color || "#795875"
                              : "#627790",
                          )}
                          onPointerDown={(ev) => beginDrag(ev, e, "move")}
                          onClick={() => {
                            if (!suppressClick.current) openEvent(e);
                          }}
                        >
                          {!e.allDay && e.start} {e.title}
                        </button>
                      ))}
                    {visibleTasks
                      .filter(
                        (t) =>
                          !t.completed &&
                          !t.inBacklog &&
                          t.date === day &&
                          !t.scheduledStart &&
                          !t.allDay,
                      )
                      .map((t) => (
                        <button
                          key={t.id}
                          className="studio-month-event"
                          style={styleColor(sectionOf(t)?.color || "#795875")}
                          onPointerDown={(ev) => beginTaskDrag(ev, t)}
                          onClick={() => {
                            if (!suppressClick.current) open(t);
                          }}
                        >
                          ✓ {t.title}
                        </button>
                      ))}
                    <button
                      className="studio-month-add"
                      aria-label={`Додати на ${day}`}
                      onClick={() => create(day)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="studio-week">
              <div
                className="studio-day-head"
                style={{
                  gridTemplateColumns: `44px repeat(${days.length},minmax(0,1fr))`,
                }}
              >
                <span title="Europe/Kyiv">Київ</span>
                {days.map((day) => (
                  <button
                    key={day}
                    data-studio-day={day}
                    data-drop-kind="date"
                    className={`${day === today ? "today" : ""} ${day === key ? "selected" : ""}`}
                    onClick={() => {
                      p.onDate(fromDate(day));
                      setRight(true);
                    }}
                  >
                    <small>
                      {fromDate(day).toLocaleDateString("uk-UA", {
                        weekday: "short",
                      })}
                    </small>
                    <strong>{fromDate(day).getDate()}</strong>
                  </button>
                ))}
              </div>
              <div
                className="studio-all-day"
                style={{
                  gridTemplateColumns: `44px repeat(${days.length},minmax(0,1fr))`,
                }}
              >
                <small>Увесь день</small>
                {days.map((day) => (
                  <div key={day} data-studio-day={day} data-drop-kind="date">
                    {events
                      .filter((e) => e.allDay && eventOnDay(e, day))
                      .map((e) => (
                        <button
                          key={e.id}
                          onPointerDown={(ev) => beginDrag(ev, e, "move")}
                          onClick={() => {
                            if (!suppressClick.current) openEvent(e);
                          }}
                        >
                          {e.title}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
              <div
                className="studio-all-day studio-untimed"
                style={{
                  gridTemplateColumns: `44px repeat(${days.length},minmax(0,1fr))`,
                }}
              >
                <small>Без часу</small>
                {days.map((day) => (
                  <div key={day} data-studio-day={day} data-drop-kind="date">
                    {" "}
                    {visibleTasks
                      .filter(
                        (t) =>
                          !t.completed &&
                          !t.inBacklog &&
                          t.date === day &&
                          !t.scheduledStart &&
                          !t.allDay,
                      )
                      .map((t) => (
                        <button
                          key={t.id}
                          style={styleColor(sectionOf(t)?.color || "#795875")}
                          onPointerDown={(ev) => beginTaskDrag(ev, t)}
                          onClick={() => {
                            if (!suppressClick.current) open(t);
                          }}
                        >
                          {t.title}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
              {!events.length && (
                <p className="studio-grid-hint">
                  Вільний простір для планів. Натисни час або виділи проміжок;
                  справи зліва можна перетягнути в сітку.
                </p>
              )}
              <div className="studio-time-scroll" ref={scroll}>
                <div
                  className="studio-time-grid"
                  style={{
                    gridTemplateColumns: `44px repeat(${days.length},minmax(0,1fr))`,
                  }}
                >
                  <div className="studio-hours">
                    {Array.from({ length: 24 }, (_, h) => (
                      <span key={h} style={{ top: h * 60 }}>
                        {String(h).padStart(2, "0")}:00
                      </span>
                    ))}
                  </div>
                  {days.map((day) => (
                    <div
                      key={day}
                      data-studio-day={day}
                      data-drop-kind="time"
                      className={`studio-time-day ${day === today ? "today" : ""}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData("text/dayframe-task");
                        if (!id) return;
                        const start = Math.max(
                          0,
                          Math.min(
                            1425,
                            Math.floor(
                              (e.clientY -
                                e.currentTarget.getBoundingClientRect().top) /
                                15,
                            ) * 15,
                          ),
                        );
                        patchTask(id, {
                          date: day,
                          scheduledStart: timeString(start),
                          scheduledDuration: 30,
                          inBacklog: false,
                          planningHorizon: "day",
                          planningAnchor: day,
                        });
                      }}
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <button
                          key={h}
                          className="studio-time-slot"
                          style={{ top: h * 60 }}
                          aria-label={`Створити подію ${day} о ${String(h).padStart(2, "0")}:00`}
                          onClick={() => {
                            if (!suppressClick.current)
                              create(day, timeString(h * 60));
                          }}
                          onPointerDown={(e) => {
                            if (e.button !== 0) return;
                            selection.current = {
                              day,
                              start: h * 60,
                              y: e.clientY,
                            };
                            e.currentTarget.setPointerCapture(e.pointerId);
                          }}
                          onPointerUp={(e) => {
                            const sel = selection.current;
                            selection.current = null;
                            if (sel && Math.abs(e.clientY - sel.y) > 20) {
                              suppressClick.current = true;
                              const delta =
                                Math.round((e.clientY - sel.y) / 15) * 15;
                              const start = Math.max(
                                0,
                                Math.min(sel.start, sel.start + delta),
                              );
                              const duration = Math.max(
                                15,
                                Math.min(1440 - start, Math.abs(delta)),
                              );
                              create(day, timeString(start));
                              setDraft((d) =>
                                d ? { ...d, scheduledDuration: duration } : d,
                              );
                              setTimeout(() => {
                                suppressClick.current = false;
                              }, 100);
                            }
                          }}
                        />
                      ))}
                      {layoutEvents(events, day).map((pos) => {
                        const e = pos.event,
                          task = localEvent(e)
                            ? p.tasks.find((t) => t.id === e.taskId)
                            : undefined,
                          color = task ? sectionOf(task)?.color : "#627790";
                        const preview =
                          dragPreview?.id === task?.id ? dragPreview : null;
                        const duration =
                          preview?.duration ?? pos.end - pos.start;
                        return (
                          <div
                            data-density={
                              duration < 60
                                ? "compact"
                                : duration < 90
                                  ? "regular"
                                  : "roomy"
                            }
                            key={e.id}
                            className={`studio-timed-event ${preview ? "dragging" : ""}`}
                            style={{
                              ...styleColor(color || "#795875"),
                              top: preview?.start ?? pos.start,
                              height: Math.max(26, duration - 2),
                              left: `calc(${(pos.column / pos.columns) * 100}% + 2px)`,
                              width: `calc(${100 / pos.columns}% - 4px)`,
                            }}
                          >
                            <button
                              className="studio-event-main"
                              aria-label={`${e.title} · ${e.start}–${e.end}`}
                              title={`${e.start}–${e.end} ${e.title}`}
                              onPointerDown={(ev) => beginDrag(ev, e, "move")}
                              onClick={() => {
                                if (!suppressClick.current) openEvent(e);
                              }}
                            >
                              <span>
                                {preview
                                  ? `${timeString(preview.start)} · ${preview.duration} хв`
                                  : e.start + "–" + e.end}
                              </span>
                              <strong>{e.title}</strong>
                              {task?.cover && (
                                <img
                                  src={task.cover}
                                  alt="Обкладинка творчої справи"
                                />
                              )}
                              {!task && (
                                <small>{e.source} · лише читання</small>
                              )}
                            </button>
                            {task && (
                              <button
                                className="studio-resize"
                                aria-label={`Змінити тривалість ${e.title}`}
                                onPointerDown={(ev) =>
                                  beginDrag(ev, e, "resize")
                                }
                                onClick={() => {
                                  if (!suppressClick.current) openEvent(e);
                                }}
                              >
                                <GripVertical size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {day === today && (
                        <div
                          className="studio-now"
                          aria-label="Поточний час"
                          style={{ top: minutes(timeNow) }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {mobile && (
                <div className="studio-upcoming">
                  <h2>Найближчі події</h2>
                  {upcoming.map((e) => (
                    <button
                      key={e.id}
                      onPointerDown={(ev) => beginDrag(ev, e, "move")}
                      onClick={() => {
                        if (!suppressClick.current) openEvent(e);
                      }}
                    >
                      <time>
                        {fromDate(e.date).toLocaleDateString("uk-UA", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {e.allDay ? "Увесь день" : e.start}
                      </time>
                      {e.title}
                    </button>
                  ))}
                  {!upcoming.length && (
                    <p>
                      Найближчих подій немає. Натисни час у сітці, щоб додати
                      нову.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {right && (
          <aside
            className="studio-day-panel"
            aria-label="Панель дня"
            role={mobile ? "dialog" : undefined}
            aria-modal={mobile ? true : undefined}
          >
            <div className="studio-panel-top">
              <span className="studio-eyebrow">ПЛАНИ ТА ДЕНЬ</span>
              <button
                aria-label="Згорнути панель дня"
                onClick={() => setRight(false)}
              >
                <X size={16} />
              </button>
            </div>
            <section
              className="studio-plan-pool"
              aria-label="Плани для календаря"
            >
              <h2>Плани під рукою</h2>
              <p>Перетягни справу за крапки на день або час.</p>
              {scopeGroups.map((group) => {
                const list = scopedTasks.filter((t) => scopeOf(t) === group.id);
                return (
                  <details
                    className="studio-scope-group"
                    key={group.id}
                    open={list.length > 0}
                  >
                    <summary>
                      <span>{group.name}</span>
                      <small>{list.length}</small>
                    </summary>
                    <div className="studio-scope-list">
                      {list.map(taskRow)}
                      {!list.length && <p>Ще немає планів.</p>}
                      <button
                        className="studio-text-action"
                        aria-label={`Додати план: ${group.name}`}
                        onClick={() => createScope(group.id)}
                      >
                        <Plus size={14} />
                        Додати план
                      </button>
                    </div>
                  </details>
                );
              })}
            </section>
            <h2 className="studio-panel-date">
              {p.date.toLocaleDateString("uk-UA", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>
            {inspectedTask && (
              <section className="studio-inspected">
                <div className="studio-panel-top">
                  <h3>Деталі запису</h3>
                  <button
                    aria-label="Сховати деталі запису"
                    onClick={() => setInspected(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <strong>{inspectedTask.title}</strong>
                <p>{inspectedTask.notes || "Нотаток поки немає."}</p>
                {inspectedTask.deadline && (
                  <small>
                    Дедлайн:{" "}
                    {fromDate(inspectedTask.deadline).toLocaleDateString(
                      "uk-UA",
                    )}
                  </small>
                )}
                {inspectedTask.checklist?.map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        patchTask(inspectedTask.id, {
                          checklist: inspectedTask.checklist?.map((x) =>
                            x.id === item.id ? { ...x, done: !x.done } : x,
                          ),
                        })
                      }
                    />
                    {item.title}
                  </label>
                ))}
                {inspectedTask.attachments?.map((file, i) => (
                  <a key={i} href={file.data} download={file.name}>
                    {file.name}
                  </a>
                ))}
                <button
                  className="studio-text-action"
                  onClick={() => open(inspectedTask)}
                >
                  Редагувати запис
                </button>
              </section>
            )}
            <h3>
              Справи на день <small>{dayTasks.length}</small>
            </h3>
            {dayTasks.map(taskRow)}
            {!dayTasks.length && (
              <p className="studio-empty-small">
                Тут будуть справи без конкретного часу.
              </p>
            )}
            <button className="studio-text-action" onClick={() => create()}>
              <Plus size={14} />
              Додати справу
            </button>
            <h3>Чекліст дня</h3>
            {plan.priorities.map((item, i) => (
              <label className="studio-day-check" key={i}>
                <input
                  type="checkbox"
                  aria-label={`Виконано пріоритет ${i + 1}`}
                  checked={item.done}
                  onChange={() =>
                    update({
                      priorities: plan.priorities.map((x, j) =>
                        i === j ? { ...x, done: !x.done } : x,
                      ),
                    })
                  }
                />
                <input
                  aria-label={`Пріоритет дня ${i + 1}`}
                  placeholder={`Пріоритет ${i + 1}`}
                  value={item.title}
                  onChange={(e) =>
                    update({
                      priorities: plan.priorities.map((x, j) =>
                        i === j ? { ...x, title: e.target.value } : x,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <h3>Нотатки дня</h3>
            <textarea
              aria-label="Нотатки дня"
              rows={6}
              value={plan.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Думки, посилання на референси, маленькі перемоги…"
            />
            <small className="studio-helper">
              Автозбереження на цьому пристрої
            </small>
            <h3>Події дня</h3>
            {events
              .filter((e) => eventOnDay(e, key))
              .map((e) => (
                <button
                  className="studio-day-event"
                  key={e.id}
                  onPointerDown={(ev) => beginDrag(ev, e, "move")}
                  onClick={() => {
                    if (!suppressClick.current) openEvent(e);
                  }}
                >
                  <Clock size={14} />
                  <span>
                    {e.allDay ? "Увесь день" : e.start}
                    <strong>{e.title}</strong>
                  </span>
                </button>
              ))}
          </aside>
        )}
      </div>
      {dragGhost && (
        <div
          className="studio-drag-ghost"
          aria-hidden="true"
          style={{
            left: Math.min(dragGhost.x + 14, innerWidth - 220),
            top: Math.max(8, dragGhost.y - 65),
          }}
        >
          <strong>{dragGhost.title}</strong>
          <span>
            {fromDate(dragGhost.date).toLocaleDateString("uk-UA", {
              day: "numeric",
              month: "short",
            })}
            {dragGhost.timed
              ? " · " + timeString(dragGhost.start)
              : " · без зміни часу"}
          </span>
        </div>
      )}
      <dialog
        ref={dialog}
        className="studio-editor"
        aria-label="Редактор запису"
        onCancel={() => setDraft(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDraft(null);
        }}
      >
        {draft && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <header>
              <div>
                <span className="studio-eyebrow">ТВІЙ ЧАС, ТВОЇ ПЛАНИ</span>
                <h2>
                  {p.tasks.some((t) => t.id === draft.id)
                    ? "Редагувати запис"
                    : "Новий запис"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Закрити редактор"
                onClick={() => setDraft(null)}
              >
                <X size={20} />
              </button>
            </header>
            {!p.tasks.some((t) => t.id === draft.id) && (
              <label className="studio-quick">
                Швидке введення
                <div>
                  <input
                    aria-label="Швидке введення фразою"
                    value={quick}
                    onChange={(e) => setQuick(e.target.value)}
                    placeholder="Завтра о 15:00 перевірити префаби, година"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = quickEntry(quick, today);
                      setDraft({
                        ...draft,
                        title: parsed.title,
                        date: parsed.date,
                        scheduledStart: parsed.start,
                        planningHorizon: "day",
                        planningAnchor: parsed.date,
                        scheduledDuration: parsed.duration,
                        inBacklog: false,
                      });
                    }}
                  >
                    Розпізнати
                  </button>
                </div>
                <small>
                  Перевір дату, час і тривалість нижче перед збереженням.
                </small>
              </label>
            )}
            <label>
              Назва
              <input
                ref={titleInput}
                required
                maxLength={500}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <div className="studio-editor-grid">
              <label>
                Розділ
                <select
                  aria-label="Розділ"
                  value={draft.sectionId || "personal"}
                  onChange={(e) =>
                    setDraft({ ...draft, sectionId: e.target.value })
                  }
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Тип запису
                <select
                  aria-label="Тип запису"
                  value={
                    draft.inBacklog
                      ? "idea"
                      : draft.allDay
                        ? "allDay"
                        : draft.scheduledStart
                          ? "event"
                          : "task"
                  }
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      inBacklog: e.target.value === "idea",
                      planningHorizon:
                        e.target.value === "idea" ? "backlog" : "day",
                      planningAnchor: draft.date || key,
                      date: draft.date || key,
                      allDay: e.target.value === "allDay",
                      scheduledStart:
                        e.target.value === "event"
                          ? draft.scheduledStart || "09:00"
                          : undefined,
                    })
                  }
                >
                  <option value="task">Справа без часу</option>
                  <option value="event">Подія з часом</option>
                  <option value="allDay">Увесь день</option>
                  <option value="idea">Ідея без дати</option>
                </select>
              </label>
            </div>
            {draft.inBacklog && (
              <label>
                Рівень плану
                <select
                  aria-label="Рівень плану"
                  value={scopeOf(draft)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      planningHorizon:
                        e.target.value === "quarter"
                          ? "year"
                          : (e.target.value as PersonalTask["planningHorizon"]),
                      category:
                        e.target.value === "quarter"
                          ? "Quarter"
                          : e.target.value === "year"
                            ? "Year"
                            : e.target.value === "month"
                              ? "Month"
                              : "Day",
                      planningAnchor: key,
                    })
                  }
                >
                  <option value="backlog">Без дати / ідея</option>
                  {scopeGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {!draft.inBacklog && (
              <div className="studio-editor-grid">
                <label>
                  Дата
                  <input
                    aria-label="Дата запису"
                    required
                    type="date"
                    value={draft.date}
                    onChange={(e) =>
                      setDraft({ ...draft, date: e.target.value })
                    }
                  />
                </label>
                {draft.scheduledStart && (
                  <>
                    <label>
                      Початок
                      <input
                        aria-label="Початок події"
                        required
                        type="time"
                        value={draft.scheduledStart}
                        onChange={(e) =>
                          setDraft({ ...draft, scheduledStart: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Тривалість, хв
                      <input
                        aria-label="Тривалість події"
                        required
                        type="number"
                        min={15}
                        step={15}
                        max={1440 - minutes(draft.scheduledStart)}
                        value={draft.scheduledDuration || 30}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            scheduledDuration: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </>
                )}
              </div>
            )}
            <div className="studio-editor-grid">
              <label>
                Дедлайн (окремо від плану)
                <input
                  aria-label="Дедлайн"
                  type="date"
                  value={draft.deadline || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, deadline: e.target.value })
                  }
                />
              </label>
              <label>
                Повторення
                <select
                  aria-label="Повторення запису"
                  value={draft.recurrence}
                  onChange={(e) =>
                    setDraft({ ...draft, recurrence: e.target.value })
                  }
                >
                  {[
                    ["once", "Не повторювати"],
                    ["daily", "Щодня"],
                    ["weekly", "Щотижня"],
                    ["monthly", "Щомісяця"],
                    ["yearly", "Щороку"],
                    ["every 3 months", "Щокварталу"],
                    ["custom", "Власний інтервал"],
                  ].map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {draft.recurrence === "custom" && (
              <label>
                Інтервал повторення, днів
                <input
                  type="number"
                  min={1}
                  max={36500}
                  value={draft.customDays || 2}
                  onChange={(e) =>
                    setDraft({ ...draft, customDays: Number(e.target.value) })
                  }
                />
              </label>
            )}
            {occurrence && draft.recurrence !== "once" && (
              <label>
                Застосувати зміни
                <select
                  aria-label="Обсяг змін серії"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  <option value="one">Лише це входження</option>
                  <option value="all">Усю серію</option>
                </select>
              </label>
            )}
            <label>
              Нотатки
              <textarea
                aria-label="Нотатки запису"
                rows={3}
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </label>
            <fieldset>
              <legend>Чекліст</legend>
              {(draft.checklist || []).map((item) => (
                <div className="studio-check-item" key={item.id}>
                  <input
                    aria-label={`Готово: ${item.title}`}
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        checklist: draft.checklist?.map((x) =>
                          x.id === item.id ? { ...x, done: !x.done } : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label="Текст пункту"
                    value={item.title}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        checklist: draft.checklist?.map((x) =>
                          x.id === item.id
                            ? { ...x, title: e.target.value }
                            : x,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Видалити пункт ${item.title}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        checklist: draft.checklist?.filter(
                          (x) => x.id !== item.id,
                        ),
                      })
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="studio-check-item">
                <input
                  aria-label="Новий пункт чекліста"
                  value={checkTitle}
                  onChange={(e) => setCheckTitle(e.target.value)}
                />
                <button
                  type="button"
                  disabled={!checkTitle.trim()}
                  onClick={() => {
                    setDraft({
                      ...draft,
                      checklist: [
                        ...(draft.checklist || []),
                        {
                          id: crypto.randomUUID(),
                          title: checkTitle.trim(),
                          done: false,
                        },
                      ],
                    });
                    setCheckTitle("");
                  }}
                >
                  Додати пункт
                </button>
              </div>
            </fieldset>
            <details>
              <summary>Посилання, вкладення та нагадування</summary>
              <label>
                Посилання (по одному в рядку)
                <textarea
                  aria-label="Посилання запису"
                  value={(draft.links || []).join("\n")}
                  onChange={(e) =>
                    setDraft({ ...draft, links: e.target.value.split("\n") })
                  }
                />
              </label>
              {draft.links
                ?.filter((url) => /^https?:\/\//.test(url))
                .map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                ))}
              <label>
                Нагадування
                <select
                  aria-label="Нагадування запису"
                  value={
                    draft.reminderMinutes === undefined
                      ? "off"
                      : draft.reminderMinutes
                  }
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      reminderMinutes:
                        e.target.value === "off"
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                >
                  <option value="off">Вимкнено</option>
                  <option value="0">На початку</option>
                  <option value="5">За 5 хвилин</option>
                  <option value="15">За 15 хвилин</option>
                  <option value="60">За годину</option>
                </select>
                <small>
                  Нагадування працює, доки Dayframe відкритий, для подій із
                  часом.
                </small>
              </label>
              <label>
                Вкладення (до 1 МБ сумарно на запис)
                <input
                  type="file"
                  aria-label="Додати вкладення"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (
                      file.size +
                        (draft.attachments || []).reduce(
                          (n, a) => n + a.data.length * 0.75,
                          0,
                        ) >
                      1024 * 1024
                    ) {
                      setAttachmentError(
                        "Завеликий файл: до 1 МБ сумарно. Для великих референсів додай посилання.",
                      );
                      return;
                    }
                    try {
                      const data = await new Promise<string>(
                        (resolve, reject) => {
                          const r = new FileReader();
                          r.onload = () => resolve(String(r.result));
                          r.onerror = reject;
                          r.readAsDataURL(file);
                        },
                      );
                      setDraft((d) =>
                        d
                          ? {
                              ...d,
                              attachments: [
                                ...(d.attachments || []),
                                { name: file.name, data, type: file.type },
                              ],
                            }
                          : d,
                      );
                      setAttachmentError("");
                    } catch {
                      setAttachmentError(
                        "Не вдалося прочитати файл. Спробуй додати його ще раз.",
                      );
                    }
                  }}
                />
              </label>
              {attachmentError && <p role="alert">{attachmentError}</p>}
              {draft.attachments?.map((file, i) => (
                <div className="studio-attachment" key={i}>
                  <a href={file.data} download={file.name}>
                    {file.name}
                  </a>
                  {/^image\/(png|jpeg|webp|gif)$/.test(file.type) && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, cover: file.data })}
                    >
                      На обкладинку
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`Видалити вкладення ${file.name}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        attachments: draft.attachments?.filter(
                          (_, j) => j !== i,
                        ),
                        cover:
                          draft.cover === file.data ? undefined : draft.cover,
                      })
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {draft.cover && (
                <div className="studio-cover">
                  <img src={draft.cover} alt="Обкладинка референсу" />
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, cover: undefined })}
                  >
                    Прибрати обкладинку
                  </button>
                </div>
              )}
            </details>
            <footer>
              {p.tasks.some((t) => t.id === draft.id) && (
                <button type="button" className="danger" onClick={remove}>
                  Видалити
                </button>
              )}
              <button type="button" onClick={() => setDraft(null)}>
                Скасувати
              </button>
              <button className="primary" type="submit">
                Зберегти
              </button>
            </footer>
          </form>
        )}
      </dialog>
    </section>
  );
}
