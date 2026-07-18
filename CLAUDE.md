# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Watch mode for both builds in parallel (use during development)
npm run build          # Production build (runs both Vite configs sequentially)

npm run lint           # ESLint check
npm run lint:fix       # ESLint with --fix
npm run format         # Prettier write over src/**/*.{ts,tsx,scss}
npm run format:check   # Prettier check only
npm run check          # format:check + lint
npm run fix            # format + lint:fix

npm run test           # Unit (vitest) then e2e (playwright)
npm run test:unit      # vitest run (tests/unit/**/*.test.ts)
npm run test:unit:watch
npm run test:e2e       # playwright (tests/e2e/**/*.spec.ts)
npm run test:e2e:ui
```

After any build, load/reload the unpacked extension from `dist/` in Chrome (`chrome://extensions` → Load unpacked).

## Architecture

This is a **Manifest V3 Chrome Extension** with four isolated execution contexts: **content script**, **background service worker**, **side panel**, and **options page**. Two separate Vite configs are required because the content script must be bundled as an IIFE while the rest uses ES modules.

### Build outputs (`dist/`)

| File | Vite config | Format | Source |
|------|-------------|--------|--------|
| `sidepanel.js` / `options.js` / `background.js` | `vite.config.ts` | ES module | `sidepanel.html`, `options.html`, `src/background/serviceWorker.ts` |
| `content.js` | `vite.content.config.ts` | IIFE | `src/content/main.tsx` |

