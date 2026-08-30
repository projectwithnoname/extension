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

### Authentication (`src/shared/auth.ts`, `src/background/auth.ts`)

**The extension contains no login UI and no login logic.** Signing in means opening a tab on the website, which owns the entire Auth0 flow:

```
Shared view "Sign in" button
  → useAuth().signIn() → chrome.runtime.sendMessage({ type: "AUTH_SIGN_IN" })
    → background/auth.ts startSignIn(): chrome.tabs.create(`${WEBSITE_ORIGIN}/sign-in`)
      → …website does Auth0 login + email verification…
        → website calls chrome.runtime.sendMessage(EXTENSION_ID, { type: "AUTH_TOKEN", … })
          → onMessageExternal → handleToken() writes authState + authAccessToken
            → chrome.storage.onChanged → AuthProvider re-renders the panel
```

Auth reuses the storage-broadcast pattern above: the website's tab writes storage, and every context picks it up on `onChanged`. That is the *only* path from sign-in to the panel — there is no messaging between the tab and the panel.

- **`src/shared/auth.ts`** — the contract shared with the website: `WEBSITE_ORIGIN`, `AUTH0_ORIGIN`, `LOGOUT_URL`, `AuthUser`, `AuthState` (`unknown | signed-out | signed-in`), the storage keys `AUTH_STATE_KEY` / `ACCESS_TOKEN_KEY`, `AuthRequest`, `AuthTokenMessage`, and the `isAuthTokenMessage()` type guard. `WEBSITE_ORIGIN` must stay in sync with `externally_connectable.matches` in `public/manifest.json`, and `AUTH0_ORIGIN` with the website's `AUTH0_DOMAIN`.
- **`src/shared/external.ts`** — the other half of the website contract: the `PING` message, its `PingResponse`, and the `isPingMessage()` guard. A web page cannot see an installed extension, so `onMessageExternal` answers a `PING` with `{ ok: true, version }` — the reply arriving at all is the whole signal. That branch needs no `sender.origin` check (only origins in `externally_connectable.matches` can send, and the version is not a secret) and must stay synchronous: returning `true` would hold a channel open for a reply already sent.
- **`src/background/auth.ts`** — the only writer of auth storage: `readAuthState`, `getAccessToken`, `startSignIn`, `handleToken`, `signOut`.
- **`handleToken` checks `sender.origin` against `WEBSITE_ORIGIN`** and returns `false` otherwise. This is the trust boundary — any page can attempt an external message. Keep the check first, before touching storage.
- **`status: "unknown"`** is the pre-read state, not an error. Render a placeholder for it; treating it as signed-out flashes the sign-in prompt on every panel open.

The `key` field in `public/manifest.json` pins the extension ID across reinstalls, which is what keeps the website's `EXTENSION_ID` valid. **Do not regenerate or remove it** — a new ID silently breaks the handoff.

`signOut()` is a full sign-out, in three steps: it clears local storage (so the panel flips immediately), then opens the website's `/auth/logout` in a background tab and closes it once the redirect chain lands back on `WEBSITE_ORIGIN`, then removes any cookie left on `WEBSITE_ORIGIN` or `AUTH0_ORIGIN`. All three matter — clearing storage alone leaves the website session cookie and Auth0's SSO cookie alive, and either one signs the user back in with no prompt. The cookie sweep is the fallback for when the website is unreachable and the round-trip does nothing; it needs the `cookies` permission in `public/manifest.json`.

The stored token is a 30-day HMAC minted by the website. Nothing refreshes or validates it yet, and no request currently sends it — `getAccessToken()` exists for the sync backend that doesn't exist.

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

The primary UI (replaces the old popup), opened from the toolbar action and declared in `manifest.json` as `side_panel.default_path`. Three tabs, keyed by `ViewId` (`src/shared/types.ts`): **Page** (highlights for the active tab), **Tree** (grouped per domain), **Shared** (account + sync, the only auth surface in the extension).

