# Dayframe

A personal work + life dashboard built with React, TypeScript, Vite, Tailwind and Lucide. Readable typography, saturated pastel themes, local personal tasks and optional read-only connections to Outlook, Google Calendar and Slack. Jira and Confluence are disabled.

## Run

Node.js 24 or later:

```sh
npm ci --cache /tmp/dayframe-npm-cache
npm run build
npm start
```

The backend serves the built app on port 4317. With no OAuth app configuration, real sources show **Not connected**. Use **Settings → Try demo** to explore sample calendars and Slack activity. Personal tasks work without account connections.

`npm run dev` runs Vite on port 5173 and proxies `/api` to the backend. For integrated OAuth development, match `DAYFRAME_PUBLIC_URL` and registered redirects to port 5173. `npm run preview` is a static production preview, not the OAuth backend.

## Account connections

Start with Outlook, then Google Calendar and Slack. Hosting and one-time OAuth app registration are required. See [the connection guide](docs/CONNECTIONS.md) for exact scopes, callback URLs and environment variable names. Client secrets belong only in backend hosting settings, never in the frontend.

- `server/config.mjs`: provider endpoints, read-only scopes and required configuration names.
- `server/app.mjs`: authorization-code exchanges, PKCE for Microsoft/Google, state validation, HttpOnly same-origin sessions, token refresh, calendar and Slack read endpoints, frontend hosting.
- `server/mappers.mjs`: provider data → domain model, including timezone conversion.
- `src/data/live.ts`: typed browser API client; account tokens never enter localStorage.
- `src/useWorkspace.ts`: live/demo selection, synchronization, partial failure states, deduplication and date-range loading.
- `src/components/IntegrationSettings.tsx`: actual connection state, connect/disconnect and Slack channel preferences.
- `src/data/mock*.ts`, `providers.ts`: isolated sample data. Jira and Confluence fixtures are retained only as unused future reference; they are not consumed by the application.
- `src/types.ts`: typed domain models.
- `src/App.tsx`: Today, Calendar, Work, Personal, search, notifications and task editing.
- `src/styles.css`: responsive layouts, eight themes, accessible motion preferences and readable font sizes.

Live Slack is a search-based feed, not an AI digest. External sources are read-only. Server sessions are in memory, expire after eight hours and require reconnection after restart. Personal tasks and browser preferences persist locally. Completed recurring tasks reopen when their next date arrives and the app is open; there is no background scheduler. Personal data does not sync across devices or site origins.

## Deployment

GitHub Pages automatically publishes static assets on pushes to `main`; it supports personal tasks and explicitly labelled demo mode. It cannot host real connections. For a live workspace, use the included `render.yaml` template or another Node 24 host. Build with `npm ci && npm run build`, start with `npm start`, and configure HTTPS public URL and provider credentials on that host. No live server has been provisioned by adding this template.

## Mac

See [Mac installation and build options](docs/MAC.md). Safari on macOS Sonoma or later can add Dayframe to the Dock as a standalone web app. A signed native .dmg is a separate implementation and macOS validation task; it is not currently generated.

## Validation

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Node tests exercise OAuth state/PKCE, missing configuration, account disconnect, pagination, timezone conversion, all-day events, Slack read-only scopes and safe provider errors with local fixtures. No real credentials are used. Browser checks cover live empty states, demo selection, connection controls, task persistence, readable text, navigation and mobile layout. Real provider consent remains unverified until you configure and connect the accounts.

For an existing system Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path instead of downloading a browser. `npm run test:browser` starts the built backend when needed.
