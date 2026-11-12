# Production build

The site is static files served by Caddy on the same domain as the API: Caddy serves `dist/` and proxies `/api/*`
to the backend (see `asico-server/deploy/Caddyfile` and `asico-server/docs/deployment.md`).

## Build

- **Node 22** (`.nvmrc`; `package.json` "engines" is `>=22.12.0`, which Vite 8 needs). The server uses `node:22-slim`.
- **npm**, from `package-lock.json`: `npm ci && npm run build`. The build reads `.env.production`
  (`VITE_API_BASE_URL=/api/v1`, tracked, no secrets). Output: `dist/` (`index.html`, `assets/`, `favicon.svg`).

On the server, `/opt/asico/deploy-frontend.sh` (from the deployment guide) runs exactly this in a throwaway
`node:22-slim` container from a clean checkout, and only copies `dist/` to `/opt/asico/frontend-dist` when the build
produced an `index.html`.

Keep `package-lock.json` in sync: after changing a dependency, run `npm install` and commit the lock file. Local
development may use pnpm (`pnpm-lock.yaml`); the server only uses the npm lock.

## What to check after a build

- `dist/index.html` loads `/assets/index-<hash>.js` and `.css` and has **no inline script** (the CSP is `script-src 'self'`).
- No source maps in `dist/assets` (Vite does not emit them by default).
- No `localhost` API URL in the bundle: `grep -o "localhost:[0-9]*" dist/assets/*.js` prints nothing. (React Router
  and axios contain the bare string `http://localhost` as a URL-parsing base; that is expected.)
- No mock code: `grep -c "msw\|mockServiceWorker" dist/assets/*.js` is 0 (MSW is only imported by the tests).

## Routes the server must know

- Every client route (`/villas/123`, `/materials?tab=balance`, ...) is answered with `index.html` (Caddy `try_files`).
  Hashed `/assets/*` are cached for a year; `index.html` is `no-store`.
- Password reset: the email links to **`/reset-password?token=<token>`**. The backend setting is
  `PASSWORD_RESET_URL=https://YOUR_DOMAIN/reset-password`; the page reads the `token` query parameter.
- Public sign-up (`/signup`) gets `403 SIGNUP_DISABLED` in production unless `AUTH_SIGNUP_ENABLED=true`; the page
  shows the server's message.

## Content-Security-Policy for this build

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self';
object-src 'self' blob:; frame-src 'self' blob:; worker-src 'self' blob:; base-uri 'self'; form-action 'self';
frame-ancestors 'none'
```

- `style-src 'unsafe-inline'`: Radix and the toasts set inline styles. Fonts come from Google Fonts (`src/index.css`).
- `blob:`: documents and delivery notes open in a new tab from a blob URL, and downloads use blob URLs.
- No inline scripts, no `eval`, no workers of our own.
