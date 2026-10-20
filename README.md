# Dayframe

A calm, responsive work + life dashboard built with React, TypeScript, Vite, Tailwind CSS and Lucide. This is an interactive prototype: all external sources are mock, read-only data. No OAuth or real API connections are implemented.

## Run

```sh
npm ci --cache /tmp/dayframe-npm-cache
npm run dev
```

Vite listens on port 5173. `npm run build` checks TypeScript and creates a production build in `dist`; `npm run preview` serves that build on port 4173.

## Structure

- `src/App.tsx`: navigation, Today, Calendar, Work, Personal, Settings, search, notifications and task dialogs.
- `src/types.ts`: typed calendar, issue, digest, document and personal task models.
- `src/data/mockCalendar.ts`, `mockJira.ts`, `mockSlack.ts`, `mockConfluence.ts`, `mockTasks.ts`: realistic seed data. Calendar dates are anchored to the browser's local day.
- `src/data/providers.ts`: async read-only interfaces and mock providers. Add Jira, Slack and Confluence API adapters here; combine future Outlook and Google providers behind the calendar interface, deduplicating by provider/event identity before passing events to the UI. Authentication belongs in a future secure service, never in browser source.
- `src/styles.css`: responsive layout and eight CSS variable themes. Tailwind is enabled through its Vite plugin.

Personal task edits, completion, recurrence preferences, themes, calendar filters and notification read states persist in localStorage. Demo source details open in a local preview instead of navigating to fabricated external URLs. Recurrence is saved as a rule; the prototype does not run a background reminder or recurrence scheduler. Mock weather and AI-style summaries are explicitly simulated. No real user data is sent externally.

## Browser validation

The onboarding validation uses Playwright with system Chromium, with tooling outside the repository. It covers navigation, task CRUD and postponement, localStorage after reload, themes, search, calendar navigation/filtering, notifications and mobile overflow. No backend is required.

## Automatic publication

`.github/workflows/deploy.yml` builds and publishes the application to GitHub Pages on every push to `main`; a manual Actions run is also supported. No hosting secrets are required.

One-time activation: publish these source changes to the GitHub repository, then open repository Settings → Pages → Build and deployment → Source and select **GitHub Actions**. Run **Publish Dayframe** from Actions if the first push occurred before Pages was enabled. The successful deployment reports the actual site URL. Vite uses relative asset paths for repository subpath hosting.

Publishing an environment snapshot is separate from publishing the web application. LocalStorage data is specific to each browser and site origin; it does not sync between devices.

The default palette is soft blush; Blossom adds a lilac alternative. A small bunny offers encouragement, task completion triggers decorative petals, and all motion respects `prefers-reduced-motion`. These details live in `src/components/CozyCompanion.tsx` and the final section of `src/styles.css`.
