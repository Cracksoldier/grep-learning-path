# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running locally

No build step. Open `index.html` directly in a browser, or serve it:

```bash
python3 -m http.server 8000
```

## Architecture

Four files, no framework, no bundler:

- **`data.js`** — single source of truth. Defines `stages` as a plain global (no `export`), an array of four objects (beginner → expert). Each stage has `lessons`, `resources`, and `challenges`. All content changes go here.
- **`app.js`** — loaded after `data.js`, uses the `stages` global, renders the page via `innerHTML`, and handles all interactivity via event delegation on `#stages-container`. Progress state lives in a plain object `{ completedLessons: Set, completedChallenges: Set }` synced to `localStorage` (`grep-lp-progress`) on every change.
- **`style.css`** — dark terminal theme using CSS custom properties defined on `:root`. No preprocessor.
- **`index.html`** — static shell. The `#stages-container` div is populated entirely by `app.js` at runtime.

## Key patterns

**Rendering:** `fullRender(container, progress)` wipes and rebuilds `#stages-container` from scratch (used on init and after import). Individual checkbox changes update the DOM in-place without re-rendering.

**Progress bars:** bars are rendered with `width: 0%`, then `updateOverallProgress` / `updateStageProgress` set the real widths inside a `requestAnimationFrame`, triggering the CSS `transition` for the animated fill effect.

**Import/export:** Export serialises the two Sets to JSON arrays. Import validates shape (`Array.isArray` check) before accepting; invalid files get an `alert`.

**Adding content:** add an entry to the relevant `lessons`, `resources`, or `challenges` array in `data.js`. IDs must be unique across the entire dataset (they're used as localStorage keys).
