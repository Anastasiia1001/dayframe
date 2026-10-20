import {
  X,
  Video,
  MapPin,
  Users,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";
import type { CalendarEvent } from "../types";
import { shortDate } from "../locale";
import { addDays } from "../domain/planning";
const safeLink = (url?: string) => {
  try {
    const u = new URL(url || "");
    return u.protocol === "https:" ? u.href : undefined;
  } catch {
    return undefined;
  }
};
export function EventDetails({
  event: e,
  onClose,
}: {
  event: CalendarEvent;
  onClose: () => void;
}) {
  const lastDate = e.allDay && e.endDate ? addDays(e.endDate, -1) : e.endDate;
  const link = safeLink(e.url),
    meeting = safeLink(e.meetingUrl);
  return (
    <div className="overlay" onClick={onClose}>
      <section
        className="detail-modal event-details"
        role="dialog"
        aria-modal="true"
        aria-label={e.title}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="section-head">
          <span className="source-label">{e.accountLabel || e.source}</span>
          <button aria-label="Закрити подію" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <h2>{e.title}</h2>
        <div className="event-detail-facts">
          <p>
            <CalendarDays size={18} />
            <span>
              {shortDate(e.date)}
              {lastDate && lastDate !== e.date
                ? " · до " + shortDate(lastDate!)
                : ""}
              <strong>{e.allDay ? "Увесь день" : `${e.start}–${e.end}`}</strong>
            </span>
          </p>
          {e.location &&
            e.location !== e.meetingUrl &&
            !["Місце не вказано", "No location"].includes(e.location) && (
              <p>
                <MapPin size={18} />
                <span>{e.location}</span>
              </p>
            )}
          {e.participants.length > 0 && (
            <p>
              <Users size={18} />
              <span>{e.participants.join(", ")}</span>
            </p>
          )}
        </div>
        <div className="event-detail-actions">
          {meeting && (
            <a
              className="primary"
              href={meeting}
              target="_blank"
              rel="noreferrer"
            >
              <Video size={16} />
              Приєднатися
            </a>
          )}
          {link && (
            <a
              className="secondary"
              href={link}
              target="_blank"
              rel="noreferrer"
            >
              Відкрити в календарі <ArrowUpRight size={14} />
            </a>
          )}
          <button className="secondary" onClick={onClose}>
            Закрити
          </button>
        </div>
        <small className="muted">
          Подія лише для читання. Зміни доступні в оригінальному календарі.
        </small>
      </section>
    </div>
  );
}
