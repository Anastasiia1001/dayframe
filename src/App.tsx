import { ThemePreview } from "./components/ThemePreview";
import { CalendarCompanion } from "./components/CalendarCompanion";
import { RestCorner } from "./components/RestCorner";
import { QuickTaskEditor } from "./components/QuickTaskEditor";
import { TodayFocus } from "./components/DayContext";
import { TaskChecklist } from "./components/TaskChecklist";
import { HabitTracker } from "./components/HabitTracker";
import { TodayTaskBoard } from "./components/TodayTaskBoard";
import { PlannerCare, ChatGPTQuestions } from "./components/PlannerCare";
import { moveTodayTask } from "./domain/todayBoard";
import { WeatherCard } from "./components/WeatherCard";
import { InspirationCard } from "./components/InspirationCard";
import {
  TodayFitness,
  TodayPlan,
  PeriodOverview,
  overviewPeriods,
} from "./components/TodayOverview";
import { overviewRange, type OverviewPeriod } from "./domain/overview";
import { FitnessTracker } from "./components/FitnessTracker";
import { useTaskReminders } from "./useTaskReminders";
import { CalendarStudio } from "./components/CalendarStudio";
import { TouchFeedback } from "./components/TouchFeedback";
import { planInHorizon } from "./domain/horizons";
import { ThemeAtmosphere } from "./components/ThemeAtmosphere";
import { CalendarBoard } from "./components/CalendarBoard";
import { PersonalBoard } from "./components/PersonalBoard";
import { TaskList } from "./components/TaskList";
import { EventDetails } from "./components/EventDetails";
import {
  activeTasks,
  sortTasks,
  postponedTask,
  normalizeStoredTasks,
  eventOnDay,
} from "./domain/planning";
import { themes, mascots, safeMascot, isPlannerTheme } from "./appearance";
import { Mascot } from "./components/Mascot";
import { uk, locale, shortDate } from "./locale";
import { nextOccurrence, reopenDueTasks } from "./recurrence";
import { IntegrationSettings } from "./components/IntegrationSettings";
import { useWorkspace } from "./useWorkspace";
import { CozyCompanion, HappyPetals } from "./components/CozyCompanion";
import { Source, Section } from "./components/Primitives";
import { useLocal } from "./useLocal";
import { useEffect, useState } from "react";
import {
  Wind,
  ChevronDown,
  Dumbbell,
  Sun,
  CalendarDays,
  BriefcaseBusiness,
  Check,
  Plus,
  Search,
  Bell,
  Settings,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  X,
  Video,
  MapPin,
  MoreHorizontal,
  Leaf,
  CircleHelp,
  Sparkles,
  CheckCheck,
  PanelLeftClose,
  MessageSquare,
  Trash2,
} from "lucide-react";
import type { CalendarEvent, PersonalTask, Period } from "./types";

import { mockTasks } from "./data/mockTasks";

