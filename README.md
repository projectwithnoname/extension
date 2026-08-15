# Highlighter — Chrome Extension

Select text on any page and highlight it. Add notes, pick colors, and see all
your highlights in the side panel. 

Highlighting works on its own. Signing in and everything built on top of it —
the **Shared** tab, syncing, sharing — is owned by the companion **website**
project ([repo](https://github.com/projectwithnoname/website)), which has to be running for any of it to work.
See [Sign-in and sharing](#sign-in-and-sharing) below.

## Run it

```bash
npm install
npm run dev     # rebuilds into dist/ on every change
```

Then in Chrome: `chrome://extensions` → enable Developer mode → **Load
unpacked** → pick the `dist/` folder. After a rebuild, hit reload on the card.

## Sign-in and sharing

The extension has no login UI and no login logic. "Sign in" in the **Shared**
tab just opens a tab on the website; the website runs the whole Auth0 flow and
hands a token back to the extension once the account's email is verified. With
the website down, the Shared tab never gets past its sign-in prompt.

So to work on anything behind a sign-in, run the website too:

```bash
# in the website repo — https://github.com/projectwithnoname/website
npm install
npm run dev     # must be http://localhost:3000
```

That origin is hardcoded in two places that have to agree: `WEBSITE_ORIGIN` in
[src/shared/auth.ts](src/shared/auth.ts) and `externally_connectable.matches` in
[public/manifest.json](public/manifest.json). Pointing the extension at a
different website means changing both.

The website needs this extension's ID in its own `.env.local` (`EXTENSION_ID`),
which is why the `key` field in [public/manifest.json](public/manifest.json)
pins the ID across reinstalls. don't remove it.

## Other commands

```bash
npm run build   # production build
npm run test    # unit + e2e
npm run fix     # format + lint
```
