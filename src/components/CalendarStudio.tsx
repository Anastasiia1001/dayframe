import { applyRecordEdit } from "../domain/recordEdit";
import { useDraftGuard } from "../useDraftGuard";
import { overviewRange } from "../domain/overview";
import { RecordFields } from "./RecordFields";
import { WeatherCard } from "./WeatherCard";
import { backupKeyAllowed, restOccurrences } from "../domain/rest";
import { DayContext } from "./DayContext";
import { AppearancePicker } from "./AppearancePicker";
import { chooseFocus, focusedOn } from "../domain/focus";
import { mockTasks } from "../data/mockTasks";
import { KeepImport } from "./KeepImport";
import { ManualAssistant } from "./ManualAssistant";
import { taskHorizon } from "../domain/horizons";
import { parseBackup, writeBackup } from "../domain/backup";
import {
  useMemo,
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
  Star,
  MoreHorizontal,
  ChevronDown,
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
  scheduledEvents,
  timeString,
  type Section,
  type LocalOccurrence,
} from "../domain/studio";
import { CalendarCompanion } from "./CalendarCompanion";
import { type MascotId } from "../appearance";

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
  plansMode?: boolean;
  onPlans: () => void;
  onCalendar: () => void;
  onRefresh: () => void;
  syncStatus: string;
  showMascot?: boolean;
  showWeather?: boolean;
  openDayRequest?: number;
};
const localEvent = (e: CalendarEvent): e is LocalOccurrence => "taskId" in e;
const styleColor = (color: string) =>
  ({ "--section-color": color }) as CSSProperties;
