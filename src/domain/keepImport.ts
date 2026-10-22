import { Unzip, UnzipInflate, strFromU8 } from "fflate";
import type { PersonalTask } from "../types";
import type { Section } from "./studio";
export interface KeepNote {
  id: string;
  title: string;
  text: string;
  labels: string[];
  links: string[];
  checklist: { id: string; title: string; done: boolean }[];
  archived: boolean;
  date: string;
  time: string;
}
const MAX_TOTAL = 20 * 1024 * 1024,
  MAX_NOTE = 512 * 1024,
  MAX_NOTES = 2000;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown) => (typeof v === "string" ? v : "");
function hash(s: string) {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++)
    n = Math.imul(n ^ s.charCodeAt(i), 16777619);
  return (n >>> 0).toString(36);
}
export function validKeepDate(s: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s + "T12:00:00Z")) &&
    new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s
  );
}
export function suggestedKeepSchedule(s: string) {
  const match =
    s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/) ||
    s.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
  const date = match
    ? match[1].length === 4
      ? `${match[1]}-${match[2]}-${match[3]}`
      : `${match[3]}-${match[2]}-${match[1]}`
    : "";
  const time = match
    ? s
        .slice(
          (match.index || 0) + match[0].length,
          (match.index || 0) + match[0].length + 24,
        )
        .match(/\b([01]\d|2[0-3]):([0-5]\d)\b/)?.[0] || ""
    : "";
  return {
    date: validKeepDate(date) ? date : "",
    time: validKeepDate(date) ? time : "",
  };
}
export function parseKeepNote(value: unknown): KeepNote | null {
  if (!object(value) || value.isTrashed === true) return null;
  if (
    !(
      "textContent" in value ||
      "listContent" in value ||
      "createdTimestampUsec" in value
    )
  )
    throw new Error("Це не JSON-нотатка з експорту Google Keep.");
  const annotations = Array.isArray(value.annotations)
    ? value.annotations.filter(object).filter((a) => text(a.url))
    : [];
  const links = annotations
    .map((a) => text(a.url))
    .filter((url) => {
      try {
        return new URL(url).protocol === "https:";
      } catch {
        return false;
      }
    });
  const annotationText = annotations
    .map((a) =>
      [text(a.title), text(a.description), text(a.url)]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
  const body =
      text(value.textContent) +
      (annotationText ? `\n\nПосилання Keep:\n${annotationText}` : ""),
    title =
      text(value.title).trim() ||
      body
        .split("\n")
        .find((s) => s.trim())
        ?.slice(0, 100) ||
      "Нотатка Keep";
  const labels = Array.isArray(value.labels)
    ? [
        ...new Set(
          value.labels
            .filter(object)
            .map((l) => text(l.name).trim())
            .filter(Boolean),
        ),
      ]
    : [];
  if (labels.length > 30)
    throw new Error("У нотатці забагато міток для одного імпорту.");
  const list = Array.isArray(value.listContent)
    ? value.listContent
        .filter(object)
        .map((l, i) => ({
          id: `keep-check-${i}`,
          title: text(l.text),
          done: l.isChecked === true,
        }))
        .filter((l) => l.title)
    : [];
  if (!body.trim() && !text(value.title).trim() && !list.length) return null;
  const identity =
    typeof value.createdTimestampUsec === "number" ||
    typeof value.createdTimestampUsec === "string"
      ? String(value.createdTimestampUsec)
      : hash(JSON.stringify([title, body, list]));
  return {
    id: `keep:${identity}`,
    title,
    text: body,
    labels,
    links,
    checklist: list,
    archived: value.isArchived === true,
    ...suggestedKeepSchedule(title + "\n" + body),
  };
}
export async function readKeepFiles(
  files: File[],
): Promise<{ notes: KeepNote[]; skipped: number }> {
  if (files.reduce((n, f) => n + f.size, 0) > 50 * 1024 * 1024)
    throw new Error(
      "Обери до 50 МБ. Для більшого архіву вибери JSON-файли з теки Keep.",
    );
  let total = 0,
    skipped = 0;
  const values: unknown[] = [];
  const add = (data: Uint8Array) => {
    if (
      data.length > MAX_NOTE ||
      (total += data.length) > MAX_TOTAL ||
      values.length >= MAX_NOTES
    )
      throw new Error(
        "Завеликий експорт: до 2000 нотаток, 512 КБ на нотатку та 20 МБ тексту за один імпорт.",
      );
    try {
      values.push(JSON.parse(strFromU8(data).replace(/^\uFEFF/, "")));
    } catch {
      throw new Error(
        "Один із JSON-файлів пошкоджений. Обери оригінальний експорт Keep.",
      );
    }
  };
  for (const file of files) {
    if (/\.json$/i.test(file.name))
      add(new Uint8Array(await file.arrayBuffer()));
    else if (/\.zip$/i.test(file.name)) {
      let failure: Error | null = null;
      const zip = new Unzip((entry) => {
        if (failure) return;
        if (
          !/\.json$/i.test(entry.name) ||
          !(/(^|\/)Keep\//i.test(entry.name) || !entry.name.includes("/"))
        )
          return;
        if ((entry.originalSize || 0) > MAX_NOTE)
          throw new Error(
            "Нотатка в ZIP завелика. Обери меншу частину експорту.",
          );
        const chunks: Uint8Array[] = [];
        let size = 0;
        entry.ondata = (error, chunk, final) => {
          if (failure) return;
          if (error) {
            failure = new Error("Не вдалося прочитати ZIP Google Keep.");
            return;
          }
          size += chunk.length;
          if (size > MAX_NOTE || total + size > MAX_TOTAL) {
            entry.terminate();
            failure = new Error(
              "Розпаковані нотатки завеликі. Імпортуй меншими частинами.",
            );
            return;
          }
          chunks.push(chunk);
          if (final) {
            const data = new Uint8Array(size);
            let offset = 0;
            for (const c of chunks) {
              data.set(c, offset);
              offset += c.length;
            }
            try {
              add(data);
            } catch (e) {
              failure =
                e instanceof Error ? e : new Error("Помилка JSON у ZIP.");
            }
          }
        };
        entry.start();
      });
      zip.register(UnzipInflate);
      try {
        const data = new Uint8Array(await file.arrayBuffer());
        for (let offset = 0; offset < data.length; offset += 4096) {
          zip.push(
            data.subarray(offset, offset + 4096),
            offset + 4096 >= data.length,
          );
          if (failure) throw failure;
        }
      } catch (e) {
        throw e instanceof Error ? e : new Error("Не вдалося прочитати ZIP.");
      }
      if (failure) throw failure;
    }
  }
  if (!values.length)
    throw new Error(
      "Не знайдено JSON-нотаток Keep. Обери ZIP Google Takeout або JSON-файли з його теки Keep.",
    );
  const notes: KeepNote[] = [],
    seen = new Set<string>();
  for (const value of values) {
    const note = parseKeepNote(value);
    if (!note || seen.has(note.id)) {
      skipped++;
      continue;
    }
    seen.add(note.id);
    notes.push(note);
  }
  return { notes, skipped };
}
export function mergeKeepNotes(
  notes: KeepNote[],
  tasks: PersonalTask[],
  sections: Section[],
) {
  const mergedSections = [...sections],
    added: PersonalTask[] = [];
  const names = new Map(
    sections.map((s) => [s.name.trim().toLocaleLowerCase("uk"), s.id]),
  );
  const ids = new Set(
    tasks
      .filter((t) => t.origin?.source === "GoogleKeep")
      .map((t) => t.origin!.id),
  );
  let duplicates = 0;
  const section = (label: string) => {
    const name = label.trim().slice(0, 80),
      key = name.toLocaleLowerCase("uk");
    if (!names.has(key)) {
      if (mergedSections.length >= 200)
        throw new Error("Понад 200 розділів. Імпортуй меншу групу нотаток.");
      let id = `keep-section-${hash(key)}`;
      while (mergedSections.some((s) => s.id === id)) id += "x";
      names.set(key, id);
      mergedSections.push({
        id,
        name,
        color: ["#795875", "#527d6b", "#af653e", "#627790", "#93719d"][
          mergedSections.length % 5
        ],
        visible: true,
      });
    }
    return names.get(key)!;
  };
  for (const note of notes) {
    if (ids.has(note.id)) {
      duplicates++;
      continue;
    }
    if (note.date && !validKeepDate(note.date))
      throw new Error("Перевір дату нотатки.");
    if (note.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(note.time))
      throw new Error("Перевір час нотатки.");
    const labels = note.labels.length ? note.labels : ["Нотатки Keep"];
    const sectionIds = labels.map(section);
    added.push({
      id: crypto.randomUUID(),
      title: note.title,
      notes:
        note.text +
        (note.labels.length ? `\n\nМітки Keep: ${note.labels.join(", ")}` : ""),
      checklist: note.checklist,
      links: note.links,
      sectionId: sectionIds[0],
      origin: { source: "GoogleKeep", id: note.id },
      date: note.date,
      inBacklog: !note.date,
      planningHorizon: note.date ? "day" : "backlog",
      category: "Day",
      recurrence: "once",
      priority: "Normal",
      completed: false,
      disabled: false,
      ...(note.date
        ? note.time
          ? { scheduledStart: note.time, scheduledDuration: 30 }
          : { allDay: true }
        : {}),
    });
    ids.add(note.id);
  }
  return {
    tasks: [...tasks, ...added],
    sections: mergedSections,
    added: added.length,
    duplicates,
  };
}
