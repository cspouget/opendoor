# OpenRoom: invite-only recovery meeting pilot

React + Vite frontend, Node/Express server, Supabase accounts and database, LiveKit audio. Includes a standalone solo practice flow and an authenticated live meeting implementation. Live services have NOT been deployed or verified with multiple people.

## Implemented

- Email/password signup and sign-in; usernames in rooms, no public email listing.
- Host-created invitations, scheduled 20-minute rooms, 8-person capacity.
- Server-validated membership and short-lived, microphone-only LiveKit tokens.
- Join muted, audio playback, microphone toggle, reconnection status.
- Shared server clock and hand queue, refreshed every 5 seconds.
- Host mute, remove/ban, lock and end controls; participant reports and host report view.
- Private attendance history. Database RLS and server-only writes.
- Server reconciliation every 10 seconds for expired rooms and revoked memberships. Browser sessions without a heartbeat for 90 seconds are released.
- No recording, transcription or AI connection is implemented.

## Local setup

Use Node 22.12 or newer.

1. `npm ci`
2. Copy `.env.example` to `.env`; configure the server variables below.
3. Apply `supabase/migrations/001_pilot.sql` once to a Supabase project.
4. `npm run build` then `npm start`. Open `http://localhost:3001`.

For development run `npm run dev:server` and `npm run dev` in separate terminals. Vite proxies `/api` to port 3001. With no credentials, the solo preview remains usable and live rooms show an unavailable state.

## Service configuration

Configure values in your deployment provider's secret/environment settings. Do not commit `.env` or paste private keys into source files.

| Variable | Source |
| --- | --- |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_ANON_KEY | Public anon/publishable key |
| SUPABASE_SERVICE_ROLE_KEY | Server-only service role/secret key |
| LIVEKIT_URL | LiveKit project WebSocket URL, starting wss:// |
| LIVEKIT_API_KEY | LiveKit API key |
| LIVEKIT_API_SECRET | Server-only LiveKit API secret |
| HOST_USER_IDS | Comma-separated Supabase UUIDs authorized to create rooms |
| TRUST_PROXY_HOPS | Exact number of reverse proxies between the browser and Node; default 0 |
| PORT | HTTP port, default 3001 |

Enable Supabase email confirmation and configure its Site URL and allowed email redirect URL to the deployed HTTPS origin. Create and confirm the host account, copy its user UUID from Supabase Auth into HOST_USER_IDS, then restart the server. Configure email delivery for invited testers. The public configuration endpoint exposes only the public Supabase settings and whether server values are present; it does not prove service connectivity.

## Deploy

Deploy the included Dockerfile to a Node/container host with HTTPS, a continuously running instance, and secrets support. This version uses a single instance for rate limiting and room reconciliation. Its API and frontend must share an origin.

`docker build -t openroom .`

`docker run --env-file .env -p 3001:3001 openroom`

GitHub Pages cannot run the live meeting API. The included GitHub Pages workflow publishes only the solo preview after automated access-control and browser checks pass. No automatic paid infrastructure provisioning is included.

## Verification

`npm test` executes the migration against a local PostgreSQL-compatible runtime and checks capacity, room locking, bans, closed-room rejection, private attendance access, write denial, authentication and host creation authorization. `npm run build` checks the frontend production build.

Live acceptance gate after service setup: two separate confirmed accounts on separate browsers join the same invitation; both start muted; verify bidirectional audio, synchronized timer and queue, reconnect, host mute/removal/lock, report visibility and automatic end. Test mobile microphone permission denial and network loss. Verify no private keys appear in frontend requests or built assets.

## Pilot limits

Scripted facilitation only. No continuously staffed 24/7 promise. Report handling depends on the room host; reports are not an emergency channel. A host mute can be undone by the participant; removal is the stronger action. Removed users are denied new tokens; an already-issued token may remain usable for up to 30 seconds, with reconciliation removing unauthorized participants every 10 seconds. Test this behavior against the selected LiveKit deployment before inviting people outside the pilot.

Attendance and reports are stored in Supabase until explicitly deleted by an administrator. Communicate this retention to invitees and set an operating retention policy before public launch. Provider logs may also contain connection metadata. Browser playback and microphone access require HTTPS except on localhost.

Official API references: https://docs.livekit.io/reference/server-sdk-js/classes/RoomServiceClient.html and https://supabase.com/docs/reference/javascript/auth-getuser