The content config sets `emptyOutDir: false` to avoid wiping the main build output, bundles React/ReactDOM inline (an IIFE can't be code-split), and uses an inline sourcemap so DevTools maps the injected script back to source.

### Single source of truth + realtime sync

Everything revolves around `chrome.storage.local["highlights"]` — an array of [`Highlight`](src/shared/types.ts) objects. The **background service worker is the only writer**; content, side panel, and options are readers that send messages to mutate. Because `chrome.storage.onChanged` broadcasts to every extension context, two-way sync is free: each context (a) writes only through the background and (b) re-reads on the change event. No direct panel↔content messaging is needed.

### Messaging layer (`src/shared/messaging.ts`)

Central, typed message contract shared by all contexts. Defines `ExtensionMessage`, the payload types, `buildCreatePayload()`, and the senders `sendCreate`, `sendUpdateHighlight`, `sendUpdateNote`, `sendDelete`. Background message types (`src/background/serviceWorker.ts`): `ACTION_CLICKED` (create), `UPDATE_HIGHLIGHT` (recolor/restyle), `UPDATE_NOTE` (note text), `DELETE_HIGHLIGHT`. The service worker also calls `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`.

### Execution flow

```
User selects text on page
  → content/inject.ts (mouseup listener)
    → setupHighlighter raises Toolbar.tsx (floating toolbar)
      → user clicks "Highlight" (or picks a color/style, adds a note, etc.)
        → inject.ts: higlightSelectedText(color, style) wraps the selection in
          <span data-highlight-id> styled by buildHighlightCss() (background fill or
          colored text-decoration)
        → messaging.ts sendCreate(...) → chrome.runtime.sendMessage("ACTION_CLICKED")
          → background/serviceWorker.ts appends to chrome.storage.local["highlights"]
            → chrome.storage.onChanged fires in EVERY context:
               • side panel list re-renders
               • content script reconciles the in-page DOM (setupStorageSync)
            → on later page loads, inject.ts loadPageHighlights() re-wraps via stored context
```

### Content script (`src/content/`)

Mounts React into a **closed Shadow DOM** to prevent style leakage from host pages. Highlights themselves live in the host page DOM (outside the shadow root) as inline-styled `<span data-highlight-id>` wrappers.

- **`inject.ts`** — All DOM/selection logic (no React). Module-level globals like `lastRange` (frozen clone of the selection). `buildHighlightCss(color, style)` is the single source of truth for how a highlight renders. Exports include `setupHighlighter`, `higlightSelectedText`, `highlightWithNote`, `restyleHighlight`, `markHighlightHasNote`, `removeHighlight`, `reapplyHighlight`, `loadPageHighlights`, `setupStorageSync`, `setupNoteHover`, `clearSelectionState`, `getSelectedHighlightId`. `setupStorageSync` subscribes to `chrome.storage.onChanged` and reconciles the page DOM with edits made elsewhere (e.g. the side panel).
- **`main.tsx`** — Creates `<div id="my-extension-root">`, attaches the closed Shadow DOM, injects `styles.scss?inline`, mounts `HighlighterRoot`, and sends all `chrome.runtime` messages via `messaging.ts`. Composes the hooks below.
- **`hooks/`** — `useToolbar` (floating toolbar state + setupHighlighter subscription), `useHighlightNotes` (per-page notes map, initial load, and the setupStorageSync subscription), `useNoteViewer` (hover popover state + setupNoteHover), `useLatestRef` (ref that mirrors latest value for once-registered listeners). Order matters: `useNoteViewer` before `useToolbar` (a fresh selection closes the viewer; the two popovers never coexist).
- **`Toolbar.tsx`** — Floating toolbar: Highlight / Change Color / Add Note / Delete. Nested highlights are prevented — when a selection overlaps an existing highlight the Highlight button is hidden and the palette/note act on that whole highlight instead.
- **`palette/Palette.tsx`** + **`palette/paletteOptions.ts`** — Color + style picker (8 colors; styles `default | underline | wave | strike`). Constants live in the `.ts` file so the `.tsx` only exports a component (fast-refresh lint rule).
- **`note/Note.tsx`** / **`note/NoteViewer.tsx`** — Note editor (in the toolbar) and the hover popover shown over a highlight that has a note.

### Side panel (`src/sidepanel/`)

The primary UI (replaces the old popup), opened from the toolbar action and declared in `manifest.json` as `side_panel.default_path`. Three tabs are planned — **Content** (per-page/domain/all highlight list), **Tree** (highlights grouped per domain), **Collaborate** (stub, needs accounts/sync backend). Currently `Content`/`Tree`/`Collaborate` are placeholders and `SidePanel.tsx` also renders a temporary flat `HighlightList` scaffold.

- **`main.tsx`** — Mounts `<SidePanel />` into `#root`.
- **`SidePanel.tsx`** — View shell: `contentViews` tab registry, `activeView` state, renders `Header` + the active view inside `<HighlightsProvider>`.
- **`context/HighlightsContext.tsx`** + **`context/useHighlights.ts`** — The store. Mirrors `chrome.storage.local["highlights"]`, subscribes to `onChanged`, and exposes `highlights`, `loading`, `updateHighlight`, `updateNote`, `deleteHighlight`. Mutators only send messages (via `messaging.ts`); `onChanged` is what updates local state, so there is one write path and no drift. Read-only consumers use the `useHighlights()` hook.
- **`components/header/Header.tsx`** — Tab bar.
- **`ARCHITECTURE.md`** — Design blueprint/intent for the full side panel (scoping, tree grouping, theming, sync) ahead of the current implementation. **`SYNC_IMPLEMENTATION_PLAN.md`** — sync plan notes.

> The panel never builds a create payload (`location.href` would be the panel doc, not the user's page). It only updates/deletes existing highlights. For "current page" scope, use `chrome.tabs.query` rather than `location.href`.

### Options page (`src/options/`)

`Options.tsx` mounted by `main.tsx` into `options.html`; declared as `options_page` in the manifest.

### Shared (`src/shared/`)

- **`types.ts`** — `HighlightStyle` and the `Highlight` interface `{ id, text, timestamp, url, context, color, style?, note? }`.
- **`messaging.ts`** — typed message contract + senders (see above).
- **`utils.ts`** — `normalizeUrl()` (scopes highlights to a page; can throw on non-URL strings — guard when grouping/filtering).
- **`storage.ts`** — exports `storageString` key. **`constants.ts`** — currently empty.
- **`components/`** — reusable UI: `Button`, `Icon` (inlines `public/icons/*.svg` via `import.meta.glob(... ?raw)` since the IIFE content script can't fetch files at runtime), `Tooltip`.
- **`styles/`** — `index.scss` aggregates `_tokens.scss` (CSS custom-property palette under `:root, :host`), `_fonts.scss`, `_reset.scss`.

### Styling

Each context has its own `styles.scss`; component styles live next to components as `Styles.scss`. Shadow DOM isolation means content-script styles are self-contained (tokens are declared on `:host` as well as `:root` so they cross the shadow boundary); side panel and options styles are scoped to their own HTML pages.

### Tests

- **Unit** — `tests/unit/**/*.test.ts` via vitest (`vitest.config.ts`, node environment).
- **E2E** — `tests/e2e/**/*.spec.ts` via Playwright (`playwright.config.ts`).

## Code Style

**Braces and if statements** — always open the brace on a new line, never inline. This applies even to single-expression returns:

```ts
// correct
if (condition)
{
  return value;
}

// wrong
if (condition) { return value; }
if (condition) return value;
```

**Iterators and callbacks** — always use descriptive parameter names, never single letters:

```ts
// correct
highlights.map(highlight => highlight.text)
items.forEach(item => item.prop)

// wrong
highlights.map(h => h.text)
items.forEach(x => x.prop)
```
