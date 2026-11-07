#!/usr/bin/env python3
"""Stop the site header from pushing pages wider than the window.

On many pages the header was wider than the window, so the whole page
scrolled sideways. 74 pages carry their own inline CSS and never load
style.css, and most of them only switched to the hamburger menu at 760px, so
from 761px to 1200px they showed the full desktop header, cut off on the
right, with no menu button. Above 1200px, headers that carry the search box,
a long CTA label or the ES/EN toggle also ran past the window edge. This sweep
puts one marker-guarded <style> block just before </head> on every page with
a site header:

  * at 1200px and below every page uses the hamburger menu, and the header
    button and tagline hide, the same as the pages that load style.css;
  * at 480px and below a header that is only the logo and one button gets a
    smaller button;

  * up to 1760px the "attorney-built" tagline and the header search box hide
    (search stays in the hamburger menu, on /search and in the page heroes);
  * up to 1440px the link gaps tighten and the "Start Case Review" text link
    hides, since the amber header button next to it also goes to a case review;
  * up to 1320px the "Home" text link hides too (the logo links home) and the
    gaps tighten further.

The block sits between <!-- LC-HEADER-FIT:BEGIN --> and <!-- LC-HEADER-FIT:END -->.
A page that already carries the current block is left alone; an older version
of the block is replaced in place, so changing CSS below and rerunning updates
every page. Safe to rerun.

Usage
-----
    python3 add_header_fit.py            dry run
    python3 add_header_fit.py --apply    write
"""

import argparse
import os
import re

BEGIN = "<!-- LC-HEADER-FIT:BEGIN -->"
END = "<!-- LC-HEADER-FIT:END -->"
CSS = (
    # Hamburger at 1200px and below on every page. 72 self-contained pages only
    # collapsed at 760px, so tablets and small laptops got the full desktop
    # header, cut off at the right edge, with no menu button.
    "@media (max-width:1200px){"
    ".nav__links{display:none !important}"
    ".nav__links.is-open{display:flex !important;position:absolute;top:76px;left:0;right:0;"
    "flex-direction:column;align-items:stretch;background:rgba(17,17,17,.97);"
    "padding:24px var(--gutter);border-bottom:1px solid var(--border);gap:16px}"
    ".nav__links.is-open a{width:100%;color:var(--ink);white-space:normal}"
    ".nav .btn--amber{display:none !important}"
    ".nav__toggle{display:inline-flex !important}"
    ".site-header__inner{height:76px}"
    ".brand__tag{display:none !important}}"
    # Landing pages whose header is the logo plus one button.
    "@media (max-width:480px){"
    ".site-header__inner>.btn{padding:10px 12px;font-size:13px}}"
    "@media (max-width:380px){.brand img{max-width:132px !important;height:auto !important}}"
    # Desktop widths where the full header did not fit.
    "@media (min-width:1201px) and (max-width:1760px){"
    ".brand__tag{display:none !important}"
    ".nav__links .nav__search{display:none !important}}"
    "@media (min-width:1201px) and (max-width:1440px){"
    ".nav{gap:20px}.nav__links{gap:20px}"
    ".nav__links a[href$=\"case-review\"]{display:none !important}}"
    "@media (min-width:1201px) and (max-width:1320px){"
    ".nav{gap:14px}.nav__links{gap:16px}"
    ".nav__links a[href=\"/\"]{display:none !important}"
    ".site-header__inner{gap:16px}}"
)
BLOCK = BEGIN + '\n<style id="lc-header-fit">' + CSS + "</style>\n" + END
BLOCK_RE = re.compile(re.escape(BEGIN) + r".*?" + re.escape(END), re.S)


def sweep(html):
    if 'class="site-header' not in html:
        return html, "no header"
    m = BLOCK_RE.search(html)
    if m:
        if m.group(0) == BLOCK:
            return html, "current"
        return html[: m.start()] + BLOCK + html[m.end():], "updated"
    i = html.lower().find("</head>")
    if i < 0:
        return html, "no </head>"
    return html[:i] + BLOCK + "\n" + html[i:], "added"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default=".")
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()
    counts, changed, problems = {}, [], []
    for root, dirs, files in os.walk(a.path):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("node_modules", "case-filings", "fonts")]
        for fn in sorted(files):
            if not fn.endswith(".html") or fn == "footer.html":
                continue
            p = os.path.join(root, fn)
            rel = os.path.relpath(p, a.path)
            with open(p, encoding="utf-8") as fh:
                html = fh.read()
            new, status = sweep(html)
            counts[status] = counts.get(status, 0) + 1
            if status == "no </head>":
                problems.append(rel)
            if new != html:
                changed.append((rel, status))
                if a.apply:
                    with open(p, "w", encoding="utf-8") as fh:
                        fh.write(new)
    verb = "changed" if a.apply else "would change"
    print(f"{len(changed):3d} pages {verb}")
    print(f"{counts.get('current', 0):3d} pages already current")
    print(f"{counts.get('no header', 0):3d} pages without a site header (skipped)")
    print(f"{len(problems):3d} pages with problems")
    for rel, status in changed:
        print(f"  {rel}: {status}")
    for rel in problems:
        print(f"  PROBLEM {rel}: no </head>")


if __name__ == "__main__":
    main()
