import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBackup } from '../src/domain/backup.ts';
const data={goal:8000,days:{'2026-10-22':{steps:5000,exercises:[{id:'test',name:'Присідання',sets:3,reps:10,weight:12.5,minutes:0,done:true}]}}};
test('fitness backup preserves progress and rejects invalid dates, goals and exercise records',()=>{
  const backup=fitness=>({format:'dayframe-backup',version:1,data:{'dayframe-tasks':[],'dayframe-fitness':fitness}});
  assert.deepEqual(parseBackup(backup(data)).fitness,data);
  assert.throws(()=>parseBackup(backup({...data,goal:0})),/fitness/);
  assert.throws(()=>parseBackup(backup({...data,days:{'2026-02-31':data.days['2026-10-22']}})),/fitness/);
  assert.throws(()=>parseBackup(backup({...data,days:{'2026-10-22':{steps:-1,exercises:[]}}})),/fitness/);
  assert.throws(()=>parseBackup(backup({...data,days:{'2026-10-22':{steps:5,exercises:[{}]}}})),/fitness/);
});
