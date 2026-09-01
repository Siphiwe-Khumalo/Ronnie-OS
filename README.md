# Ronnie OS

A small, local-first activity log for daily life.

## Development

```bash
npm install
npm run dev
```

The voice screen also needs the local backend running, in a second terminal:

```bash
npm run server
```

The Vite development server proxies `/api/voice/session` to the backend on port `8787`. The backend binds to loopback by default and caps concurrent session creation; any non-local deployment must add HTTPS and application authentication at the trusted reverse proxy boundary.

The server starts without any configuration, but voice sessions require an OpenAI API key. Create an untracked `.env.local` file in the project root (it is covered by `.gitignore` and is never read by the frontend) with the key only for the server:

```bash
OPENAI_API_KEY=your-server-side-key
VOICE_MODEL=gpt-realtime-mini
# Optional when the backend is reachable beyond localhost:
# VOICE_ALLOWED_ORIGIN=https://your-ronnie-host.example
```

Without `OPENAI_API_KEY` set, the backend still starts and serves `/health`, but `/api/voice/session` responds with `503 Voice service is not configured on the server.` instead of exposing any key.

## Validation

```bash
npm run typecheck
npm run build
```

## Production deployment (Vercel)

Ronnie OS deploys as a static Vite/React frontend plus two small Vercel Functions, all from the same GitHub repository — no separate backend host or always-on server is required.

```text
Browser (any device, HTTPS)
      ↓
Vercel static hosting (dist/, built by `npm run build`)
      ↓
Vercel Functions (api/health.js, api/voice/session.js)
      ↓
OpenAI Realtime API (https://api.openai.com/v1/realtime/calls)
```

- `api/health.js` and `api/voice/session.js` are Vercel Functions (Node.js runtime, Web `Request`/`Response` signature). They reuse the same `server/voice/createSession.mjs` session logic as local development, so production and local behavior stay identical.
- `vercel.json` adds a single SPA rewrite (`/(.*) → /index.html`) so client-side routes and page refreshes work correctly. Vercel always serves real files (including everything under `/api`) before applying rewrites, so this does not interfere with the API routes.
- The local `npm run server` / `server/index.mjs` Node HTTP server remains for local development only; it is not used in production. Production traffic is served entirely by Vercel's static hosting and Functions.

### Connecting the repository

1. In the Vercel dashboard, import the `Siphiwe-Khumalo/Ronnie-OS` GitHub repository as a new project.
2. Vercel auto-detects the Vite framework: build command `npm run build`, output directory `dist`. No override is needed.
3. Every push to the connected branch triggers an automatic deployment (a Preview deployment for other branches/PRs, a Production deployment for the branch configured as production in the Vercel project).

### Required environment variables (set in Vercel, never in GitHub)

Configure these under Project Settings → Environment Variables in the Vercel dashboard:

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | Server-side secret. Only read inside `api/voice/session.js` on the server. Never exposed to the browser or committed to Git. |
| `VOICE_MODEL` | No | Defaults to `gpt-realtime-mini` if unset. |
| `VOICE_ALLOWED_ORIGIN` | No | Restricts `/api/voice/session` to a specific request origin if set. |

These are read with `process.env.*` inside the Vercel Function at request time; they are never bundled into frontend code.

### Verifying a deployment

After Vercel provides a deployment URL:

```bash
curl -s https://<your-deployment-url>/api/health
# {"ok":true}

curl -s -i -X POST https://<your-deployment-url>/api/voice/session \
  -H "Content-Type: application/sdp" --data-binary "v=0"
# 503 if OPENAI_API_KEY is not set, 502 if the provider rejects the request,
# or a 200 application/sdp answer on a real successful session
```

Then open the deployment URL in a browser, confirm Today/Log/Voice all load, refresh on `/voice` (or any route) without a 404, and confirm the microphone permission prompt appears when starting a voice session.