- **`main.tsx`** — Mounts `<SidePanel />` into `#root`.
- **`SidePanel.tsx`** — View shell: the `views` registry (`page` / `shared` / `tree`), `activeView` state, and the provider stack `ThemeProvider > AuthProvider > HighlightsProvider > FilterProvider` wrapping `Header` + the active view.
- **`context/HighlightsContext.tsx`** + **`hooks/useHighlights.ts`** — The store. Mirrors `chrome.storage.local["highlights"]`, subscribes to `onChanged`, and exposes `highlights`, `loading`, `updateHighlight`, `updateNote`, `deleteHighlight`. Mutators only send messages (via `messaging.ts`); `onChanged` is what updates local state, so there is one write path and no drift. Read-only consumers use the `useHighlights()` hook.
- **`context/AuthContext.tsx`** + **`hooks/useAuth.ts`** — Same shape for auth: mirrors `chrome.storage.local["authState"]`, subscribes to `onChanged`, exposes `state`, `signIn`, `signOut`. Both mutators only post `AuthRequest` messages to the background — the panel never writes auth storage and never touches Auth0.
- **`views/Shared.tsx`** — Renders on `state.status`: a blank `aria-busy` placeholder for `unknown`, the sign-in prompt for `signed-out`, and the account header (avatar, name, email, sign-out) for `signed-in`. Shared-highlight content is still a stub.
- **`components/header/Header.tsx`** — Tab bar.
- **`ARCHITECTURE.md`** — Design blueprint/intent for the full side panel (scoping, tree grouping, theming, sync) ahead of the current implementation. **`SYNC_IMPLEMENTATION_PLAN.md`** — sync plan notes.

> The panel never builds a create payload (`location.href` would be the panel doc, not the user's page). It only updates/deletes existing highlights. For "current page" scope, use `chrome.tabs.query` rather than `location.href`.

### Options page (`src/options/`)

`Options.tsx` mounted by `main.tsx` into `options.html`; declared as `options_page` in the manifest.

### Shared (`src/shared/`)

- **`types.ts`** — `HighlightStyle` and the `Highlight` interface `{ id, text, timestamp, url, context, color, style?, note? }`.
- **`messaging.ts`** — typed message contract + senders (see above).
- **`auth.ts`** — auth contract shared with the *website*, not just with other contexts (see above). Changing it means changing the website too.
- **`utils.ts`** — `normalizeUrl()` (scopes highlights to a page; can throw on non-URL strings — guard when grouping/filtering).
- **`storage.ts`** — exports `storageString` key. **`constants.ts`** — currently empty.
- **`components/`** — reusable UI: `Button`, `Icon` (inlines `public/icons/*.svg` via `import.meta.glob(... ?raw)` since the IIFE content script can't fetch files at runtime), `Tooltip`.
- **`styles/`** — `index.scss` aggregates `_tokens.scss` (CSS custom-property palette under `:root, :host`), `_fonts.scss`, `_reset.scss`.

### Styling

Each context has its own `styles.scss`; component styles live next to components as `Styles.scss`. Shadow DOM isolation means content-script styles are self-contained (tokens are declared on `:host` as well as `:root` so they cross the shadow boundary); side panel and options styles are scoped to their own HTML pages.

**Sizes are in `px`. Never write `rem` in a component stylesheet.**

```scss
.thing {
  padding: 8px;   // not 0.5rem
  gap: 4px;
}
```

Shadow DOM isolates selectors and inherited properties, but it does **not** rebase `rem` — a shadow root is not a new root element, so `rem` always resolves against the *host page's* `<html>` font-size. A site using the common `html { font-size: 62.5% }` would render the content-script toolbar at 62.5% scale. `px` is absolute and has no such relationship, so it is immune by construction.

The one exception is the **type scale** in `_tokens.scss`, which stays proportional so the side panel still honours the user's browser font-size preference. It goes through the `rem()` helper in `src/shared/styles/_units.scss`, which expands `rem(0.875)` to `calc(0.875 * var(--root-font-size))`. `--root-font-size` is `1rem` on the panel/options pages and pinned to `16px` on `:host` in the content script.

Two gotchas if you ever touch the scale:

- Inside a **custom-property** value Sass does not evaluate functions, so interpolate: `--token: #{rem(0.875)}`.
- A custom property containing `var()` is resolved **where it is declared** and inherits already-resolved. That is why the content script pins `--root-font-size` on `:host` (the same element `_tokens.scss` declares the scale on) rather than on `#extension-root` — pinning on a descendant leaves every `font:` token page-relative.

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
