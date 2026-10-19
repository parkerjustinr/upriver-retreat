/* Event kit - renders every section from data/event.json. Vanilla JS, no build step.
   Sections render in the order listed in data.sections; set "on": false to hide one.
   "welcome" renders into the hero; everything else renders into #sections. */
(function () {
  "use strict";

  var D = null;              // event data
  var state = { guest: null, answers: null, badge: null };
  var PACK_KEY = "upriver27-packing";

  // ---------- helpers ----------
  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  // [PLACEHOLDER] markers get a visible tag so draft copy is obvious on the page.
  function copy(v) { return esc(v).replace(/\[PLACEHOLDER\]\s?/g, '<span class="ph">Placeholder</span> '); }
  function plain(v) { return String(v || "").replace(/\[PLACEHOLDER\]\s?/g, ""); }
  function $(id) { return document.getElementById(id); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------- time ----------
  function tzOffsetMs(date, tz) {
    var p = {};
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    var asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return asUtc - Math.floor(date.getTime() / 1000) * 1000;
  }
  // "2027-05-12" + "09:00" in the event time zone -> a real Date.
  function zoned(dateStr, timeStr) {
    var d = dateStr.split("-"), t = timeStr.split(":");
    var guess = Date.UTC(+d[0], +d[1] - 1, +d[2], +t[0], +t[1]);
    var off = tzOffsetMs(new Date(guess), D.meta.timezone);
    var res = guess - off;
    var off2 = tzOffsetMs(new Date(res), D.meta.timezone);
    if (off2 !== off) res = guess - off2;
    return new Date(res);
  }
  function fmtTime(date) { return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: D.meta.timezone }); }
  function fmtWeekday(date) { return date.toLocaleDateString("en-US", { weekday: "short", timeZone: D.meta.timezone }); }
  function sessionTimes(day, s) {
    var a = zoned(day.date, s.start), b = zoned(day.date, s.end);
    return { start: a, end: b, label: fmtTime(a) + " - " + fmtTime(b) };
  }
  function shuttleTimes(sh) {
    var a = zoned(sh.date, sh.depart);
    return { start: a, end: new Date(a.getTime() + (sh.minutes || 30) * 60000) };
  }
  function shuttleLabel(sh) { return fmtWeekday(shuttleTimes(sh).start) + " " + fmtTime(shuttleTimes(sh).start) + ", " + sh.from; }

  // ---------- calendar (.ics) ----------
  // Times go out in UTC. Lines fold at 75 octets (RFC 5545), never splitting a UTF-8 character.
  function icsStamp(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  function icsText(v) { return plain(v).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function utf8Len(ch) { var c = ch.codePointAt(0); return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4; }
  function fold(line) {
    var out = [], cur = "", bytes = 0, limit = 75;
    Array.from(line).forEach(function (ch) {
      var n = utf8Len(ch);
      if (bytes + n > limit) { out.push(cur); cur = " "; bytes = 1; limit = 75; }
      cur += ch; bytes += n;
    });
    out.push(cur);
    return out.join("\r\n");
  }
  function icsEvent(ev) {
    return ["BEGIN:VEVENT", "UID:" + ev.uid + "@upriver27.ferrow.example", "DTSTAMP:" + icsStamp(new Date()),
      "DTSTART:" + icsStamp(ev.start), "DTEND:" + icsStamp(ev.end), "SUMMARY:" + icsText(ev.summary),
      ev.description ? "DESCRIPTION:" + icsText(ev.description) : null, "LOCATION:" + icsText(ev.location), "END:VEVENT"].filter(Boolean);
  }
  function downloadIcs(events, filename) {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ferrow//Upriver 27//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    events.forEach(function (ev) { lines = lines.concat(icsEvent(ev)); });
    lines.push("END:VCALENDAR");
    var blob = new Blob([lines.map(fold).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function place(p) { return [p, D.meta.venue + ", " + D.meta.city].filter(Boolean).join(", "); }
  // The whole retreat as one calendar. With a pick, the Thursday choice becomes that activity.
  function retreatEvents(pickId) {
    var out = [];
    D.itinerary.days.forEach(function (day) {
      day.sessions.forEach(function (s) {
        var t = sessionTimes(day, s), opt = s.choice && pickId ? byId(s.options, pickId) : null;
        var desc = opt ? opt.detail : s.choice ? "Options: " + s.options.map(function (o) { return o.title; }).join(", ") + "." : s.detail;
        out.push({ uid: s.id + "-" + D.meta.year, start: t.start, end: t.end, summary: D.meta.name + ": " + (opt ? opt.title : s.title),
          description: desc, location: place(opt ? opt.place : s.place) });
      });
    });
    return out;
  }
  function shuttleEvent(sh) {
    var t = shuttleTimes(sh);
    return { uid: "shuttle-" + sh.id + "-" + D.meta.year, start: t.start, end: t.end, summary: "Shuttle: " + sh.from + " to " + sh.to,
      description: "Retreat shuttle for " + D.meta.name + ". Travel questions: " + D.contacts.items[1].name + ".", location: sh.from };
  }

  // ---------- shared bits ----------
  function sectionShell(id, title, inner) {
    return '<section class="section sec-' + id + '" id="' + id + '" aria-labelledby="' + id + '-title">' +
      '<div class="wrap"><h2 class="section-title" id="' + id + '-title">' + copy(title) + "</h2>" + inner + "</div></section>";
  }
  function initials(name) { return name.split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase(); }
  function firstName(name) { return name.split(/\s+/)[0]; }
  function leadsHtml(ids) {
    var list = (ids || []).map(function (id) { return byId(D.people, id); }).filter(Boolean);
    if (!list.length) return "";
    return '<ul class="leads" aria-label="Led by">' + list.map(function (p) {
      var pic = p.photo
        ? '<img class="avatar" src="' + esc(p.photo) + '" alt="" loading="lazy">'
        : '<span class="avatar" aria-hidden="true">' + esc(initials(p.name)) + "</span>";
      return '<li title="' + esc(p.name) + '">' + pic + '<span class="lead-name">' + esc(firstName(p.name)) + "</span></li>";
    }).join("") + "</ul>";
  }
  function typeLabel(type) { return type ? type.charAt(0).toUpperCase() + type.slice(1) : ""; }
  function choiceSession() {
    for (var i = 0; i < D.itinerary.days.length; i++) {
      var s = D.itinerary.days[i].sessions.filter(function (x) { return x.choice; })[0];
      if (s) return s;
    }
    return null;
  }
  function spotsLeft(opt) { return Math.max(0, (opt.capacity || 0) - (opt.taken || 0)); }

  // ---------- sections ----------
  var R = {};

  R.welcome = function () {
    var w = D.welcome, m = D.meta;
    return '<p class="hero-when">' + esc(m.dates) + '<span class="sep" aria-hidden="true">/</span>' + esc(m.venue) + ", " + esc(m.city) + "</p>" +
      '<h1 id="hero-title">' + w.title.map(function (l) { return "<span>" + esc(l) + "</span>"; }).join("") + "</h1>" +
      '<div class="hero-ctas"><a class="btn btn-primary" href="' + esc(w.cta.href) + '">' + esc(w.cta.label) + ' <span class="arrow" aria-hidden="true">&rarr;</span></a>' +
      '<p class="hero-deadline">' + esc(w.deadline) + "</p></div>" +
      (w.quote ? '<figure class="hero-quote"><blockquote><p>' + copy(w.quote) + "</p></blockquote><figcaption>" + esc(w.quoteBy) + "</figcaption></figure>" : "");
  };

  R.itinerary = function () {
    var it = D.itinerary;
    var tabs = '<div class="day-tabs" role="tablist" aria-label="Retreat days">' + it.days.map(function (day, i) {
      return '<button class="day-tab" role="tab" type="button" id="tab-' + day.id + '" aria-controls="panel-' + day.id +
        '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '"><span class="dt-label">' + esc(day.label) +
        '</span><span class="dt-title">' + esc(day.title) + "</span></button>";
    }).join("") + "</div>";
    function optionHtml(o) {
      return '<li class="option type-' + esc(o.type) + '" data-type="' + esc(o.type) + '" id="option-' + o.id + '">' +
        '<h4 class="o-title">' + esc(o.title) + '</h4><p class="s-place">' + esc(o.place) + "</p>" +
        (o.detail ? '<p class="s-detail">' + copy(o.detail) + "</p>" : "") +
        '<p class="o-cap">Up to ' + esc(o.capacity) + " people</p>" + leadsHtml(o.leads) + "</li>";
    }
    var panels = it.days.map(function (day, i) {
      var sorted = day.sessions.slice().sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
      return '<div class="day-panel" role="tabpanel" id="panel-' + day.id + '" aria-labelledby="tab-' + day.id + '"' + (i ? " hidden" : "") + ' tabindex="0">' +
        '<ol class="sessions">' + sorted.map(function (x) {
          var t = sessionTimes(day, x);
          return '<li class="session type-' + esc(x.type) + '" data-type="' + esc(x.type) + '" id="session-' + x.id + '">' +
            '<span class="s-time"><time datetime="' + t.start.toISOString() + '">' + esc(t.label) + "</time></span>" +
            '<div class="s-body"><h3 class="s-title">' + esc(x.title) + "</h3>" +
              (x.choice ? "" : '<p class="s-place">' + esc(x.place) + "</p>") +
              (x.detail ? '<p class="s-detail">' + copy(x.detail) + "</p>" : "") +
              leadsHtml(x.leads) +
              (x.choice ? '<ul class="options">' + x.options.map(optionHtml).join("") + "</ul>" : "") + "</div>" +
            '<span class="s-type">' + esc(typeLabel(x.type)) + "</span>" +
          "</li>";
        }).join("") + "</ol></div>";
    }).join("");
    return sectionShell("itinerary", it.heading, (it.note ? '<p class="note">' + copy(it.note) + "</p>" : "") + tabs + panels +
      '<button type="button" class="btn btn-small ics-btn" data-ics="retreat">Add the retreat to your calendar</button>');
  };

  R.travel = function () {
    var tv = D.travel;
    function shuttleLine(kind) {
      if (kind === "depart") {
        var out = D.shuttles.filter(function (s) { return s.dir === "depart"; }).sort(function (a, b) { return a.depart < b.depart ? -1 : 1; });
        return '<p><span class="ph">Placeholder</span> Shuttles leave the ' + esc(out[0].from.toLowerCase()) + " at " + out.map(function (s) {
          return esc(fmtTime(shuttleTimes(s).start)) + " for " + esc(s.to);
        }).join(" and ") + ".</p>";
      }
      var list = D.shuttles.filter(function (s) { return s.dir === "arrive" && s.mode === kind; });
      if (!list.length) return "";
      return '<p><span class="ph">Placeholder</span> Wednesday shuttles from ' + esc(list[0].from) + ": " +
        list.map(function (s) { return esc(fmtTime(shuttleTimes(s).start)); }).join(", ") + ". Pick yours in the RSVP.</p>";
    }
    return sectionShell("travel", tv.heading, tv.groups.map(function (g) {
      return '<div class="travel-group"><h3 class="group-title">' + esc(g.name) + '</h3><dl class="ruled">' + g.rows.map(function (r) {
        return "<div><dt>" + esc(r.label) + "</dt><dd>" + (r.body ? "<p>" + copy(r.body) + "</p>" : "") + (r.shuttles ? shuttleLine(r.shuttles) : "") + "</dd></div>";
      }).join("") + "</dl></div>";
    }).join(""));
  };

  R.packing = function () {
    var pk = D.packing;
    return sectionShell("packing", pk.heading,
      '<p class="note" id="pack-count" aria-live="polite"></p>' +
      '<div class="pack-groups">' + pk.groups.map(function (g, gi) {
        return '<fieldset class="pack-group"><legend class="group-title">' + esc(g.name) + "</legend>" +
          (g.note ? '<p class="note">' + copy(g.note) + "</p>" : "") +
          '<ul class="checklist">' + g.items.map(function (x) {
            return '<li><label class="check"><input type="checkbox" data-pack="' + esc(x.id) + '"><span>' + esc(x.label) + "</span></label></li>";
          }).join("") + "</ul></fieldset>";
      }).join("") + "</div>");
  };

  function field(id, label, input, opts) {
    opts = opts || {};
    return '<div class="field' + (opts.cls ? " " + opts.cls : "") + '"' + (opts.hidden ? " hidden" : "") + ' id="w-' + id + '"><label for="f-' + id + '">' + esc(label) +
      (opts.optional ? ' <span class="opt">(optional)</span>' : "") + "</label>" + input +
      (opts.hint ? '<span class="hint" id="h-' + id + '">' + esc(opts.hint) + "</span>" : "") +
      '<span class="error" id="e-' + id + '"></span></div>';
  }
  function choiceGroup(id, legend, type, items, opts) {
    opts = opts || {};
    return '<fieldset class="field choice" id="w-' + id + '" aria-describedby="e-' + id + '"><legend>' + esc(legend) +
      (opts.optional ? ' <span class="opt">(optional)</span>' : "") + "</legend>" +
      '<div class="choice-list">' + items.map(function (x) {
        return '<label class="check"><input type="' + type + '" name="' + id + '" value="' + esc(x.id) + '"' + (x.disabled ? " disabled" : "") + ">" +
          '<span>' + esc(x.label) + (x.sub ? ' <span class="opt">' + esc(x.sub) + "</span>" : "") + "</span></label>";
      }).join("") + '</div><span class="error" id="e-' + id + '"></span></fieldset>';
  }

  R.rsvp = function () {
    var r = D.rsvp, pick = choiceSession();
    var teams = '<option value="">Choose your team</option>' + r.teams.map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + "</option>"; }).join("");
    var activities = pick ? pick.options.map(function (o) {
      var left = spotsLeft(o);
      return { id: o.id, label: o.title, sub: left ? left + " of " + o.capacity + " spots left" : "Full", disabled: !left };
    }) : [];
    return sectionShell("rsvp", r.heading,
      '<p class="demo" role="note">' + esc(r.demoNotice) + "</p>" +
      '<div id="rsvp-out"><form class="reg-form" id="rsvp-form" novalidate>' +
        choiceGroup("attending", "Are you coming?", "radio", [{ id: "yes", label: "Yes, I'll be there" }, { id: "no", label: "No, I can't make it" }]) +
        field("name", "Full name", '<input type="text" id="f-name" name="name" autocomplete="name" aria-describedby="e-name">') +
        '<div class="rsvp-branch" id="rsvp-yes" hidden>' +
          field("email", "Work email", '<input type="email" id="f-email" name="email" autocomplete="email" inputmode="email" placeholder="you@' + esc(r.emailDomain) + '" aria-describedby="e-email">') +
          field("team", "Team", '<select id="f-team" name="team" aria-describedby="e-team">' + teams + "</select>") +
          choiceGroup("arriving", "How are you arriving?", "radio", r.arriving) +
          field("window", "Arrival window", '<select id="f-window" name="window" aria-describedby="h-window e-window" disabled><option value="">Choose how you are arriving first</option></select>',
            { hint: "Train and ALB windows match a retreat shuttle." }) +
          choiceGroup("dietary", "Dietary needs", "checkbox", r.dietary, { optional: true }) +
          field("dietnotes", "Tell us more", '<textarea id="f-dietnotes" name="dietnotes" aria-describedby="e-dietnotes"></textarea>', { hidden: true }) +
          (pick ? choiceGroup("activity", "Thursday afternoon", "radio", activities) : "") +
          field("access", "Accessibility notes", '<textarea id="f-access" name="access" aria-describedby="h-access"></textarea>',
            { optional: true, hint: "Anything that helps us plan rooms, rides, or activities for you." }) +
        "</div>" +
        '<div class="rsvp-branch" id="rsvp-no" hidden>' +
          field("note", "Note", '<textarea id="f-note" name="note"></textarea>', { optional: true }) +
        "</div>" +
        '<button type="submit" class="btn btn-primary" id="rsvp-submit">Send RSVP</button>' +
      "</form></div>");
  };

  R.contacts = function () {
    var c = D.contacts;
    return sectionShell("contacts", c.heading, '<ul class="contact-list">' + c.items.map(function (x) {
      var tel = x.phone.replace(/[^\d+]/g, "");
      var shown = x.phone.replace(/^\+1-/, "").replace(/^(\d{3})-/, "($1) ");
      return '<li class="contact"><p class="c-role">' + esc(x.role) + '</p><h3 class="c-name">' + esc(x.name) + "</h3>" +
        '<div class="c-actions"><a class="btn btn-small" href="tel:' + esc(tel) + '">Call ' + esc(shown) + "</a>" +
        '<a class="btn btn-small" href="mailto:' + esc(x.email) + '">' + esc(x.email) + "</a></div>" +
        (x.note ? '<p class="note">' + copy(x.note) + "</p>" : "") + "</li>";
    }).join("") + "</ul>");
  };

  // ---------- wiring ----------
  function wireTabs() {
    var root = $("itinerary");
    if (!root) return;
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { selectTab(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") n = tabs[0];
        if (e.key === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); selectTab(n, true); }
      });
    });
    // During the retreat, open on today's tab.
    var today = new Date().toLocaleDateString("en-CA", { timeZone: D.meta.timezone });
    var day = D.itinerary.days.filter(function (d) { return d.date === today; })[0];
    if (day) selectTab($("tab-" + day.id), false);
  }
  function selectTab(tab, focus) {
    var tabs = $("itinerary").querySelectorAll('[role="tab"]');
    Array.prototype.forEach.call(tabs, function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }

  function wirePacking() {
    var root = $("packing");
    if (!root) return;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(PACK_KEY) || "{}") || {}; } catch (e) { saved = {}; }
    var boxes = Array.prototype.slice.call(root.querySelectorAll("[data-pack]"));
    function count() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      $("pack-count").textContent = n + " of " + boxes.length + " packed";
    }
    boxes.forEach(function (b) {
      b.checked = !!saved[b.getAttribute("data-pack")];
      b.addEventListener("change", function () {
        saved[b.getAttribute("data-pack")] = b.checked;
        try { localStorage.setItem(PACK_KEY, JSON.stringify(saved)); } catch (e) { /* storage blocked: list still works for this visit */ }
        count();
      });
    });
    count();
  }

  function windowOptions(mode) {
    if (mode === "drive") return D.rsvp.driveWindows.map(function (w) { return { value: "drive:" + w, label: w }; });
    return D.shuttles.filter(function (s) { return s.dir === "arrive" && s.mode === mode; }).map(function (s) {
      return { value: s.id, label: plain(s.window) + " (" + fmtTime(shuttleTimes(s).start) + " shuttle)" };
    });
  }

  function wireForm() {
    var form = $("rsvp-form");
    if (!form) return;
    var els = form.elements;
    function sync() {
      var att = form.querySelector('[name="attending"]:checked');
      $("rsvp-yes").hidden = !att || att.value !== "yes";
      $("rsvp-no").hidden = !att || att.value !== "no";
      $("w-name").hidden = !att;
      var other = form.querySelector('[name="dietary"][value="other"]');
      $("w-dietnotes").hidden = !(other && other.checked);
    }
    function fillWindows() {
      var mode = form.querySelector('[name="arriving"]:checked'), sel = els.window, prev = sel.value;
      if (!mode) return;
      sel.disabled = false;
      sel.innerHTML = '<option value="">Choose a window</option>' + windowOptions(mode.value).map(function (o) {
        return '<option value="' + esc(o.value) + '">' + esc(o.label) + "</option>";
      }).join("");
      sel.value = prev;
    }
    form.addEventListener("change", function (e) {
      if (e.target.name === "arriving") fillWindows();
      sync();
    });
    // Restore earlier answers when someone comes back to edit, otherwise pre-fill from ?g=<id>.
    if (state.answers) {
      Object.keys(state.answers).forEach(function (k) {
        var v = state.answers[k];
        Array.prototype.forEach.call(form.querySelectorAll('[name="' + k + '"]'), function (el) {
          if (el.type === "radio" || el.type === "checkbox") el.checked = [].concat(v).indexOf(el.value) > -1;
        });
        if (k === "arriving") fillWindows();
      });
      Object.keys(state.answers).forEach(function (k) {
        var el = els[k];
        if (el && el.tagName && el.type !== "radio" && el.type !== "checkbox") el.value = state.answers[k];
      });
    } else if (state.guest) {
      els.name.value = state.guest.name;
      els.team.value = state.guest.team;
    }
    sync();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      function check(id, msg, focusEl) {
        var w = $("w-" + id), err = $("e-" + id);
        var target = focusEl || $("f-" + id) || (w && w.querySelector("input:not([disabled])"));
        if (target && !w.matches("fieldset")) target.setAttribute("aria-invalid", msg ? "true" : "false");
        if (w && w.matches("fieldset")) w.classList.toggle("is-invalid", !!msg);
        err.textContent = msg || "";
        if (msg && !first) first = target;
      }
      function picked(name) { return form.querySelector('[name="' + name + '"]:checked'); }
      var att = picked("attending");
      check("attending", att ? "" : "Choose yes or no.");
      if (att) check("name", els.name.value.trim() ? "" : "Enter your name.");
      if (att && att.value === "yes") {
        var ev = els.email.value.trim(), dom = D.rsvp.emailDomain;
        check("email", !ev ? "Enter your work email." : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ev) ? "Check the email format, for example you@" + dom + "."
          : ev.toLowerCase().slice(-dom.length - 1) !== "@" + dom ? "Use your @" + dom + " address." : "");
        check("team", els.team.value ? "" : "Choose your team.");
        check("arriving", picked("arriving") ? "" : "Choose how you're arriving.");
        check("window", els.window.value ? "" : picked("arriving") ? "Choose an arrival window." : "Choose how you're arriving first.");
        var other = form.querySelector('[name="dietary"][value="other"]');
        check("dietnotes", other.checked && !els.dietnotes.value.trim() ? "Tell us what to plan for." : "");
        if ($("w-activity")) check("activity", picked("activity") ? "" : "Pick a Thursday activity.");
      }
      if (first) { first.focus(); return; }
      state.answers = readAnswers(form);
      confirmRsvp(state.answers);
    });
  }

  function readAnswers(form) {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.closest("[hidden]")) return;
      if (el.type === "checkbox") { if (el.checked) (out[el.name] = out[el.name] || []).push(el.value); return; }
      if (el.type === "radio") { if (el.checked) out[el.name] = el.value; return; }
      out[el.name] = el.value.trim();
    });
    return out;
  }

  // ---------- badge ----------
  // A generated pattern that looks like a QR code: three finder squares, timing lines, seeded noise. It encodes nothing.
  function fakeQr(seed) {
    var n = 25, g = [], s = hash(seed) || 1;
    function rand() { s = (s + 0x6D2B79F5) >>> 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    function finder(r, c) {
      for (var y = -1; y <= 7; y++) for (var x = -1; x <= 7; x++) {
        var yy = r + y, xx = c + x;
        if (yy < 0 || xx < 0 || yy >= n || xx >= n) continue;
        var ring = Math.max(Math.abs(y - 3), Math.abs(x - 3));
        g[yy][xx] = ring === 4 ? 0 : ring === 2 ? 0 : 1;
      }
    }
    for (var y = 0; y < n; y++) { g.push([]); for (var x = 0; x < n; x++) g[y].push(rand() < 0.5 ? 1 : 0); }
    for (var i = 8; i < n - 8; i++) { g[6][i] = i % 2 ? 0 : 1; g[i][6] = i % 2 ? 0 : 1; }
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
    return { size: n, rows: g.map(function (row) { return row.join(""); }) };
  }
  function roomFor(name) {
    var g = state.guest;
    if (g && g.name.toLowerCase() === name.toLowerCase()) return g.room;
    var h = hash(name.toLowerCase()), rooms = D.rsvp.rooms;
    return rooms[h % rooms.length] + " " + (1 + (h >>> 4) % 16);
  }
  function buildBadge(a) {
    var sh = byId(D.shuttles, a.window), pick = choiceSession(), opt = pick && a.activity ? byId(pick.options, a.activity) : null;
    var diet = (a.dietary || []).filter(function (id) { return id !== "other"; }).map(function (id) { var d = byId(D.rsvp.dietary, id); return d ? d.label : id; });
    if (a.dietnotes) diet.push(a.dietnotes);
    return {
      id: state.guest && state.guest.name.toLowerCase() === a.name.toLowerCase() ? state.guest.id : "w" + hash(a.email).toString(36).slice(0, 5),
      name: a.name,
      team: a.team,
      room: roomFor(a.name),
      shuttle: sh ? { id: sh.id, label: shuttleLabel(sh), from: sh.from, start: shuttleTimes(sh).start.toISOString() }
        : { id: null, label: "No shuttle, driving (" + String(a.window).replace(/^drive:/, "") + ")" },
      thursday: opt ? { id: opt.id, title: opt.title, place: opt.place } : null,
      dietary: diet.length ? diet : ["No restrictions"],
      qr: fakeQr(a.name + "|" + a.email)
    };
  }

  function confirmRsvp(a) {
    var r = D.rsvp, yes = a.attending === "yes";
    state.badge = yes ? buildBadge(a) : null;
    window.Upriver = { data: D, badge: state.badge };
    document.dispatchEvent(new CustomEvent("upriver:badge", { detail: state.badge }));
    var b = state.badge;
    $("rsvp-out").innerHTML =
      '<div class="confirm" role="status" tabindex="-1" id="rsvp-confirm">' +
        '<p class="confirm-kicker">Demo confirmation</p><h3>' + (yes ? "See you upriver, " + esc(firstName(a.name)) + "." : "Got it, " + esc(firstName(a.name)) + ".") + "</h3>" +
        (yes ? '<dl class="confirm-dl"><dt>Team</dt><dd>' + esc(b.team) + "</dd><dt>Room</dt><dd>" + esc(b.room) +
          "</dd><dt>Shuttle</dt><dd>" + esc(b.shuttle.label) + "</dd><dt>Thursday</dt><dd>" + esc(b.thursday ? b.thursday.title : "") +
          "</dd><dt>Dietary</dt><dd>" + esc(b.dietary.join(", ")) + "</dd></dl>" : "") +
        "<p>" + copy(yes ? r.confirmYes : r.confirmNo) + "</p>" +
        '<div class="confirm-actions">' +
          (yes ? '<button type="button" class="btn btn-small" data-ics="retreat-mine">Add the retreat to your calendar</button>' +
            (b.shuttle.id ? '<button type="button" class="btn btn-small" data-ics="shuttle">Add your shuttle</button>' : "") : "") +
          '<button type="button" class="btn btn-small" id="rsvp-edit">Change your answers</button></div>' +
      "</div>";
    $("rsvp-confirm").focus();
    $("rsvp-edit").addEventListener("click", function () {
      $("rsvp").outerHTML = R.rsvp();
      wireForm();
      $("rsvp-form").querySelector("input").focus();
    });
  }

  function wireGlobal() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      var ics = t.closest("[data-ics]");
      if (!ics) return;
      var kind = ics.getAttribute("data-ics"), b = state.badge;
      if (kind === "retreat") downloadIcs(retreatEvents(null), "upriver-27.ics");
      if (kind === "retreat-mine" && b) downloadIcs(retreatEvents(b.thursday && b.thursday.id), "upriver-27.ics");
      if (kind === "shuttle" && b && b.shuttle.id) downloadIcs([shuttleEvent(byId(D.shuttles, b.shuttle.id))], "upriver-27-shuttle.ics");
    });
  }

  function renderChrome() {
    var m = D.meta, on = D.sections.filter(function (s) { return s.on && R[s.id]; });
    document.title = m.pageTitle || m.name;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", plain(m.description));
    if (m.fictionNotice) { $("notice").textContent = m.fictionNotice; $("notice").hidden = false; }
    $("brand").innerHTML = '<span class="brand-mark" aria-hidden="true">' + esc(m.shortName) + '</span><span class="brand-name">' + esc(m.name) + "</span>";
    $("brand").setAttribute("aria-label", m.name + ", back to top");
    var welcomeOn = on.some(function (s) { return s.id === "welcome"; });
    $("welcome").hidden = !welcomeOn;
    if (welcomeOn) $("hero").innerHTML = R.welcome();
    var body = on.filter(function (s) { return s.id !== "welcome"; });
    $("nav").innerHTML = body.map(function (s) { return '<li><a href="#' + s.id + '">' + esc(s.label) + "</a></li>"; }).join("");
    $("sections").innerHTML = body.map(function (s) { return R[s.id](); }).join("");
    $("footer").innerHTML = '<div class="wrap footer-inner"><p class="footer-word" aria-hidden="true">' + esc(m.name) + "</p>" +
      '<nav aria-label="Footer"><ul class="footer-links">' + on.map(function (s) { return '<li><a href="#' + s.id + '">' + esc(s.label) + "</a></li>"; }).join("") + "</ul></nav>" +
      '<p class="footer-small">' + esc(m.fictionNotice || "") + "</p></div>";
  }

  function showError(err) {
    $("notice").hidden = false;
    $("notice").classList.add("is-error");
    $("notice").textContent = "Content failed to load from data/event.json.";
    $("hero").innerHTML = '<h1 id="hero-title">Content did not load</h1><p>Open this page from a web server (GitHub Pages, or python3 -m http.server), not straight from disk. Detail: ' + esc(err && err.message) + "</p>";
  }

  fetch("data/event.json", { cache: "no-cache" })
    .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function (data) {
      D = data;
      var g = null;
      try { g = new URLSearchParams(location.search).get("g"); } catch (e) { g = null; }
      state.guest = g ? byId(D.guests || [], g) : null;
      renderChrome();
      wireTabs(); wirePacking(); wireForm(); wireGlobal();
      window.Upriver = { data: D, badge: null };
      if (location.hash.length > 1) {
        var target = $(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    })
    .catch(showError);
})();
