#!/usr/bin/env python3
"""Give every content page a datePublished, a dateModified, an author, and a
visible Published / Updated line.

Why. On 2026-10-18, 124 of 141 Lawsuit Center pages carried no dateModified
at all. check_date_consistency.py compares every stamp on a page against its
dateModified, so a page without one is invisible to that check, and Bing has
no freshness signal to read. The 17 pages that did carry dates were the ones
edited by hand that week.

What it writes, per page that has none of it:
  JSON-LD   datePublished  = the date of the commit that added the file
            dateModified   = the date of the file's last commit, unless that
                             commit is marked [skip lastmod], in which case the
                             last commit before it (same rule as
                             generate-sitemap.py)
            author         = David Meldofsky (Person), as on the hand-dated pages
            into the page's main node: WebPage, ContactPage, Article,
            WebApplication, CollectionPage or AboutPage, before "publisher" when
            that key exists, else at the end of the node.
  VISIBLE   <p class="meta">Published <time> · Updated <time>.</p> in the
            page hero, placed above the existing disclaimer line when the hero
            has one (class meta or small-text), else after the last <p> or
            action block in the hero.

What it leaves alone, and reports:
  - pages that already carry "dateModified" (the hand-dated ones; rerun-safe)
  - pages with no <section class="page-hero"> (404, search, thank-you pages,
    index, footer.html, a few intake pages): the JSON-LD still gets dates if
    the page has a main node; the visible line is skipped and listed
  - pages whose JSON-LD has no main node of a dated type (listed as problems)
  - anything under es/ gets Spanish labels (Publicado / Actualizado)

Dates come from git, so run it in a checkout with history (fetch-depth: 0 in
the workflow). The commit that applies it is a mechanical sweep and must carry
[skip lastmod] [skip ci], or generate-sitemap.py stamps every swept page with
the sweep date, which is exactly the false-freshness signal this exists to end.

Usage
-----
    python3 add_page_dates.py                 # report only
    python3 add_page_dates.py --apply         # write
    python3 add_page_dates.py --path DIR
"""
import argparse
import datetime as dt
import os
import re
import subprocess

AUTHOR = '"author": { "@type": "Person", "name": "David Meldofsky", "jobTitle": "Attorney", "url": "https://lawsuit.center/david-meldofsky" }'
MAIN_TYPES = ("WebPage", "ContactPage", "Article", "WebApplication", "CollectionPage", "AboutPage")
SKIP_TOKEN = "[skip lastmod]"
LD = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)
HERO = re.compile(r'<section class="page-hero">.*?</section>', re.S)
SKIP_FILES = {"footer.html", "404.html", "search.html"}


def git(*args, cwd="."):
    return subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, check=True).stdout


def dates_for(path, root):
    rel = os.path.relpath(path, root)
    log = git("log", "--follow", "--format=%H %ad %s", "--date=short", "--", rel, cwd=root).strip().splitlines()
    if not log:
        return None, None
    first = log[-1].split()[1]
    last = None
    for line in log:
        _, d, *msg = line.split(" ", 2) + [""]
        if SKIP_TOKEN not in " ".join(msg):
            last = d
            break
    return first, last or first


def vis(d, es=False):
    y, m, dd = (int(x) for x in d.split("-"))
    if es:
        months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
        return f"{dd} de {months[m-1]} de {y}"
    return dt.date(y, m, dd).strftime("%B %-d, %Y")


def add_ld_dates(html, pub, mod):
    blocks = list(LD.finditer(html))
    main = [m for m in blocks if re.search(r'"@type":\s*"(%s)"' % "|".join(MAIN_TYPES), m.group(1))]
    if not main:
        return None
    m = main[0]
    node = m.group(1)
    indent = (re.search(r"\n(\s*)\"", node) or re.search(r"\n(\s*)}", node))
    ind = indent.group(1) if indent else "    "
    # Add the author only when the node has none. Twelve pages already carried
    # a richer author (the davidmeldofsky.com @id plus sameAs) when this sweep
    # first ran on 2026-10-18, and an unconditional insert gave them a second
    # "author" key. JSON keeps the last duplicate, so the richer one was lost.
    author = "" if '"author"' in node else f"\n{ind}{AUTHOR},"
    ins = f'"datePublished": "{pub}",\n{ind}"dateModified": "{mod}",{author}'
    node2 = node
    if '"publisher"' in node:
        node2 = re.sub(r'(\n\s*)"publisher"', lambda mm: mm.group(1) + ins.replace("\n" + ind, mm.group(1)) + mm.group(1) + '"publisher"', node, count=1)
    if node2 == node:
        # no "publisher" key, or one that sits mid-line: append at the end of the node
        k = node.rstrip().rfind("}")
        node2 = node[:k].rstrip() + ",\n" + ind + ins.rstrip(",") + "\n" + node[k:]
    return html[:m.start(1)] + node2 + html[m.end(1):]


def add_visible(html, pub, mod, es):
    hs = HERO.search(html)
    if not hs:
        return None
    s = hs.group(0)
    if es:
        line = f'<p class="meta">Publicado <time datetime="{pub}">{vis(pub, True)}</time> &middot; Actualizado <time datetime="{mod}">{vis(mod, True)}</time>.</p>'
    else:
        line = f'<p class="meta">Published <time datetime="{pub}">{vis(pub)}</time> &middot; Updated <time datetime="{mod}">{vis(mod)}</time>.</p>'
    for marker in ('<p class="small-text">', '<p class="meta">'):
        if marker in s:
            s2 = s.replace(marker, line + "\n    " + marker, 1)
            return html.replace(s, s2, 1)
    # no disclaimer line: put it after the last block before the hero's closing divs
    m = re.search(r"(</div>|</p>)(\s*</div>\s*</section>)$", s, re.S)
    if not m:
        return None
    s2 = s[:m.start(2)] + "\n    " + line + s[m.start(2):]
    return html.replace(s, s2, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default=".")
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()
    root = os.path.abspath(a.path)
    pages = []
    for d, _, files in os.walk(root):
        if ".git" in d or "node_modules" in d:
            continue
        for f in files:
            if f.endswith(".html") and f not in SKIP_FILES:
                pages.append(os.path.join(d, f))
    changed, current, novis, problems = [], [], [], []
    for p in sorted(pages):
        rel = os.path.relpath(p, root)
        html = open(p, encoding="utf-8").read()
        if '"dateModified"' in html:
            current.append(rel)
            continue
        pub, mod = dates_for(p, root)
        if not pub:
            problems.append(f"{rel}: no git history")
            continue
        out = add_ld_dates(html, pub, mod)
        if out is None:
            problems.append(f"{rel}: no WebPage/ContactPage/Article node in JSON-LD")
            continue
        out2 = add_visible(out, pub, mod, rel.startswith("es/") or rel.startswith("es" + os.sep))
        if out2 is None:
            novis.append(rel)
            out2 = out
        changed.append((rel, pub, mod))
        if a.apply:
            open(p, "w", encoding="utf-8").write(out2)
    verb = "changed" if a.apply else "would change"
    print(f"{len(changed):3d} pages {verb}")
    print(f"{len(current):3d} pages already carry dateModified")
    print(f"{len(novis):3d} pages got JSON-LD dates only (no page hero for a visible line)")
    print(f"{len(problems):3d} problems")
    for rel, pub, mod in changed:
        print(f"    {rel}: published {pub}, modified {mod}")
    if novis:
        print("  no visible line:")
        for rel in novis:
            print(f"    {rel}")
    for pr in problems:
        print(f"  !! {pr}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
