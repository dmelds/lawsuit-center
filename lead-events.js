/* Lawsuit Center lead events. lead_events v4.
 *
 * The intake form lives here, so a completed submission is the only true
 * conversion in the two-site funnel. This script records it as generate_lead
 * and, since v2, opens the form at the situation the visitor already chose
 * on Lawsuit Informer.
 *
 * Four parts, one file, self-detecting by what is on the page.
 *
 * PREFILL. Informer's hero and inline links append ?situation=<option value>.
 * On a form page that carries that param, the first select in the intake
 * form holding an option with that exact value is set to it and the page
 * scrolls to the form. A value that matches nothing leaves the form alone,
 * and a page with no intake form ignores the param. The match is on the
 * option's value attribute, not its label, so copy edits do not break it.
 *
 * CAPTURE. On a form page, a submit handler stashes a small payload in
 * sessionStorage: the form name, the raw value of the situation select, the
 * utm_content slot the visitor arrived on, and the page they submitted from.
 * The handler is registered on DOMContentLoaded so that it runs AFTER the
 * validation handler in form-validation.js, which registers there too but
 * earlier in the parse. A submit that validation has blocked arrives here
 * with defaultPrevented set and writes nothing. v1 registered at script
 * execution time, which put it ahead of validation, so a visitor who failed
 * validation and later reached any thank-you page produced a false lead.
 *
 * FIRE. On a thank-you page, the payload is read back, sent as generate_lead,
 * and cleared. Firing here rather than at submit time is deliberate. A submit
 * handler fires even when Netlify rejects the post for a failed recaptcha, so
 * it counts attempts. A thank-you page load only happens on success.
 *
 * gtag arrives through Netlify snippet injection and loads after this script,
 * so fire() waits for it, polling every 250 ms for up to 10 seconds. The
 * payload is cleared the moment gtag is found and immediately before the
 * event is sent, so a reload cannot send it twice. If gtag never appears the
 * payload stays put and the next thank-you load in the same tab sends it.
 * v1 cleared the payload before checking for gtag, and because gtag was never
 * present at that instant, no generate_lead event was ever sent.
 *
 * The payload uses its own key, lc_lead, rather than the existing lc_category.
 * The inline block on each thank-you page removes lc_category as soon as it
 * rewrites the heading, so reading that key would make this script depend on
 * which handler happens to run first.
 *
 * v3 changes how intake forms are found. v1 and v2 selected
 * form[data-netlify][name], but Netlify's form processing strips the
 * data-netlify attribute from the deployed HTML. The repo source carries it,
 * the live page does not, so on production the selector matched nothing:
 * no prefill ran, no payload was captured, and no generate_lead was ever
 * sent. v3 selects any named form that posts (method="POST"), which is how
 * every intake form on this site is built and which Netlify leaves in place.
 * add_lead_events.py still keys on data-netlify, and that is correct there,
 * because it reads the repo source, not the deployed page.
 *
 * Fires nothing when the page is reached directly with no stored payload, so
 * a bookmarked or crawled thank-you URL does not inflate the count.
 *
 * STEPS (v4). On a form page, every intake form reports how far a visitor
 * got, as GA4 event form_step. One event name, told apart by step_action:
 *
 *   view            the form scrolled into the viewport
 *   enter           first time a field took focus (or changed, for controls
 *                   Safari never focuses, such as checkboxes)
 *   filled / empty  the visitor left the field, with or without a value,
 *                   and step_seconds spent in it
 *   error           form-validation.js rejected the field; step_error names
 *                   the rule (email_typo, phone_short, name_one_word ...)
 *   submit_blocked  Submit was pressed and nothing was posted. step_error is
 *                   "required" or "format" when the browser stopped it, or
 *                   the validation rule when form-validation.js did.
 *                   step_fields lists every field that failed
 *   submit_sent     the post left the page. step_recaptcha says whether the
 *                   reCAPTCHA box was solved at that moment. A submit_sent
 *                   that is never followed by generate_lead was refused by
 *                   Netlify, and "unsolved" is the usual reason
 *   leave_page      the tab was hidden or closed after the form was touched
 *                   and before a post; step_field is the field the visitor
 *                   was in, step_seconds how long they had been there
 *
 * The reCAPTCHA box is reported as field "recaptcha": enter when its frame
 * takes focus, filled when a response token appears, with the seconds the
 * challenge took.
 *
 * Every event carries lead_form, step_field, step_index (the field's place in
 * the form, 1-based), step_seq (order within the page load), and step_at
 * (seconds since the page loaded). Events queue until gtag exists, so
 * step_seq and step_at are the clock to trust, not the GA4 timestamp.
 *
 * No field VALUE is ever read into an event. Only field names, whether a
 * field holds something, timings, and rule names leave the page. The
 * validation message itself is never sent, because the email typo message
 * repeats the address the visitor typed.
 *
 * The step listeners register after capture(), so they see the same
 * defaultPrevented flag and the two agree on whether a post went out.
 *
 * Not every named form on this site is a claim. The contact form, the law firm
 * sponsorship inquiry, and the retainer review all post to the same thank-you
 * page as the intake forms. Counting those as generate_lead would fold inbound
 * sponsorship mail into the headline conversion number, so they are skipped by
 * name in NOT_A_LEAD below. Add to that list, do not remove from it, when a new
 * non-claimant form ships.
 */
