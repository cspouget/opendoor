import 'dotenv/config';
import express from 'express';
import {createClient} from '@supabase/supabase-js';
import {RoomServiceClient} from 'livekit-server-sdk';
import {createApp} from './app.mjs';
const config={trustProxyHops:Number(process.env.TRUST_PROXY_HOPS||0),supabaseUrl:process.env.SUPABASE_URL,anonKey:process.env.SUPABASE_ANON_KEY,livekitUrl:process.env.LIVEKIT_URL,livekitKey:process.env.LIVEKIT_API_KEY,livekitSecret:process.env.LIVEKIT_API_SECRET,hostIds:(process.env.HOST_USER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean)};
const ready=[config.supabaseUrl,config.anonKey,config.livekitUrl,config.livekitKey,config.livekitSecret,process.env.SUPABASE_SERVICE_ROLE_KEY].every(v=>typeof v==='string' && v.trim().length>0);
const db=ready?createClient(config.supabaseUrl,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}):null;
const livekit=ready?new RoomServiceClient(config.livekitUrl.replace(/^ws/,'http'),config.livekitKey,config.livekitSecret):null;
const app=createApp({db,livekit,config});
app.use(express.static('dist'));
app.get('/',(_req,res)=>res.sendFile('index.html',{root:'dist'}));
const server=app.listen(process.env.PORT||3001,()=>console.log(`OpenRoom server started. Live services configured: ${ready}`));
// Single-instance pilot: reconcile expiration, removals, and stale membership.
let working=false;
const job=setInterval(async()=>{
 if(!db || working)return; working=true;
 try {
  const {data:rooms,error}=await db.from('rooms').select('*').gte('ends_at',new Date(Date.now()-86400000).toISOString());if(error)throw error;
  for(const room of rooms||[]) {
   try {
   if(Date.parse(room.starts_at)>Date.now())continue;
   if(room.closed || Date.parse(room.ends_at)<=Date.now()) {
    await livekit.deleteRoom(room.id).catch(e=>{if(e.status!==404 && e.code!=='not_found')throw e;});
    await db.from('rooms').update({closed:true}).eq('id',room.id);
    await db.from('members').update({left_at:new Date().toISOString(),hand_at:null}).eq('room_id',room.id).is('left_at',null);
    continue;
   }
   await db.from('members').update({left_at:new Date().toISOString(),hand_at:null}).eq('room_id',room.id).is('left_at',null).lt('last_seen_at',new Date(Date.now()-90000).toISOString());
   const participants=await livekit.listParticipants(room.id).catch(e=>{if(e.status===404 || e.code==='not_found')return [];throw e;});
   const {data:members,error:merror}=await db.from('members').select('*').eq('room_id',room.id);if(merror)throw merror;
   for(const p of participants){const m=members.find(x=>x.user_id===p.identity);if(!m || m.banned || m.left_at)await livekit.removeParticipant(room.id,p.identity);}
   } catch {console.error('A room could not be reconciled; retrying.');}
  }
 } catch {console.error('Room reconciliation failed; retrying.');} finally {working=false;}
},10000);
process.on('SIGTERM',()=>{clearInterval(job);server.close();});
