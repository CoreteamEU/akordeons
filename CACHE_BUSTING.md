# Cache Busting Guide

To prevent browser caching during development, this site uses a single version constant approach.

## How it works

1. **Meta tags**: All HTML files include meta tags that prevent caching:
   - `Cache-Control: no-cache, no-store, must-revalidate`
   - `Pragma: no-cache`
   - `Expires: 0`

2. **Single version constant**: One file (`js/version.js`) defines the version:
   - `window.APP_VERSION = '1.0.0'`
   - All CSS and JS files automatically get this version appended as a query parameter
   - JSON files loaded via fetch also use this version

3. **Automatic application**: A script in each HTML file automatically:
   - Adds version parameters to all CSS `<link>` tags
   - Adds version parameters to all JS `<script>` tags
   - Works for both static and dynamically loaded resources

## Updating the version

**This is now automatic during local development.** Run `python3 dev_server.py`
(instead of `python3 -m http.server`) to serve `build/` — it watches every file under
`build/` (except `js/version.js` itself) and rewrites `window.APP_VERSION` to a fresh
timestamp whenever anything changes. Just save your edit and reload the browser; no
manual step needed. See `dev_server.py` at the repo root and the "Testing locally"
section of `CLAUDE.md`.

If you ever need to bump it by hand (e.g. running a plain `http.server` without the
watcher, or preparing a production deploy), edit `build/js/version.js` directly:

```javascript
window.APP_VERSION = '1.0.1';
```

That's it! All HTML pages and JavaScript files will automatically use the new version.

## How it works technically

1. `version.js` is loaded first in the `<head>` of each HTML file
2. An inline script runs that:
   - Waits for DOM to load
   - Finds all CSS and JS resources
   - Appends `?v={version}` to their URLs
3. JavaScript files use `window.APP_VERSION` when fetching JSON data

## Benefits

- ✅ Only one file to update
- ✅ No need to manually update multiple HTML files
- ✅ Consistent version across all resources
- ✅ Works for both static and dynamic resources
- ✅ Fallback to timestamp if version.js fails to load

## For production

In production, you may want to:
- Remove the cache-prevention meta tags
- Use a proper versioning system (e.g., from package.json)
- Or use a build tool that automatically handles cache-busting

