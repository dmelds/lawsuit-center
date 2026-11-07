#!/usr/bin/env python3
"""Retire Center's off-mission pages and its paid-placement program.

What it does, in order:
  1. Deletes the off-mission pages (general PI, civil, business, bankruptcy,
     defense, funding, the truck trio) and the three sponsorship pages
     (for-law-firms, marketing-packages, law-firm-inquiry). They 404 after the
     deploy; generate_redirects.py drops their .html self-pair rules on its
     next run, and generate-sitemap.py drops them from the sitemap.
  2. Removes every link to a deleted page from the pages that stay: hub
     cards, buttons, related-topic links, list items and the footer
     "For Law Firms" link (only that link and its separator, so the
     intentional footer differences on /es/ pages and index stay intact).
     A link inside running prose is unwrapped to plain text instead.
  3. Removes the paid-placement surfaces: the unsold "Featured lawyers"
     sections become a closing case-review box, the sponsored-listing
     disclosure sections and "Sponsoring Firm" placeholders go, and the
     copy that describes paid placement on index, lawsuits, about,
     david-meldofsky, how-case-review-works, advertising-disclosure,
     contact and resources is rewritten to describe the referral fee only.
  4. Cleans up what the removals leave empty: card grids, button rows,
     hub sections and their in-page nav links. Breadcrumb structured data
     loses the step for a deleted page, and the steps after it are renumbered.
  5. Removes the deleted pages from search.js and llms.txt.
  6. Moves dateModified and the visible Updated stamp on the pages whose
     prose was rewritten (DATED below). Pure link and block removals are
     not dated.

The footer disclosure sentence ("... or sponsored law firm visibility ...")
is handled by set_footer_legal.py, whose NEW_EN / NEW_ES were updated in the
same delivery. Run it after this script.

Every page-specific edit names the exact text it replaces. On a rerun the
new text is found instead and the edit is skipped, so the script is safe to
run twice. If neither the old nor the new text is found, the edit is
reported as a problem and nothing is written for that page.

Usage
-----
    python3 prune_off_mission.py            dry run, lists what would change
    python3 prune_off_mission.py --apply    write the changes
    python3 prune_off_mission.py --check    exit 1 if a deleted page, a link
                                            to one, or paid-placement copy
                                            has come back (monthly guard)
"""

import argparse
import os
import re
import sys

TODAY_ISO = "2026-11-07"
TODAY_TXT = "November 7, 2026"

CUT = [
    # off-mission: general personal injury
    "car-accident-lawsuits", "catastrophic-injury-lawsuits", "dog-bite-lawsuits",
    "motorcycle-accident-lawsuits", "pedestrian-accident-lawsuits", "personal-injury-lawsuits",
    "california-personal-injury-lawyers", "slip-and-fall-lawsuits", "wrongful-death-lawsuits",
    "truck-accident-lawsuits", "truck-accident-case-review", "thank-you-truck-accident-review",
    # off-mission: civil, business, financial
    "banking-lending-lawsuits", "business-bankruptcy", "business-lawsuits", "civil-rights-lawsuits",
    "construction-lawsuits", "consumer-bankruptcy", "defamation-reputation-lawsuits",
    "default-judgment", "employment-lawsuits", "financial-lawsuits", "insurance-lawsuits",
    "lawsuit-defense", "lawsuit-funding-options", "privacy-data-breach-lawsuits",
    "real-estate-property-lawsuits", "social-media-defamation-lawsuit",
    "stock-market-fraud-lawsuits", "what-to-do-after-being-sued",
    # paid placement program
    "for-law-firms", "marketing-packages", "law-firm-inquiry",
    # general overviews with no case review behind them (cut November 7)
    "consumer-lawsuits", "class-action-lawsuits",
]
CUTSET = set(CUT)

# Pages whose reader-facing prose this script rewrites. They get today's
# dateModified and visible Updated stamp.
DATED = {
    "advertising-disclosure.html", "contact.html", "about.html", "david-meldofsky.html",
    "how-case-review-works.html", "resources.html", "disclaimer.html", "editorial-policy.html",
}

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "param", "source", "track", "wbr"}
TAG = re.compile(r"<!--.*?-->|<(/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(/?)>", re.S)


# ---------------------------------------------------------------- HTML spans

def element_end(html, start):
    """Index just past the element whose opening tag starts at `start`."""
    m = TAG.match(html, start)
    name = m.group(2).lower()
    if name in VOID or m.group(3):
        return m.end()
    depth = 0
    for t in TAG.finditer(html, start):
        if t.group(2) is None or t.group(2).lower() != name:
            continue
        if t.group(1):
            depth -= 1
        elif not t.group(3):
            depth += 1
        if depth == 0:
            return t.end()
    raise ValueError("unbalanced <%s> at %d" % (name, start))


def open_tags_before(html, pos):
    """Opening tags that start before pos, innermost last."""
    out = []
    for m in TAG.finditer(html):
        if m.start() >= pos:
            break
        if m.group(2) and not m.group(1) and not m.group(0).startswith("<!--"):
            out.append(m)
    return out


