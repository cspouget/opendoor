import React from 'react';
import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import MeetingRoom from './components/MeetingRoom.jsx';

/**
 * App is the top‑level component controlling whether the user is on the
 * dashboard view or inside a meeting room. In a future version this
 * component would also handle routing, authentication state, and
 * connecting to Supabase/LiveKit. For now it provides a simple toggle
 * between the dashboard and a placeholder meeting room.
 */
export default function App() {
  const [inMeeting, setInMeeting] = useState(false);

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f7f8fa' }}>
      {inMeeting ? (
        <MeetingRoom onLeave={() => setInMeeting(false)} />
      ) : (
        <Dashboard onJoin={() => setInMeeting(true)} />
      )}
    </div>
  );
}
