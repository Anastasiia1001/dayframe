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
  attachments?: PersonalTask["attachments"];
  attachmentPaths?: string[];
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
export function keepSections(note: KeepNote): string[] {
  if (note.archived) return ["Архів Keep"];
  if (note.labels.length) return note.labels;
  const title = note.title.toLocaleLowerCase("uk");
  const rules: [RegExp, string][] = [
    [/домашн|прибиран|очищення техніки|великі дрібні завдання|покупк/, "Дім і побут"],
    [/робот|робоч|sprint/, "Робота"],
    [/трекер|тренуван|фітнес/, "Тренування"],
    [/таблетк|вітамін|селен|лікуван/, "Здоров’я"],
    [/проєкт|проект|іграшк|малюван|творч/, "Творчість"],
    [/догляд|self.?care/, "Догляд за собою"],
    [/книг|навчан/, "Книги та навчання"],
    [/відпустк|подорож|поїздк/, "Поїздки та відпочинок"],
  ];
  for (const [pattern, name] of rules) if (pattern.test(title)) return [name];
  if (/^\s*\d{3,5}\s*[xх×]\s*\d{3,5}\s*$/i.test(note.text)) return ["Технічні нотатки"];
  if (note.links.length || /^https?:\/\//.test(note.text.trim())) return ["Посилання"];
  return ["Нотатки Keep"];
}
function containsCredentials(value: unknown) {
  return /ATATT[A-Za-z0-9_-]{20,}|(?:password|парол|secret|api.?key)\s*[:=\n]|\b(?:ghp_|sk-)[A-Za-z0-9_-]{15,}/i.test(JSON.stringify(value));
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
      (Array.isArray(value.attachments) && value.attachments.length ? "Зображення з Keep" : "Нотатка Keep");
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
  const attachmentPaths = Array.isArray(value.attachments)
    ? value.attachments.filter(object).map(a => text(a.filePath)).filter(Boolean) : [];
  if (!body.trim() && !text(value.title).trim() && !list.length && !attachmentPaths.length) return null;
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
    attachmentPaths,
    archived: value.isArchived === true,
    ...suggestedKeepSchedule(title + "\n" + body),
  };
}
export async function readKeepFiles(
  files: File[],
): Promise<{ notes: KeepNote[]; skipped: number; excluded: number; missingAttachments: number }> {
  if (files.reduce((n, f) => n + f.size, 0) > 50 * 1024 * 1024)
    throw new Error(
      "Обери до 50 МБ. Для більшого архіву вибери JSON-файли з теки Keep.",
    );
  let total = 0,
    skipped = 0;
  const values: { value: unknown; path: string; scope: number }[] = [];
  const images = new Map<string, Uint8Array>();
  let imageTotal = 0, scope = 0, excluded = 0, missingAttachments = 0;
  const imagePattern = /\.(?:png|jpe?g|gif|webp)$/i;
  const addImage = (data: Uint8Array, path: string) => {
    imageTotal += data.length;
    if (data.length > 4 * 1024 * 1024 || imageTotal > MAX_TOTAL)
      throw new Error("Зображення завеликі: до 4 МБ на файл і 20 МБ разом.");
    images.set(`${scope}:${path}`, data);
  };
  const add = (data: Uint8Array, path: string) => {
    if (
      data.length > MAX_NOTE ||
      (total += data.length) > MAX_TOTAL ||
      values.length >= MAX_NOTES
    )
      throw new Error(
        "Завеликий експорт: до 2000 нотаток, 512 КБ на нотатку та 20 МБ тексту за один імпорт.",
      );
    try {
      values.push({ value: JSON.parse(strFromU8(data).replace(/^\uFEFF/, "")), path, scope });
    } catch {
      throw new Error(
        "Один із JSON-файлів пошкоджений. Обери оригінальний експорт Keep.",
      );
    }
  };
  for (const file of files) {
    if (/\.json$/i.test(file.name))
      add(new Uint8Array(await file.arrayBuffer()), file.webkitRelativePath || file.name);
    else if (imagePattern.test(file.name))
      addImage(new Uint8Array(await file.arrayBuffer()), file.webkitRelativePath || file.name);
    else if (/\.zip$/i.test(file.name)) {
      scope++;
      let failure: Error | null = null;
      const zip = new Unzip((entry) => {
        if (failure) return;
        if (
          !(/\.json$/i.test(entry.name) || imagePattern.test(entry.name)) ||
          !(/(^|\/)Keep\//i.test(entry.name) || !entry.name.includes("/"))
        )
          return;
        const isImage = imagePattern.test(entry.name);
        const limit = isImage ? 4 * 1024 * 1024 : MAX_NOTE;
        if ((entry.originalSize || 0) > limit)
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
          if (size > limit || (isImage ? imageTotal : total) + size > MAX_TOTAL) {
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
              if (isImage) addImage(data, entry.name);
              else add(data, entry.name);
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
      scope++;
    }
  }
  if (!values.length)
    throw new Error(
      "Не знайдено JSON-нотаток Keep. Обери ZIP Google Takeout або JSON-файли з його теки Keep.",
    );
  const notes: KeepNote[] = [],
    seen = new Set<string>();
  for (const { value, path, scope: sourceScope } of values) {
    if (containsCredentials(value)) { excluded++; continue; }
    const note = parseKeepNote(value);
    if (!note || seen.has(note.id)) {
      skipped++;
      continue;
    }
    note.attachments = [];
    for (const name of note.attachmentPaths || []) {
      const relative = path.slice(0, path.lastIndexOf("/") + 1) + name;
      const data = !/(^|\/)\.\.(\/|$)/.test(name)
        ? images.get(`${sourceScope}:${relative}`) : undefined;
      let type = "";
      if (data) {
        if (data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71) type = "image/png";
        else if (data[0] === 255 && data[1] === 216 && data[2] === 255) type = "image/jpeg";
        else if (strFromU8(data.subarray(0, 6)).startsWith("GIF8")) type = "image/gif";
        else if (strFromU8(data.subarray(0, 4)) === "RIFF" && strFromU8(data.subarray(8, 12)) === "WEBP") type = "image/webp";
      }
      if (!data || !type) { missingAttachments++; continue; }
      let binary = "";
      for (let i = 0; i < data.length; i += 32768)
        binary += String.fromCharCode(...data.subarray(i, i + 32768));
      note.attachments.push({ name: name.split("/").pop()!, type, data: `data:${type};base64,${btoa(binary)}` });
    }
    seen.add(note.id);
    notes.push(note);
  }
  return { notes, skipped, excluded, missingAttachments };
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
    const labels = keepSections(note);
    const isTemplate = /\btemp(?:late)?\b|шаблон/i.test(note.title);
    const sectionIds = labels.map(section);
    added.push({
      id: crypto.randomUUID(),
      title: note.title,
      notes:
        note.text +
        (note.labels.length ? `\n\nМітки Keep: ${note.labels.join(", ")}` : ""),
      checklist: note.checklist,
      attachments: note.attachments,
      isTemplate,
      links: note.links,
      sectionId: sectionIds[0],
      origin: { source: "GoogleKeep", id: note.id },
      date: note.date,
      inBacklog: !note.date,
      planningHorizon: note.date ? "day" : /тижд/i.test(note.title) ? "week" : /місяц/i.test(note.title) ? "month" : /квартал|річн/i.test(note.title) ? "year" : "backlog",
      category: /квартал/i.test(note.title) ? "Quarter" : /місяц/i.test(note.title) ? "Month" : "Day",
      recurrence: "once",
      priority: "Normal",
      completed: !isTemplate && note.checklist.length > 0 && note.checklist.every(item => item.done),
      disabled: note.archived,
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
