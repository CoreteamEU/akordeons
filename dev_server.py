#!/usr/bin/env python3
"""
Local dev server for the Akordeons static site.

Serves Build/ on http://localhost:8080 and automatically bumps the
cache-busting version whenever any other file under Build/ changes on
disk, so edits to content/CSS/JS/HTML show up on the next browser reload
without a manual version bump.

Every page/script/stylesheet reference is a plain, static tag with
?v=<version> baked directly into its href/src - not injected by JS at
request time. That's deliberate: a static tag is visible to the browser's
preload scanner and can be fetched in parallel with everything else,
whereas injecting the query string via document.write (the previous
approach) is invisible to the preload scanner and forces every resource
to load strictly one at a time. Since nothing rewrites the version at
request time anymore, this script rewrites it at edit time instead,
across every Build/*.html file plus Build/js/version.js itself.
"""
import functools
import http.server
import pathlib
import re
import threading
import time

ROOT = pathlib.Path(__file__).resolve().parent
BUILD = ROOT / "Build"
VERSION_JS = (BUILD / "js" / "version.js").resolve()
PORT = 8080
POLL_INTERVAL_SECONDS = 1.0
VERSION_QUERY_RE = re.compile(r"\?v=\d+")


def bump_version():
    version = str(int(time.time()))
    VERSION_JS.write_text(
        "/**\n"
        " * Single version constant - update this one value to bust cache\n"
        " * Used by language.js/mp3-player.js when fetching JSON content.\n"
        " * The ?v= query strings on <link>/<script> tags in the HTML files\n"
        " * are a separate copy of this same value, kept in sync below.\n"
        " *\n"
        " * Auto-updated by dev_server.py whenever a file under Build/ changes.\n"
        " */\n"
        f"window.APP_VERSION = '{version}';\n"
    )
    for html_file in BUILD.glob("*.html"):
        text = html_file.read_text()
        new_text = VERSION_QUERY_RE.sub(f"?v={version}", text)
        if new_text != text:
            html_file.write_text(new_text)
    print(f"[dev_server] Build/ changed -> version={version}")


def snapshot():
    # Excludes version.js and the HTML files themselves, since
    # bump_version() writes to all of them - without this exclusion the
    # watcher would see its own writes as a new change and bump forever.
    written_files = {VERSION_JS} | {p.resolve() for p in BUILD.glob("*.html")}
    state = {}
    for path in BUILD.rglob("*"):
        if path.is_file() and path.resolve() not in written_files:
            try:
                state[path] = path.stat().st_mtime_ns
            except FileNotFoundError:
                continue
    return state


def watch_loop():
    last = snapshot()
    while True:
        time.sleep(POLL_INTERVAL_SECONDS)
        current = snapshot()
        if current != last:
            bump_version()
            last = current


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(BUILD))
    with http.server.ThreadingHTTPServer(("", PORT), handler) as httpd:
        print(f"[dev_server] Serving {BUILD} at http://localhost:{PORT}")
        httpd.serve_forever()


def main():
    bump_version()  # fresh version on every server start too
    threading.Thread(target=watch_loop, daemon=True).start()
    serve()


if __name__ == "__main__":
    main()
