# Cache Busting Guide

This site cache-busts every CSS/JS resource with a `?v=<version>` query string,
baked directly into static `<link>`/`<script>` tags in the HTML.

## How it works

1. **Static, versioned tags**: every page's `<head>` and end-of-`<body>` scripts are
   plain tags with the version baked in, e.g. `<link rel="stylesheet"
   href="css/main.css?v=1785931423">`. Nothing injects this at request time - the
   query string is literally sitting in the HTML source. This matters for
   performance: a static tag is visible to the browser's preload scanner and can be
   fetched in parallel with every other resource on the page. An earlier version of
   this mechanism used `document.write()` to inject the version at request time,
   which is invisible to the preload scanner and forces every resource to load
   strictly one at a time - Lighthouse measured that costing ~1.7s of render-blocking
   delay on this site. Don't reintroduce that pattern.
2. **`js/version.js`**: still defines `window.APP_VERSION`, used by `language.js`
   and `mp3-player.js` when `fetch()`-ing JSON content (`content-{lang}.json`,
   playlist files) - those are runtime requests, not static tags, so they read the
   version from this file rather than having it baked in.
3. Both copies of the version - the query strings baked into every `Build/*.html`
   file, and the `window.APP_VERSION` value inside `version.js` - must stay in sync.

## Updating the version

**This is automatic during local development.** Run `python3 dev_server.py` (instead
of `python3 -m http.server`) to serve `Build/` - it watches every file under `Build/`
and, whenever anything changes:
- rewrites `window.APP_VERSION` in `Build/js/version.js` to a fresh timestamp, and
- rewrites every `?v=<old>` query string across all `Build/*.html` files to match.

Just save your edit and reload the browser; no manual step needed. See
`dev_server.py` at the repo root and the "Testing locally" section of `CLAUDE.md`.

If you ever need to bump it by hand (e.g. editing without the watcher running, or
preparing a deploy commit), find-and-replace every `?v=<old-version>` with
`?v=<new-version>` across `Build/*.html`, and update `window.APP_VERSION` in
`Build/js/version.js` to the same value.

## For production

There's no separate production step - whatever version is baked into the HTML/
`version.js` at commit time is what deploys. Since edits happen through a
`dev_server.py` session (which keeps both in sync automatically), a normal commit
already carries a fresh version. GitHub Pages' own CDN still caches every response
for ~10 minutes regardless of this mechanism (fixed platform behavior, not
configurable), but since each deploy's resources live at a new `?v=` URL, that
10-minute window only affects how soon a *given* URL's cache expires, not whether a
new deploy is visible - a new deploy is always a new URL.