def enclosing(html, pos, tag=None, cls=None, ident=None):
    for m in reversed(open_tags_before(html, pos)):
        if tag and m.group(2).lower() != tag:
            continue
        s = m.group(0)
        if cls and not re.search(r'class="[^"]*(?<![\w-])' + re.escape(cls) + r'(?![\w-])', s):
            continue
        if ident and ('id="%s"' % ident) not in s:
            continue
        try:
            e = element_end(html, m.start())
        except ValueError:
            continue
        if e > pos:
            return m.start(), e
    return None


def parent_of(html, start):
    """Innermost element that contains the element starting at `start`."""
    end = element_end(html, start)
    for m in reversed(open_tags_before(html, start)):
        try:
            e = element_end(html, m.start())
        except ValueError:
            continue
        if e >= end:
            return m.start(), e, m.group(2).lower(), m.group(0)
    return None


def cut_span(html, s, e):
    """Remove html[s:e] plus the indentation before it and the newline after,
    when the element sits on its own lines."""
    ls = html.rfind("\n", 0, s) + 1
    if html[ls:s].strip() == "":
        s = ls
        if html[e:e + 1] == "\n":
            e += 1
    return html[:s] + html[e:]


# ---------------------------------------------------------------- links

HREF = re.compile(r'<a\b[^>]*?\bhref="([^"]*)"[^>]*>', re.S)


def target_slug(href):
    h = href.strip()
    h = re.sub(r"^https?://(www\.)?lawsuit\.center", "", h)
    if re.match(r"^[a-z]+:", h) or h.startswith("#"):
        return None
    h = h.split("#")[0].split("?")[0].lstrip("/")
    if h.endswith(".html"):
        h = h[:-5]
    return h if h in CUTSET else None


FOOT_SEP_AFTER = re.compile(r"\s*(&nbsp;)?\s*(·|&middot;|&#183;)")
FOOT_SEP_BEFORE = re.compile(r"(&nbsp;)?\s*(·|&middot;|&#183;)\s*$")


def remove_links(html, notes):
    while True:
        hit = None
        for m in HREF.finditer(html):
            if target_slug(m.group(1)):
                hit = m
                break
        if not hit:
            return html
        s = hit.start()
        e = element_end(html, s)
        tag = hit.group(0)
        slug = target_slug(hit.group(1))
        foot = enclosing(html, s, "div", cls="site-footer__links")
        par = parent_of(html, s)
        if foot:
            after = FOOT_SEP_AFTER.match(html, e)
            if after:
                e = after.end()
                html = cut_span(html, s, e)
            else:
                before = FOOT_SEP_BEFORE.search(html, 0, s)
                html = html[:before.start()] + html[e:] if before else cut_span(html, s, e)
            notes.append("footer link " + slug)
        elif re.search(r'class="[^"]*\b(btn|card|dir-card|cat)\b', tag):
            html = cut_span(html, s, e)
            notes.append("card/button " + slug)
        elif par and par[2] == "li" and re.sub(r"<[^>]+>|\s", "", html[par[0]:s] + html[e:par[1]]) == "":
            html = cut_span(html, par[0], par[1])
            notes.append("list item " + slug)
        elif par and par[2] in ("p", "span", "dd", "td", "label", "strong", "em"):
            inner = html[hit.end():e - len("</a>")]
            html = html[:s] + inner + html[e:]
            notes.append("unwrapped prose link " + slug)
        else:
            html = cut_span(html, s, e)
            notes.append("link " + slug)


# ---------------------------------------------------------------- empties

def remove_empty(html, notes):
    changed = True
    while changed:
        changed = False
        # grids and button rows with no element child left
        for m in re.finditer(r'<(div|nav)\b[^>]*class="[^"]*\b(dir-grid|card-grid|cats|placement-grid|'
                             r'hero-actions|actions|inline-link-list|state-grid)\b[^"]*"[^>]*>', html):
            e = element_end(html, m.start())
            body = html[m.end():e - len("</%s>" % m.group(1))]
            if re.search(r"<[a-zA-Z]", body):
                continue
            s = m.start()
            if m.group(2) == "dir-grid":
                prev = re.search(r'<h3 class="subhead">[^<]*</h3>\s*$', html[:s])
                if prev:
                    s = prev.start()
            html = cut_span(html, s, e)
            notes.append("empty " + m.group(2))
            changed = True
            break
        if changed:
            continue
        # hub sections with no card left
        for m in re.finditer(r'<section\b[^>]*class="[^"]*\b(cat-section|related-topics-module)\b[^"]*"[^>]*>', html):
            e = element_end(html, m.start())
            body = html[m.end():e]
            if re.search(r'class="[^"]*\b(dir-card|card)\b', body):
                continue
            sid = re.search(r'\bid="([^"]+)"', m.group(0))
            html = cut_span(html, m.start(), e)
            if sid:
                html = re.sub(r'\n[ \t]*<a href="#%s">[^<]*</a>' % re.escape(sid.group(1)), "", html)
            notes.append("empty section " + (sid.group(1) if sid else m.group(1)))
            changed = True
            break
    return html


def realternate_cat_sections(html):
    """lawsuits.html alternates plain and section--surface; keep it alternating
    after sections are removed."""
    out, last, i = [], 0, 0
    for m in re.finditer(r'<section\b[^>]*class="([^"]*\bcat-section\b[^"]*)"', html):
        classes = [c for c in m.group(1).split() if c != "section--surface"]
        if i % 2 == 1:
            classes.insert(classes.index("section") + 1, "section--surface")
        i += 1
        out.append(html[last:m.start(1)])
        out.append(" ".join(classes))
        last = m.end(1)
    out.append(html[last:])
    return "".join(out)


