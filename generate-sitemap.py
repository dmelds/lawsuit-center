#!/usr/bin/env python3
"""
Generate sitemap.xml for lawsuit.center.
- Extensionless URLs to match canonicals (homepage = "/").
- Includes the /es/ Spanish directory (es/thank-you excluded via basename + noindex).
- Excludes the JS-fetched footer fragment, noindex pages, thank-you/utility pages,
  and any URL that 301-redirects to a different slug.
- lastmod from each file's last git commit date, ignoring commits marked
  SKIP_TOKEN (falls back to file mtime, then today).
Runs in CI (GitHub Actions), where full git history is available.
"""

import os
import re
import glob
import subprocess
from datetime import date, datetime, timezone

BASE = "https://lawsuit.center"

# Commits whose message contains this token are ignored when computing
# <lastmod>, so mechanical site-wide sweeps don't flatten every date to the
# same day. Usage: git commit -m "Add GA4 snippet [skip lastmod] [skip actions]"
SKIP_TOKEN = "[skip lastmod]"

# Commits to ignore for <lastmod> even though their message lacks SKIP_TOKEN.
# One full or abbreviated SHA per line in lastmod-skip-commits.txt at the repo
# root; blank lines and lines starting with # are ignored. For a mechanical
# change that went up without the token (a GitHub web upload keeps its default
# "Add files via upload" message), add the upload commit here and re-run the
# generator rather than rewriting history. Ported from Informer 2026-11-04,
# after three schema-only uploads stamped four pages with that day's date.
SKIP_COMMITS_FILE = "lastmod-skip-commits.txt"


def skip_commits():
    try:
        with open(SKIP_COMMITS_FILE, encoding="utf-8") as fh:
            return [ln.strip() for ln in fh
                    if ln.strip() and not ln.lstrip().startswith("#")]
    except OSError:
        return []

# Never list these: footer is a fetch() fragment; the rest are noindex/utility.
EXCLUDE_FILES = {
    "footer.html",          # injected via fetch('/footer.html') — must stay a 200 fragment, not a page
    "search.html",          # noindex search UI
    "thank-you.html",
    "thank-you-asbestos-review.html",
    "thank-you-truck-accident-review.html",
    "404.html",
    # Removed as Lawsuit Informer duplicates (June 23, 2026); now 301 -> /asbestos-lawsuits
    "asbestos-exposure-in-power-plants-and-refineries.html",
    "asbestos-exposure-in-shipyards-and-naval-service.html",
}


def slug_for(filename):
    s = re.sub(r"\.html?$", "", filename).strip("/")
    return "" if s == "index" else s


def is_noindex(path):
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            return bool(re.search(r'name=["\']robots["\'][^>]*noindex', f.read(), re.I))
    except OSError:
        return False


def redirected_away():
    """Slugs that 301 to a DIFFERENT slug — never list these (here: none, redirects are .html->same slug)."""
    away = set()
    if not os.path.exists("_redirects"):
        return away
    with open("_redirects", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            if len(parts) >= 3 and not parts[1].startswith("http"):
                a = re.sub(r"\.html?$", "", parts[0].split("?")[0].strip("/"))
                b = re.sub(r"\.html?$", "", parts[1].split("?")[0].strip("/"))
                if a and a != b:
                    away.add(a)
    return away


def git_lastmod(path):
    # --no-merges is load-bearing. A merge commit's message never carries
    # SKIP_TOKEN, so without it the PR merge that lands a mechanical sweep is
    # reported as the file's last change and the skip token is bypassed for
    # every file the merge was not TREESAME to a parent on.
    # The first pass drops token commits and listed SHAs; the second pass, used
    # only when every commit was skipped, takes the newest commit of any kind.
    skipped = skip_commits()
    try:
        for extra in (["-F", f"--grep={SKIP_TOKEN}", "--invert-grep"], []):
            out = subprocess.run(
                ["git", "log", "--no-merges", "--format=%H %cs", *extra, "--", path],
                capture_output=True, text=True, check=True,
            ).stdout
            for line in out.splitlines():
                sha, _, d = line.partition(" ")
                if extra and any(sha.startswith(x) for x in skipped):
                    continue
                if d:
                    return d
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    try:
        return datetime.fromtimestamp(os.path.getmtime(path), timezone.utc).strftime("%Y-%m-%d")
    except OSError:
        return date.today().isoformat()


def main():
    away = redirected_away()
    urls = []
    for path in sorted(glob.glob("*.html") + glob.glob("es/*.html")):
        fn = os.path.basename(path)
        if fn in EXCLUDE_FILES or is_noindex(path):
            continue
        slug = slug_for(path)
        if slug in away:
            continue
        loc = f"{BASE}/{slug}" if slug else f"{BASE}/"
        urls.append((loc, git_lastmod(path)))

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for loc, lastmod in urls:
        lines.append(f"  <url><loc>{loc}</loc><lastmod>{lastmod}</lastmod></url>")
    lines.append("</urlset>")

    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Wrote sitemap.xml with {len(urls)} URLs.")


if __name__ == "__main__":
    main()
