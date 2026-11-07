#!/usr/bin/env python3
"""Replace the footer disclosure block on every page with the attorney-practice wording.

The footer is inlined on every page, and inline_footer.py does not re-sync
pages that already carry one, so a change to footer.html reaches nothing on
its own. This sweep rewrites the site-footer__legal block on each page.

The block is matched by its text, whitespace ignored, so the sweep touches a
page only when it carries one of the known old texts (the pre-10/12/26 text or
the 10/12/26 text that still named sponsored visibility) (English or Spanish) and
leaves any other wording alone and reported. A page that already carries the
new text is left alone, so this is safe to rerun. footer.html is updated too,
so a page converted by inline_footer.py later carries the new text from the
start.

Usage
-----
    python3 set_footer_legal.py
    python3 set_footer_legal.py --apply

Options
-------
    --path DIR   directory to scan (default .)
    --apply      write changes; without it the script only reports
"""

import argparse
import os
import re

OLD_EN = (
    "Educational information only. Not legal advice. No attorney-client relationship is formed "
    "by using this website. Some pages may include attorney advertising or sponsored law firm visibility. "
    "Lawsuit Center is not a law firm and does not provide legal advice. Use of this site does not "
    "create an attorney-client relationship. Information submitted through this site may be reviewed "
    "by participating law firms, legal advertisers, or third-party intake providers, depending on the "
    "claim category and availability."
)
PRIOR_EN = (
    "Educational information only, not legal advice. Lawsuit Center is the intake and referral "
    "practice of David Meldofsky, a California attorney. Information you submit is referred by him "
    "to participating law firms, which decide whether to follow up. Using this site or submitting "
    "information creates no attorney-client relationship with David Meldofsky or with any firm. You "
    "become a firm's client only when you sign an agreement with that firm. Some pages include "
    "attorney advertising or sponsored law firm visibility, labeled where it appears."
)
OLD_ES = (
    "Información educativa solamente. No constituye asesoría legal. El uso de este sitio web no crea "
    "una relación abogado-cliente. Algunas páginas pueden incluir publicidad de abogados o visibilidad "
    "patrocinada de firmas legales. Lawsuit Center no es una firma de abogados y no brinda asesoría "
    "legal. La información enviada a través de este sitio puede ser revisada por firmas de abogados "
    "participantes, anunciantes legales o proveedores externos de admisión de casos, según la "
    "categoría del reclamo y la disponibilidad."
)
PRIOR_ES = (
    "Información educativa solamente, no asesoría legal. Lawsuit Center es la práctica de admisión y "
    "referidos de David Meldofsky, abogado de California. La información que usted envía es referida "
    "por él a firmas de abogados participantes, que deciden si dan seguimiento. Usar este sitio o enviar "
    "información no crea una relación abogado-cliente con David Meldofsky ni con ninguna firma. Usted "
    "se convierte en cliente de una firma solo cuando firma un acuerdo con esa firma. Algunas páginas "
    "incluyen publicidad de abogados o visibilidad patrocinada de firmas legales, señalada donde aparece."
)

# Paid placement retired 11/7/26: the sponsored-visibility clause is gone. The
# 10/12/26 wording above (PRIOR_*) is now an old text this sweep replaces.
NEW_EN = PRIOR_EN.replace(
    "Some pages include attorney advertising or sponsored law firm visibility, labeled where it appears.",
    "Some pages include attorney advertising, labeled where it appears.")
NEW_ES = PRIOR_ES.replace(
    "Algunas páginas incluyen publicidad de abogados o visibilidad patrocinada de firmas legales, señalada donde aparece.",
    "Algunas páginas incluyen publicidad de abogados, señalada donde aparece.")
assert NEW_EN != PRIOR_EN and NEW_ES != PRIOR_ES

BLOCK_RE = re.compile(r'(<div class="site-footer__legal">)(.*?)(</div>)', re.S)


def norm(t):
    return re.sub(r"\s+", " ", t).strip()


def wrap(text, indent):
    # Lay the text out at roughly the width of the original block, one indent per line.
    words = text.split(" ")
    lines, cur = [], ""
    for w in words:
        if len(cur) + len(w) + 1 > 96 and cur:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w) if cur else w
    if cur:
        lines.append(cur)
    return "\n" + "\n".join(indent + "  " + l for l in lines) + "\n" + indent


def sweep(rel, html):
    m = BLOCK_RE.search(html)
    if not m:
        return html, []
    cur = norm(m.group(2))
    if cur in (NEW_EN, NEW_ES):
        return html, []
    if cur in (OLD_EN, PRIOR_EN):
        new = NEW_EN
    elif cur in (OLD_ES, PRIOR_ES):
        new = NEW_ES
    else:
        return html, ["NO KNOWN LEGAL TEXT (left alone)"]
    line_start = html.rfind("\n", 0, m.start(1)) + 1
    indent = re.match(r"[ \t]*", html[line_start:m.start(1)]).group(0)
    out = html[: m.start(2)] + wrap(new, indent) + html[m.end(2):]
    return out, ["legal block (%s)" % ("es" if new is NEW_ES else "en")]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default=".")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    changed, skipped, problems = [], [], []
    for root, dirs, files in os.walk(args.path):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d != "node_modules"]
        for fn in sorted(files):
            if not fn.endswith(".html"):
                continue
            p = os.path.join(root, fn)
            rel = os.path.relpath(p, args.path)
            with open(p, encoding="utf-8") as fh:
                html = fh.read()
            new, notes = sweep(rel, html)
            if any(n.startswith("NO ") for n in notes):
                problems.append((rel, notes))
                continue
            if new == html:
                if "site-footer__legal" in html:
                    skipped.append(rel)
                continue
            changed.append((rel, notes))
            if args.apply:
                with open(p, "w", encoding="utf-8") as fh:
                    fh.write(new)

    verb = "changed" if args.apply else "would change"
    print(f"{len(changed):3d} pages {verb}")
    print(f"{len(skipped):3d} pages already current")
    print(f"{len(problems):3d} pages with problems")
    print()
    for rel, notes in changed:
        print(f"  {rel}: {', '.join(notes)}")
    if problems:
        print()
        for rel, notes in problems:
            print(f"  PROBLEM {rel}: {', '.join(notes)}")
        print()
        print("Problem pages were left untouched. Fix their footer, then rerun.")


if __name__ == "__main__":
    main()