(function () {
  "use strict";

  var KEY = "lc_lead";
  var PREFILL_PARAM = "situation";
  var GTAG_POLL_MS = 250;
  var GTAG_POLL_LIMIT = 40; /* 40 x 250 ms = 10 s */
  var STEP_EVENT = "form_step";
  var STEP_LIMIT = 80;          /* events per page load, a runaway guard */
  var STEP_ERROR_REPEATS = 3;   /* same rule on the same field */
  var RECAPTCHA_WATCH_MS = 180000;

  /* Named forms that post to a thank-you page but are not claimant intakes. */
  var NOT_A_LEAD = {
    "site-contact": 1,        /* contact.html - general enquiries */
    "law-firm-inquiry": 1,    /* law-firm-inquiry.html - sponsorship, inbound sales */
    "retainer-review": 1      /* educational-review.html - retainer agreement review */
  };

  function read(key) {
    try { return sessionStorage.getItem(key); } catch (e) { return null; }
  }

  function write(key, value) {
    try { sessionStorage.setItem(key, value); } catch (e) {}
  }

  function clear(key) {
    try { sessionStorage.removeItem(key); } catch (e) {}
  }

  function param(name) {
    try {
      return new URLSearchParams(location.search).get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function intakeForms() {
    /* Not form[data-netlify]: Netlify strips that attribute on deploy. */
    var all = document.querySelectorAll("form[name][method]");
    var out = [];
    for (var i = 0; i < all.length; i++) {
      var name = all[i].getAttribute("name") || "";
      var method = (all[i].getAttribute("method") || "").toUpperCase();
      if (method === "POST" && !NOT_A_LEAD[name]) out.push(all[i]);
    }
    return out;
  }

  /* ---- prefill: runs on a form page reached with ?situation=<value> ---- */
  function prefill(forms) {
    var wanted = param(PREFILL_PARAM);
    if (!wanted) return;
    wanted = wanted.replace(/\s+/g, " ").trim();
    if (!wanted) return;

    for (var f = 0; f < forms.length; f++) {
      var form = forms[f];
      var selects = form.querySelectorAll("select");
      for (var s = 0; s < selects.length; s++) {
        var select = selects[s];
        for (var o = 0; o < select.options.length; o++) {
          var value = (select.options[o].value || "").replace(/\s+/g, " ").trim();
          if (value && value === wanted) {
            select.value = select.options[o].value;
            try {
              select.dispatchEvent(new Event("change", { bubbles: true }));
            } catch (e) {
              /* Old engines without the Event constructor keep the value; only
                 dependent UI misses the change notification. */
            }
            try { form.scrollIntoView({ block: "start" }); } catch (e2) {}
            return;
          }
        }
      }
    }
  }

  /* ---- capture: runs on any page carrying a named intake form that posts ---- */
  function capture(forms) {
    for (var i = 0; i < forms.length; i++) {
      (function (form) {
        var name = form.getAttribute("name") || "unknown";

        form.addEventListener("submit", function (event) {
          /* form-validation.js has already run for this submit. When it
             blocked the post, nothing was sent and nothing is stored. */
          if (event.defaultPrevented) return;

          /* The situation select is the first select in the form on every
             intake page. Its raw option value is stored rather than the
             display label, because the labels are prose and change with copy
             edits while the values are stable keys. */
          var select = form.querySelector("select");
          var payload = {
            form: name,
            category: (select && select.value) || "none",
            slot: param("utm_content") || "direct",
            source: location.pathname
          };
          try { write(KEY, JSON.stringify(payload)); } catch (e) {}
        });
      })(forms[i]);
    }
  }

  /* ---- steps: runs on a form page, records where a visitor stops ---- */
  var stepQueue = [];
  var stepSeq = 0;
  var stepPolls = 0;
  var stepTimer = null;
  var pageStart = Date.now();

  function seconds(since) {
    return Math.max(0, Math.round((Date.now() - since) / 1000));
  }

  function flushSteps() {
    stepTimer = null;
    if (typeof window.gtag !== "function") {
      stepPolls += 1;
      if (stepPolls < GTAG_POLL_LIMIT) stepTimer = setTimeout(flushSteps, GTAG_POLL_MS);
      return;
    }
    while (stepQueue.length) window.gtag("event", STEP_EVENT, stepQueue.shift());
  }

  function step(params) {
    if (stepSeq >= STEP_LIMIT) return;
    stepSeq += 1;
    params.step_seq = stepSeq;
    params.step_at = seconds(pageStart);
    stepQueue.push(params);
    if (typeof window.gtag === "function") { flushSteps(); return; }
    /* gtag loads late through snippet injection. Each new event restarts the
       10 second wait, so a visitor who is still typing keeps the queue alive.
       A visitor who blocks gtag never sends anything, which is correct. */
    stepPolls = 0;
    if (!stepTimer) stepTimer = setTimeout(flushSteps, GTAG_POLL_MS);
  }

  /* form-validation.js messages mapped to rule names, English and Spanish.
     Matched on the fixed opening words only. The text after them can repeat
     what the visitor typed and is never sent. */
  var RULES = [
    [/^(Please enter your full name|Por favor ingrese su nombre completo)/, "name_short"],
    [/^(Please enter both|Por favor ingrese nombre y apellido)/, "name_one_word"],
    [/^(Please enter your email|Por favor ingrese su correo)/, "email_empty"],
    [/^(Please enter a valid email|Por favor ingrese un correo electrónico válido)/, "email_format"],
    [/^(Please enter a real email|Por favor ingrese un correo electrónico real)/, "email_junk"],
    [/^(Did you mean|\u00bfQuiso decir)/, "email_typo"],
    [/^(Please enter your phone|Por favor ingrese su número)/, "phone_empty"],
    [/^(That is only|Ingresó solo)/, "phone_short"],
    [/^(That is a 1 followed|Es un 1 seguido)/, "phone_missing_digit"],
    [/^(That is|Ingresó)/, "phone_long"],
    [/^(Area codes|Los códigos de área)/, "phone_area_code"],
    [/^(Please check the three|Por favor verifique los tres)/, "phone_exchange"],
    [/^(Please enter a valid 10-digit|Por favor ingrese un número de teléfono válido)/, "phone_invalid"]
  ];

  function ruleFor(input) {
    var name = input.getAttribute("name") || "field";
    var text = "";
    try {
      var el = input.parentNode.querySelector('.field-error[data-for="' + name + '"]');
      text = el ? (el.textContent || "").replace(/^\s+/, "") : "";
    } catch (e) {}
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i][0].test(text)) return RULES[i][1];
    }
    return name + "_invalid";
  }

  function watch(form) {
    var formName = form.getAttribute("name") || "unknown";
    var slot = param("utm_content") || "direct";
    var honeypot = form.getAttribute("netlify-honeypot") || "bot-field";

    var order = [];     /* field names in page order, "recaptcha" last */
    var fields = {};    /* name -> { entered, since, last, errors } */
    var current = "";   /* the field the visitor is in, or was in last */
    var touched = false;
    var posted = false;
    var attempts = 0;
    var hidden = false;
    var leaves = 0;

    function fieldOf(node) {
      if (!node || !node.getAttribute || !form.contains(node)) return "";
      var tag = (node.tagName || "").toLowerCase();
      if (tag !== "input" && tag !== "select" && tag !== "textarea") return "";
      var type = (node.getAttribute("type") || "").toLowerCase();
      if (type === "hidden" || type === "submit" || type === "button" ||
          type === "reset" || type === "image") return "";
      var name = node.getAttribute("name") || "";
      if (!name || name === honeypot || name.indexOf("g-recaptcha") === 0) return "";
      return name;
    }

    function slotFor(name) {
      if (!fields[name]) {
        fields[name] = { entered: false, since: 0, last: "", rule: "", errors: {} };
        order.push(name);
      }
      return fields[name];
    }

    function recaptchaBox() {
      return form.querySelector(".g-recaptcha, div[data-netlify-recaptcha]");
    }

    function recaptchaToken() {
      return form.querySelector('textarea[name="g-recaptcha-response"]');
    }

    function recaptchaState() {
      var token = recaptchaToken();
      if (token) return token.value ? "solved" : "unsolved";
      return recaptchaBox() ? "not_loaded" : "none";
    }

    function isFilled(name) {
      if (name === "recaptcha") return recaptchaState() === "solved";
      var all = form.querySelectorAll("input, select, textarea");
      for (var i = 0; i < all.length; i++) {
        if (fieldOf(all[i]) !== name) continue;
        var type = (all[i].getAttribute("type") || "").toLowerCase();
        if (type === "checkbox" || type === "radio") {
          if (all[i].checked) return true;
        } else if ((all[i].value || "").replace(/\s+/g, "") !== "") {
          return true;
        }
      }
      return false;
    }

    function filledCount() {
      var n = 0;
      for (var i = 0; i < order.length; i++) if (isFilled(order[i])) n += 1;
      return n;
    }

    function send(action, name, extra) {
      var params = {
        lead_form: formName,
        lead_slot: slot,
        step_action: action,
        step_field: name,
        step_index: order.indexOf(name) + 1   /* 0 for "form" and "submit" */
      };
      if (extra) for (var k in extra) if (extra.hasOwnProperty(k)) params[k] = extra[k];
      step(params);
    }

    function enter(name) {
      var f = slotFor(name);
      touched = true;
      current = name;
      f.since = Date.now();
      if (f.entered) return;
      f.entered = true;
      send("enter", name);
    }

    function leave(name) {
      var f = slotFor(name);
      var outcome = isFilled(name) ? "filled" : "empty";
      if (f.last === outcome) return;
      f.last = outcome;
      send(outcome, name, { step_seconds: f.since ? seconds(f.since) : 0 });
    }

    /* The form's fields in page order, fixed before anything is typed so
       step_index means the same thing on every visit. */
    (function () {
      var all = form.querySelectorAll("input, select, textarea");
      for (var i = 0; i < all.length; i++) {
        var name = fieldOf(all[i]);
        if (name) slotFor(name);
      }
      if (recaptchaBox()) slotFor("recaptcha");
    })();

    form.addEventListener("focusin", function (event) {
      var name = fieldOf(event.target);
      if (name) enter(name);
    });

    form.addEventListener("focusout", function (event) {
      var name = fieldOf(event.target);
      if (name) leave(name);
    });

    form.addEventListener("input", function (event) {
      var name = fieldOf(event.target);
      if (name && fields[name]) fields[name].rule = "";
    });

    /* Safari does not focus a checkbox, a radio button or (on a Mac) a select
       when it is clicked, and browser autofill writes several fields without
       focusing any of them. change covers all three. */
    form.addEventListener("change", function (event) {
      var name = fieldOf(event.target);
      if (!name) return;
      var f = slotFor(name);
      if (!f.entered) enter(name);
      leave(name);
    });

    /* A rule in form-validation.js failed. It marks the input aria-invalid
       after writing the message, on blur and again on a blocked submit. */
    if (typeof MutationObserver === "function") {
      new MutationObserver(function (records) {
        for (var i = 0; i < records.length; i++) {
          var node = records[i].target;
          if (node.getAttribute("aria-invalid") !== "true") continue;
          var name = fieldOf(node);
          if (!name) continue;
          var rule = ruleFor(node);
          var f = slotFor(name);
          /* A blocked submit re-marks every field that was already marked on
             blur. Until the visitor edits the field, the same rule is the
             same error and is reported once. */
          if (f.rule === rule) continue;
          f.rule = rule;
          f.errors[rule] = (f.errors[rule] || 0) + 1;
          if (f.errors[rule] > STEP_ERROR_REPEATS) continue;
          send("error", name, { step_error: rule });
        }
      }).observe(form, { attributes: true, subtree: true, attributeFilter: ["aria-invalid"] });
    }

    /* Submit pressed, browser refused: a required field is empty or an email
       is malformed. No submit event fires in that case, only one invalid
       event per failing field, in page order. They are gathered and reported
       as one blocked attempt. */
    var refused = [];
    var refusedTimer = null;

    form.addEventListener("invalid", function (event) {
      var name = fieldOf(event.target);
      if (!name) return;
      var v = event.target.validity || {};
      refused.push({ name: name, rule: v.valueMissing ? "required" : (v.typeMismatch ? "format" : "browser") });
      if (refusedTimer) return;
      refusedTimer = setTimeout(function () {
        refusedTimer = null;
        var batch = refused;
        refused = [];
        if (!batch.length) return;
        var names = [];
        for (var i = 0; i < batch.length; i++) {
          if (names.indexOf(batch[i].name) === -1) names.push(batch[i].name);
        }
        attempts += 1;
        touched = true;
        send("submit_blocked", batch[0].name, {
          step_error: batch[0].rule,
          step_fields: names.join(",").slice(0, 100),
          step_attempt: attempts,
          step_filled: filledCount(),
          step_total: order.length
        });
      }, 0);
    }, true);

    /* Submit pressed and the browser let it through. form-validation.js and
       capture() have both already run. */
    form.addEventListener("submit", function (event) {
      attempts += 1;
      touched = true;
      if (event.defaultPrevented) {
        var bad = form.querySelectorAll('[aria-invalid="true"]');
        var names = [];
        var first = null;
        for (var i = 0; i < bad.length; i++) {
          var name = fieldOf(bad[i]);
          if (!name || names.indexOf(name) !== -1) continue;
          names.push(name);
          if (!first) first = bad[i];
        }
        send("submit_blocked", names[0] || "submit", {
          step_error: first ? ruleFor(first) : "validation",
          step_fields: names.join(",").slice(0, 100),
          step_attempt: attempts,
          step_filled: filledCount(),
          step_total: order.length
        });
        return;
      }
      posted = true;
      send("submit_sent", "submit", {
        step_recaptcha: recaptchaState(),
        step_attempt: attempts,
        step_filled: filledCount(),
        step_total: order.length
      });
    });

    /* The reCAPTCHA box is a cross-origin frame, so it raises no focus event
       inside the form. When the window loses focus to a frame that sits in
       this form, the visitor has clicked the box. From then the response
       field is checked once a second until a token appears. */
    var recaptchaTimer = null;

    window.addEventListener("blur", function () {
      setTimeout(function () {
        var active = document.activeElement;
        if (!active || (active.tagName || "").toLowerCase() !== "iframe") return;
        if (!form.contains(active)) return;
        enter("recaptcha");
        if (recaptchaTimer || fields.recaptcha.last === "filled") return;
        var started = Date.now();
        recaptchaTimer = setInterval(function () {
          if (recaptchaState() === "solved") {
            clearInterval(recaptchaTimer);
            recaptchaTimer = null;
            leave("recaptcha");
          } else if (Date.now() - started > RECAPTCHA_WATCH_MS) {
            clearInterval(recaptchaTimer);
            recaptchaTimer = null;
          }
        }, 1000);
      }, 0);
    });

    /* The tab was hidden or closed with the form started and not posted.
       Sent at most twice per page load, because a visitor who switches tabs
       to look up a date comes back; the last form_step of the session says
       where they finally stopped. */
    function left() {
      if (hidden) return;
      hidden = true;
      if (!touched || posted || leaves >= 2) return;
      leaves += 1;
      var f = current ? fields[current] : null;
      send("leave_page", current || "form", {
        step_seconds: f && f.since ? seconds(f.since) : 0,
        step_filled: filledCount(),
        step_total: order.length,
        step_attempt: attempts
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") left();
      else hidden = false;
    });
    window.addEventListener("pagehide", left);

    /* The form came into view. Says whether a visitor who never touched a
       field at least scrolled far enough to see one. */
    if (typeof IntersectionObserver === "function") {
      var seen = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          seen.disconnect();
          send("view", "form", { step_total: order.length });
          return;
        }
      });
      seen.observe(form);
    }
  }

  function steps(forms) {
    for (var i = 0; i < forms.length; i++) {
      try { watch(forms[i]); } catch (e) { /* never let tracking break a form */ }
    }
  }

  /* ---- fire: runs on any page that finds a stored payload ---- */
  function fire() {
    var raw = read(KEY);
    if (!raw) return;

    var payload;
    try { payload = JSON.parse(raw); } catch (e) { clear(KEY); return; }

    var attempts = 0;

    function send() {
      if (typeof window.gtag !== "function") {
        attempts += 1;
        if (attempts < GTAG_POLL_LIMIT) setTimeout(send, GTAG_POLL_MS);
        return;
      }

      /* Clear immediately before sending, never earlier. A reload after this
         point finds no payload; a reload before it retries from scratch. */
      clear(KEY);

      window.gtag("event", "generate_lead", {
        lead_form: payload.form || "unknown",
        lead_category: payload.category || "none",
        lead_slot: payload.slot || "direct",
        lead_source: payload.source || "unknown"
      });
    }

    send();
  }

  function init() {
    var forms = intakeForms();
    if (forms.length) {
      prefill(forms);
      capture(forms);
      steps(forms);
    }
    fire();
  }

  /* Register on DOMContentLoaded even though this script is deferred and the
     DOM is already parsed. Listeners run in registration order, and the
     validation handler registered its own DOMContentLoaded listener during
     the parse, so deferring init to the same event puts the submit handler
     below it. readyState is "complete" only if the script was injected after
     load, in which case DOMContentLoaded has passed and init runs at once. */
  if (document.readyState === "complete") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