const nav = [
  ["Today", Sun],
  ["Calendar", CalendarDays],
  ["Work", BriefcaseBusiness],
  ["Personal", CheckCheck],
  ["Fitness", Dumbbell],
] as const;
export default function App() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const visibility = () => {
      document.documentElement.dataset.petPaused = String(document.hidden);
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      delete document.documentElement.dataset.petPaused;
    };
  }, []);
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Kyiv",
  }).format(now);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const blockLabels = {
    plan: "План дня",
    fitness: "Спорт і кроки",
    tasks: "Дошка завдань",
    habits: "Трекер звичок",
    care: "Турбота про себе",
    chat: "ChatGPT",
    weather: "Погода",
    affirmations: "Афірмації",
    facts: "Цікавинки",
    schedule: "Розклад на сьогодні",
    attention: "Потребує відповіді",
    connections: "Підказка підключення календаря",
  };
  const [blocks, setBlocks] = useLocal<Record<string, boolean>>(
    "dayframe-visible-blocks",
    {},
  );
  const visible = (key: string) => blocks[key] !== false;
  const [displayName, setDisplayName] = useLocal("dayframe-display-name", "");
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "♡";
  const [burst, setBurst] = useState(0);
  const [motion, setMotion] = useLocal("dayframe-motion", true);
  useEffect(() => {
    document.documentElement.dataset.motion = motion ? "on" : "off";
  }, [motion]);
  const [ambient, setAmbient] = useLocal("dayframe-ambient", true);
  const [legacyPlanner, setLegacyPlanner] = useLocal(
    "dayframe-classic-planner",
    false,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useLocal(
    "dayframe-sidebar-collapsed",
    false,
  );
  const visibleNav = legacyPlanner
    ? nav
    : [
        ...nav.filter(([name]) =>
          ["Today", "Calendar", "Personal"].includes(name),
        ),
        ["Rest", Wind] as const,
      ];
  const pageName = (name: string) =>
    name === "Rest"
      ? "Перепочинок"
      : !legacyPlanner && name === "Personal"
        ? "Плани"
        : uk(name);
  const [openAIKey, setOpenAIKey] = useState("");
  const [overviewPeriod, setOverviewPeriod] = useState<OverviewPeriod>("day");
  const [page, setPageState] = useState(legacyPlanner ? "Today" : "Calendar");
  const setPage = (next: string) => {
    if (next === page) return;
    const event = new CustomEvent("dayframe-before-navigate", {
      cancelable: true,
      detail: { resume: () => setPageState(next) },
    });
    if (window.dispatchEvent(event)) setPageState(next);
  };
  const [sourcesOpen, setSourcesOpen] = useLocal("dayframe-sources-open", true);
  const [reduceTransparency, setReduceTransparency] = useLocal(
    "dayframe-reduce-transparency",
    false,
  );
  useEffect(() => {
    document.documentElement.dataset.transparency = reduceTransparency
      ? "reduced"
      : "normal";
  }, [reduceTransparency]);
  const [mascot, setMascot] = useLocal("dayframe-mascot", "bunny");
  const [theme, setTheme] = useLocal("dayframe-theme", "Pastel");
  const [fontSize, setFontSize] = useLocal("dayframe-font-size", 100);
  const safeFontSize = Number.isFinite(fontSize)
    ? Math.max(85, Math.min(125, fontSize))
    : 100;
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-scale",
      String(safeFontSize / 100),
    );
  }, [safeFontSize]);
  const [tasks, setTasks] = useLocal<PersonalTask[]>(
    "dayframe-tasks",
    legacyPlanner ? mockTasks : [],
  );
  useEffect(() => {
    setTasks((current) => reopenDueTasks(current, today));
  }, [today, tasks, setTasks]);
  const taskReminders = useTaskReminders(tasks);
  const [modal, setModal] = useState<PersonalTask | null>(null);
  const [eventDetail, setEventDetail] = useState<CalendarEvent | null>(null);
  const [detail, setDetail] = useState<{
    title: string;
    body: string;
    source: string;
  } | null>(null);
  const [openDayRequest, setOpenDayRequest] = useState(0);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [read, setRead] = useLocal<string[]>("dayframe-read", []);
  const [digestGroup, setDigestGroup] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useLocal<string[]>("dayframe-filters", [
    "Outlook",
    "Google",
    "Jira",
    "Personal",
  ]);
  const [calendarView, setCalendarView] = useLocal(
    "dayframe-calendar-view",
    innerWidth < 760 ? "Day" : "Week",
  );
  const [calendarDate, setCalendarDate] = useState(
    () => new Date(today + "T12:00:00"),
  );
  const [toast, setToast] = useState("");
  const [prefs, setPrefs] = useLocal("dayframe-prefs", {
    showPersonal: true,
    defaultRecurrence: "once",
    cozyMode: true,
  });
  const workspace = useWorkspace(
    page === "Calendar" ? calendarDate : new Date(),
    page === "Today" && overviewPeriod !== "day"
      ? overviewRange(today, overviewPeriod)
      : undefined,
  );
  const { events, slack } = workspace;
  const visibleEvents = events.filter((e) => eventOnDay(e, today));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (isPlannerTheme(theme)) document.documentElement.dataset.planner = theme;
    else delete document.documentElement.dataset.planner;
  }, [theme]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setModal(null);
        setDetail(null);
        setEventDetail(null);
        setNotifications(false);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href),
      result = url.searchParams.get("connection");
    if (!result) return;
    if (sessionStorage.getItem("dayframe-login-return") === "settings") {
      setPage("Settings");
      sessionStorage.removeItem("dayframe-login-return");
    }
    if (result === "success") {
      workspace.setMode("live");
      setToast("Обліковий запис підключено. Оновлюємо дані.");
    } else if (result === "cancelled")
      setToast("Підключення скасовано. Спробуй ще раз у налаштуваннях.");
    url.searchParams.delete("connection");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);
  const openMock = (title: string, body: string, source: string) =>
    setDetail({ title, body, source });
  const openItem = (
    title: string,
    body: string,
    source: string,
    url?: string,
  ) => {
    if (workspace.mode === "live" && url) {
      try {
        const u = new URL(url);
        if (u.protocol === "https:") {
          window.open(u.href, "_blank", "noopener,noreferrer");
          return;
        }
      } catch {}
    }
    openMock(title, body, source);
  };
  const addTask = (date = today, inBacklog = false) =>
    setModal({
      id: crypto.randomUUID(),
      title: "",
      inBacklog,
      category: "Day",
      date,
      recurrence: prefs.defaultRecurrence,
      priority: "Normal",
      notes: "",
      completed: false,
      disabled: false,
    });
  const toggleTask = (t: PersonalTask) => {
    setTasks((ts) =>
      ts.map((x) =>
        x.id === t.id
          ? {
              ...x,
              completed: !x.completed,
              completedOn: x.completed ? undefined : today,
              nextOccurrence: x.completed
                ? undefined
                : nextOccurrence(x, today),
            }
          : x,
      ),
    );
    if (!t.completed) {
      setBurst((b) => b + 1);
      setToast("Маленька перемога. Ти молодець! ♡");
    }
  };
  const postpone = (t: PersonalTask) => {
    const next = postponedTask(t, today);
    setTasks((ts) => ts.map((x) => (x.id === t.id ? next : x)));
    setToast("Завдання перенесено на " + shortDate(next.date));
  };
  const todaysTasks = sortTasks(
    activeTasks(tasks).filter((t) => t.date <= today),
  );
  useEffect(() => {
    setTasks((current) => normalizeStoredTasks(current, mockTasks, today));
  }, [tasks, today]);
  useEffect(() => {
    setTasks((current) => {
      let changed = false;
      const localized = current.map((t) => {
        if (!/^(Day|Month|Quarter|Year)-\d+$/.test(t.id)) return t;
        const title = uk(t.title);
        if (title === t.title) return t;
        changed = true;
        return { ...t, title };
      });
      return changed ? localized : current;
    });
  }, [setTasks]);
  const done = todaysTasks.filter((t) => t.completed).length;
  const taskRows = (list: PersonalTask[], full = false) => (
    <TaskList
      tasks={list}
      today={today}
      compact={!full}
      onToggle={toggleTask}
      onEdit={setModal}
      onPostpone={postpone}
      onDelete={
        full
          ? (t) => setTasks((ts) => ts.filter((x) => x.id !== t.id))
          : undefined
      }
    />
  );
  const schedule = (list: CalendarEvent[]) =>
    list.map((e, i) => (
      <button
        className={`event ${e.source === "Google" ? "google" : ""}`}
        key={e.id}
        onClick={() => setEventDetail(e)}
      >
        <div className="event-time">
          {e.start}
          <small>{e.allDay ? "" : e.end}</small>
        </div>
        <div className="event-line" />
        <div className="event-info">
          <strong>{e.title}</strong>
          <small>
            {e.meetingUrl ||
            e.location.includes("Teams") ||
            e.location.includes("Meet") ? (
              <Video size={12} />
            ) : (
              <MapPin size={12} />
            )}{" "}
            {e.location.startsWith("https:") ? "Онлайн-зустріч" : e.location}
          </small>
        </div>
        {e.participants.length > 1 ? (
          <div className="avatars">
            {e.participants.slice(0, 3).map((p, j) => (
              <span
                key={uk(p)}
                style={{ background: ["#e8e3da", "#dce4e1", "#e7dce3"][j] }}
              >
                {p[0]}
              </span>
            ))}
          </div>
        ) : (
          <span className="event-source">{e.accountLabel || e.source}</span>
        )}
        {e.date === today &&
          !e.allDay &&
          e.start > new Date().toTimeString().slice(0, 5) &&
          !list
            .slice(0, i)
            .some(
              (x) =>
                !x.allDay && x.start > new Date().toTimeString().slice(0, 5),
            ) && <span className="soon">НЕЗАБАРОМ</span>}
      </button>
    ));
  const digest = () => (
    <>
      {slack.length > 0 && (
        <div className="digest-tabs">
          <select
            aria-label="Категорія огляду"
            value={digestGroup}
            onChange={(e) => setDigestGroup(e.target.value)}
          >
            <option value="All">Усі повідомлення</option>
            {[...new Set(slack.map((s) => s.group))].map((g) => (
              <option key={g} value={g}>
                {uk(g)}
              </option>
            ))}
          </select>
          <span className="muted">
            {
              slack.filter(
                (s) => digestGroup === "All" || s.group === digestGroup,
              ).length
            }{" "}
            повідомлень
          </span>
        </div>
      )}
      <div className="digest-list">
        {slack.length === 0 && (
          <div className="empty">
            <MessageSquare size={22} />
            <p>
              {workspace.mode === "live"
                ? "Дані Slack не завантажено. Підключи Slack у налаштуваннях або онови джерела."
                : "Відповідних повідомлень немає."}
            </p>
            <button className="text-button" onClick={() => setPage("Settings")}>
              Налаштувати Slack <ArrowRight size={14} />
            </button>
          </div>
        )}
        {slack
          .filter((s) => digestGroup === "All" || s.group === digestGroup)
          .map((s) => (
            <article key={s.id} className="digest-item">
              <button
                className="digest-toggle"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <span
                  className={`digest-symbol ${s.group === "Could help here" ? "help-symbol" : ""}`}
                >
                  {s.group === "Could help here" ? (
                    <Sparkles size={16} />
                  ) : (
                    <MessageSquare size={16} />
                  )}
                </span>
                <div className="grow">
                  <div className="digest-meta">
                    <strong>{uk(s.group)}</strong>
                    <span>#{s.channel}</span>
                    <span>
                      {workspace.mode === "live"
                        ? new Date(s.time).toLocaleString(locale, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                        : s.time}
                    </span>
                  </div>
                  <p>{s.summary}</p>
                </div>
                <ChevronRight
                  size={16}
                  className={expanded === s.id ? "rotate" : ""}
                />
              </button>
              {expanded === s.id && (
                <div className="digest-expanded">
                  <p>
                    <strong>{s.author}</strong> · {s.why}
                  </p>
                  <button
                    className="text-button"
                    onClick={() =>
                      openItem(
                        "#" + s.channel,
                        s.summary + "\n\n" + s.why,
                        "Slack",
                        s.url,
                      )
                    }
                  >
                    Відкрити у Slack <ArrowUpRight size={13} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      if (
                        tasks.some(
                          (t) => t.origin?.id === s.id || t.notes === s.id,
                        )
                      ) {
                        setToast("Уже є серед твоїх завдань");
                        return;
                      }
                      setModal({
                        id: crypto.randomUUID(),
                        title: "",
                        category: "Day",
                        date: today,
                        recurrence: "once",
                        priority: "Normal",
                        notes: s.summary + "\n\n" + s.why,
                        origin: { source: "Slack", id: s.id },
                        completed: false,
                        disabled: false,
                      });
                    }}
                  >
                    <Plus size={13} />
                    Додати до завдань
                  </button>
                </div>
              )}
            </article>
          ))}
      </div>
    </>
  );
  const attention = slack
    .filter((s) => s.group === "Direct mentions")
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      source: "Slack",
      title: s.summary,
      summary: `#${s.channel} · ${s.author}`,
      badge: "Згадка",
      body: s.why,
      url: s.url,
    }));
  const notificationsList = [
    ...attention.map((a, i) => ({
      id: "mention-" + a.id,
      title: a.title,
      body: a.summary,
      source: a.source,
    })),
    ...visibleEvents.slice(0, 2).map((e) => ({
      id: e.id,
      title: e.title,
      body: `${e.start} · ${e.location}`,
      source: e.source,
    })),
    ...todaysTasks
      .filter((t) => !t.completed)
      .slice(0, 1)
      .map((t) => ({
        id: t.id,
        title: t.title,
        body: "Особисте завдання · " + uk(t.recurrence),
        source: "Personal",
      })),
  ];
  const dayNotes = () => {
    try {
      return Object.entries(
        JSON.parse(
          localStorage.getItem("dayframe-daily-plans") || "{}",
        ) as Record<string, { notes?: string }>,
      )
        .filter(
          ([date, value]) =>
            /^\d{4}-\d{2}-\d{2}$/.test(date) &&
            typeof value?.notes === "string" &&
            value.notes,
        )
        .map(([date, value]) => ({
          id: date,
          title: `Нотатки · ${new Date(date + "T12:00:00").toLocaleDateString("uk-UA")}`,
          body: value.notes!,
        }));
    } catch {
      return [];
    }
  };
  const searchGroups = [
    {
      source: "Calendar",
      items: events.map((x) => ({
        id: x.id,
        title: x.title,
        body: `${x.start} · ${x.source} · ${x.location}`,
      })),
    },
    {
      source: "Slack",
      items: slack.map((x) => ({
        id: x.id,
        title: x.summary,
        body: `#${x.channel} · ${x.author}`,
      })),
    },
    {
      source: "Personal",
      items: tasks
        .filter((t) => !t.isTemplate)
        .map((x) => ({
          id: x.id,
          title: x.title,
          body: `${uk(x.category)} · ${uk(x.recurrence)} · ${x.notes}`,
        })),
    },
    { source: "DayNotes", items: searchOpen ? dayNotes() : [] },
  ].map((g) => ({
    ...g,
    items: g.items.filter((x) =>
      (x.title + " " + x.body).toLowerCase().includes(query.toLowerCase()),
    ),
  }));
  const hasCalendar =
    workspace.mode === "demo" ||
    !!workspace.status?.providers.some((p) => p.id !== "slack" && p.connected);
  function calendar(plansMode = false) {
    if (!legacyPlanner)
      return (
        <CalendarStudio
          tasks={tasks}
          onTasks={setTasks}
          events={events}
          onExternal={setEventDetail}
          date={calendarDate}
          onDate={setCalendarDate}
          view={calendarView === "Agenda" ? "Week" : calendarView}
          onView={setCalendarView}
          theme={theme}
          onTheme={setTheme}
          mascot={safeMascot(mascot)}
          onLegacy={() => {
            setLegacyPlanner(true);
            setCalendarView("Day");
          }}
          loading={workspace.loading}
          plansMode={plansMode}
          onPlans={() => setPage("Personal")}
          onCalendar={() => setPage("Calendar")}
          onRefresh={() => void workspace.refresh()}
          syncStatus={
            workspace.mode === "demo"
              ? "Демонстраційні дані"
              : hasCalendar
                ? workspace.loading
                  ? "Оновлюємо календарі…"
                  : workspace.updated
                    ? `Календарі оновлено о ${workspace.updated.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`
                    : "Підключені календарі"
                : "Google та Outlook не підключено"
          }
          showMascot={prefs.cozyMode !== false}
          showWeather={visible("weather")}
          openDayRequest={openDayRequest}
        />
      );
    return (
      <>
        <button className="secondary" onClick={() => setLegacyPlanner(false)}>
          Повернутися до творчого календаря
        </button>
        <CalendarBoard
          theme={theme}
          mascot={safeMascot(mascot)}
          onTheme={setTheme}
          events={events}
          tasks={tasks}
          today={today}
          date={calendarDate}
          onDate={setCalendarDate}
          view={calendarView}
          onView={setCalendarView}
          filters={filters}
          onFilters={setFilters}
          onEvent={setEventDetail}
          onTask={setModal}
          onPostpone={postpone}
          onDelete={(task) =>
            setTasks((ts) => ts.filter((t) => t.id !== task.id))
          }
          onToggleTask={toggleTask}
          onAdd={addTask}
          loading={workspace.loading}
          hasCalendar={hasCalendar}
          onConnect={() => setPage("Settings")}
        />
      </>
    );
  }
  return (
    <div
      className={`app planner-prism ${!legacyPlanner ? "product-layout" : ""} ${sidebarCollapsed ? "nav-collapsed" : ""}`}
    >
      {ambient &&
        !isPlannerTheme(theme) &&
        (legacyPlanner || !["Calendar", "Personal", "Rest"].includes(page)) && (
          <ThemeAtmosphere theme={theme} />
        )}
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Today");
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            ✿
          </span>
          <span className="brand-word">
            dayframe<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">{initials}</span>
          <div>
            {displayName.trim()
              ? displayName.trim() + " — мій простір"
              : "Твій простір"}
            <small>Особистий простір</small>
          </div>
          <span className="workspace-chevron">⌄</span>
        </div>
        <div className="nav-label">ТВІЙ ПРОСТІР</div>
        <nav>
          {visibleNav.map(([name, Icon]) => (
            <button
              key={uk(name)}
              className={page === name ? "selected" : ""}
              aria-current={page === name ? "page" : undefined}
              aria-label={pageName(name)}
              onClick={() => {
                setPage(name);
                if (name === "Today") setOverviewPeriod("day");
              }}
            >
              <span
                className="clay-nav-icon"
                data-nav={name}
                aria-hidden="true"
              />
              <Icon size={18} />
              <span className="nav-text">{pageName(name)}</span>
              {name === "Today" && attention.length > 0 && (
                <span className="nav-count">{attention.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <button
          className="nav-label sources-toggle"
          aria-label="Джерела"
          aria-expanded={sourcesOpen}
          onClick={() => setSourcesOpen(!sourcesOpen)}
        >
          ТВОЇ ДЖЕРЕЛА{" "}
          <span>
            {workspace.mode === "demo"
              ? "ДЕМО"
              : workspace.status?.providers.filter((p) => p.connected).length ||
                0}
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="connections" hidden={!sourcesOpen}>
          {["Outlook", "Google", "Slack", "Jira"]
            .filter(
              (s) =>
                s !== "Jira" ||
                workspace.status?.providers.some(
                  (p) => p.id === "jira" && p.configured,
                ),
            )
            .map((s) => (
              <button key={uk(s)} onClick={() => setPage("Settings")}>
                <Source name={s} />
                {s === "Google"
                  ? "Календар Google"
                  : s === "Outlook"
                    ? "Календар Outlook"
                    : s}
                <i
                  className={
                    workspace.mode === "live" &&
                    workspace.status?.providers.some(
                      (p) =>
                        (s === "Outlook"
                          ? p.id.startsWith("outlook-")
                          : p.id === s.toLowerCase()) && p.connected,
                    )
                      ? "connected"
                      : "disconnected"
                  }
                />
              </button>
            ))}
        </div>
        <div className="sidebar-bottom">
          <div className="quiet-note">
            <Leaf size={18} />
            <p>
              Трохи менше шуму.
              <br />
              <strong>Трохи більше радості. ♡</strong>
            </p>
          </div>
          <button
            onClick={() => setPage("Settings")}
            className={page === "Settings" ? "selected" : ""}
          >
            <Settings size={17} />
            Налаштування
          </button>
          <button
            onClick={() =>
              openMock(
                "Спокійний початок дня",
                "Dayframe збирає твій день в одному місці. Підключи Outlook, Календар Google і Slack у налаштуваннях або спробуй деморежим. Зовнішні джерела доступні лише для читання; Confluence вимкнена. Особисті завдання зберігаються в цьому браузері.",
                "Dayframe",
              )
            }
          >
            <CircleHelp size={17} />
            Допомога й перші кроки
            <ArrowUpRight size={13} />
          </button>
          <button className="profile" onClick={() => setPage("Settings")}>
            <span className="profile-avatar">{initials}</span>
            <span>
              {displayName.trim() || "Особистий профіль"}
              <small>Залиши місце для важливого</small>
            </span>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </aside>
      <div className={`main-shell page-${page.toLowerCase()}`}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="global-nav-toggle"
              aria-label="Згорнути або розгорнути навігацію"
              aria-expanded={!sidebarCollapsed}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <PanelLeftClose size={17} />
            </button>
            <span className="crumb-divider" />
            Твій простір <ChevronRight size={13} />
            <strong>{pageName(page)}</strong>
          </div>
          <div className="top-actions">
            <button
              className="search-trigger"
              aria-label={
                legacyPlanner ? undefined : "Пошук справ, подій і нотаток"
              }
              onClick={() => setSearchOpen(true)}
            >
              <Search size={16} />
              <span>Знайти щось…</span>
              <kbd>⌘ K</kbd>
            </button>
            {!legacyPlanner && (
              <button
                className="primary global-add"
                onClick={() => addTask()}
                aria-label="Швидко додати справу"
              >
                <Plus size={16} />
                <span>Додати</span>
              </button>
            )}
            <span className="top-divider" />
            <button
              className="notification-trigger"
              aria-label="Сповіщення"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              {notificationsList.some((n) => !read.includes(n.id)) && <i />}
            </button>
            <button
              className="mini-avatar"
              onClick={() => setPage("Settings")}
              aria-label="Налаштування профілю"
            >
              {initials}
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading" hidden={page === "Rest"}>
            <div>
              {page === "Today" && (
                <div className="date-eyebrow">
                  {new Date().toLocaleDateString(locale, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}
              <h1>
                {page === "Today"
                  ? "Сьогодні"
                  : page === "Personal"
                    ? "Мої завдання"
                    : page === "Work"
                      ? "Робочі повідомлення"
                      : page === "Calendar"
                        ? "Календар"
                        : page === "Fitness"
                          ? "Спорт і кроки"
                          : "Налаштування"}
              </h1>
              <p>
                {page === "Today"
                  ? "Зустрічі, актуальні справи й запити на відповідь."
                  : page === "Personal"
                    ? "Від року до конкретного дня — усі плани поруч."
                    : page === "Work"
                      ? "Прямі згадки й повідомлення вибраних каналів."
                      : page === "Calendar"
                        ? "Події на шкалі часу. Завдання без часу — окремо."
                        : page === "Fitness"
                          ? "Вправи, тренування та щоденний рух у власному темпі."
                          : "Теми, помічник і підключення облікових записів."}
              </p>
            </div>
            {!legacyPlanner && page === "Today" && visible("weather") && (
              <WeatherCard
                compact
                companion={
                  prefs.cozyMode !== false ? (
                    <CalendarCompanion
                      theme={theme}
                      mascot={safeMascot(mascot)}
                    />
                  ) : undefined
                }
              />
            )}
          </div>
          <div className="workspace-toolbar" hidden={page === "Rest"}>
            <span
              className={`mode-badge ${workspace.mode === "demo" ? "demo" : ""}`}
            >
              <span className="live-dot" />
              {workspace.mode === "demo"
                ? "Демонстраційні дані"
                : "Власні дані"}
            </span>
            <span className="sync-time">
              {!hasCalendar && workspace.mode !== "demo"
                ? "Збереження на цьому пристрої"
                : workspace.updated
                  ? "Синхронізовано о " +
                    workspace.updated.toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })
                  : "Google та Outlook не підключено"}
            </span>
            <button
              className="secondary"
              onClick={() => void workspace.refresh()}
              disabled={workspace.loading}
            >
              {workspace.loading ? "Оновлюємо…" : "Оновити"}
            </button>
            {["Today", "Personal"].includes(page) && (
              <button className="primary quick-add" onClick={() => addTask()}>
                <Plus size={16} />
                Додати завдання
              </button>
            )}
          </div>
          {prefs.cozyMode !== false && page === "Today" && (
            <CozyCompanion
              mascot={safeMascot(mascot)}
              hideMascot={!legacyPlanner && visible("weather")}
              burst={burst}
              tasks={tasks}
              today={today}
              alerts={taskReminders.alerts}
              onOpenTask={setModal}
              onOpenChat={() => {
                setBlocks((old) => ({ ...old, chat: true }));
                requestAnimationFrame(() =>
                  document.getElementById("planner-chat")?.scrollIntoView({
                    behavior: matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                      ? "auto"
                      : "smooth",
                    block: "start",
                  }),
                );
              }}
            />
          )}
          {workspace.errors
            .filter((e) => workspace.status || page === "Settings")
            .map((e) => (
              <div className="workspace-alert" key={e} role="status">
                <CircleHelp size={18} />
                <p>{e}</p>
                <button
                  onClick={() => void workspace.refresh()}
                  disabled={workspace.loading}
                >
                  Повторити
                </button>
                <button onClick={() => setPage("Settings")}>
                  Підключення <ArrowRight size={15} />
                </button>
              </div>
            ))}
          {page === "Today" && (
            <nav className="overview-periods" aria-label="Період огляду">
              {overviewPeriods.map(([id, name]) => (
                <button
                  key={id}
                  aria-pressed={overviewPeriod === id}
                  onClick={() => setOverviewPeriod(id)}
                >
                  {name}
                </button>
              ))}
            </nav>
          )}
          {page === "Today" && overviewPeriod !== "day" && (
            <PeriodOverview
              loading={workspace.loading}
              period={overviewPeriod}
              today={today}
              tasks={tasks}
              events={events}
              onEdit={setModal}
              onToggle={toggleTask}
              onEvent={setEventDetail}
            />
          )}
          {page === "Today" && overviewPeriod === "day" && (
            <div className="focused-dashboard">
              <nav className="planner-shortcuts" aria-label="Розділи планера">
                {[
                  ["planner-tasks", "Справи"],
                  ["planner-habits", "Трекер"],
                  ["planner-care", "Турбота"],
                  ["planner-weather", "Погода"],
                  ["planner-chat", "ChatGPT"],
                ]
                  .filter(([id]) =>
                    visible(
                      (
                        {
                          "planner-tasks": "tasks",
                          "planner-habits": "habits",
                          "planner-care": "care",
                          "planner-weather": "weather",
                          "planner-chat": "chat",
                        } as Record<string, string>
                      )[id],
                    ),
                  )
                  .map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() =>
                        document.getElementById(id)?.scrollIntoView({
                          behavior: matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "auto"
                            : "smooth",
                          block: "start",
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
              </nav>
              <div className="today-overview-grid">
                {visible("plan") && !legacyPlanner && (
                  <TodayFocus
                    date={today}
                    today={today}
                    tasks={tasks}
                    events={events}
                    onTasks={setTasks}
                    onEdit={setModal}
                    onAdd={() => addTask()}
                  />
                )}
                {visible("plan") && legacyPlanner && (
                  <TodayPlan
                    date={today}
                    onCalendar={() => {
                      setCalendarDate(new Date(today + "T12:00:00"));
                      setCalendarView("Day");
                      setPage("Calendar");
                    }}
                  />
                )}
                {visible("fitness") && (
                  <TodayFitness
                    date={today}
                    onOpen={() => setPage("Fitness")}
                  />
                )}
              </div>
              {!hasCalendar && !workspace.loading && visible("connections") && (
                <div className="connect-strip">
                  <CalendarDays size={21} />
                  <div>
                    <strong>Додай календар — решта вже під рукою</strong>
                    <p>
                      Outlook і Google покажуть події тут. Особистими завданнями
                      можна користуватися вже зараз.
                    </p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => setPage("Settings")}
                  >
                    Підключити календар
                  </button>
                </div>
              )}
              <div
                className={`focus-columns ${!hasCalendar ? "tasks-first" : ""}`}
              >
                {hasCalendar && visible("schedule") && (
                  <Section
                    title="Розклад на сьогодні"
                    action={
                      <button
                        className="text-button"
                        onClick={() => setPage("Calendar")}
                      >
                        Весь календар <ArrowRight size={15} />
                      </button>
                    }
                  >
                    <div className="schedule-list">
                      {workspace.loading ? (
                        <p className="board-empty" role="status">
                          Оновлюємо події…
                        </p>
                      ) : visibleEvents.length ? (
                        schedule(visibleEvents)
                      ) : (
                        <div className="board-empty">
                          <CalendarDays size={24} />
                          <p>На сьогодні зустрічей немає.</p>
                          <button
                            className="text-button"
                            onClick={() => setPage("Calendar")}
                          >
                            Переглянути інший день
                          </button>
                        </div>
                      )}
                    </div>
                  </Section>
                )}
              </div>
              {prefs.showPersonal && visible("tasks") && (
                <TodayTaskBoard
                  tasks={tasks}
                  today={today}
                  onToggle={toggleTask}
                  onEdit={setModal}
                  onPostpone={postpone}
                  onAdd={() => addTask()}
                  onMove={(id, column, before) => {
                    setTasks((old) =>
                      moveTodayTask(old, id, column, today, before),
                    );
                    if (column === "done") {
                      setBurst((n) => n + 1);
                      setToast("Маленька перемога. Ти молодець! ♡");
                    }
                  }}
                />
              )}
              {visible("habits") && <HabitTracker today={today} />}
              <div className="today-overview-grid">
                {visible("care") && <PlannerCare today={today} />}
                {visible("chat") && (
                  <ChatGPTQuestions
                    apiKey={openAIKey}
                    onKey={setOpenAIKey}
                    mascot={safeMascot(mascot)}
                  />
                )}
              </div>
              <div className="today-overview-grid">
                {visible("weather") && legacyPlanner && <WeatherCard />}
                <div className="planner-inspiration-pair">
                  {visible("affirmations") && (
                    <InspirationCard kind="affirmations" />
                  )}
                  {visible("facts") && <InspirationCard kind="facts" />}
                </div>
              </div>
              {attention.length > 0 && visible("attention") && (
                <Section
                  title="Потребує відповіді"
                  action={
                    <button
                      className="text-button"
                      onClick={() => setPage("Work")}
                    >
                      Slack <ArrowRight size={15} />
                    </button>
                  }
                >
                  {attention.map((a) => (
                    <button
                      className="attention-item"
                      key={a.id}
                      onClick={() => openItem(a.title, a.body, a.source, a.url)}
                    >
                      <Source name={a.source} />
                      <div>
                        <strong>{a.title}</strong>
                        <p>{a.summary}</p>
                      </div>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </Section>
              )}
            </div>
          )}
          {page === "Calendar" && calendar()}
          {page === "Fitness" && <FitnessTracker />}
          {page === "Rest" && (
            <RestCorner
              today={today}
              tasks={tasks}
              onExit={() => setPage("Calendar")}
              onCommit={(next) => {
                try {
                  localStorage.setItem("dayframe-tasks", JSON.stringify(next));
                  setTasks(next);
                } catch {
                  return "Не вдалося зберегти зміни. Нічого не застосовано; повтори спробу.";
                }
              }}
            />
          )}
          {page === "Personal" && !legacyPlanner && calendar(true)}
          {page === "Personal" && legacyPlanner && (
            <PersonalBoard
              tasks={tasks}
              today={today}
              onToggle={toggleTask}
              onEdit={setModal}
              onPostpone={postpone}
              onDelete={(t) =>
                setTasks((ts) => ts.filter((x) => x.id !== t.id))
              }
              onPlan={(task, horizon) => {
                const planned = planInHorizon(
                  task,
                  horizon,
                  today,
                  crypto.randomUUID(),
                );
                setTasks((ts) =>
                  task.isTemplate
                    ? [...ts, planned]
                    : ts.map((t) => (t.id === task.id ? planned : t)),
                );
                setToast(
                  task.isTemplate
                    ? "Шаблон додано до плану"
                    : "Період планування змінено",
                );
              }}
              onSchedule={(task, date) => {
                if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
                if (!date && task.isTemplate) return;
                const planned = {
                  ...task,
                  id: task.isTemplate ? crypto.randomUUID() : task.id,
                  isTemplate: false,
                  planningHorizon: date
                    ? ("day" as const)
                    : ("backlog" as const),
                  planningAnchor: today,
                  inBacklog: !date,
                  date: date || task.date,
                  completed: false,
                  completedOn: undefined,
                  nextOccurrence: undefined,
                };
                setTasks((ts) =>
                  task.isTemplate
                    ? [...ts, planned]
                    : ts.map((t) => (t.id === task.id ? planned : t)),
                );
                setToast(
                  task.isTemplate
                    ? "Справу заплановано, шаблон збережено"
                    : date
                      ? "Дату завдання змінено"
                      : "Завдання повернуто в беклог",
                );
              }}
              onImportJira={(title, url) => {
                if (url) {
                  try {
                    if (new URL(url).protocol !== "https:") return;
                  } catch {
                    return;
                  }
                }
                setTasks((ts) => [
                  ...ts,
                  {
                    id: crypto.randomUUID(),
                    title,
                    inBacklog: true,
                    jiraUrl: url || undefined,
                    category: "Day",
                    date: today,
                    recurrence: "once",
                    priority: "Normal",
                    notes: "Додано з Jira вручну. Без синхронізації.",
                    completed: false,
                    disabled: false,
                  },
                ]);
                setToast("Назву тікета додано як особисте завдання");
              }}
              onAddBacklog={() => addTask(today, true)}
            />
          )}
          {page === "Work" && (
            <div className="work-stack">
              {workspace.jira.length > 0 && (
                <Section
                  title="Jira · Твої завдання"
                  eyebrow="ДЕДЛАЙНИ В КАЛЕНДАРІ · БЕЗ ДАТИ — ЗАПЛАНУЙ САМА"
                >
                  <div className="jira-plans">
                    {workspace.jira.map((issue) => (
                      <article key={issue.id}>
                        <div>
                          <a href={issue.url} target="_blank" rel="noreferrer">
                            {issue.key}
                          </a>
                          <strong>{issue.title}</strong>
                          <small>
                            {issue.status}
                            {issue.due
                              ? ` · Дедлайн ${issue.due}`
                              : " · Без дати"}
                          </small>
                        </div>
                        <button
                          className="secondary"
                          disabled={tasks.some((t) =>
                            t.links?.includes(issue.url),
                          )}
                          onClick={() =>
                            setModal({
                              id: crypto.randomUUID(),
                              title: `${issue.key} · ${issue.title}`,
                              category: "Day",
                              date: issue.due || today,
                              recurrence: "once",
                              priority: "Normal",
                              notes: "",
                              links: [issue.url],
                              completed: false,
                              disabled: false,
                            })
                          }
                        >
                          {tasks.some((t) => t.links?.includes(issue.url))
                            ? "У планах"
                            : "Запланувати"}
                        </button>
                      </article>
                    ))}
                  </div>
                </Section>
              )}

              <Section
                title="Slack · Важливе для тебе"
                action={
                  <span className="ai-label">
                    {workspace.mode === "demo"
                      ? "Демонстраційні огляди"
                      : "Лише читання · Без ШІ-огляду"}
                  </span>
                }
              >
                {digest()}
              </Section>
            </div>
          )}
          {page === "Settings" && (
            <div className="settings-stack">
              <Section title="Спокійний інтерфейс">
                <label className="setting-row">
                  <div>
                    <strong>Зменшити прозорість</strong>
                    <small>
                      Щільні поверхні без розмиття. Системне налаштування також
                      враховується.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="Зменшити прозорість"
                    checked={reduceTransparency}
                    onChange={(e) => setReduceTransparency(e.target.checked)}
                  />
                </label>
                <label className="setting-row">
                  <div>
                    <strong>Анімації інтерфейсу</strong>
                    <small>
                      Можна вимкнути рух помічника, погоди й декору.
                      Налаштування ОС також враховуються.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label="Анімації інтерфейсу"
                    checked={motion}
                    onChange={(e) => setMotion(e.target.checked)}
                  />
                </label>
              </Section>
              <Section title="Розмір шрифтів">
                <label className="setting-row">
                  <span>
                    Масштаб тексту <strong>{safeFontSize}%</strong>
                  </span>
                  <input
                    aria-label="Розмір шрифтів"
                    type="range"
                    min="85"
                    max="125"
                    step="5"
                    value={safeFontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  />
                </label>
                <p className="font-size-preview">
                  Твої плани — у зручному для тебе розмірі.
                </p>
                <button className="secondary" onClick={() => setFontSize(100)}>
                  Стандартний розмір
                </button>
              </Section>
              <Section title="Блоки на сьогодні">
                <p className="section-description">
                  Залиши те, що потрібно саме тобі. Дані прихованих блоків
                  зберігаються.
                </p>
                {Object.entries(blockLabels).map(([key, label]) => (
                  <label className="setting-row" key={key}>
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label={label}
                      checked={visible(key)}
                      onChange={(e) =>
                        setBlocks((old) => ({
                          ...old,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                  </label>
                ))}
              </Section>
              <Section title="Твій профіль">
                <label className="setting-row">
                  <div>
                    <strong>Ім’я у застосунку</strong>
                    <small>Зберігається лише в цьому браузері.</small>
                  </div>
                  <input
                    aria-label="Ім’я у застосунку"
                    maxLength={40}
                    placeholder="Твоє ім’я"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </label>
              </Section>
              <Section title="Оформлення" eyebrow="ТВІЙ ПРОСТІР, ТВІЙ СТИЛЬ">
                <p className="section-description">
                  Обери кольори під свій настрій.
                </p>
                <div className="theme-grid">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      data-theme-id={t.id}
                      className={`theme-choice ${theme === t.id ? "chosen" : ""}`}
                      onClick={() => setTheme(t.id)}
                      aria-pressed={theme === t.id}
                    >
                      <ThemePreview id={t.id} />
                      <b>{t.name}</b>
                      {theme === t.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
                <p className="muted">
                  Тема визначає кольори акцентів, фону, тексту, вибраних
                  елементів і календаря.
                </p>
              </Section>
              <Section
                title="Твій маленький помічник"
                eyebrow="ОБЕРИ ТОГО, ХТО ПІДТРИМУВАТИМЕ ТЕБЕ"
              >
                <p className="section-description">
                  Натисни на героя, щоб познайомитися. Він радітиме твоїм
                  маленьким перемогам.
                </p>
                <div className="mascot-grid">
                  {mascots.map((m) => (
                    <button
                      key={m.id}
                      className={`mascot-choice ${safeMascot(mascot) === m.id ? "chosen" : ""}`}
                      aria-pressed={safeMascot(mascot) === m.id}
                      onClick={() => setMascot(m.id)}
                    >
                      <Mascot kind={m.id} />
                      <strong>{m.name}</strong>
                      <small>{m.description}</small>
                      {safeMascot(mascot) === m.id && (
                        <Check className="mascot-selected" size={16} />
                      )}
                    </button>
                  ))}
                </div>
                <p className="section-description">
                  Анімації враховують системне налаштування «Зменшити рух».
                  Помічника можна приховати нижче.
                </p>
              </Section>
              {!legacyPlanner && (
                <Section title="Джерела й додаткові можливості">
                  <button className="secondary" onClick={() => setPage("Work")}>
                    Повідомлення Slack і записи Jira
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setPage("Fitness")}
                  >
                    Трекер спорту і кроків
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setLegacyPlanner(true)}
                  >
                    Відкрити попередню версію планера
                  </button>
                </Section>
              )}
              <IntegrationSettings workspace={workspace} />
              <Section title="Dayframe на твоєму Mac">
                <div className="mac-install">
                  <strong>Окреме вікно. Маленька квіточка в Dock.</strong>
                  <p>
                    У Safari на macOS Sonoma або новішій відкрий Dayframe та
                    вибери <b>Файл → Додати до Dock</b>. Для підключення
                    облікових записів використовуй серверну версію.
                  </p>
                  <small>
                    Вебзастосунок може мати окреме сховище: завдання не
                    переносяться автоматично. Окремого інсталятора .dmg поки
                    немає.
                  </small>
                  <a
                    href="https://github.com/Anastasiia1001/dayframe/blob/main/docs/MAC.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Як установити на Mac <ArrowUpRight size={14} />
                  </a>
                </div>
              </Section>
              <Section title="Особисті завдання">
                <label className="setting-row">
                  <div>
                    <strong>Анімований фон</strong>
                    <small>
                      {isPlannerTheme(theme)
                        ? "У темах планера декор статичний. Рух доступний в інших темах."
                        : "Листя, пелюстки, зорі й хмаринки під настрій теми. Враховує системне зменшення руху."}
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    aria-label="Анімований фон"
                    disabled={isPlannerTheme(theme) || !motion}
                    checked={ambient && !isPlannerTheme(theme) && motion}
                    onChange={(e) => setAmbient(e.target.checked)}
                  />
                </label>
                <label className="setting-row">
                  <div>
                    <strong>Показувати маленького помічника</strong>
                    <small>
                      Залиш трохи підтримки або приховай її, щоб зосередитися.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.cozyMode !== false}
                    onChange={(e) =>
                      setPrefs({ ...prefs, cozyMode: e.target.checked })
                    }
                  />
                </label>
                <label className="setting-row">
                  <div>
                    <strong>Показувати особисті завдання на сьогодні</strong>
                    <small>
                      Залиши трохи місця для життя поряд із роботою.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.showPersonal}
                    onChange={(e) =>
                      setPrefs({ ...prefs, showPersonal: e.target.checked })
                    }
                  />
                </label>
                <label className="setting-row">
                  <div>
                    <strong>Типове повторення</strong>
                    <small>Використовується для нових особистих завдань.</small>
                  </div>
                  <select
                    value={prefs.defaultRecurrence}
                    onChange={(e) =>
                      setPrefs({ ...prefs, defaultRecurrence: e.target.value })
                    }
                  >
                    {[
                      "once",
                      "daily",
                      "weekly",
                      "monthly",
                      "every 3 months",
                      "yearly",
                      "custom",
                    ].map((r) => (
                      <option key={r} value={r}>
                        {uk(r)}
                      </option>
                    ))}
                  </select>
                </label>
              </Section>
            </div>
          )}
        </main>
      </div>
      <nav className="mobile-nav">
        {visibleNav.map(([n, I]) => (
          <button
            className={page === n ? "active" : ""}
            key={n}
            onClick={() => {
              setPage(n);
              if (n === "Today") setOverviewPeriod("day");
            }}
          >
            <I size={20} />
            <span>{pageName(n)}</span>
          </button>
        ))}
        <button
          className={page === "Settings" ? "active" : ""}
          aria-label="Налаштування"
          onClick={() => setPage("Settings")}
        >
          <Settings size={20} />
          <span>Опції</span>
        </button>
      </nav>
      {notifications && (
        <>
          <div
            className="panel-scrim"
            onClick={() => setNotifications(false)}
          />
          <aside className="notification-panel">
            <div className="section-head">
              <h2>Сповіщення</h2>
              <button
                aria-label="Закрити сповіщення"
                onClick={() => setNotifications(false)}
              >
                <X size={18} />
              </button>
            </div>
            <button
              className="text-button"
              onClick={() => setRead(notificationsList.map((n) => n.id))}
            >
              <CheckCheck size={15} />
              Позначити все прочитаним
            </button>
            {notificationsList.length === 0 && (
              <p className="empty">
                Нових сповіщень немає. Можна трохи видихнути.
              </p>
            )}
            {notificationsList.map((n) => (
              <button
                key={n.id}
                className={`notification-item ${read.includes(n.id) ? "read" : ""}`}
                onClick={() => {
                  setRead((r) => [...r, n.id]);
                  const event = events.find((e) => e.id === n.id),
                    task = tasks.find((t) => t.id === n.id),
                    message = slack.find((s) => "mention-" + s.id === n.id);
                  if (event) setEventDetail(event);
                  else if (task) setModal(task);
                  else if (message) {
                    setPage("Work");
                    setExpanded(message.id);
                  } else openMock(n.title, n.body, n.source);
                }}
              >
                <Source name={n.source} />
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                </div>
                {!read.includes(n.id) && <i className="live-dot" />}
              </button>
            ))}
          </aside>
        </>
      )}
      {searchOpen && (
        <div className="overlay" onClick={() => setSearchOpen(false)}>
          <section
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Пошук усюди"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-input">
              <Search size={20} />
              <input
                autoFocus
                placeholder="Пошук серед подій, повідомлень і завдань…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                aria-label="Закрити пошук"
                onClick={() => setSearchOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="search-results">
              {searchGroups.map(
                (g) =>
                  g.items.length > 0 && (
                    <div key={uk(g.source)}>
                      <div className="eyebrow">
                        {g.source === "DayNotes"
                          ? "Нотатки дня"
                          : !legacyPlanner && g.source === "Personal"
                            ? "Справи"
                            : uk(g.source)}
                      </div>
                      {g.items.slice(0, 8).map((i) => (
                        <button
                          key={i.id}
                          onClick={() => {
                            setSearchOpen(false);
                            g.source === "DayNotes"
                              ? (setCalendarDate(new Date(i.id + "T12:00:00")),
                                setCalendarView("Day"),
                                setPage("Calendar"),
                                setOpenDayRequest((n) => n + 1))
                              : g.source === "Personal"
                                ? setModal(tasks.find((t) => t.id === i.id)!)
                                : g.source === "Calendar"
                                  ? setEventDetail(
                                      events.find((e) => e.id === i.id) || null,
                                    )
                                  : openMock(i.title, i.body, g.source);
                          }}
                        >
                          <Source name={g.source} />
                          <div>
                            <strong>{i.title}</strong>
                            <small>{i.body}</small>
                          </div>
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                    </div>
                  ),
              )}
              {searchGroups.every((g) => !g.items.length) && (
                <p className="empty">
                  Нічого не знайдено за запитом «{query}». Спробуй назву, ім’я
                  або канал.
                </p>
              )}
            </div>
            <div className="search-foot">
              {legacyPlanner
                ? "Пошук серед усіх доступних джерел"
                : "Усі справи й нотатки · події підключених календарів у поточному періоді"}{" "}
              <kbd>Esc — закрити</kbd>
            </div>
          </section>
        </div>
      )}
      {modal && !legacyPlanner && (
        <QuickTaskEditor
          task={modal}
          onChange={setModal}
          onClose={() => setModal(null)}
          onSave={() => {
            const next = tasks.some((t) => t.id === modal.id)
              ? tasks.map((t) =>
                  t.id === modal.id
                    ? { ...modal, title: modal.title.trim() }
                    : t,
                )
              : [...tasks, { ...modal, title: modal.title.trim() }];
            try {
              localStorage.setItem("dayframe-tasks", JSON.stringify(next));
            } catch {
              return "Не вдалося зберегти справу. Перевір вільне місце або зроби резервну копію. Редактор залишається відкритим.";
            }
            setTasks(next);
            setModal(null);
            setToast("Справу збережено на цьому пристрої");
          }}
          onDelete={
            tasks.some((t) => t.id === modal.id)
              ? () => {
                  setTasks((all) => all.filter((t) => t.id !== modal.id));
                  setModal(null);
                }
              : undefined
          }
        />
      )}
      {modal && legacyPlanner && (
        <div className="overlay" onClick={() => setModal(null)}>
          <form
            onInvalidCapture={(e) => {
              const field = e.target as HTMLInputElement;
              field.setCustomValidity(
                field.validity.valueMissing
                  ? "Заповни це поле."
                  : "Перевір значення цього поля.",
              );
            }}
            onInputCapture={(e) =>
              (e.target as HTMLInputElement).setCustomValidity?.("")
            }
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Особисте завдання"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!modal.title.trim()) return;
              const category: Period =
                modal.recurrence === "yearly"
                  ? "Year"
                  : modal.recurrence === "every 3 months"
                    ? "Quarter"
                    : modal.recurrence === "monthly"
                      ? "Month"
                      : "Day";
              const saved = {
                ...modal,
                category:
                  modal.inBacklog &&
                  modal.planningHorizon === "year" &&
                  modal.category === "Quarter"
                    ? ("Quarter" as const)
                    : category,
                title: modal.title.trim(),
              };
              setTasks((ts) =>
                ts.some((t) => t.id === modal.id)
                  ? ts.map((t) => (t.id === modal.id ? saved : t))
                  : [...ts, saved],
              );
              setModal(null);
              setToast(
                modal.isTemplate ? "Шаблон збережено" : "Завдання збережено",
              );
            }}
          >
            <div className="section-head">
              <div>
                <span className="eyebrow">МАЛЕНЬКА СПРАВА ДЛЯ СЕБЕ</span>
                <h2>
                  {modal.isTemplate
                    ? "Редагувати шаблон"
                    : tasks.some((t) => t.id === modal.id)
                      ? "Редагувати завдання"
                      : "Додати особисте завдання"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Закрити завдання"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <label>
              Назва
              <input
                autoFocus
                required
                value={modal.title}
                placeholder="Про що хочеш подбати?"
                onChange={(e) => setModal({ ...modal, title: e.target.value })}
              />
            </label>
            <TaskChecklist
              items={modal.checklist}
              onChange={(checklist) => setModal({ ...modal, checklist })}
            />
            {!modal.isTemplate && (
              <label className="setting-row">
                <span>Без конкретної дати</span>
                <input
                  type="checkbox"
                  checked={!!modal.inBacklog}
                  onChange={(e) =>
                    setModal({
                      ...modal,
                      inBacklog: e.target.checked,
                      planningHorizon: e.target.checked ? "backlog" : "day",
                    })
                  }
                />
              </label>
            )}
            <div className="form-grid">
              {!modal.isTemplate && !modal.inBacklog && (
                <label>
                  Дата
                  <input
                    type="date"
                    required
                    value={modal.date}
                    onChange={(e) =>
                      setModal({ ...modal, date: e.target.value })
                    }
                  />
                </label>
              )}
              <label>
                Повторення
                <select
                  aria-label="Повторення"
                  value={modal.recurrence}
                  onChange={(e) =>
                    setModal({ ...modal, recurrence: e.target.value })
                  }
                >
                  {[
                    "once",
                    "daily",
                    "weekly",
                    "monthly",
                    "every 3 months",
                    "yearly",
                    "custom",
                  ].map((r) => (
                    <option key={r} value={r}>
                      {uk(r)}
                    </option>
                  ))}
                </select>
              </label>
              {modal.recurrence === "custom" && (
                <label>
                  Повторювати кожні (днів)
                  <input
                    type="number"
                    min="1"
                    required
                    value={modal.customDays || 2}
                    onChange={(e) =>
                      setModal({ ...modal, customDays: Number(e.target.value) })
                    }
                  />
                </label>
              )}
            </div>
            <details className="task-extra">
              <summary>
                Важливість і нотатки
                {modal.priority === "High" ? " · Важливе" : ""}
                {modal.notes ? " · Є нотатки" : ""}
              </summary>
              <label>
                Пріоритет
                <select
                  aria-label="Пріоритет"
                  value={modal.priority}
                  onChange={(e) =>
                    setModal({ ...modal, priority: e.target.value })
                  }
                >
                  {["Low", "Normal", "High"].map((r) => (
                    <option key={r} value={r}>
                      {uk(r)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Нотатки
                <textarea
                  rows={3}
                  value={modal.notes}
                  onChange={(e) =>
                    setModal({ ...modal, notes: e.target.value })
                  }
                  placeholder="Що корисно пам’ятати"
                />
              </label>
              {!modal.isTemplate && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={modal.disabled}
                    onChange={(e) =>
                      setModal({ ...modal, disabled: e.target.checked })
                    }
                  />
                  Призупинити це завдання
                </label>
              )}
            </details>{" "}
            <div className="modal-footer">
              {tasks.some((t) => t.id === modal.id) && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    setTasks((ts) => ts.filter((t) => t.id !== modal.id));
                    setModal(null);
                  }}
                >
                  <Trash2 size={15} />
                  Видалити
                </button>
              )}
              <button
                type="button"
                className="secondary"
                onClick={() => setModal(null)}
              >
                Скасувати
              </button>
              <button className="primary" type="submit">
                {modal.isTemplate ? "Зберегти шаблон" : "Зберегти завдання"}{" "}
                <Check size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <section
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label={detail.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-head">
              <span className="source-label">
                <Source name={detail.source} />
                {uk(detail.source)}
              </span>
              <button
                aria-label="Закрити подробиці"
                onClick={() => setDetail(null)}
              >
                <X size={20} />
              </button>
            </div>
            <h2>{detail.title}</h2>
            <p className="detail-body">{detail.body}</p>
            <div className="demo-notice">
              <CircleHelp size={16} />
              <span>
                {workspace.mode === "demo"
                  ? "Демонстраційний перегляд · Приклади даних."
                  : "Твій простір · Дані джерел лише для читання."}
              </span>
            </div>
            <button className="primary" onClick={() => setDetail(null)}>
              Зрозуміло <Check size={15} />
            </button>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {eventDetail && (
        <EventDetails
          event={eventDetail}
          onClose={() => setEventDetail(null)}
        />
      )}
      <div className="reminder-alerts">
        {taskReminders.alerts.map((reminder) => (
          <div className="task-reminder-alert" role="alert" key={reminder.id}>
            <Bell size={18} />
            <div>
              <small>Нагадування · {reminder.time} за Києвом</small>
              <strong>{reminder.title}</strong>
            </div>
            <button
              aria-label={`Закрити нагадування ${reminder.title}`}
              onClick={() => taskReminders.dismiss(reminder.id)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <HappyPetals burst={burst} />
      <TouchFeedback />
    </div>
  );
}
