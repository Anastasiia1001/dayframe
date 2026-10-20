# Connecting your accounts

Dayframe supports read-only Outlook Calendar, Google Calendar and Slack. Jira and Confluence are deliberately disabled. This setup needs one-time OAuth app registration and your explicit sign-in. No account credentials have been supplied or connections established by development tests.

## 1. Host the live workspace

GitHub Pages serves static files and cannot run OAuth token exchange. It remains useful for personal tasks and an explicitly labelled demo. For live connections, deploy this repository as a Node 24 web service, using `render.yaml` or another Node host:

- Build: `npm ci --no-audit --no-fund && npm run build`
- Start: `npm start`
- Health: `/api/health`
- On Render, the public URL is discovered from `RENDER_EXTERNAL_URL`. On other hosts, set `DAYFRAME_PUBLIC_URL` to the exact HTTPS origin, e.g. `https://your-workspace.example`. Do not include a path.
- Keep all client secrets in the host's secret environment settings. Never put them in Git, frontend variables, chat, localStorage, or a desktop application.

Use the hosted workspace URL for sign-in and everyday work. Do not try to proxy private tokens through the GitHub Pages frontend. The backend and frontend intentionally share one origin, avoiding cross-site tracking cookies and insecure CORS exceptions. Each browser gets its own server-side session; account tokens are not sent to browser JavaScript.

`render.yaml` is a deployment template, not evidence that a service was created. Hosting requires your own provider account and may have plan limits. The template deploys without provider credentials. Once the live URL exists, register the OAuth apps, then add only the client IDs and secrets for providers you intend to connect in the service’s Environment settings. Unconfigured providers remain disabled.

## 2. Outlook first

1. Open [Microsoft Entra app registrations](https://entra.microsoft.com/). Create an application with the audience **Accounts in any organizational directory and personal Microsoft accounts** so both your work and personal Outlook accounts are supported. A work account may require an administrator's consent.
2. Add both **Web** redirect URIs: `https://YOUR-HOST/api/auth/outlook-work/callback` and `https://YOUR-HOST/api/auth/outlook-personal/callback`.
3. Add delegated Microsoft Graph permission **Calendars.Read**. Do not add calendar write or mail permissions. The authorization request also requests `offline_access` for refresh.
4. Create a client secret. Securely set `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` on the backend host. Set `MICROSOFT_TENANT_ID` to your tenant ID for a single-tenant app, or `common` for an appropriately registered multitenant app.
5. Restart/redeploy the backend. In Dayframe, open **Settings → Your connections** and connect **Outlook · Work** and **Outlook · Personal** separately. Work sign-in uses the organizations endpoint (or your configured tenant); personal sign-in uses consumers. The same app registration and server-side secret are reused; each account has an independent session token.

Outlook reads the default calendar through Microsoft Graph `calendarView`, follows pagination, excludes cancelled events and asks Graph for UTC timestamps, then converts them into your device's timezone. A later iteration can add calendar selection. Authorization uses state validation plus PKCE.

Microsoft documentation: [authorization code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow), [calendarView](https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview).

## 3. Google Calendar

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/). Enable **Google Calendar API**.
2. Configure OAuth consent. For an app in testing, explicitly add your Google account as a test user. Testing-mode grants may expire according to Google's policy.
3. Create an OAuth **Web application** client. Register `https://YOUR-HOST/api/auth/google/callback` as its authorized redirect URI.
4. Securely set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the backend host.
5. Restart/redeploy, then click **Connect Google Calendar** in Dayframe.

Only `calendar.events.readonly` is requested. Dayframe reads the primary calendar in the visible date range, including recurring event instances, and follows pagination. Same event UID + occurrence time is deduplicated across calendars; similarly named separate events are preserved. All-day end dates are exclusive.

Google documentation: [web server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [events.list](https://developers.google.com/workspace/calendar/api/v3/reference/events/list).

## 4. Slack

1. Create an app in [Slack API apps](https://api.slack.com/apps) in the workspace you can access.
2. Add `https://YOUR-HOST/api/auth/slack/callback` under **OAuth & Permissions → Redirect URLs**.
3. Add **User Token Scopes** `search:read` and `users:read`. This implementation uses your user authorization, not a bot token. Do not add message write scopes. Your workspace may require administrator approval.
4. Securely set `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` on the backend host.
5. Restart/redeploy, click **Connect Slack**, and select up to five channel names in Settings.

Dayframe searches direct mentions and your selected channels within the last 24 hours. It shows up to 30 latest matches per query and explicitly reports truncation. Slack retention and search permissions determine what is visible. Authors are resolved for up to 15 users per refresh. This is a search-based activity feed, **not an AI summary or inferred relevance engine**. No Slack data is sent to an AI provider. Suggestions never become tasks automatically.

Slack documentation: [OAuth v2](https://docs.slack.dev/authentication/installing-with-oauth/), [search.messages](https://docs.slack.dev/reference/methods/search.messages/).

## Sessions and limitations

- Tokens stay in server memory. Sessions expire after 8 hours and are lost on backend restart/sleep/redeploy. Reconnect afterward. Run one backend instance; multi-instance operation needs a shared encrypted session store and coordination before scaling.
- Refresh tokens are used when supplied. Failed or revoked grants require reconnecting. Disconnect removes the current session's token; revoke permissions in the provider's account settings to revoke the grant itself.
- Browser preferences and personal tasks stay in that browser's localStorage. Recurring tasks reopen on their next due date when the app is open; no background process runs. They do not sync between devices, desktop web apps, or site origins. Changing from GitHub Pages to a live host starts a separate local task store.
- No email, notification push, weather, Jira, Confluence, writes to external services, or automatic background Slack polling is enabled. Use Refresh or refocus the window to update sources. An inactive app does not send reminders.
- Readiness tests use local fixtures to verify OAuth, authorization boundaries and provider response mapping. They do not prove that an actual Microsoft, Google or Slack account has authorized access.

## Local development

```sh
npm ci --cache /tmp/dayframe-npm-cache
npm run build
cp .env.example .env
# Fill in your own app settings securely; never commit .env.
npm start
```

Register `http://localhost:4317/api/auth/outlook-work/callback` and `http://localhost:4317/api/auth/outlook-personal/callback` (and the equivalent provider callback) for local development when that provider permits it. The backend serves the built frontend on port 4317.

For Vite hot reload, run `npm run dev` separately, set `DAYFRAME_PUBLIC_URL=http://localhost:5173` and register callback URLs with port 5173. Vite proxies `/api` to the backend on port 4317. The public URL must match your browser's origin exactly so OAuth redirects and disconnect CSRF checks work.