LD_BLOCK = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)
LD_ITEM = re.compile(r',?\s*\{\s*"@type":\s*"ListItem",\s*"position":\s*\d+,\s*"name":\s*"[^"]*",\s*'
                     r'"item":\s*"https://lawsuit\.center/([a-z0-9-]+)"\s*\}')
LD_URL = re.compile(r'"https://lawsuit\.center/(?:es/)?([a-z0-9-]+)"')


def fix_breadcrumb_ld(html, notes):
    """Drop BreadcrumbList steps that point at a deleted page and renumber the
    positions that follow, so structured data matches the visible trail."""
    def block(m):
        body = m.group(2)
        if "BreadcrumbList" not in body:
            return m.group(0)
        new = LD_ITEM.sub(lambda i: "" if i.group(1) in CUTSET else i.group(0), body)
        if new == body:
            return m.group(0)
        new = new.replace("[,", "[")
        n = iter(range(1, 100))
        new = re.sub(r'"position":\s*\d+', lambda _: '"position": %d' % next(n), new)
        notes.append("breadcrumb step")
        return m.group(1) + new + m.group(3)
    return LD_BLOCK.sub(block, html)


# ---------------------------------------------------------------- page edits

def section_with(html, marker, tag="section"):
    i = html.find(marker)
    if i < 0:
        return None
    return enclosing(html, i, tag)


CLOSING_CTA = """<section class="section section--surface">
  <div class="container container--narrow">
    <div class="featured-open">
      <h3>{h3}</h3>
      <p>{p}</p>
      <div class="hero-actions" style="justify-content:center;">
        {button}
      </div>
    </div>
  </div>
</section>"""

CTA_EN = dict(h3="Start with a free case review.",
              p="Tell us what happened and roughly when. David Meldofsky, the California attorney "
                "behind Lawsuit Center, refers each request to a participating firm with active "
                "intake for that category and your state.")
CTA_ES = dict(h3="Comience con una revisión de caso gratuita.",
              p="Cuéntenos qué pasó y aproximadamente cuándo. David Meldofsky, el abogado de "
                "California detrás de Lawsuit Center, refiere cada solicitud a una firma "
                "participante con admisión activa para esa categoría y su estado.")


def featured_to_cta(html, notes, problems, spanish):
    r = section_with(html, 'id="featured-lawyers"')
    if not r:
        return html
    s, e = r
    sec = html[s:e]
    btn = re.search(r'<a href="[^"#]+"[^>]*class="btn btn--amber"[^>]*>.*?</a>', sec, re.S)
    if not btn:
        problems.append("featured-lawyers section has no case-review button")
        return html
    new = CLOSING_CTA.format(button=btn.group(0), **(CTA_ES if spanish else CTA_EN))
    html = html[:s] + new + html[e:]
    notes.append("featured-lawyers section -> closing case-review box")
    # hero buttons that pointed at the section
    html = re.sub(r'\n[ \t]*<a href="#featured-lawyers"[^>]*>[^<]*</a>', "", html)
    return html


REMOVE_SECTIONS_BY_MARKER = [
    # sponsored-listing disclosure sections
    "<h2>Sponsored listings and attorney advertising.</h2>",
    # chemical-exposure placement grid
    "<h2>Sponsored visibility on this page.</h2>",
    # mesothelioma-lawyers disclosure section that only describes paid placements
    "<h2>Disclosure approach.</h2>",
]

PLAIN_REMOVALS = [
    '<p class="small-text">Some placements on this page may be sponsored. Featured visibility should be '
    'clearly identified and does not constitute a recommendation or guarantee of results.</p>',
    '<p class="small-text">Algunas ubicaciones en esta página pueden ser patrocinadas. La visibilidad '
    'destacada debe estar claramente identificada y no constituye una recomendación ni una garantía de '
    'resultados.</p>',
]

PLAIN_SWAPS = [
    ("<p><strong>Featured lawyer section</strong></p>", "<p><strong>Free case review path</strong></p>"),
    ("<p><strong>Sección de abogados destacados</strong></p>",
     "<p><strong>Ruta de revisión de caso gratuita</strong></p>"),
    # case-page disclosure box
    ("<p>Some pages on Lawsuit Center include sponsored law firm listings or other attorney advertising. "
     "Paid visibility is not a recommendation or endorsement, and visitors should evaluate any attorney "
     "independently before hiring counsel. See our <a href=\"advertising-disclosure\">Advertising "
     "Disclosure</a>, or <a href=\"for-law-firms\">information for law firms</a>.</p>",
     "<p>This page is attorney advertising. It is not a recommendation or endorsement of any attorney, "
     "and visitors should evaluate any attorney independently before hiring counsel. See our "
     "<a href=\"advertising-disclosure\">Advertising Disclosure</a>.</p>"),
]

SPONSOR_CASE_REVIEW = """<section class="section section--surface">
  <div class="container container--narrow">
    <span class="eyebrow section__eyebrow">Case Review</span>
    <h2>Reviewing this category of claim.</h2>
    <p>
      David Meldofsky, a California attorney, refers {topic} case review requests to participating law firms
      that handle them. Visitors should evaluate any law firm independently before choosing to hire counsel.
    </p>

<div class="actions">
  {button}
</div>

  </div>
</section>"""


