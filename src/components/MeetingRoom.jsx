import React from 'react';

/**
 * MeetingRoom is a stub component representing the live meeting interface.
 * Eventually this file should integrate LiveKit to provide audio/video
 * streaming, participant tiles, raise‑hand queue, and moderation controls.
 * For now it displays a placeholder layout with a leave button.
 */
export default function MeetingRoom({ onLeave }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Meeting Room (Placeholder)</h2>
      <p>This area will host the real‑time meeting powered by LiveKit.</p>
      <p>
        Participants will be able to toggle video, raise their hand, and share
        audio. Moderation controls and an AI facilitator will be integrated
        here.
      </p>
      <button
        onClick={onLeave}
        style={{
          padding: '0.5rem 1rem',
          marginTop: '1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: '#e11d48',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        Leave Meeting
      </button>
    </div>
  );
}
