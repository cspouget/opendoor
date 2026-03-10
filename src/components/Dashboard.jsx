import React from 'react';

/**
 * Dashboard displays the main landing page after a user logs in. It shows
 * a countdown until the next meeting and provides a button to join a
 * meeting when available. In a complete implementation this component
 * would read the current meeting schedule from Supabase and only enable
 * the join button within the allowed window. For now it's a placeholder.
 */
export default function Dashboard({ onJoin }) {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>OpenRoom</h1>
      <p style={{ maxWidth: '32rem', textAlign: 'center', marginBottom: '2rem' }}>
        Welcome! OpenRoom provides always‑available recovery meetings. Join the
        next 20‑minute meeting to share, listen, and support others on the path
        to sobriety.
      </p>
      {/* Countdown timer placeholder */}
      <div style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Next meeting starts soon…</div>
      <button
        onClick={onJoin}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: '#4f46e5',
          color: 'white',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        Join Meeting Now
      </button>
    </main>
  );
}
