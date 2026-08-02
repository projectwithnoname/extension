# Highlighter — Chrome Extension

Select text on any page and highlight it. Add notes, pick colors, and see all
your highlights in the side panel. Everything is saved locally.

## Run it

```bash
npm install
npm run dev     # rebuilds into dist/ on every change
```

Then in Chrome: `chrome://extensions` → enable Developer mode → **Load
unpacked** → pick the `dist/` folder. After a rebuild, hit reload on the card.

## Other commands

```bash
npm run build   # production build
npm run test    # unit + e2e
npm run fix     # format + lint
```
