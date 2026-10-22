export type Exercise = { id: string; kind?: "strength" | "cardio"; name: string; sets: number; reps: number; weight: number; minutes: number; done: boolean };
export type FitnessData = { goal: number; days: Record<string, {steps:number; exercises:Exercise[]}> };
const record = (v:unknown):v is Record<string,unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const number = (v:unknown,min:number,max:number,step=1) => typeof v === "number" && Number.isFinite(v) && v>=min && v<=max && Number.isInteger(v/step);
export function isFitnessData(value:unknown):value is FitnessData {
  return record(value) && number(value.goal,100,100000) && record(value.days) && Object.entries(value.days).every(([date,day])=>
    /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date+"T12:00:00Z")) && new Date(date+"T12:00:00Z").toISOString().slice(0,10)===date && record(day) && number(day.steps,0,200000) && Array.isArray(day.exercises) && day.exercises.every(e=>record(e) && typeof e.id === "string" && typeof e.name === "string" && e.name.trim().length>0 && e.name.length<=120 && number(e.sets,1,100) && number(e.reps,0,1000) && number(e.weight,0,1000,.5) && number(e.minutes,0,1440) && typeof e.done === "boolean" && (e.kind === undefined || e.kind === "strength" || e.kind === "cardio"))
  );
}
