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
import json
import os
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
TRACKS_VAR_RE = re.compile(r'(id="playlist-([a-z_]+)"[^>]*?--tracks:)\d+')


def sync_playlist_track_counts(text):
    """Keep each playlist container's --tracks in sync with its JSON.

    The .playlist-slot CSS reserves the player's eventual height from this
    number so filling the container doesn't shift the page (see
    css/player.css). If it drifts out of sync with the actual track count
    the reservation is wrong and the layout shift silently comes back, so
    it's derived here rather than maintained by hand.
    """
    def replace(match):
        playlist_id = match.group(2)
        json_path = BUILD / "data" / f"{playlist_id}.json"
        try:
            count = len(json.loads(json_path.read_text())["tracks"])
        except (OSError, ValueError, KeyError):
            return match.group(0)  # leave as-is if the JSON isn't readable
        return f"{match.group(1)}{count}"

    return TRACKS_VAR_RE.sub(replace, text)


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
        new_text = sync_playlist_track_counts(new_text)
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


class RangeRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Adds single-range `Range: bytes=` support, which GitHub Pages has and
    SimpleHTTPRequestHandler lacks; without it browsers can't seek audio."""

    range = None

    def send_head(self):
        self.range = None
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range", "").strip())
        path = self.translate_path(self.path)
        if not match or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        start_s, end_s = match.groups()
        if start_s:
            start, end = int(start_s), int(end_s) if end_s else size - 1
        elif end_s:
            start, end = max(0, size - int(end_s)), size - 1
        else:
            return super().send_head()
        end = min(end, size - 1)
        if start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None
        f = open(path, "rb")
        f.seek(start)
        self.range = end - start + 1
        self.send_response(206)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self.range))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        if self.range is None:
            return super().copyfile(source, outputfile)
        remaining = self.range
        while remaining > 0:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)


def serve():
    handler = functools.partial(RangeRequestHandler, directory=str(BUILD))
    with http.server.ThreadingHTTPServer(("", PORT), handler) as httpd:
        print(f"[dev_server] Serving {BUILD} at http://localhost:{PORT}")
        httpd.serve_forever()


def main():
    bump_version()  # fresh version on every server start too
    threading.Thread(target=watch_loop, daemon=True).start()
    serve()


if __name__ == "__main__":
    main()
