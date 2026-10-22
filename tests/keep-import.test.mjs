import test from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import {
  parseKeepNote,
  readKeepFiles,
  mergeKeepNotes,
  suggestedKeepSchedule,
} from "../src/domain/keepImport.ts";
const fixture = {
  title: "Список покупок",
  textContent: "Не забути",
  createdTimestampUsec: 1234,
  labels: [{ name: "Побут" }, { name: "Особисте" }],
  annotations: [{ title: "Референс", url: "https://example.com/reference" }],
  listContent: [
    { text: "Хліб", isChecked: true },
    { text: "Кава", isChecked: false },
  ],
};
test("Keep preserves text and checked lists, creates missing sections and never schedules by creation timestamp", () => {
  const note = parseKeepNote(fixture);
  assert.equal(note.date, "");
  const existing = [
    { id: "personal", name: "Особисте", color: "#abc123", visible: true },
  ];
  const result = mergeKeepNotes([note], [], existing);
  assert.equal(result.tasks[0].inBacklog, true);
  assert.deepEqual(result.tasks[0].links, ["https://example.com/reference"]);
  assert.equal(result.tasks[0].checklist[0].done, true);
  assert.equal(result.tasks[0].checklist[1].done, false);
  assert.ok(result.tasks[0].notes.includes("Не забути"));
  assert.ok(result.tasks[0].notes.includes("Побут, Особисте"));
  assert.equal(result.sections.length, 2);
  assert.equal(result.sections[0].id, "personal");
  assert.equal(result.tasks[0].sectionId, result.sections[1].id);
  const repeat = mergeKeepNotes([note], result.tasks, result.sections);
  assert.equal(repeat.added, 0);
  assert.equal(repeat.duplicates, 1);
  assert.deepEqual(repeat.tasks, result.tasks);
});
test("explicit dates can be reviewed while invalid dates and discarded notes are not scheduled", () => {
  assert.deepEqual(suggestedKeepSchedule("Лікар 2026-11-12 о 14:30"), {
    date: "2026-11-12",
    time: "14:30",
  });
  assert.deepEqual(suggestedKeepSchedule("Подія 31.02.2026"), {
    date: "",
    time: "",
  });
  assert.equal(parseKeepNote({ ...fixture, isTrashed: true }), null);
  assert.equal(parseKeepNote({ ...fixture, isArchived: true }).archived, true);
  const note = parseKeepNote({ ...fixture, title: "Лікар 12.11.2026 о 14:30" });
  const result = mergeKeepNotes([note], [], []);
  assert.equal(result.tasks[0].scheduledStart, "14:30");
  assert.equal(result.tasks[0].date, "2026-11-12");
});
test("Takeout ZIP ignores HTML and unrelated files and rejects malformed JSON without changes", async () => {
  const zip = zipSync({
    "Takeout/Keep/note.json": strToU8(JSON.stringify(fixture)),
    "Takeout/Keep/note.html": strToU8("<script>throw 1</script>"),
    "Takeout/Keep/image.png": strToU8("not an image"),
    "Takeout/Contacts/other.json": strToU8("{}"),
  });
  const result = await readKeepFiles([new File([zip], "takeout.zip")]);
  assert.equal(result.notes.length, 1);
  assert.equal(result.notes[0].title, fixture.title);
  await assert.rejects(
    readKeepFiles([new File(["{"], "broken.json")]),
    /пошкоджений/,
  );
  await assert.rejects(
    readKeepFiles([new File([JSON.stringify({ no: "keep" })], "other.json")]),
    /не JSON-нотатка/,
  );
});
test("original ZIP preserves image-only notes, classifies topics and excludes credentials", async () => {
  const png = Uint8Array.from([137,80,78,71,13,10,26,10]);
  const imageNote = {createdTimestampUsec: 5678, attachments:[{filePath:'photo.png',mimetype:'image/png'}]};
  const chores = {...fixture,createdTimestampUsec:999,title:'Домашні справи на тиждень (temp)',labels:[]};
  const zip = zipSync({
    'Takeout/Keep/image.json':strToU8(JSON.stringify(imageNote)),
    'Takeout/Keep/photo.png':png,
    'Takeout/Keep/chores.json':strToU8(JSON.stringify(chores)),
    'Takeout/Keep/private.json':strToU8(JSON.stringify({...fixture,textContent:'password: example-only'})),
  });
  const result=await readKeepFiles([new File([zip],'original.zip')]);
  assert.equal(result.notes.length,2);
  assert.equal(result.excluded,1);
  assert.equal(result.missingAttachments,0);
  const merged=mergeKeepNotes(result.notes,[],[]);
  assert.equal(merged.tasks[0].attachments[0].data,'data:image/png;base64,iVBORw0KGgo=');
  assert.equal(merged.tasks[1].isTemplate,true);
  assert.equal(merged.tasks[1].planningHorizon,'week');
  assert.equal(merged.sections[1].name,'Дім і побут');
  assert.equal(merged.tasks[1].notes.includes('Мітки Keep'),false);
});
test("archived lists stay paused, completed checklists stay completed, missing images are reported",async()=>{
  const note={...fixture,isArchived:true,listContent:[{text:'Зроблено',isChecked:true}],attachments:[{filePath:'../outside.png'}]};
  const result=await readKeepFiles([new File([JSON.stringify(note)],'archive.json')]);
  assert.equal(result.missingAttachments,1);
  const merged=mergeKeepNotes(result.notes,[],[]);
  assert.equal(merged.tasks[0].disabled,true);
  assert.equal(merged.tasks[0].completed,true);
  assert.equal(merged.sections[0].name,'Архів Keep');
});
