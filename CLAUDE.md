# Credit Card Ticketing System

A React-based internal ticketing / case-management web app for a credit-card support team (Nashville, FD POS / BroadPOS / IPOS / IRIS / Corvia portals). The page is hosted on GitHub Pages.

---

## Stack

- **React 18.3.1** + **ReactDOM 18.3.1** (no router, no Redux — single `App` component with local state)
- **Vite 8** (`@vitejs/plugin-react`) as build tool / dev server
- **No bundler-time CSS framework** — Bootstrap 5.3.8 and Bootstrap Icons are loaded from `cdn.jsdelivr.net`, plus `animate.css` and Quill 2.0.3 (`quill.snow`). Inter is loaded from Google Fonts.
- **State persistence** — `localStorage` only (no backend). Merchant list is fetched once from a published Google Sheets CSV at startup.
- **Testing** — `node:test` + `node:assert/strict` (built-in Node test runner). No test framework.

---

## Scripts

| Script         | Command       | Purpose                                |
| -------------- | ------------- | -------------------------------------- |
| `npm start`    | `vite`        | Dev server                             |
| `npm run dev`  | `vite`        | Dev server (alias of `start`)          |
| `npm run build`| `vite build`  | Production build into `./dist`         |
| `npm run preview` | `vite preview` | Serve the built `dist` locally     |
| (test)         | `node --test src/draftStorage.test.js` | Run the single test file |

Run the test suite with `node --test src/draftStorage.test.js` from the project root.

---

## Project layout

```
.
├── index.html                  # Vite entrypoint; loads Bootstrap/Quill/Inter from CDN
├── vite.config.js              # base: "/Credit-Card-Ticketing-System/" (GitHub Pages subpath)
├── package.json
├── .github/workflows/deploy.yml   # Build + deploy to GitHub Pages on push to main
├── test.html                   # Standalone test page (89KB, pre-built preview)
├── dist/                       # Production build output
└── src/
    ├── main.jsx                # ReactDOM.createRoot(...).render(<App />)
    ├── App.jsx                 # Top-level React component (modals, layout, dashboard)
    ├── creditcardController.js # The bulk of the app: state, form, table, draft logic, init
    ├── draftStorage.js         # Tiny pure helper: ensureDraftForSaving
    ├── draftStorage.test.js    # Unit test for draftStorage
    ├── styles.css              # Full custom theme (CSS variables, light + dark mode)
    └── group-photo.jpeg        # Static asset bundled with the app
```

`App.jsx` is mostly presentational (sidebar, header, dashboard, tabs, modal triggers, layout shell). The real behavior — form handling, table rendering, draft tabs, localStorage persistence, Quill wiring, merchant loading, combobox, preview — lives in `creditcardController.js` and is wired up by `initCreditcardApp()` which `App.jsx` calls inside a `useEffect`.

---

## Architecture notes

- **Single init function** — `initCreditcardApp()` in `creditcardController.js` is idempotent (guarded by `window.__creditcardAppInitialized`). It wires DOM event listeners directly, including Quill, form fields, combobox, bulk actions, and a `setInterval` that auto-rolls the date at midnight EST.
- **IIFE / `'use strict'`** — the controller wraps everything in an IIFE; variables (`allEntries`, `editId`, `currentDraftId`, `quillEditor`, etc.) are closure-scoped, not React state.
- **Draft tabs** — multiple in-progress ticket drafts can be open at once as tabs; IDs are stored under `ticketDraftTabs_creditcard`, active tab under `activeDraftId_creditcard`, per-draft bodies under `editingDraft_creditcard_<id>`. `ensureDraftForSaving()` in `draftStorage.js` is the single helper that decides whether to reuse or create a draft before saving.
- **Statuses** — `RESOLVED`, `PENDING`, `OTHER TASK`. Selecting `OTHER TASK` reveals a template dropdown that auto-fills issue / troubleshooting / resolution fields.
- **TID templates** — `TID_TEMPLATES` and `OTHER_TASK_TEMPLATES` are inline dictionaries (PAX, NEXGO, FD150, FD130, Valor, Dejavoo, NMI, Auth.Net, Verifone, Gilbarco, etc.). TID templates are surfaced through a modal (`TidTemplatesModal` in `App.jsx`) that copies the chosen template to the clipboard.
- **Break schedule** — `BREAK_SCHEDULE` (Mon–Sun) is rendered by `BreakScheduleModal` from `App.jsx`; the "today" card is highlighted based on local time.
- **Merchant lookup** — `globalMerchantArray` is populated at startup from a published Google Sheets CSV (`MERCHANT_API_URL` in `creditcardController.js`). Used to autocomplete MID / store / merchant fields.
- **Theme** — light + dark via `body.dark-mode` toggling CSS variables in `styles.css`. Initialized in `initTheme()` inside the controller.
- **GitHub Pages** — `vite.config.js` sets `base: "/Credit-Card-Ticketing-System/"`; `.github/workflows/deploy.yml` builds on push to `main` and deploys `dist` via `actions/deploy-pages@v4`.