def sponsoring_firm(html, rel, notes, problems):
    r = section_with(html, '<span class="eyebrow section__eyebrow">Sponsoring Firm</span>')
    if r:
        s, e = r
        sec = html[s:e]
        btn = re.search(r'<a href="[^"]+" class="btn btn--amber">Request a Case Review</a>', sec)
        topic = {"depo-provera.html": "Depo-Provera meningioma",
                 "talcum-powder-lawsuits.html": "talcum powder ovarian cancer",
                 "paraquat-lawsuit.html": "paraquat"}.get(rel)
        if not btn or not topic:
            problems.append("Sponsoring Firm section not recognized")
            return html
        html = html[:s] + SPONSOR_CASE_REVIEW.format(topic=topic, button=btn.group(0)) + html[e:]
        notes.append("Sponsoring Firm section -> case review")
    r = section_with(html, '<span class="eyebrow section__eyebrow">Firma Patrocinadora</span>')
    if r:
        s, e = r
        sec = html[s:e]
        sec2 = sec.replace('<span class="eyebrow section__eyebrow">Firma Patrocinadora</span>',
                           '<span class="eyebrow section__eyebrow">Revisión de Casos</span>')
        old_p = re.search(r"<p>\s*Las solicitudes de revisión de casos de paraquat.*?</p>", sec2, re.S)
        if not old_p:
            problems.append("Firma Patrocinadora paragraph not recognized")
            return html
        sec2 = sec2.replace(old_p.group(0), (
            "<p>\n      David Meldofsky, abogado de California, refiere las solicitudes de revisión de casos "
            "de paraquat a firmas de abogados\n      participantes que manejan estos casos. Los visitantes deben evaluar "
            "cualquier firma de abogados de manera independiente\n      antes de decidir contratar a un "
            "abogado.\n    </p>"))
        sec2 = re.sub(r'\n[ \t]*<a href="/advertising-disclosure" class="btn btn--ghost">Divulgación Publicitaria</a>',
                      "", sec2)
        html = html[:s] + sec2 + html[e:]
        notes.append("Firma Patrocinadora section -> revisión de casos")
    return html


