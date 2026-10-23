import test from 'node:test';import assert from 'node:assert/strict';
import {habitCells,validHabits} from '../src/domain/habits.ts';
import {moveTodayTask,todayColumn} from '../src/domain/todayBoard.ts';
import {parseBackup} from '../src/domain/backup.ts';
const base={id:'one',title:'Завдання',category:'Month',date:'',inBacklog:true,planningHorizon:'month',recurrence:'weekly',notes:'Не втратити',priority:'Normal',completed:false,disabled:false};
test('habit cells retain checks across week, month, quarter and year boundaries',()=>{
 const days=habitCells('daily','2026-01-01',2026);assert.equal(days[0].key,'2025-12-29');assert.equal(days[6].key,'2026-01-04');
 assert.equal(habitCells('weekly','2026-01-01',2026)[0].key,'week:2025-12-29');assert.equal(habitCells('monthly','2026-01-01',2026).length,12);assert.equal(habitCells('quarterly','2026-01-01',2026).length,4);assert.equal(habitCells('yearly','2026-01-01',2026)[0].key,'2026');
 const habits=[{id:'habit',title:'Читати',frequency:'daily',checks:{'2026-01-01':true}}];assert.equal(validHabits(habits),true);assert.equal(validHabits([{...habits[0],checks:{bad:true}}]),false);
 const backup={format:'dayframe-backup',version:1,data:{'dayframe-tasks':[],'dayframe-habits':habits,'dayframe-self-care':{'2026-01-01':{mood:2,need:'rest',notes:'Потрібна пауза'}}}};assert.deepEqual(parseBackup(backup).habits,habits);assert.equal(parseBackup(backup).care['2026-01-01'].mood,2);
});
test('dragging plans to Today and Done preserves recurrence, notes, ordering and next occurrence',()=>{
 const tasks=[base,{...base,id:'two',date:'2026-10-23',inBacklog:false,planningHorizon:'day'}];
 const planned=moveTodayTask(tasks,'one','today','2026-10-23','two');assert.equal(planned[0].date,'2026-10-23');assert.equal(planned[0].inBacklog,false);assert.equal(planned[0].notes,'Не втратити');assert.ok(planned[0].plannerRank<planned[1].plannerRank);
 const done=moveTodayTask(planned,'one','done','2026-10-23');assert.equal(done[0].completed,true);assert.equal(done[0].nextOccurrence,'2026-10-30');assert.equal(todayColumn(done[0],'2026-10-23'),'done');
 const restored=moveTodayTask(done,'one','plans','2026-10-23');assert.equal(restored[0].completed,false);assert.equal(restored[0].inBacklog,true);assert.equal(restored[0].nextOccurrence,undefined);assert.equal(tasks[0].date,'');
});
