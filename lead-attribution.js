/* Lawsuit Center. Copyright (c) 2026 David Meldofsky. All rights reserved.
   No license is granted to copy, modify or redistribute this code.

   First-touch attribution for intake forms. Loaded on every page.

   On every page load: if the URL carries UTM parameters, or nothing is stored yet, record
   this visit as the first touch (UTMs, document.referrer, landing path) in sessionStorage.
   On a page with an intake form: fill that form's hidden utm_* / page_referrer /
   landing_page inputs from the stored first touch, falling back to this page's own values.

   First-party, inline, no third-party host, so tracker blockers that take googletagmanager
   dark leave this alone. sessionStorage lives for the tab; a private window that refuses
   storage still gets the current page's referrer and UTMs. consent_version is static in the
   HTML and is never touched here.

   A slot= parameter on the URL fills utm_content when the real tag is missing. */
(function () {
  var KEY = "lc_attr";
  var UTMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  function read() {
    try { var v = sessionStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function write(v) {
    try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage refused */ }
  }
  function current() {
    var q = {};
    try {
      var sp = new URLSearchParams(location.search);
      UTMS.forEach(function (k) { var v = sp.get(k); if (v) q[k] = String(v).slice(0, 100); });
      /* Informer's buttons repeat their slot name in a plain slot= parameter
         (cta_click listener v5). Link-cleaning browser tools remove utm_* before
         this page loads and leave slot alone, so when utm_content is missing the
         slot stands in for it. utm_source stays empty in that case, which is how
         a lead with stripped tags can be told from one with its tags intact. */
      var slot = sp.get("slot");
      if (slot && !q.utm_content) q.utm_content = String(slot).slice(0, 100);
    } catch (e) { /* old browser */ }
    var ref = "";
    try { ref = document.referrer || ""; } catch (e) { /* ignore */ }
    var sameSite = false;
    try { sameSite = !!ref && new URL(ref).hostname.replace(/^www\./, "") === location.hostname.replace(/^www\./, ""); } catch (e) { /* ignore */ }
    return {
      utm: q,
      hasUtm: Object.keys(q).length > 0,
      referrer: sameSite ? "" : ref.slice(0, 500),
      landing: (location.pathname + location.search).slice(0, 300),
      at: Date.now()
    };
  }

  var now = current();
  var first = read();
  // A new campaign click overrides an older first touch; an internal page view never does.
  if (!first || now.hasUtm || (!first.hasUtm && !first.referrer && now.referrer)) {
    first = now;
    write(first);
  }

  function fill() {
    var forms = document.querySelectorAll("form");
    for (var i = 0; i < forms.length; i++) {
      var f = forms[i];
      var probe = f.querySelector('input[name="landing_page"]');
      if (!probe) continue;
      UTMS.forEach(function (k) {
        var el = f.querySelector('input[name="' + k + '"]');
        if (el && !el.value) el.value = first.utm[k] || now.utm[k] || "";
      });
      var r = f.querySelector('input[name="page_referrer"]');
      if (r && !r.value) r.value = first.referrer || now.referrer || "";
      if (!probe.value) probe.value = first.landing || now.landing || "";
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill);
  else fill();

  /* phone_click: a tap on any tel: link. Every page shows the same number, so
     the call itself cannot say which page it came from; this event can. It
     carries where on the page the link sat (form or footer), the first-touch
     slot and source, and GA4 adds page_location on its own. Desktop readers
     who dial by hand stay unattributed. gtag arrives through Netlify snippet
     injection; a click lands long after load, so if gtag is still absent the
     reader is blocking it and the event is simply not sent. */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (!a || typeof window.gtag !== "function") return;
    var place = a.closest("form") ? "form" : (a.closest("footer") ? "footer" : "body");
    var form = a.closest("form");
    var formName = form && form.getAttribute("name") ? form.getAttribute("name") : "none";
    window.gtag("event", "phone_click", {
      phone_number: (a.getAttribute("href") || "").replace(/^tel:/, ""),
      phone_placement: place,
      lead_form: formName,
      lead_slot: (first.utm && first.utm.utm_content) || (now.utm && now.utm.utm_content) || "direct",
      lead_source: (first.utm && first.utm.utm_source) || (now.utm && now.utm.utm_source) || "unknown"
    });
  }, true);
})();