# Exact replacements per page: (old, new). The Consumer & Financial rewrites
# on index and lawsuits were dropped November 7, when both pages were rebuilt
# and the consumer and class action overviews joined CUT. Old must be found once, or new
# must already be present (rerun). A replacement whose new text is "" removes.
EDITS = {
    "index.html": [
        ("""        <div class="trust__title">Independent</div>
        <div class="trust__desc">Not a law firm. Referral fees, when applicable, paid by firms out of attorney fees.</div>""",
         """        <div class="trust__title">Direct referral</div>
        <div class="trust__desc">David Meldofsky, a California attorney, refers each request himself.</div>"""),
        ("""        <div class="trust__title">Disclosed placement</div>
        <div class="trust__desc">Paid firm visibility is labeled. Editorial is separate.</div>""",
         """        <div class="trust__title">No added cost</div>
        <div class="trust__desc">Any referral fee comes from the firm's attorney fee. Your fee stays the same.</div>"""),
        (" When firms pay for visibility on a category page, we label it.", ""),
        ("SECTION:<h2>Founding Sponsor Pilot.</h2>", ""),
        ("SECTION:<h3>Been sued or received legal papers?</h3>", ""),
    ],
    "lawsuits.html": [
        ("SECTION:<h2>Accidents, negligence, and serious harm.</h2>", ""),
        ("SECTION:<h2>Business disputes and workplace lawsuits.</h2>", ""),
        ('<a href="#personal-injury">Personal Injury</a>', ""),
        ('<a href="#business-employment">Business &amp; Employment</a>', ""),
        (" These pages may include sponsored law firm visibility &mdash; see the advertising disclosure for details.", ""),
        (" Some pages may include attorney advertising or sponsored law firm visibility.",
         " Some pages include attorney advertising."),
    ],
    "about.html": [
        ("      <li>Review paid-placement and referral-fee disclosures, which are labeled everywhere they apply.</li>",
         "      <li>Read how referral fees work on the advertising disclosure page.</li>"),
        ("""    <h2>Editorial categorization, paid placement, and referral fees.</h2>
    <p>
      Some firms pay for visibility on category pages — featured listings, category sponsorships, enhanced profiles, or other attorney advertising. We label every paid placement so visitors can tell editorial categorization from advertising.
    </p>
    <p>
      Separately, when a participating firm""",
         """    <h2>Editorial categorization and referral fees.</h2>
    <p>
      David Meldofsky decides which lawsuit categories the site covers and what each category page says.
    </p>
    <p>
      When a participating firm"""),
        ("      Paid placement and referral fees are not recommendations or endorsements of any attorney or law firm.",
         "      A referral fee is not a recommendation or endorsement of any attorney or law firm."),
        ("""      The platform exists to organize lawsuit information in a way the public can actually navigate, and to give law firms a clean, disclosed way to present sponsored visibility and referral arrangements next to editorial categorization. Lawsuit Center is educational and commercial — it is not a law firm and does not provide legal advice or representation.""",
         """      The platform exists to organize lawsuit information in a way the public can actually navigate. Lawsuit Center is the intake and referral practice of David Meldofsky, a California attorney, and provides no legal advice or representation through this site."""),
    ],
    "david-meldofsky.html": [
        ("an attorney-built layer that organizes claim categories honestly and labels paid placement clearly.",
         "an attorney-built layer that organizes claim categories honestly and discloses how referral fees work."),
        ("        Plain-language categorization, clear disclosure, and separation between editorial content and paid firm visibility.",
         "        Plain-language categorization, clear disclosure, and editorial content kept separate from referral fees."),
        ("<p>Categories built around exposure, product, condition, injury, and claim type — not around which firms paid most for visibility.</p>",
         "<p>Categories built around exposure, product, condition, injury, and claim type.</p>"),
        ("""        <h3>Disclosed placement and referrals</h3>
        <p>Paid law firm visibility and referral arrangements are labeled. Editorial categorization stays separate from advertising.</p>""",
         """        <h3>Disclosed referral fees</h3>
        <p>When a participating firm pays David a referral fee, the advertising disclosure explains how it works. Editorial categorization stays separate from it.</p>"""),
        ("claim categories, free tools, case review, and disclosed sponsored visibility.",
         "claim categories, free tools, and case review."),
        ("<dd>Action: case review, claim categories, disclosed sponsored visibility</dd>",
         "<dd>Action: case review, claim categories, free tools</dd>"),
        ("""      Lawsuit Center is educational and commercial. It is not a law firm and does not provide legal advice or representation. Viewing this page or submitting information through the site does not create an attorney-client relationship.""",
         """      Lawsuit Center is the intake and referral practice of David Meldofsky, a California attorney, and provides no legal advice or representation through this site. Viewing this page or submitting information through the site does not create an attorney-client relationship."""),
        ("""      Some pages include sponsored law firm listings, paid placements, or other attorney advertising — all labeled where they appear. When a participating firm takes a case from a case review request, it may pay David a referral fee out of its own attorney fee. The client pays nothing extra. Paid placement and referral arrangements are not recommendations or endorsements of any attorney or law firm.""",
         """      When a participating firm takes a case from a case review request, it may pay David a referral fee out of its own attorney fee. The client pays nothing extra. A referral fee is not a recommendation or endorsement of any attorney or law firm."""),
    ],
    "how-case-review-works.html": [
        ("<h2>How Lawsuit Center gets paid.</h2>", "<h2>How referral fees work.</h2>"),
        (" Those firms accept clients and sign cases. Money changes hands two ways, both disclosed:",
         " Those firms accept clients and sign cases. Money changes hands one way, disclosed here:"),
        ("""    <p>
      <strong>Paid placement on category pages.</strong> Some firms pay for visibility on category pages, such as a featured listing, a sponsorship, or other attorney advertising. Every paid placement is labeled, so visitors can tell editorial categorization from advertising.
    </p>
""", ""),
        ("      Neither arrangement is a recommendation or endorsement of any attorney or law firm.",
         "      A referral fee is not a recommendation or endorsement of any attorney or law firm."),
    ],
    "advertising-disclosure.html": [
        ('content="Lawsuit Center\'s full disclosure for paid placements, sponsored law firm listings, and referral or marketing fees paid by participating firms." />',
         'content="How referral fees work at Lawsuit Center: when a participating firm pays David Meldofsky, a California attorney, and what it means for the client." />'),
        ('"description": "Full disclosure for paid placements, sponsored listings, and referral or marketing fees from participating firms.",',
         '"description": "How referral fees work at Lawsuit Center: when a participating firm pays David Meldofsky, a California attorney, and what it means for the client.",'),
        ("Lawsuit Center's full disclosure for paid placements, sponsored law firm listings, and referral or marketing fees from participating firms. Referral fees",
         "Lawsuit Center's full disclosure of the referral fees participating firms may pay David Meldofsky, a California attorney. Referral fees"),
        ("Lawsuit Center's full disclosure for paid placements, sponsored law firm listings, and referral or marketing fees from participating firms. Referral fees",
         "Lawsuit Center's full disclosure of the referral fees participating firms may pay David Meldofsky, a California attorney. Referral fees"),
        (" Money changes hands two ways, both disclosed. The platform receives payment for paid placement on category pages. A participating firm",
         " Money changes hands one way, and it is disclosed here. A participating firm"),
        ("SECTION:<h2>Sponsored law firm visibility.</h2>", ""),
        ('<span class="eyebrow section__eyebrow">Referral &amp; Marketing Fees</span>',
         '<span class="eyebrow section__eyebrow">Referral Fees</span>'),
        ("""      Lawsuit Center's editorial categorization is not for sale. A firm cannot pay to be listed in a category that doesn't match its actual practice area, and paid placement does not control whether a lawsuit category appears on the site at all.""",
         """      Lawsuit Center's editorial categorization is not for sale. David Meldofsky decides which lawsuit categories the site covers and what each page says."""),
        ("      Lawsuit Center does not guarantee the quality, experience, availability, or results of any attorney or law firm — whether paid placement, referral-connected, or otherwise.",
         "      Lawsuit Center does not guarantee the quality, experience, availability, or results of any attorney or law firm, including the firms David Meldofsky refers requests to."),
        ("""      Lawsuit Center's editorial content — category descriptions, claim patterns, exposure information, free tools — is developed independently of paid placement and referral arrangements. The goal is to help visitors understand lawsuit categories and possible next steps regardless of which firms pay for visibility.""",
         """      Lawsuit Center's editorial content — category descriptions, claim patterns, exposure information, free tools — is developed independently of referral arrangements. The goal is to help visitors understand lawsuit categories and possible next steps."""),
        ("""      Paid placement does not control whether Lawsuit Center publishes information about a lawsuit category. Lawsuit Center may update, revise, or remove content at its discretion. Where a category includes paid placement, the editorial categorization stays separate from the advertising.""",
         """      David Meldofsky decides whether Lawsuit Center publishes information about a lawsuit category, independent of any referral arrangement. Lawsuit Center may update, revise, or remove content at its discretion."""),
        ("""      Law firms interested in sponsored visibility or participating firm arrangements can review placement opportunities. Visitors with questions about specific disclosures, paid placements, or referral arrangements can contact Lawsuit Center directly.""",
         """      Visitors with questions about specific disclosures or referral arrangements can contact Lawsuit Center directly."""),
        ('<a href="contact" class="btn btn--ghost">Contact Lawsuit Center</a>',
         '<a href="contact" class="btn btn--amber">Contact Lawsuit Center</a>'),
    ],
    "contact.html": [
        ('content="Contact Lawsuit Center to request a case review, ask a general question, or inquire about sponsored law firm placement opportunities." />',
         'content="Contact Lawsuit Center to request a free case review or ask a general question about a lawsuit category or what to do next." />'),
        ('"description": "Contact Lawsuit Center to request a case review, ask a general question, or inquire about sponsored law firm placement opportunities.",',
         '"description": "Contact Lawsuit Center to request a free case review or ask a general question about a lawsuit category or what to do next.",'),
        ('content="Contact Lawsuit Center to request a case review, ask a general question, or inquire about sponsored law firm placement opportunities.">',
         'content="Contact Lawsuit Center to request a free case review or ask a general question about a lawsuit category or what to do next.">'),
        ('content="Contact Lawsuit Center to request a case review, ask a general question, or inquire about sponsored law firm placement opportunities.">',
         'content="Contact Lawsuit Center to request a free case review or ask a general question about a lawsuit category or what to do next.">'),
        ("<h1>Case review and <em>law firm placement</em> inquiries.</h1>",
         "<h1>Contact <em>Lawsuit Center</em>.</h1>"),
        ("""      Use this page to request a case review, ask a general question, or inquire about sponsored
      visibility opportunities for law firms.""",
         """      Use this page to request a case review or ask a general question."""),
        ("SECTION:<h2>Choose the right path.</h2>", ""),
        ('            <option value="law-firm-placement">Law firm / sponsored placement inquiry</option>\n', ""),
        ('            <option value="personal-injury">Personal injury</option>\n', ""),
        ('            <option value="advertising-placement">Advertising or sponsored placement</option>\n', ""),
        ("<li>Whether you are reaching out as an individual, family member, or law firm</li>",
         "<li>Whether you are reaching out for yourself or for a family member</li>"),
        ("      We review every message to understand which path fits — a case review request, a general question, or a law firm placement discussion.",
         "      We review every message to understand which path fits: a case review request or a general question."),
        (" If you're reaching out as a law firm, we'll follow up about visibility or placement options.", ""),
        ("a contact from a firm, representation, placement, or any particular result.",
         "a contact from a firm, representation, or any particular result."),
    ],
    "resources.html": [
        ("lawsuit research, case review, lawsuit funding, claim categories, sponsored listings, and practical next steps.",
         "lawsuit research, case review, claim categories, free exposure checkers, and practical next steps."),
        ("lawsuit research, case review, lawsuit funding, claim categories, sponsored listings, and practical next steps.",
         "lawsuit research, case review, claim categories, free exposure checkers, and practical next steps."),
        ("lawsuit research, case review, lawsuit funding, claim categories, sponsored listings, and practical next steps.",
         "lawsuit research, case review, claim categories, free exposure checkers, and practical next steps."),
        ("lawsuit research, case review, lawsuit funding, claim categories, sponsored listings, and practical next steps.",
         "lawsuit research, case review, claim categories, free exposure checkers, and practical next steps."),
        ("lawsuit research, case review, lawsuit funding, claim categories, sponsored listings, and next-step planning.",
         "lawsuit research, case review, claim categories, free exposure checkers, and next-step planning."),
        ("<p>Understand sponsored listings, attorney advertising, paid visibility, and how placements may appear on Lawsuit Center.</p>",
         "<p>Understand attorney advertising and how referral fees work on Lawsuit Center.</p>"),
        ("Lawsuit Center focuses on lawsuit categories, case review options, sponsored visibility, and next-step resources.",
         "Lawsuit Center focuses on lawsuit categories, case review options, and next-step resources."),
    ],
    "disclaimer.html": [
        ("""    <h2>Sponsored Visibility</h2>
    <p>Some pages may include clearly identified sponsored visibility or featured placement. Any sponsored placement should not be understood as legal advice, a guarantee of results, or a recommendation of any specific attorney.</p>""",
         """    <h2>Attorney Advertising</h2>
    <p>Lawsuit Center is attorney advertising. Nothing on this site should be understood as legal advice, a guarantee of results, or a recommendation of any specific attorney.</p>"""),
    ],
    "editorial-policy.html": [
        ("""<h2>Sponsored visibility</h2>
<p>Some pages may include clearly identified sponsored visibility or featured placement opportunities. Where sponsored placement appears, Lawsuit Center aims to distinguish it from general educational content.</p>""",
         """<h2>Advertising and editorial content</h2>
<p>David Meldofsky decides what Lawsuit Center's educational content says. Firms that receive referrals have no role in writing it.</p>"""),
    ],
    "es/pesticide-case-review.html": [
        ("""      por pesticidas, un patrón de reclamos, una ruta patrocinada de revisión de casos o un posible
      seguimiento por parte de una firma de abogados.""",
         """      por pesticidas, un patrón de reclamos o un posible seguimiento por parte de una firma de
      abogados."""),
        ("""      Si parece haber una posible coincidencia, una firma de abogados participante, un anunciante
      legal, un proveedor de admisión u otro socio puede contactarlo para pedirle más información.""",
         """      Si parece haber una posible coincidencia, David Meldofsky refiere su solicitud a una firma de
      abogados participante, que puede contactarlo para pedirle más información."""),
        ("""      Algunas páginas pueden incluir publicidad de abogados, anuncios patrocinados, visibilidad
      pagada de firmas de abogados u oportunidades relacionadas con referencias. La visibilidad
      patrocinada es publicidad y no debe tratarse como una recomendación ni un respaldo de
      ningún abogado o firma de abogados.""",
         """      Esta página es publicidad de abogados. No debe tratarse como una recomendación ni un
      respaldo de ningún abogado o firma de abogados."""),
    ],
}