---

## Conventions

- **JS, not TypeScript** — `.jsx` for components, `.js` for the controller and helpers. No type annotations anywhere.
- **Inline data, not JSON files** — schedule, templates, statuses, and status options are inline constants. Adding a new TID template = adding a key to `TID_TEMPLATES` (in `App.jsx`).
- **localStorage keys are namespaced** — suffix `_creditcard` (e.g. `editingEntryId_creditcard`, `ticketDraftTabs_creditcard`, `lastClearDate_creditcard`). Keep the suffix when adding new keys.
- **DOM IDs are prefixed** — form fields are `creditcard-<name>` (e.g. `creditcard-mid`, `creditcard-issue`, `creditcard-remarks-editor`). The Quill editor targets `#creditcard-remarks-editor` and mirrors its HTML into the hidden `#creditcard-remarks` input on every `text-change`.
- **Persistence on every input** — most form inputs call `saveFormData('creditcard')` and, if a draft is active, `saveDraftData(currentDraftId)` on each change. `beforeunload` re-saves the form and active draft.
- **EST for date math** — `getESTDateString()` controls the daily auto-clear / date-roll logic; display uses `getLocalTodayString()`.

---

## Things to watch out for

- `creditcardController.js` is ~2000 lines of DOM-manipulating, closure-scoped code. New behavior usually means appending to `init()` and hooking up listeners — there is no router, no global store, no event bus.
- The `quillEditor` instance is a module-level `let` inside the IIFE; it must exist before any handler that writes to it is called. `quillEditor.on('text-change', ...)` is the source of truth for syncing the hidden remarks field.
- `draftStorage.js` is intentionally pure (no `localStorage` access) — `initCreditcardApp` injects `createNewDraft` / `saveDraftData` callbacks. Keep it that way so it stays unit-testable.
- Bootstrap and Quill are loaded from CDN inside `index.html`, not npm-installed. CDN URL changes need an `index.html` edit and a redeploy.
- The `group-photo.jpeg` asset is ~2.6 MB and ships in `src/`. Vite will fingerprint it into `dist/`; don't move it without updating imports.
- The workflow deploys to GitHub Pages with `concurrency: pages` and `cancel-in-progress: true`; do not change without understanding the impact on in-flight deploys.
- `test.html` at the repo root is a large standalone preview file (~90 KB). It is not referenced by the build — do not assume changes to it affect the deployed app.

---

## Where to add things

- **New TID template** → `TID_TEMPLATES` in `src/App.jsx`.
- **New "Other Task" template** → `OTHER_TASK_TEMPLATES` in `src/creditcardController.js`.
- **New break-schedule entry / day** → `BREAK_SCHEDULE` in `src/App.jsx`.
- **New persisted field** → add to the input listener list inside `init()` (`['mid', 'store', ...]`) and to `saveFormData` / the relevant `loadFormData` logic.
- **New status** → append to `STATUS_OPTIONS` in `src/creditcardController.js`; downstream branches that switch on `'OTHER TASK'` or `'RESOLVED'` will need to be reviewed.
- **New theme color** → CSS variable on `:root` in `src/styles.css`; mirror under `body.dark-mode` for the dark variant.

---

## Do not

- Do not introduce a router, Redux, or any state-management library — the app's single-page nature is deliberate and the controller is wired by direct DOM IDs.
- Do not add backend calls or API keys — the Google Sheets CSV is the only network fetch and it is read-only.
- Do not switch the test runner to Jest / Vitest — `draftStorage.test.js` uses `node:test` and runs directly under Node.
- Do not change `vite.config.js#base` without updating the GitHub Pages URL expectations and any hard-coded asset links.
