import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createApp} from '../server/app.mjs';
const host='11111111-1111-4111-8111-111111111111', guest='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333', room='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
test('database admission and isolation',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create schema auth; create role anon;create role authenticated;create role service_role bypassrls;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;insert into auth.users values('${host}'),('${guest}'),('${other}');`);
 await db.exec(await readFile(new URL('../supabase/migrations/001_pilot.sql',import.meta.url),'utf8'));
 await db.query("insert into rooms(id,host_id,title,invite_hash,starts_at,ends_at,capacity) values($1,$2,'Test','hash',now()-interval '1 minute',now()+interval '19 minutes',2)",[room,host]);
 const join=id=>db.query('select join_pilot($1,$2,$3)',[room,id,'Guest']);
 await join(host);await join(guest);
 await assert.rejects(join(other),/Room full/);
 await db.query('update rooms set locked=true where id=$1',[room]);
 await assert.rejects(join(guest),/Room locked/);await join(host);
 await db.query('update rooms set locked=false where id=$1',[room]);
 await db.query('update members set banned=true,left_at=now() where user_id=$1',[guest]);
 await assert.rejects(join(guest),/Room unavailable/);await join(other);
 await db.exec(`set role authenticated;set request.jwt.claim.sub='${host}';`);
 assert.equal((await db.query('select * from members')).rows.length,1);
 await assert.rejects(db.query('select * from reports'),/permission denied/);
 await assert.rejects(db.query('update members set banned=false'),/permission denied/);
 await assert.rejects(join(guest),/permission denied/);
 await db.exec('reset role');await db.query('update rooms set closed=true where id=$1',[room]);await assert.rejects(join(host),/Room unavailable/);
 }finally{await db.close();}
});
test('API denies unauthenticated users and unauthorized hosts; config excludes secrets',async()=>{
 const db={auth:{getUser:async token=>({data:{user:token==='valid'?{id:guest}:null},error:token!=='valid'})},from(){throw Error('Must not query DB for denied host');}};
 const config={hostIds:[host],supabaseUrl:'https://example.supabase.co',anonKey:'public-key',livekitUrl:'wss://example.livekit.cloud',livekitSecret:'private-secret'};
 const server=createApp({db,livekit:{},config}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
 const configResponse=await fetch(base+'/api/config');assert.equal(configResponse.headers.get('cache-control'),'no-store');assert.ok(!(await configResponse.text()).includes('private-secret'));
 assert.equal((await fetch(base+'/api/history')).status,401);
 assert.equal((await fetch(base+'/api/history',{headers:{Authorization:'Bearer forged'}})).status,401);
 assert.equal((await fetch(base+'/api/rooms',{method:'POST',headers:{Authorization:'Bearer valid','Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(base+'/api/join',{method:'POST',headers:{Authorization:'Bearer valid','Content-Type':'application/json'},body:JSON.stringify({code:'x',name:'Test',agreed:false})})).status,400);
 }finally{await new Promise(r=>server.close(r));}
});