def apply_edits(html, rel, notes, problems):
    for old, new in EDITS.get(rel, []):
        if old.startswith("SECTION:"):
            marker = old[len("SECTION:"):]
            r = section_with(html, marker)
            if r:
                html = cut_span(html, *r)
                notes.append("removed section " + re.sub(r"<[^>]+>", "", marker))
            continue
        if new and new in html and (old not in new or html.count(old) <= html.count(new)):
            continue
        if old in html:
            html = html.replace(old, new)
            notes.append("edit: " + re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", old)).strip()[:60])
        elif not new:
            continue
        else:
            problems.append("text not found: " + re.sub(r"\s+", " ", old).strip()[:90])
    return html


def bump_dates(html, rel, notes):
    if rel not in DATED:
        return html
    new = re.sub(r'("dateModified":\s*")(\d{4}-\d{2}-\d{2})(T[^"]*)?(")',
                 lambda m: m.group(1) + TODAY_ISO + (m.group(3) or "") + m.group(4), html)
    new = re.sub(r'(Updated <time datetime=")\d{4}-\d{2}-\d{2}(">)[^<]*(</time>)',
                 r"\g<1>" + TODAY_ISO + r"\g<2>" + TODAY_TXT + r"\g<3>", new)
    new = re.sub(r'(<meta property="article:modified_time" content=")[^"]*(")',
                 r"\g<1>" + TODAY_ISO + r"\g<2>", new)
    if new != html:
        notes.append("dateModified -> " + TODAY_ISO)
    return new


INTAKE_SPONSOR_P = re.compile(
    r"(<p>)(\s*)Some pages may include attorney advertising, sponsored listings, paid law firm visibility,"
    r"\s+or\s+referral-related opportunities\.\s+Sponsored visibility is advertising and should not be"
    r"\s+treated\s+as a recommendation or endorsement of any attorney or law firm\.(\s*)(</p>)")


def intake_sponsor_p(html, notes):
    new, n = INTAKE_SPONSOR_P.subn(
        lambda m: m.group(1) + m.group(2) + "This page is attorney advertising. It is not a recommendation"
        " or endorsement of any attorney or law firm." + m.group(3) + m.group(4), html)
    if n:
        notes.append("intake disclosure paragraph")
    return new


def process_html(rel, html):
    notes, problems = [], []
    spanish = rel.startswith("es/")
    html = apply_edits(html, rel, notes, problems)
    for old, new in PLAIN_SWAPS:
        if old in html:
            html = html.replace(old, new)
            notes.append("swap: " + re.sub(r"<[^>]+>", "", old)[:50])
    for old in PLAIN_REMOVALS:
        i = html.find(old)
        if i >= 0:
            html = cut_span(html, i, i + len(old))
            notes.append("removed sponsored-placement note")
    for marker in REMOVE_SECTIONS_BY_MARKER:
        r = section_with(html, marker)
        if r:
            html = cut_span(html, *r)
            notes.append("removed section " + re.sub(r"<[^>]+>", "", marker))
    html = intake_sponsor_p(html, notes)
    html = sponsoring_firm(html, rel, notes, problems)
    html = featured_to_cta(html, notes, problems, spanish)
    html = fix_breadcrumb_ld(html, notes)
    html = remove_links(html, notes)
    html = remove_empty(html, notes)
    if rel == "lawsuits.html":
        html = realternate_cat_sections(html)
    if rel == "text-review.html":
        o = '           <option value="truck-accident-case-review">Truck accident</option>\n'
        if o in html:
            html = html.replace(o, "")
            notes.append("removed truck option")
    return html, notes, problems


# ---------------------------------------------------------------- other files

def process_search_js(text, notes):
    for slug in CUT:
        pat = re.compile(r'\n?[ \t]*\{ url: "%s",.*?" \},[ \t]*\n' % re.escape(slug), re.S)
        text, n = pat.subn("\n", text)
        if n:
            notes.append("search.js entry " + slug)
    return re.sub(r"\n{3,}", "\n\n", text)


def process_llms(text, notes):
    out = []
    for line in text.split("\n"):
        m = re.search(r"\(https://lawsuit\.center/([a-z0-9-]+)\)", line)
        if m and m.group(1) in CUTSET:
            notes.append("llms.txt " + m.group(1))
            continue
        out.append(line)
    text = "\n".join(out)
    # a heading left with nothing under it
    return re.sub(r"\n## [^\n]+\n(?=\n## |\n*\Z)", "\n", text)


# ---------------------------------------------------------------- check mode

LEFTOVER = re.compile(
    r"sponsored law firm|sponsored listing|sponsored visibility|sponsored placement|featured placement|"
    r"paid placement|paid visibility|paid firm visibility|pay for visibility|For Law Firms|"
    r"Para Firmas de Abogados|patrocinad|ubicación destacada|Founding Sponsor", re.I)


def check(root):
    bad = []
    for slug in CUT:
        if os.path.exists(os.path.join(root, slug + ".html")):
            bad.append("page is back: %s.html" % slug)
    for rel, html in iter_html(root):
        for m in HREF.finditer(html):
            if target_slug(m.group(1)):
                bad.append("%s links to %s" % (rel, target_slug(m.group(1))))
        for m in LD_BLOCK.finditer(html):
            for u in LD_URL.finditer(m.group(2)):
                if u.group(1) in CUTSET:
                    bad.append("%s structured data points to %s" % (rel, u.group(1)))
        body = re.sub(r"<(script|style)\b.*?</\1>", "", html, flags=re.S)
        body = re.sub(r'<div class="site-footer__legal">.*?</div>', "", body, flags=re.S)
        for m in LEFTOVER.finditer(body):
            ctx = re.sub(r"\s+", " ", body[max(0, m.start() - 60):m.end() + 40])
            bad.append("%s: paid-placement copy: ...%s..." % (rel, re.sub(r"<[^>]+>", "", ctx)))
    for fn in ("search.js", "llms.txt"):
        p = os.path.join(root, fn)
        if os.path.exists(p):
            t = open(p, encoding="utf-8").read()
            for slug in CUT:
                if re.search(r'(?<![\w-])%s(?![\w-])' % re.escape(slug), t):
                    bad.append("%s mentions %s" % (fn, slug))
    return bad


def iter_html(root):
    for d, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if not x.startswith(".") and x not in ("node_modules", "case-filings", "fonts")]
        for fn in sorted(files):
            if fn.endswith(".html"):
                p = os.path.join(d, fn)
                rel = os.path.relpath(p, root).replace(os.sep, "/")
                with open(p, encoding="utf-8") as fh:
                    yield rel, fh.read()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default=".")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    root = a.path

    if a.check:
        bad = check(root)
        if bad:
            print("%d problems:" % len(bad))
            for b in bad:
                print("  " + b)
            sys.exit(1)
        print("Clean: no deleted page, no link to one, no paid-placement copy.")
        return

    deleted = [s + ".html" for s in CUT if os.path.exists(os.path.join(root, s + ".html"))]
    changed, problems = [], []
    writes = {}
    for rel, html in iter_html(root):
        if rel in deleted:
            continue
        new, notes, probs = process_html(rel, html)
        if probs:
            problems.append((rel, probs))
            continue
        if new != html:
            new = bump_dates(new, rel, notes)
            changed.append((rel, notes))
            writes[rel] = new
    for fn, fx in (("search.js", process_search_js), ("llms.txt", process_llms)):
        p = os.path.join(root, fn)
        if os.path.exists(p):
            t = open(p, encoding="utf-8").read()
            notes = []
            nt = fx(t, notes)
            if nt != t:
                changed.append((fn, notes))
                writes[fn] = nt

    if a.apply:
        for rel in deleted:
            os.remove(os.path.join(root, rel))
        for rel, t in writes.items():
            with open(os.path.join(root, rel), "w", encoding="utf-8") as fh:
                fh.write(t)

    verb = "" if a.apply else "would be "
    print("%3d pages %sdeleted" % (len(deleted), verb))
    print("%3d files %schanged" % (len(changed), verb))
    print("%3d pages with problems (left untouched)" % len(problems))
    print()
    for rel in deleted:
        print("  delete " + rel)
    for rel, notes in changed:
        summary = {}
        for n in notes:
            k = re.sub(r" [a-z0-9-]+$", "", n) if n.split(" ")[-1] in CUTSET else n
            summary[k] = summary.get(k, 0) + 1
        print("  %s: %s" % (rel, "; ".join(k + (" x%d" % v if v > 1 else "") for k, v in summary.items())))
    for rel, probs in problems:
        for p in probs:
            print("  PROBLEM %s: %s" % (rel, p))

    if problems:
        sys.exit(2)


if __name__ == "__main__":
    main()
