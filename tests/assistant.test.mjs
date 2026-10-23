import test from 'node:test';import assert from 'node:assert/strict';import {askAssistant} from '../src/domain/assistant.ts';
test('personal assistant sends only explicit conversation to the official API and parses the answer',async()=>{
 const original=globalThis.fetch;let request;
 try{globalThis.fetch=async(url,init)=>{request={url,...init};return new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:'Я поруч.'}]}]}),{status:200});};
 const answer=await askAssistant({apiKey:'test-only',model:'gpt-4.1-mini',messages:[{role:'user',content:'Підтримай мене'}],mode:'care'});
 assert.equal(answer,'Я поруч.');assert.equal(request.url,'https://api.openai.com/v1/responses');const body=JSON.parse(request.body);assert.equal(body.store,false);assert.deepEqual(body.input,[{role:'user',content:'Підтримай мене'}]);assert.match(body.instructions,/не ліцензований психотерапевт/);
 }finally{globalThis.fetch=original;}
});
test('API errors never echo provider responses or secrets, and missing keys never make a request',async()=>{
 const original=globalThis.fetch;
 try{let calls=0;globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({error:{message:'secret-sentinel'}}),{status:401});};
 const args={apiKey:'',model:'gpt-4.1-mini',messages:[],mode:'planning'};
 await assert.rejects(askAssistant(args),/API-ключ/);assert.equal(calls,0);
 await assert.rejects(askAssistant({...args,apiKey:'dummy'}),error=>!error.message.includes('secret-sentinel')&&error.message.includes('не прийнято'));
 }finally{globalThis.fetch=original;}
});
