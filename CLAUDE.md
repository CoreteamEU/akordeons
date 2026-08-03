# CLAUDE.md

Rules for working on this repo. Source of intent: `plan.md` (gitignored, local-only — read it directly, don't rely on a summary).

## What this is

Static migration of the dynamic site `akordeons.lv` (accordionist Evita Dūra) to a
static HTML/CSS/JS site hosted on GitHub Pages. No server-side framework, no build
step, no JS framework — vanilla JS only, Bootstrap is the sole permitted 3rd-party
dependency and only if actually needed (not currently used).

Deployed output lives entirely in **`Build/`** (capitalized — that's the name git
tracks). The filesystem here is case-insensitive (APFS), so `build/` and `Build/`
resolve to the same directory on disk; always use the `Build/` casing in commands
and paths to match what git tracks. GitHub Pages serves this folder directly.

Dev URL target: `https://coreteameu.github.io/akordeons/`.

## Site structure

- `Build/index.html` — home page, doubles as the music/playlists page (MP3 players)
- `Build/about.html`, `Build/videos.html`, `Build/contact.html`
- `Build/css/colors.css` — all color variables, WCAG 2.1 AA target, kept separate from `main.css` on purpose
- `Build/css/main.css`, `Build/css/player.css`
- `Build/js/version.js` — single cache-busting version constant, loaded first in every page's `<head>`
- `Build/js/language.js` — `LanguageManager`: loads `data/content-{lang}.json`, applies text to any element with `data-i18n="dot.path.key"` (or `data-i18n-html` for innerHTML), persists choice in `localStorage`
- `Build/js/dark-mode.js` — auto (prefers-color-scheme) + manual toggle, persisted
- `Build/js/mp3-player.js` — `MP3Player` class, one instance per playlist container
- `Build/js/analytics.js`, `Build/js/main.js`
- `Build/data/content-{lv,ru,en}.json` — all page text, keyed by section, one file per language. **lv is default and required; ru/en are optional/partial.**
- `Build/data/{playlistId}.json` — one file per playlist (`solo`, `duets`, `kvartets_undertango`, `duo_violinist`, `undertango_live`, `undertango_collaborations`), each track has `filename`, `title`, `duration.{minutes,seconds}`
- `Build/data/videos.json` — YouTube embeds metadata
- `Build/mp3/{playlistId}/*.mp3` — audio files matching the playlist JSON `filename` fields
- `Build/sitemap.xml`, `Build/robots.txt`, `Build/feed.rss`

## Hard rules (from plan.md — don't relax these)

- **All new file/folder names must be ASCII-only, no spaces.** Replace spaces with `_`. (Note: some legacy files under `Build/mp3/` still have spaces/parens from the old site crawl — don't propagate that pattern to new files, but don't feel obligated to mass-rename existing ones without being asked.)
- **All links must be relative to site root** — no absolute URLs to the site's own pages/assets.
- **Text content only comes from the JSON files**, never hardcoded in HTML/JS, except as a fallback/placeholder value already baked into the markup.
- Color scheme lives only in `Build/css/colors.css`, as CSS variables. Don't hardcode colors in `main.css`/`player.css`.
- No caching during development: the cache-control meta tags and `version.js` query-param busting in every HTML `<head>` are intentional — don't remove them without being asked.
- Comment code only where the *why* isn't obvious (matches the general project convention, and plan.md explicitly asks for comments "where it makes sense" — not everywhere).
- Each implementation step should be small, testable, and land as its own commit reviewed by the user manually — don't bundle unrelated changes.
- **Never translate or transliterate "Evita Dūra"** (the accordionist's name) in any language's content JSON — it stays in Latin script exactly as written, even in `content-ru.json`. "Эвита Дуура" is wrong. This applies to the standalone first name "Evita" too, not just the full "Evita Dūra".

## MP3 player localization (fixed — pattern to keep following)

`Build/js/mp3-player.js` builds its player chrome (title, description, button
`aria-label`s, "Error loading audio" text) from `content-{lang}.json`'s `player.*`
keys and the playlist JSON's `title`/`description`, both of which are per-language
objects: `{ "lv": "...", "ru": "...", "en": "..." }`, selected via
`languageManager.currentLanguage`. `LanguageManager.loadContent()` (in `language.js`)
dispatches a `window` `languagechange` event after it loads new content; `MP3Player`
listens for that and calls `applyLocalization()` on every instance to update the
already-rendered DOM in place (title/description/aria-labels only — it never touches
`audio.src` or playback state, so language switches don't interrupt a playing track).

Track `title` fields inside playlist JSON are intentionally left as plain strings
(they're song/file names, not UI text) — don't wrap those in `{lv,ru,en}`.

Keep following this pattern for any new dynamically-rendered UI text: route it through
`content-{lang}.json` (or a per-language field in the relevant data JSON) and
`languageManager`, and hook `languagechange` for anything rendered before content
loads or that needs to update live — never hardcode user-facing strings in JS.

## Data-loss caution for this repo

This repo has previously had entire tracked files silently truncated to ~0 bytes on
disk while `git status` still showed them as merely "modified" (the diff was 100%
deletions). Before editing any file that looks suspiciously short/empty for what it's
supposed to contain, run `git diff HEAD -- <path>` first — if the diff is all deletions
with no additions, stop and flag it rather than building on top of an empty file.

## Testing locally

No build step — it's plain static files, so "testing" means serving `Build/` and
exercising it in a browser.

Start the local dev server (already wired up as the VS Code default task in
`.vscode/tasks.json`, as the command in `.claude/launch.json`, or run directly):

```bash
python3 dev_server.py
```

This serves `Build/` at `http://localhost:8080/` **and** watches every file under
`Build/` (polling every second) except `js/version.js` itself — any change auto-bumps
`window.APP_VERSION` to a fresh timestamp, so edits to content/CSS/JS/HTML show up on
the next browser reload with no manual cache-busting step. (`.vscode/launch.json` also
has a "Launch Chrome against localhost" debug config that runs this task automatically.)
`dev_server.py` is gitignored (matches the existing `*.py` pattern for `crawl_site.py`/
`organize_mp3.py`) — it's local dev tooling, not deployed and not currently tracked in
git; if that's ever a problem (e.g. a fresh clone/session needs it), it'll need an
explicit `.gitignore` exception.

Plain `file://` opens will NOT work correctly — the site loads content via `fetch()`
(the `content-*.json`, playlist JSON, `videos.json`), which is blocked by CORS on
`file://`. Always test through the HTTP server.

Per plan.md, before treating a change as done, manually check:
- All pages load with no console errors
- Language switching (LV/RU/EN) updates visible text on the current page
- Dark mode: both automatic (OS-level `prefers-color-scheme`) and the manual toggle, and that the choice persists on reload
- MP3 players: play, pause, stop, volume, auto-advance to next track, and that starting one player stops any other currently playing
- YouTube embeds load and play
- Responsive layout at a mobile viewport width (~375px) — including the hamburger nav menu
- Every link on the page is relative and resolves correctly
- Analytics script loads without error (can't verify tracking hits without access to the analytics dashboard)

There is no automated test suite — all verification above is manual, in-browser.
