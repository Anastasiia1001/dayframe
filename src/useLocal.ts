import { useState, useEffect } from 'react';
export function useLocal<T,>(key:string,initial:T){const [value,setValue]=useState<T>(()=>{try{return JSON.parse(localStorage.getItem(key)||'null')??initial}catch{return initial}});useEffect(()=>{localStorage.setItem(key,JSON.stringify(value))},[key,value]);return [value,setValue] as const}
