# Ronnie OS

A small, local-first activity log for daily life.

## Development

```bash
npm install
npm run dev
```

The voice screen also needs the local backend running. Create an untracked `.env.local` file (it is covered by `.gitignore`) with the key only on the server:

```bash
OPENAI_API_KEY=your-server-side-key
VOICE_MODEL=gpt-realtime-mini
# Optional when the backend is reachable beyond localhost:
# VOICE_ALLOWED_ORIGIN=https://your-ronnie-host.example
```

Then run the backend separately:

```bash
npm run server
```

The Vite development server proxies `/api/voice/session` to the backend on port `8787`. The backend binds to loopback by default and caps concurrent session creation; any non-local deployment must add HTTPS and application authentication at the trusted reverse proxy boundary.

## Validation

```bash
npm run typecheck
npm run build
```
