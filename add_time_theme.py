#!/usr/bin/env python3
"""Switch light and dark mode by time of day on every page.

Until 11/5/26 a visitor with no saved choice always got dark mode
(FOLLOW_OS = false in LC-LIGHT-INIT and LC-LIGHT-JS). This sweep makes the
site follow the visitor's own clock instead: dark from 7 pm to 7 am, light the
rest of the day. Lawsuit Informer switched to the same schedule the same day,
so a reader moving between the two sites sees one theme.

  * LC-LIGHT-INIT picks the theme before first paint from the hour on the
    visitor's device. A saved toggle choice (localStorage lc-theme) and the
    ?theme= handoff from lawsuitinformer.com still win, exactly as before.
  * LC-LIGHT-JS replaces the (switched-off) OS listener with followClock(): it
    repaints at the next 7 pm or 7 am while the page is open and rechecks when
    the tab comes back into view. It does nothing once the visitor has clicked
    the toggle.

The hours live in DARK_FROM / DARK_UNTIL, written once in each block. Change
both pairs together, and keep them equal to Informer's.

Dry run by default; --apply writes. Idempotent: a page that already carries
followClock is left alone, so a rerun reports zero files patched. A page whose
theme block differs from the expected text is reported and makes the run exit 1.
The LC-LIGHT-JS:BEGIN marker that add_attribution.py and add_lead_events.py
anchor on is untouched.
"""
import argparse
import io
from pathlib import Path

GUARD = "function followClock()"

INIT_FLAG = "  var FOLLOW_OS = false; /* dark stays the default; set true to auto-match visitor OS */\n"
INIT_OLD = """  if (t !== 'dark' && t !== 'light') {
    t = (FOLLOW_OS && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }"""
INIT_NEW = """  if (t !== 'dark' && t !== 'light') {
    /* No saved choice: follow the visitor's own clock. Dark from DARK_FROM to
       DARK_UNTIL (24-hour, device local time). LC-LIGHT-JS keeps it in step. */
    var DARK_FROM = 19, DARK_UNTIL = 7, h = new Date().getHours();
    t = (h >= DARK_FROM || h < DARK_UNTIL) ? 'dark' : 'light';
  }"""
JS_FLAG = "  var FOLLOW_OS = false; /* keep in sync with the init script */\n"
JS_OLD = """  /* Track OS changes until a manual choice - only when FOLLOW_OS is on */
  if (FOLLOW_OS && window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: light)');
    var onChange = function (e) {
      var stored = null;
      try { stored = localStorage.getItem('lc-theme'); } catch (err) {}
      if (stored !== 'dark' && stored !== 'light') paint(e.matches ? 'light' : 'dark');
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }"""
JS_NEW = """  /* Time-of-day theme: with no saved choice, switch at 7 pm and 7 am on the
     visitor's clock while the page is open, and recheck when the tab comes
     back. Keep DARK_FROM / DARK_UNTIL in step with LC-LIGHT-INIT. */
  var DARK_FROM = 19, DARK_UNTIL = 7, clockTimer = null;
  function saved() {
    var s = null;
    try { s = localStorage.getItem('lc-theme'); } catch (err) {}
    return (s === 'dark' || s === 'light') ? s : null;
  }
  function byClock() {
    var h = new Date().getHours();
    return (h >= DARK_FROM || h < DARK_UNTIL) ? 'dark' : 'light';
  }
  function followClock() {
    clearTimeout(clockTimer);
    if (saved()) return;
    if (current() !== byClock()) paint(byClock());
    var now = new Date(), next = new Date(now);
    next.setHours(byClock() === 'dark' ? DARK_UNTIL : DARK_FROM, 0, 5, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    clockTimer = setTimeout(followClock, Math.min(next - now, 3600000));
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) followClock();
  });
  followClock();"""
PAIRS = ((INIT_FLAG, ""), (INIT_OLD, INIT_NEW), (JS_FLAG, ""), (JS_OLD, JS_NEW))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default=".")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    patched, present, problems = [], [], []
    for path in sorted(Path(args.path).rglob("*.html")):
        if ".git" in path.parts or "node_modules" in path.parts:
            continue
        html = io.open(path, encoding="utf-8").read()
        if "LC-LIGHT-INIT:BEGIN" not in html:
            continue
        if GUARD in html:
            present.append(str(path))
            continue
        if any(html.count(old) != 1 for old, _ in PAIRS):
            problems.append(str(path))
            continue
        for old, new in PAIRS:
            html = html.replace(old, new, 1)
        patched.append(str(path))
        if args.apply:
            io.open(path, "w", encoding="utf-8").write(html)

    mode = "APPLIED" if args.apply else "DRY RUN (no files written)"
    print(f"time-of-day theme sweep - {mode}")
    print(f"  {len(patched)} files patched, {len(present)} already followed the clock")
    print(f"  {len(problems)} files could not be patched")
    for p in problems:
        print(f"    {p}  [SKIPPED - theme block differs from the expected text]")
    if not args.apply:
        for p in patched[:20]:
            print(f"    + {p}")
        if len(patched) > 20:
            print(f"    ... and {len(patched) - 20} more")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
