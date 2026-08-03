#!/usr/bin/env python3
"""
Local dev server for the Akordeons static site.

Serves Build/ on http://localhost:8080 and automatically bumps the
cache-busting version constant (Build/js/version.js) whenever any other
file under Build/ changes on disk, so edits to content/CSS/JS/HTML show
up on the next browser reload without a manual version bump.
"""
import functools
import http.server
import pathlib
import threading
import time

ROOT = pathlib.Path(__file__).resolve().parent
BUILD = ROOT / "Build"
VERSION_JS = (BUILD / "js" / "version.js").resolve()
PORT = 8080
POLL_INTERVAL_SECONDS = 1.0


def bump_version():
    version = str(int(time.time()))
    VERSION_JS.write_text(
        "/**\n"
        " * Single version constant - update this one value to bust cache\n"
        " * This file is loaded first and used by all other scripts\n"
        " *\n"
        " * Auto-updated by dev_server.py whenever a file under Build/ changes.\n"
        " */\n"
        f"window.APP_VERSION = '{version}';\n"
    )
    print(f"[dev_server] Build/ changed -> APP_VERSION={version}")


def snapshot():
    state = {}
    for path in BUILD.rglob("*"):
        if path.is_file() and path.resolve() != VERSION_JS:
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
