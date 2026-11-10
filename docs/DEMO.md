# Temporary public demo (Cloudflare quick tunnel)

Use this flow when you want one public HTTPS URL for the UI while the API stays on your machine. The browser only talks to the Vite preview origin; preview proxies `/api` to `asico-server` on localhost.

## Prerequisites

- Node.js and dependencies installed (`npm install` in `asico-management`).
- `asico-server` running locally (default `PORT=8080`, API at `/api/v1` per [frontend-contract](../../asico-server/docs/frontend-contract.md)).
- `CORS_ORIGINS` on the server must include the URL you will use in the browser (for a quick tunnel, add your `https://<random>.trycloudflare.com` origin while the demo is live).

## Configure

1. Review [`.env.demo`](../.env.demo):
   - `VITE_API_BASE_URL=/api/v1` (relative, same origin as the preview/tunnel).
   - `DEV_API_PROXY_TARGET=http://localhost:8080` (or your backend port).
2. Optional: copy to `.env.demo.local` for overrides (gitignored with other `.env*` locals).

## Build and run preview

From `asico-management`:

```bash
npm run demo
```

This runs `vite build --mode demo` (loads `.env.demo`) then `vite preview --host 0.0.0.0 --port 4173`.

Preview listens on all interfaces on port **4173**. `server.allowedHosts` and `preview.allowedHosts` allow `*.trycloudflare.com`.

## Expose with Cloudflare (quick tunnel)

With preview running on 4173, in another terminal:

```bash
cloudflared tunnel --url http://127.0.0.1:4173
```

Use the printed `https://<random>.trycloudflare.com` URL. Point stakeholders at that link only.

## What to check

1. **Same-origin API (local):** With preview up and backend on 8080:

   ```bash
   curl -sS http://127.0.0.1:4173/api/v1/health
   ```

   Expect JSON health status from the backend (not a Vite HTML 404).

2. **No localhost in the client bundle:** After `npm run demo`, search `dist/` for `localhost` in JS assets. There should be no API base pointing at localhost (only relative `/api/v1` or whatever `VITE_API_BASE_URL` is).

3. **UI loads via tunnel:** Open the trycloudflare URL, sign in if needed, and confirm list pages load data (network tab shows `/api/v1/...` on the tunnel host, status 200).

4. **Cookies:** Login uses HTTP-only refresh cookies; the preview proxy forwards `Set-Cookie` and `Cookie` without rewriting domains (`cookieDomainRewrite: false`). If refresh fails only through the tunnel, confirm `CORS_ORIGINS` and cookie `Secure`/`SameSite` settings match HTTPS on the tunnel host.

## Stop

Stop `cloudflared` and the `npm run demo` process when the demo ends. Remove the tunnel origin from `CORS_ORIGINS` if you added it temporarily.
