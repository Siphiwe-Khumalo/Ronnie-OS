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
