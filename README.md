# OpenRoom

OpenRoom is a recovery support platform that provides always‑available micro‑meetings for people recovering from addiction. This repository contains the source code for the MVP web application built using React, Supabase for authentication and data storage, and LiveKit for real‑time audio/video meetings.

## Features

- **24/7 Micro‑Meetings**: Users can join structured 20‑minute recovery meetings at any time, with an AI facilitator guiding the flow.
- **Anonymous User Accounts**: Email/password sign‑up with customizable usernames and optional avatars.
- **Dashboard**: See a countdown to the next meeting and a history of past meetings.
- **Meeting Interface**: Raise‑hand queue, avatar‑only mode, and basic moderation controls.
- **Supabase & LiveKit**: Supabase provides the database and authentication; LiveKit powers the real‑time meeting rooms.

## Getting Started

1. Clone this repository:
   ```bash
   git clone https://github.com/cspouget/opendoor.git
   cd opendoor
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the `.env.example` file to `.env` and set your Supabase URL, anon key, and LiveKit server URL.
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Deploy using GitHub Pages via the included workflow.

## License

This project is for demonstration purposes and is not ready for production use. See our planning discussions for roadmap and design considerations.
