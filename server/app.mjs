import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { randomBytes, createHash } from 'node:crypto';
import { AccessToken } from 'livekit-server-sdk';
const uuid = z.string().uuid();
const hash = value => createHash('sha256').update(value).digest('hex');
export function createApp({ db, livekit, config }) {
 const app = express();
 app.disable('x-powered-by');
 if(config.trustProxyHops) app.set('trust proxy',config.trustProxyHops);
 app.use(helmet({contentSecurityPolicy:{directives:{'connect-src':["'self'",config.supabaseUrl || '',config.livekitUrl || ''].filter(Boolean),'style-src':["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],'font-src':["'self'",'https://fonts.gstatic.com'],'media-src':["'self'",'blob:']}}}));
 app.use(express.json({limit:'8kb'}));
 app.use('/api', (_req,res,next) => {res.set('Cache-Control','no-store'); next();});
 app.get('/api/config', (_req,res) => res.json({supabaseUrl:config.supabaseUrl || '',supabaseKey:config.anonKey || '',liveReady:!!(db && livekit)}));
 app.get('/api/health', (_req,res) => res.json({status:'ok',configured:!!(db && livekit)}));
 app.use('/api', rateLimit({windowMs:60000,limit:120,standardHeaders:'draft-7',legacyHeaders:false}));
 app.use('/api', async(req,res,next) => {
  if(!db || !livekit) return res.status(503).json({error:'Live meetings are not configured yet.'});
  const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
  if(!token) return res.status(401).json({error:'Sign in to continue.'});
  try { const {data,error}=await db.auth.getUser(token); if(error || !data.user) return res.status(401).json({error:'Your session expired. Sign in again.'}); req.user=data.user; next(); } catch {res.status(503).json({error:'Account service unavailable.'});}
 });
 app.use('/api', rateLimit({windowMs:60000,limit:45,keyGenerator:req=>req.user.id,standardHeaders:'draft-7',legacyHeaders:false}));
 const run = fn => async(req,res,next) => {try {await fn(req,res);} catch(e) {next(e);}};
 const query = async p => {const {data,error}=await p;if(error) throw new Error('Database operation failed');return data;};
 const fail = (status,message) => {throw Object.assign(new Error(message),{status});};
 async function access(req, host=false) {
  const id=uuid.parse(req.params.id);
  const room=await query(db.from('rooms').select('*').eq('id',id).maybeSingle());
  if(!room) fail(404,'Room unavailable.');
  if(host) {if(room.host_id!==req.user.id) fail(403,'Host access required.');}
  else {const m=await query(db.from('members').select('*').eq('room_id',id).eq('user_id',req.user.id).maybeSingle()); if(!m || m.banned || m.left_at) fail(403,'You are not an active member of this room.');}
  return room;
 }
 app.get('/api/me', (req,res)=>res.json({id:req.user.id,canHost:config.hostIds.includes(req.user.id)}));
 app.get('/api/history',run(async(req,res)=>res.json(await query(db.from('members').select('room_id,joined_at,left_at').eq('user_id',req.user.id).order('joined_at',{ascending:false}).limit(20)))));
 app.post('/api/rooms',run(async(req,res)=>{
  if(!config.hostIds.includes(req.user.id)) fail(403,'Host access required.');
  const {title,startsAt}=z.object({title:z.string().trim().min(1).max(80),startsAt:z.string().datetime()}).parse(req.body);
  const start=Date.parse(startsAt); if(start<Date.now()-60000 || start>Date.now()+7*86400000) fail(400,'Choose a start within the next seven days.');
  const code=randomBytes(24).toString('hex');
  const room=await query(db.from('rooms').insert({title,host_id:req.user.id,invite_hash:hash(code),starts_at:new Date(start).toISOString(),ends_at:new Date(start+1200000).toISOString()}).select('id,title,starts_at,ends_at').single());
  res.status(201).json({...room,code});
 }));
 app.post('/api/join',run(async(req,res)=>{
  const {code,name,agreed}=z.object({code:z.string().regex(/^[a-f0-9]{48}$/),name:z.string().trim().min(1).max(32),agreed:z.literal(true)}).parse(req.body);
  const room=await query(db.from('rooms').select('*').eq('invite_hash',hash(code)).maybeSingle());
  if(!room) fail(404,'Invitation unavailable.');
  if(Date.now()<Date.parse(room.starts_at)) fail(409,`Meeting starts ${new Date(room.starts_at).toUTCString()}.`);
  const {error}=await db.rpc('join_pilot',{p_room:room.id,p_user:req.user.id,p_name:name});
  if(error) fail(409,'Room is closed, locked, full, or unavailable to this account.');
  res.json({id:room.id});
 }));
 app.post('/api/rooms/:id/token',run(async(req,res)=>{
  const room=await access(req);
  if(room.closed || Date.now()>=Date.parse(room.ends_at)) fail(410,'Meeting ended.');
  const member=await query(db.from('members').select('display_name').eq('room_id',room.id).eq('user_id',req.user.id).single());
  const token=new AccessToken(config.livekitKey,config.livekitSecret,{identity:req.user.id,name:member.display_name,ttl:30});
  token.addGrant({roomJoin:true,room:room.id,canPublish:true,canPublishSources:['microphone'],canSubscribe:true,canPublishData:false});
  res.json({token:await token.toJwt(),url:config.livekitUrl});
 }));
 app.get('/api/rooms/:id',run(async(req,res)=>{
  const room=await access(req); await query(db.from('members').update({last_seen_at:new Date().toISOString()}).eq('room_id',room.id).eq('user_id',req.user.id)); const members=await query(db.from('members').select('user_id,display_name,hand_at').eq('room_id',room.id).eq('banned',false).is('left_at',null).order('hand_at',{ascending:true,nullsFirst:false}));
  res.json({id:room.id,title:room.title,starts_at:room.starts_at,ends_at:room.ends_at,closed:room.closed,locked:room.locked,host_id:room.host_id,members,serverNow:Date.now()});
 }));
 app.post('/api/rooms/:id/hand',run(async(req,res)=>{
  const room=await access(req);const {raised}=z.object({raised:z.boolean()}).parse(req.body);
  let q=db.from('members').update({hand_at:raised?new Date().toISOString():null}).eq('room_id',room.id).eq('user_id',req.user.id);if(raised)q=q.is('hand_at',null);await query(q);res.json({ok:true});
 }));
 app.post('/api/rooms/:id/leave',run(async(req,res)=>{
  const room=await access(req);await query(db.from('members').update({left_at:new Date().toISOString(),hand_at:null}).eq('room_id',room.id).eq('user_id',req.user.id));res.json({ok:true});
 }));
 app.post('/api/rooms/:id/lock',run(async(req,res)=>{const room=await access(req,true);const {locked}=z.object({locked:z.boolean()}).parse(req.body);await query(db.from('rooms').update({locked}).eq('id',room.id));res.json({ok:true});}));
 app.post('/api/rooms/:id/remove',run(async(req,res)=>{
  const room=await access(req,true);const target=uuid.parse(req.body.userId);if(target===req.user.id)fail(400,'Use Leave to exit your own session.');
  await query(db.from('members').update({banned:true,left_at:new Date().toISOString(),hand_at:null}).eq('room_id',room.id).eq('user_id',target));
  await livekit.removeParticipant(room.id,target);res.json({ok:true});
 }));
 app.post('/api/rooms/:id/mute',run(async(req,res)=>{
  const room=await access(req,true);const target=uuid.parse(req.body.userId);const p=await livekit.getParticipant(room.id,target);
  for(const track of p.tracks) await livekit.mutePublishedTrack(room.id,target,track.sid,true);
  res.json({ok:true});
 }));
 app.post('/api/rooms/:id/report',run(async(req,res)=>{
  const room=await access(req);const {userId,reason}=z.object({userId:uuid,reason:z.string().trim().min(1).max(1000)}).parse(req.body);
  const target=await query(db.from('members').select('user_id').eq('room_id',room.id).eq('user_id',userId).maybeSingle());if(!target)fail(400,'Participant unavailable.');
  await query(db.from('reports').insert({room_id:room.id,reporter_id:req.user.id,target_id:userId,reason}));res.status(201).json({ok:true});
 }));
 app.get('/api/rooms/:id/reports',run(async(req,res)=>{await access(req,true);res.json(await query(db.from('reports').select('*').eq('room_id',req.params.id).order('created_at',{ascending:false}).limit(100)));}));
 app.post('/api/rooms/:id/close',run(async(req,res)=>{const room=await access(req,true);await query(db.from('rooms').update({closed:true}).eq('id',room.id));await livekit.deleteRoom(room.id);res.json({ok:true});}));
 app.use('/api',(_req,res)=>res.status(404).json({error:'Endpoint not found.'}));
 app.use((e,_req,res,_next)=>res.status(e instanceof z.ZodError?400:e.status||503).json({error:e instanceof z.ZodError?'Check the form fields.':e.status?e.message:'Service unavailable. Please retry.'}));
 return app;
}
