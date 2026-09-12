import React, { useEffect, useState } from 'react';
import './style.css';
const LivePilot = React.lazy(() => import('./LivePilot.jsx'));

const stages = [
  { at: 0, name: 'Arrive', duration: '2 minutes', prompt: 'Take a moment to arrive.', detail: 'Settle into your seat. You can participate quietly. There is nothing to prove here.' },
  { at: 120, name: 'Check in', duration: '4 minutes', prompt: 'What are you bringing into this moment?', detail: 'Name a feeling, or simply listen. Passing is always welcome.' },
  { at: 360, name: 'Share & listen', duration: '10 minutes', prompt: 'What would make the next hour easier?', detail: 'Speak from your own experience. Leave space for others. Avoid giving advice unless it is requested.' },
  { at: 960, name: 'Close', duration: '4 minutes', prompt: 'Choose one small thing to carry forward.', detail: 'It might be a glass of water, a pause, or reaching out to someone you trust.' },
];
const clock = n => `${Math.floor(n / 60).toString().padStart(2, '0')}:${(n % 60).toString().padStart(2, '0')}`;
export default function App() {
  const [screen, setScreen] = useState('home');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [started, setStarted] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [hand, setHand] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [ending, setEnding] = useState(false);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const elapsed = started ? Math.min(1200, Math.max(0, Math.floor((now - started) / 1000))) : 0;
  const stage = stages.reduce((selected, item) => elapsed >= item.at ? item : selected, stages[0]);
  useEffect(() => { if (screen === 'room' && elapsed >= 1200) { setScreen('done'); setCompleted(n => n + 1); } }, [elapsed, screen]);
  function finish() { setEnding(false); setScreen('done'); setCompleted(n => n + 1); }
  return <div className="shell">
    <header><a className="brand" href="#" onClick={e => { e.preventDefault(); if(screen !== 'room') setScreen('home'); }} aria-label="OpenRoom home"><span className="mark">o</span>OpenRoom<span className="beta">PREVIEW</span></a><a className="quiet" href="#about" onClick={e => { if (screen === 'room') { e.preventDefault(); setEnding(true); } }}> {screen === 'room' ? 'Leave session' : 'How it works'} <span aria-hidden="true">↗</span></a></header>
    {screen === 'live' && <React.Suspense fallback={<p>Loading live rooms…</p>}><LivePilot onBack={() => setScreen('home')}/></React.Suspense>}
    {screen === 'home' && <main>
      <section className="hero"><div><div className="eyebrow"><span className="dot"/> A LITTLE SPACE. A HUMAN CONNECTION.</div><h1>You don’t have to<br/>do this <em>alone.</em></h1><p className="intro">A place to pause, share, and be heard.<br/>Twenty-minute spaces for people in recovery,<br className="desktop"/> wherever you are in your journey.</p><button className="primary" onClick={() => setScreen('lobby')}>Try a guided session <span>↗</span></button><button className="back live-link" onClick={() => setScreen('live')}>Join an invited audio meeting ↗</button><p className="caption">Solo preview · No account needed · Camera off</p></div><div className="art" aria-hidden="true"><div className="orbit orbit1"/><div className="orbit orbit2"/><div className="arch"><div className="light"/></div><div className="artcaption">ROOM TO BEGIN AGAIN.</div></div></section>
      <section className="availability"><div><span className="eyebrow">YOUR SPACE, AT YOUR PACE</span><h2>Start with twenty minutes.</h2><p>This preview lets you explore a full guided session on your own.</p></div><div className="status"><span className="dot"/> Solo sessions available<br/><small>Live pilot requires a host invitation.</small></div></section>
      <section className="cards" id="about">{[['01', 'Come as you are', 'Choose a display name. Share only what you feel comfortable sharing.'], ['02', 'Listening counts', 'There is no pressure to speak. Quiet participation belongs here, too.'], ['03', 'One moment at a time', 'A simple flow: arrive, check in, share and listen, then close.']].map(([n,t,d]) => <article key={n}><span className="number">{n}</span><h3>{t}</h3><p>{d}</p></article>)}</section>
      <div className="footnote">{completed > 0 ? `${completed} session${completed === 1 ? '' : 's'} finished during this visit. ` : ''}Your preview inputs stay in this page’s memory and clear when you reload.</div>
    </main>}
    {screen === 'lobby' && <main className="center"><button className="back" onClick={() => setScreen('home')}>← Back</button><div className="eyebrow">BEFORE YOU ENTER</div><h1>A space for <em>you.</em></h1><p className="intro">You’re entering a solo practice room with timed prompts. No other people or AI facilitator are connected.</p><form onSubmit={e => { e.preventDefault(); setStarted(Date.now()); setNow(Date.now()); setHand(false); setScreen('room'); }}><label htmlFor="name">Display name</label><input id="name" value={name} onChange={e => setName(e.target.value)} maxLength={32} placeholder="Choose a name" required autoComplete="off"/><div className="agreements"><h3>Room agreements</h3><p>Respect privacy. Speak from your experience. Give others room. Passing is welcome.</p><label className="check"><input type="checkbox" required checked={agreed} onChange={e => setAgreed(e.target.checked)}/>I agree to these room agreements.</label></div><button className="primary" disabled={!name.trim() || !agreed}>Enter solo session <span>↗</span></button></form></main>}
    {screen === 'room' && <main className="room"><div className="roomtitle"><div><div className="eyebrow">SOLO PRACTICE · ONLY YOU</div><h2>A moment to reconnect.</h2></div><div className="timer" role="timer" aria-label={`${clock(1200-elapsed)} remaining`}>{clock(1200-elapsed)}<small>remaining</small></div></div><div className="roomgrid"><section className="prompt"><div className="eyebrow">GUIDED PROMPT · {stage.name.toUpperCase()}</div><h1>{stage.prompt}</h1><p>{stage.detail}</p><div className="participant"><div className="avatar">{name.trim().slice(0,1).toUpperCase()}</div><strong>{name} <small>(you)</small></strong><span>{hand ? 'Hand raised · practice' : 'Camera & microphone off'}</span></div><div className="controls"><button onClick={() => setHand(!hand)} aria-pressed={hand}>{hand ? 'Lower hand' : 'Raise hand'}</button><span className="caption">No audio or video is captured.</span></div></section><aside><h3>Your twenty minutes</h3>{stages.map((s,i) => <div className={`stage ${s.name === stage.name ? 'active' : ''}`} key={s.name}><span>{i+1}</span><div>{s.name}<small>{s.duration}</small></div></div>)}<p className="caption">Prompts advance automatically. This is a scripted guide, not an AI conversation.</p><button className="back" onClick={() => setEnding(true)}>Finish session early</button></aside></div>{ending && <div className="confirm" role="alert"><p>Finish this session and return to your day?</p><button onClick={finish}>Finish session</button><button onClick={() => setEnding(false)}>Stay here</button></div>}</main>}
    {screen === 'done' && <main className="center"><div className="eyebrow">A MOMENT TAKEN FOR YOURSELF</div><h1>Carry a little<br/><em>space with you.</em></h1><p className="intro">Your session has ended. You spent {Math.floor(elapsed/60)} minute{Math.floor(elapsed/60) === 1 ? '' : 's'} here.</p><p>No recording or transcript was created.</p><button className="primary" onClick={() => setScreen('home')}>Back to OpenRoom <span>↗</span></button></main>}
    <footer><span>OpenRoom · Room for your recovery.</span><span>Peer support concept. Not clinical care or an emergency service.</span></footer>
  </div>;
}