export function CalendarStudio(p: Props) {
  const [sections, setSections] = useLocal<Section[]>(
    "dayframe-sections",
    initialSections,
  );
  useEffect(() => {
    setSections((current) =>
      current.some(
        (s) => s.id === "sport" || s.name.toLocaleLowerCase("uk") === "спорт",
      )
        ? current
        : [...current, initialSections.find((s) => s.id === "sport")!],
    );
  }, []);
  const [jiraTitle, setJiraTitle] = useState(""),
    [jiraUrl, setJiraUrl] = useState("");
  const [rightPreference, setRightPreference] = useLocal(
    "dayframe-calendar-right",
    innerWidth >= 1300,
  );
  const [narrow, setNarrow] = useState(() => innerWidth < 1180);
  const [bulkMode, setBulkMode] = useState(false);
  const [planTray, setPlanTray] = useState(false);
  const [templatePreview, setTemplatePreview] = useState(false);
  const [mobile, setMobile] = useState(() => innerWidth < 760);
  const [mobilePanel, setMobilePanel] = useState<"left" | "right" | null>(null);
  const overlay = mobile || narrow;
  const left = mobilePanel === "left";
  const right =
    !p.plansMode && (overlay ? mobilePanel === "right" : rightPreference);
  const setLeft = (value: boolean) =>
    setMobilePanel((current) =>
      value ? "left" : current === "left" ? null : current,
    );
  const setRight = (value: boolean) => {
    if (overlay)
      setMobilePanel((current) =>
        value ? "right" : current === "right" ? null : current,
      );
    else setRightPreference(value);
  };
  useEffect(() => {
    if (p.openDayRequest) setRight(true);
  }, [p.openDayRequest]);
  const [inspected, setInspected] = useState<string | null>(null);
  const inspectedTask = p.tasks.find((t) => t.id === inspected);
  const [sectionEdit, setSectionEdit] = useState(false),
    [message, setMessage] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [storageErrors, setStorageErrors] = useState<string[]>([]);
  const storageError = storageErrors.length > 0;
  const [undo, setUndo] = useState<PersonalTask[] | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  const [bulkDate, setBulkDate] = useState("");
  const [bulkScope, setBulkScope] = useState("one");
  const [draft, setDraft] = useState<PersonalTask | null>(null),
    [occurrence, setOccurrence] = useState<string | null>(null),
    [scope, setScope] = useState("one");
  const guard = useDraftGuard(draft, () => setDraft(null), occurrence);
  const scroll = useRef<HTMLDivElement>(null);
  const selection = useRef<{ day: string; start: number; y: number } | null>(
    null,
  );
  const suppressClick = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null),
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
  const days = useMemo(() => {
    const first = fromDate(key);
    if (view === "Month") first.setDate(1);
    if (view === "Month" || view === "Week")
      first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    return Array.from(
      { length: view === "Month" ? 42 : view === "Week" ? 7 : 1 },
      (_, i) => addDays(dateKey(first), i),
    );
  }, [key, view]);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 8 * 60;
  }, [view]);
  const sectionOf = (t: PersonalTask) =>
    sections.find((s) => s.id === (t.sectionId || "personal")) || sections[0];
  const visibleTasks = useMemo(
    () =>
      p.tasks.filter(
        (t) =>
          !t.isTemplate &&
          !t.disabled &&
          (
            sections.find((s) => s.id === (t.sectionId || "personal")) ||
            sections[0]
          )?.visible !== false,
      ),
    [p.tasks, sections],
  );
  const locals = useMemo(
    () => scheduledEvents(visibleTasks, days[0], days.at(-1)!),
    [visibleTasks, days],
  );
  const allEvents: CalendarEvent[] = useMemo(
    () => [...p.events, ...locals],
    [p.events, locals],
  );
  const [externalVisible, setExternalVisible] = useLocal(
    "dayframe-studio-external",
    true,
  );
  const events = useMemo(
    () => allEvents.filter((e) => localEvent(e) || externalVisible),
    [allEvents, externalVisible],
  );
  const categoryTaskIds = useMemo(
    () => visibleTasks.map((t) => t.id),
    [visibleTasks],
  );
  const externalEvents = useMemo(
    () => p.events.filter(() => externalVisible),
    [p.events, externalVisible],
  );
  const placed = useMemo(
    () =>
      Object.fromEntries(days.map((day) => [day, layoutEvents(events, day)])),
    [events, days],
  );
  const dayEvents = useMemo(
    () =>
      Object.fromEntries(
        days.map((day) => [day, events.filter((e) => eventOnDay(e, day))]),
      ),
    [events, days],
  );
  const untimedByDay = useMemo(
    () =>
      Object.fromEntries(
        days.map((day) => [
          day,
          visibleTasks.filter(
            (t) =>
              !t.completed &&
              !t.inBacklog &&
              t.date === day &&
              !t.seriesExceptions?.[day]?.cancelled &&
              (!t.seriesExceptions?.[day]?.date ||
                t.seriesExceptions[day].date === day) &&
              !t.scheduledStart &&
              !t.allDay,
          ),
        ]),
      ),
    [visibleTasks, days],
  );
  const scopeGroups = [
    { id: "week", name: "Тиждень" },
    { id: "month", name: "Місяць" },
    { id: "quarter", name: "Квартал" },
    { id: "year", name: "Рік" },
    { id: "backlog", name: "Колись / без дати" },
  ];
  const scopeOf = (task: PersonalTask) => {
    const horizon = taskHorizon(task);
    return horizon === "year" && task.category === "Quarter"
      ? "quarter"
      : horizon;
  };
  const [allPlanPeriods, setAllPlanPeriods] = useLocal(
    "dayframe-all-plan-periods",
    false,
  );
  const scopedTasks = p.tasks.filter(
    (t) =>
      !t.completed &&
      !t.disabled &&
      sectionOf(t)?.visible !== false &&
      scopeGroups.some((group) => group.id === scopeOf(t)) &&
      (allPlanPeriods ||
        !t.planningAnchor ||
        scopeOf(t) === "backlog" ||
        (() => {
          const range = overviewRange(
            key,
            scopeOf(t) as "week" | "month" | "quarter" | "year",
          );
          return (
            t.planningAnchor! >= range.from && t.planningAnchor! <= range.to
          );
        })()),
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
      setNarrow(innerWidth < 1180);
    };
    const wide = matchMedia("(max-width:1179px)");
    mq.addEventListener("change", fn);
    wide.addEventListener("change", fn);
    return () => {
      mq.removeEventListener("change", fn);
      wide.removeEventListener("change", fn);
    };
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
    } else dialog.current?.close();
  }, [!!draft]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 6000);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    if (!left && !(overlay && right)) return;
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
  }, [overlay, left, right]);
  const editorOpener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!draft && editorOpener.current?.isConnected)
      editorOpener.current.focus();
  }, [!!draft]);
  const open = (task: PersonalTask, day?: string) => {
    if (!dialog.current?.open)
      editorOpener.current = document.activeElement as HTMLElement;
    setDraft(structuredClone(task));
    setOccurrence(day || null);
    setScope("one");
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
              (minutes(event.end) - minutes(event.start) + 1440) % 1440 ||
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
      open(
        { ...task, date, scheduledStart: start, scheduledDuration: duration },
        original,
      );
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
        else if (task.recurrence !== "once")
          open(
            {
              ...task,
              date: next.date,
              scheduledStart: next.timed
                ? timeString(next.start)
                : task.scheduledStart,
              scheduledDuration: next.duration,
              inBacklog: false,
              planningHorizon: "day",
            },
            d.occurrence,
          );
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
    const next = applyRecordEdit(p.tasks, draft, scope, occurrence);
    try {
      localStorage.setItem("dayframe-tasks", JSON.stringify(next));
    } catch {
      setStorageErrors((keys) => [...new Set([...keys, "dayframe-tasks"])]);
      setMessage("Не вдалося зберегти запис. Редактор залишається відкритим.");
      return;
    }
    save(next);
    try {
      localStorage.removeItem("dayframe-record-draft");
      localStorage.removeItem("dayframe-record-draft-context");
      window.dispatchEvent(new Event("dayframe-draft-updated"));
    } catch {}
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
    try {
      localStorage.removeItem("dayframe-record-draft");
      localStorage.removeItem("dayframe-record-draft-context");
      window.dispatchEvent(new Event("dayframe-draft-updated"));
    } catch {}
    setDraft(null);
  };
  const exportBackup = () => {
    try {
      const data: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (backupKeyAllowed(k)) data[k] = JSON.parse(localStorage.getItem(k)!);
      }
      data["dayframe-tasks"] =
        draft && storageError
          ? applyRecordEdit(p.tasks, draft, scope, occurrence)
          : p.tasks;
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
      {bulkMode && !task.isTemplate && (
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
          {task.inBacklog && scopeOf(task) !== "backlog"
            ? ` · ${
                task.planningAnchor
                  ? (() => {
                      const range = overviewRange(
                        task.planningAnchor!,
                        scopeOf(task) as "week" | "month" | "quarter" | "year",
                      );
                      return `${range.from} — ${range.to}`;
                    })()
                  : "період ще не обрано"
              }`
            : ""}
          {task.deadline
            ? ` · До ${fromDate(task.deadline).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}`
            : ""}
        </small>
        {task.deadline && task.deadline < today && (
          <span className="studio-overdue">Термін минув</span>
        )}
      </button>
      {task.jiraUrl?.startsWith("https://") && (
        <a
          className="task-jira-link"
          href={task.jiraUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Відкрити тікет ${task.title}`}
        >
          ↗
        </a>
      )}
      {!task.isTemplate && !task.inBacklog && task.date === key && (
        <button
          aria-label={`Головне: ${task.title}`}
          aria-pressed={focusedOn(task, key)}
          onClick={() => {
            const next = chooseFocus(p.tasks, task.id, key);
            if (next === p.tasks) setMessage("Обери до трьох головних справ.");
            else save(next);
          }}
        >
          <Star
            size={15}
            fill={focusedOn(task, key) ? "currentColor" : "none"}
          />
        </button>
      )}
      {(p.plansMode || planTray) && (
        <button
          aria-label={`Запланувати ${task.title}`}
          onClick={() =>
            open({
              ...task,
              id: task.isTemplate ? crypto.randomUUID() : task.id,
              isTemplate: false,
              inBacklog: false,
              date: key,
              planningHorizon: "day",
              planningAnchor: key,
            })
          }
        >
          <Clock size={15} />
          <span>Запланувати</span>
        </button>
      )}
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
  const renderPlanGroups = () => (
    <section className="studio-plan-pool" aria-label="Плани для календаря">
      <h2>Від задуму до конкретного дня</h2>
      <p>
        Звичайна справа переміщується. Шаблон створює окреме виконання.
        «Запланувати» працює і без перетягування.
      </p>
      <label className="plan-period-filter">
        <input
          type="checkbox"
          checked={allPlanPeriods}
          onChange={(e) => setAllPlanPeriods(e.target.checked)}
        />
        Показати також плани інших періодів
      </label>
      {scopeGroups.map((group) => {
        const list = scopedTasks.filter((t) => scopeOf(t) === group.id);
        return (
          <details
            className="studio-scope-group"
            key={group.id}
            open={group.id === "week"}
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
  );
  return (
    <section
      className={`calendar-studio ${left ? "has-left" : ""} ${right ? "has-right" : ""} ${p.plansMode ? "plans-mode" : ""} ${overlay ? "panels-overlay" : ""}`}
      aria-label="Творчий календар"
      data-view={view.toLowerCase()}
      // Suppress only the click produced by the completed drag, never a new gesture.
      onPointerDownCapture={(event) => {
        suppressClick.current = false;
        event.currentTarget
          .querySelectorAll<HTMLDetailsElement>(
            ".studio-more[open],.studio-period-picker[open]",
          )
          .forEach((popup) => {
            if (!popup.contains(event.target as Node)) popup.open = false;
          });
      }}
      onKeyDownCapture={(event) => {
        suppressClick.current = false;
        if (event.key === "Escape" && !dialog.current?.open) {
          const popup = event.currentTarget.querySelector<HTMLDetailsElement>(
            ".studio-more[open],.studio-period-picker[open]",
          );
          if (popup) {
            popup.open = false;
            popup.querySelector<HTMLElement>("summary")?.focus();
          }
        }
      }}
      onPointerMove={pointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={cancelDrag}
    >
      <header className="studio-header">
        <details className="studio-period-picker">
          <summary aria-label="Обрати період календаря">
            <h1>
              {p.plansMode
                ? "Плани"
                : view === "Week"
                  ? `${fromDate(days[0]).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })} – ${fromDate(days[6]).toLocaleDateString("uk-UA", { day: "numeric", month: "long" })}`
                  : p.date.toLocaleDateString(
                      "uk-UA",
                      view === "Month"
                        ? { month: "long", year: "numeric" }
                        : { weekday: "long", day: "numeric", month: "long" },
                    )}
            </h1>
            <ChevronDown size={18} />
          </summary>
          <div className="studio-date-popover">
            <label>
              Місяць і рік
              <input
                aria-label="Місяць і рік календаря"
                type="month"
                value={key.slice(0, 7)}
                onChange={(e) => {
                  if (e.target.value)
                    p.onDate(fromDate(e.target.value + "-01"));
                }}
              />
            </label>
            <div className="studio-mini">
              {Array.from({ length: 42 }, (_, i) =>
                addDays(dateKey(miniFirst), i),
              ).map((d) => (
                <button
                  key={d}
                  aria-label={`Перейти до ${d}`}
                  aria-pressed={d === key}
                  onClick={(e) => {
                    p.onDate(fromDate(d));
                    e.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                >
                  {fromDate(d).getDate()}
                </button>
              ))}
            </div>
          </div>
        </details>
        <div className="studio-header-art">
          <AppearancePicker theme={p.theme} onTheme={p.onTheme} />
          {p.showWeather !== false ? (
            <WeatherCard
              compact
              companion={
                p.showMascot !== false ? (
                  <CalendarCompanion theme={p.theme} mascot={p.mascot} />
                ) : undefined
              }
            />
          ) : p.showMascot !== false ? (
            <CalendarCompanion theme={p.theme} mascot={p.mascot} />
          ) : null}
        </div>
      </header>
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
          <button
            title="Перейти до сьогоднішньої дати"
            onClick={() => p.onDate(fromDate(today))}
          >
            Сьогодні
          </button>
          <button
            aria-label="Наступний період"
            onClick={() => p.onDate(moveDate(p.date, view, 1))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        {!p.plansMode && (
          <div className="studio-modes" aria-label="Режим календаря">
            {[
              ["Day", "День"],
              ["Week", "Тиждень"],
              ["Month", "Місяць"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={p.view === id}
                onClick={() => p.onView(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          className="primary"
          onClick={() => create(p.plansMode ? "" : key)}
        >
          <Plus size={17} />
          Додати
        </button>
        {!p.plansMode && (
          <button
            className="calendar-plans-toggle"
            aria-label="Плани для календаря"
            onClick={() => {
              setPlanTray(true);
              setRight(true);
            }}
          >
            <NotebookPen size={17} />
            <span>Плани</span>
          </button>
        )}
        <details className="studio-more">
          <summary aria-label="Ще дії календаря">
            <MoreHorizontal size={20} />
          </summary>
          <div className="studio-more-menu">
            <button onClick={p.onRefresh} disabled={p.loading}>
              Оновити календарі
            </button>
            <button onClick={p.plansMode ? p.onCalendar : p.onPlans}>
              {p.plansMode ? "Відкрити календар" : "Відкрити плани"}
            </button>
            <button
              aria-pressed={bulkMode}
              onClick={() => {
                setBulkMode(!bulkMode);
                setSelected([]);
              }}
            >
              Вибрати кілька справ
            </button>
            <button onClick={exportBackup}>
              <Download size={15} />
              Резервна копія
            </button>
            <button onClick={() => importInput.current?.click()}>
              <Upload size={15} />
              Імпорт резервної копії
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
            <button onClick={p.onLegacy}>
              <NotebookPen size={15} />
              Попередній планер
            </button>
          </div>
        </details>
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
      {mobile && p.view === "Week" && !p.plansMode && (
        <nav className="mobile-week-strip" aria-label="Дні тижня">
          {Array.from({ length: 7 }, (_, i) =>
            addDays(key, -((fromDate(key).getDay() + 6) % 7) + i),
          ).map((d) => (
            <button
              key={d}
              aria-pressed={d === key}
              onClick={() => p.onDate(fromDate(d))}
            >
              <small>
                {fromDate(d).toLocaleDateString("uk-UA", { weekday: "short" })}
              </small>
              <strong>{fromDate(d).getDate()}</strong>
            </button>
          ))}
        </nav>
      )}
      <div className="studio-status" role="status">
        {storageError ? (
          <span className="studio-error">
            Не вдалося записати зміни на пристрої. Зроби експорт перед закриттям
            сторінки.
          </span>
        ) : !online ? (
          "Без інтернету · зміни зберігаються на цьому пристрої"
        ) : (
          "Збережено на пристрої"
        )}
        <details className="studio-data-status">
          <summary>Дані й підключення</summary>
          <p>{p.syncStatus}</p>
          <p>
            Europe/Kyiv · Записи зберігаються в цьому браузері. Резервна копія
            доступна в меню «Ще». Особисті записи «Перепочинку» до неї не
            входять.
          </p>
        </details>
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
      {(left || (overlay && right)) && (
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
            role="dialog"
            aria-modal="true"
          >
            <div className="studio-panel-top">
              <h2>Категорії та джерела</h2>
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
              {p.tasks.some(
                (t) => selected.includes(t.id) && t.recurrence !== "once",
              ) && (
                <label>
                  Повторювані справи
                  <select
                    aria-label="Обсяг групового перенесення"
                    value={bulkScope}
                    onChange={(e) => setBulkScope(e.target.value)}
                  >
                    <option value="one">Лише вибрані виконання</option>
                    <option value="all">Усі серії</option>
                  </select>
                </label>
              )}
              <button
                disabled={!bulkDate}
                onClick={() => {
                  let next = p.tasks;
                  for (const task of p.tasks.filter((t) =>
                    selected.includes(t.id),
                  ))
                    next = applyRecordEdit(
                      next,
                      {
                        ...task,
                        date: bulkDate,
                        inBacklog: false,
                        planningHorizon: "day",
                        planningAnchor: bulkDate,
                      },
                      bulkScope,
                      task.date,
                    );
                  save(next);
                  setSelected([]);
                }}
              >
                Перенести
              </button>
              <button onClick={() => setSelected([])}>Скасувати вибір</button>
            </div>
          )}
          {p.plansMode ? (
            <>
              {renderPlanGroups()}

              <details className="manual-jira-copy">
                <summary>Додати назву тікета Jira вручну</summary>
                <p>
                  Локальна копія назви. Без підключення або синхронізації Jira.
                </p>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!jiraTitle.trim()) return;
                    open({
                      id: crypto.randomUUID(),
                      title: jiraTitle.trim(),
                      date: "",
                      category: "Day",
                      sectionId: "work",
                      recurrence: "once",
                      priority: "Normal",
                      notes: "Додано з Jira вручну. Без синхронізації.",
                      jiraUrl: jiraUrl || undefined,
                      links: jiraUrl ? [jiraUrl] : [],
                      inBacklog: true,
                      planningHorizon: "backlog",
                      completed: false,
                      disabled: false,
                    });
                    setJiraTitle("");
                    setJiraUrl("");
                  }}
                >
                  <label>
                    Назва тікета
                    <input
                      required
                      maxLength={500}
                      value={jiraTitle}
                      onChange={(e) => setJiraTitle(e.target.value)}
                    />
                  </label>
                  <label>
                    Посилання · необов’язково
                    <input
                      type="url"
                      pattern="https://.*"
                      value={jiraUrl}
                      onChange={(e) => setJiraUrl(e.target.value)}
                    />
                  </label>
                  <button className="secondary">Перевірити й додати</button>
                </form>
              </details>
              <details className="template-library">
                <summary>Необов’язкові побутові шаблони</summary>
                <p>
                  Додавай тільки те, що потрібно. Нові справи не з’являються без
                  твого вибору.
                </p>
                <button
                  className="secondary"
                  onClick={() => setTemplatePreview(!templatePreview)}
                >
                  Переглянути шаблони
                </button>
                {templatePreview &&
                  mockTasks
                    .filter((t) => t.isTemplate)
                    .map((t) => (
                      <article key={t.id}>
                        <span>{t.title}</span>
                        <button
                          onClick={() =>
                            open({
                              ...t,
                              id: crypto.randomUUID(),
                              isTemplate: false,
                              inBacklog: true,
                              date: "",
                              planningHorizon: "backlog",
                            })
                          }
                        >
                          Взяти собі
                        </button>
                      </article>
                    ))}
              </details>
            </>
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
                    {(dayEvents[day] || []).slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        className="studio-month-event"
                        style={styleColor(
                          localEvent(e)
                            ? sectionOf(p.tasks.find((t) => t.id === e.taskId)!)
                                ?.color || "#795875"
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
                    {(untimedByDay[day] || [])
                      .slice(0, Math.max(0, 3 - (dayEvents[day] || []).length))
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
                    {dayEvents[day].length + untimedByDay[day].length > 3 && (
                      <button
                        className="studio-month-more"
                        onClick={() => {
                          p.onDate(fromDate(day));
                          setRight(true);
                        }}
                      >
                        Ще{" "}
                        {dayEvents[day].length + untimedByDay[day].length - 3}
                      </button>
                    )}
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
                    {(untimedByDay[day] || []).slice(0, 3).map((t) => (
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
                    {untimedByDay[day].length > 3 && (
                      <button
                        className="studio-untimed-more"
                        onClick={() => {
                          p.onDate(fromDate(day));
                          setRight(true);
                        }}
                      >
                        Ще {untimedByDay[day].length - 3}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!events.length && (
                <p className="studio-grid-hint">
                  Вільний простір для планів. Натисни час або виділи проміжок;
                  для перенесення справ відкрий «Плани» праворуч.
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
                      {(placed[day] || []).map((pos) => {
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
            </div>
          )}
        </div>
        {right && (
          <aside
            className="studio-day-panel"
            aria-label="Панель дня"
            role={overlay ? "dialog" : undefined}
            aria-modal={overlay ? true : undefined}
          >
            <header className="context-panel-header">
              <div className="studio-panel-top">
                <span className="studio-eyebrow">ПЛАНИ ТА ДЕНЬ</span>
                <button
                  aria-label="Згорнути панель дня"
                  onClick={() => setRight(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div
                className="context-panel-tabs"
                role="tablist"
                aria-label="Вміст бічної панелі"
              >
                <button
                  role="tab"
                  aria-selected={!planTray}
                  onClick={() => setPlanTray(false)}
                >
                  День
                </button>
                <button
                  role="tab"
                  aria-selected={planTray}
                  onClick={() => setPlanTray(true)}
                >
                  Плани
                </button>
              </div>
            </header>
            {planTray ? (
              renderPlanGroups()
            ) : (
              <>
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
                <DayContext
                  date={key}
                  today={today}
                  tasks={p.tasks}
                  visibleIds={categoryTaskIds}
                  events={externalEvents}
                  onTasks={save}
                  onEdit={(task) =>
                    open(
                      task,
                      task.recurrence !== "once"
                        ? restOccurrences([task], key)[0]?.occurrence
                        : undefined,
                    )
                  }
                  onEvent={openEvent}
                  onAdd={() => create()}
                  notes={plan.notes}
                  onNotes={(notes) => update({ notes })}
                />
              </>
            )}
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
        onCancel={(e) => {
          e.preventDefault();
          guard.requestClose();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) guard.requestClose();
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
                onClick={guard.requestClose}
              >
                <X size={20} />
              </button>
            </header>
            <RecordFields
              draft={draft}
              onChange={setDraft}
              sections={sections}
              today={today}
              selectedDate={key}
              existing={p.tasks.some((t) => t.id === draft.id)}
              occurrence={occurrence}
              scope={scope}
              onScope={setScope}
            />
            {guard.prompt}
            {storageError && (
              <div role="alert">
                <p>Не вдалося записати зміни. Чернетка лишається відкритою.</p>
                <button type="button" onClick={exportBackup}>
                  Експорт незбережених змін
                </button>
              </div>
            )}
            <footer>
              {p.tasks.some((t) => t.id === draft.id) && (
                <button type="button" className="danger" onClick={remove}>
                  Видалити
                </button>
              )}
              <button type="button" onClick={guard.requestClose}>
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
