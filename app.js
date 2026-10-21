/* Event kit - renders every section from data/event.json. Vanilla JS, no build step.
   Sections render in the order listed in data.sections; set "on": false to hide one.
   "welcome" renders into the hero. The guest badge lives in #hero-moment on phones
   and moves to the right column from 1024px. */
(function () {
  "use strict";

  var D = null;              // event data
  var state = { guest: null, answers: null, badge: null };
  var PACK_KEY = "upriver27-packing";
  var WIDE = window.matchMedia("(min-width: 1024px)");
  var CALM = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Motion tiers (see CLAUDE.md). ?motion=full forces the full version of every effect, for demos and review.
  var MOTION_FULL = (function () { try { return new URLSearchParams(location.search).get("motion") === "full"; } catch (e) { return false; } })();
  if (MOTION_FULL) document.documentElement.classList.add("motion-full");
  // True when tier 2 effects should use their softer version.
  function soft() { return CALM.matches && !MOTION_FULL; }

  // ---------- icons (Lucide, ISC license). Only used next to data. ----------
  var ICONS = {
    "utensils": "<path d=\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\"/><path d=\"M7 2v20\"/><path d=\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\"/>",
    "presentation": "<path d=\"M2 3h20\"/><path d=\"M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3\"/><path d=\"m7 21 5-5 5 5\"/>",
    "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>",
    "bus": "<path d=\"M8 6v6\"/><path d=\"M15 6v6\"/><path d=\"M2 12h19.6\"/><path d=\"M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3\"/><circle cx=\"7\" cy=\"18\" r=\"2\"/><path d=\"M9 18h5\"/><circle cx=\"16\" cy=\"18\" r=\"2\"/>",
    "armchair": "<path d=\"M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3\"/><path d=\"M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z\"/><path d=\"M5 18v2\"/><path d=\"M19 18v2\"/>",
    "train-front": "<path d=\"M8 3.1V7a4 4 0 0 0 8 0V3.1\"/><path d=\"m9 15-1-1\"/><path d=\"m15 15 1-1\"/><path d=\"M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z\"/><path d=\"m8 19-2 3\"/><path d=\"m16 19 2 3\"/>",
    "plane": "<path d=\"M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z\"/>",
    "car": "<path d=\"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2\"/><circle cx=\"7\" cy=\"17\" r=\"2\"/><path d=\"M9 17h6\"/><circle cx=\"17\" cy=\"17\" r=\"2\"/>",
    "leaf": "<path d=\"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z\"/><path d=\"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12\"/>",
    "vegan": "<path d=\"M16 8q6 0 6-6-6 0-6 6\"/><path d=\"M17.41 3.59a10 10 0 1 0 3 3\"/><path d=\"M2 2a26.6 26.6 0 0 1 10 20c.9-6.82 1.5-9.5 4-14\"/>",
    "wheat-off": "<path d=\"m2 22 10-10\"/><path d=\"m16 8-1.17 1.17\"/><path d=\"M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z\"/><path d=\"m8 8-.53.53a3.5 3.5 0 0 0 0 4.94L9 15l1.53-1.53c.55-.55.88-1.25.98-1.97\"/><path d=\"M10.91 5.26c.15-.26.34-.51.56-.73L13 3l1.53 1.53a3.5 3.5 0 0 1 .28 4.62\"/><path d=\"M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z\"/><path d=\"M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z\"/><path d=\"m16 16-.53.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.49 3.49 0 0 1 1.97-.98\"/><path d=\"M18.74 13.09c.26-.15.51-.34.73-.56L21 11l-1.53-1.53a3.5 3.5 0 0 0-4.62-.28\"/><line x1=\"2\" x2=\"22\" y1=\"2\" y2=\"22\"/>",
    "milk-off": "<path d=\"M8 2h8\"/><path d=\"M9 2v1.343M15 2v2.789a4 4 0 0 0 .672 2.219l.656.984a4 4 0 0 1 .672 2.22v1.131M7.8 7.8l-.128.192A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3\"/><path d=\"M7 15a6.47 6.47 0 0 1 5 0 6.472 6.472 0 0 0 3.435.435\"/><line x1=\"2\" x2=\"22\" y1=\"2\" y2=\"22\"/>",
    "nut-off": "<path d=\"M12 4V2\"/><path d=\"M5 10v4a7.004 7.004 0 0 0 5.277 6.787c.412.104.802.292 1.102.592L12 22l.621-.621c.3-.3.69-.488 1.102-.592a7.01 7.01 0 0 0 4.125-2.939\"/><path d=\"M19 10v3.343\"/><path d=\"M12 12c-1.349-.573-1.905-1.005-2.5-2-.546.902-1.048 1.353-2.5 2-1.018-.644-1.46-1.08-2-2-1.028.71-1.69.918-3 1 1.081-1.048 1.757-2.03 2-3 .194-.776.84-1.551 1.79-2.21m11.654 5.997c.887-.457 1.28-.891 1.556-1.787 1.032.916 1.683 1.157 3 1-1.297-1.036-1.758-2.03-2-3-.5-2-4-4-8-4-.74 0-1.461.068-2.15.192\"/><line x1=\"2\" x2=\"22\" y1=\"2\" y2=\"22\"/>",
    "ellipsis": "<circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/><circle cx=\"5\" cy=\"12\" r=\"1\"/>",
    "phone": "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"/>",
    "mail": "<rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\"/><path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\"/>",
    "x": "<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>"
  };
  var TYPE_ICON = { meal: "utensils", session: "presentation", social: "users", travel: "bus", free: "armchair" };
  var MODE_ICON = { train: "train-front", fly: "plane", drive: "car", depart: "bus" };
  var DIET_ICON = { vegetarian: "leaf", vegan: "vegan", "gluten-free": "wheat-off", "dairy-free": "milk-off", "nut-allergy": "nut-off", other: "ellipsis" };
  function icon(name, cls) {
    return ICONS[name] ? '<svg class="ic' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICONS[name] + "</svg>" : "";
  }

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
  function each(sel, fn, root) { Array.prototype.forEach.call((root || document).querySelectorAll(sel), fn); }

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
  function fmtWeekday(date, long) { return date.toLocaleDateString("en-US", { weekday: long ? "long" : "short", timeZone: D.meta.timezone }); }
  function sessionTimes(day, s) {
    var a = zoned(day.date, s.start), b = zoned(day.date, s.end);
    return { start: a, end: b, label: fmtTime(a) + " - " + fmtTime(b) };
  }
  function shuttleTimes(sh) {
    var a = zoned(sh.date, sh.depart);
    return { start: a, end: new Date(a.getTime() + (sh.minutes || 30) * 60000) };
  }
  function shuttleLabel(sh) { return fmtWeekday(shuttleTimes(sh).start) + " " + fmtTime(shuttleTimes(sh).start) + ", " + sh.from; }
  function shuttleCode(sh) { return sh.id.toUpperCase(); }

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
  function download(blob, filename) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function downloadIcs(events, filename) {
    var lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ferrow//Upriver 27//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    events.forEach(function (ev) { lines = lines.concat(icsEvent(ev)); });
    lines.push("END:VCALENDAR");
    download(new Blob([lines.map(fold).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" }), filename);
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
    return { uid: "shuttle-" + sh.id + "-" + D.meta.year, start: t.start, end: t.end, summary: "Shuttle " + shuttleCode(sh) + ": " + sh.from + " to " + sh.to,
      description: "Retreat shuttle for " + D.meta.name + " to " + place("") + ". Travel questions: " + D.contacts.items[1].name + ".", location: sh.address || sh.from };
  }

  // ---------- shared bits ----------
  function sectionShell(id, title, inner, head) {
    return '<section class="section sec-' + id + '" id="' + id + '" aria-labelledby="' + id + '-title">' +
      (head || '<div class="sec-head"><h2 class="section-title" id="' + id + '-title">' + copy(title) + "</h2></div>") +
      '<div class="sec-body">' + inner + "</div></section>";
  }
  function initials(name) { return name.split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase(); }
  function firstName(name) { return String(name || "").trim().split(/\s+/)[0]; }
  function avatar(p, cls) {
    return p.photo
      ? '<img class="avatar' + (cls ? " " + cls : "") + '" src="' + esc(p.photo) + '" alt="" width="24" height="24" loading="lazy">'
      : '<span class="avatar' + (cls ? " " + cls : "") + '" aria-hidden="true">' + esc(initials(p.name)) + "</span>";
  }
  // Leads sit inside row buttons, so this uses phrasing content only.
  function leadsHtml(ids, cls) {
    var list = (ids || []).map(function (id) { return byId(D.people, id); }).filter(Boolean);
    if (!list.length) return "";
    return '<span class="leads' + (cls ? " " + cls : "") + '"><span class="sr">Led by </span>' + list.map(function (p) {
      return '<span class="lead">' + avatar(p, cls ? "avatar-lg" : "") + '<span class="lead-name">' + esc(firstName(p.name)) + "</span></span>";
    }).join('<span class="sr">, </span>') + "</span>";
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
  function findSession(id) {
    for (var i = 0; i < D.itinerary.days.length; i++) {
      var day = D.itinerary.days[i], s = byId(day.sessions, id);
      if (s) return { day: day, s: s };
    }
    return null;
  }

  // ---------- sections ----------
  var R = {};

  R.welcome = function () {
    var w = D.welcome, m = D.meta;
    return '<p class="hero-when mono">' + esc(m.dates) + "</p>" +
      '<h1 id="hero-title">' + w.title.map(function (l) { return "<span>" + esc(l) + "</span>"; }).join(" ") + "</h1>" +
      '<p class="hero-place">' + esc(m.venue) + ", " + esc(m.city) + "</p>" +
      '<div class="hero-ctas"><a class="btn btn-primary" href="' + esc(w.cta.href) + '">' + esc(w.cta.label) + "</a>" +
      '<p class="hero-deadline">' + esc(w.deadline) + "</p></div>";
  };
  function welcomeAfter() {
    var w = D.welcome, c = D.contacts;
    return (w.quote ? '<figure class="hero-quote"><blockquote><p>' + copy(w.quote) + "</p></blockquote><figcaption>" + esc(w.quoteBy) + "</figcaption></figure>" : "") +
      (c ? '<button type="button" class="glist-btn" data-open="contacts" aria-haspopup="dialog"><span>' + esc(c.heading) +
        '</span><span class="glist-sub">' + c.items.map(function (x) { return esc(firstName(x.name)); }).join(", ") + "</span></button>" : "");
  }
  function welcomePhoto() {
    var ph = D.welcome.photo;
    return ph ? '<img class="duo" src="' + esc(ph.src) + '" alt="' + esc(ph.alt) + '">' : "";
  }

  R.itinerary = function () {
    var it = D.itinerary;
    var tabs = '<div class="segmented" role="tablist" aria-label="Retreat days">' + it.days.map(function (day, i) {
      return '<button class="seg" role="tab" type="button" id="tab-' + day.id + '" aria-controls="panel-' + day.id +
        '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '"><span class="seg-day">' + esc(day.label) +
        '</span> <span class="seg-date mono">' + esc(day.title) + "</span></button>";
    }).join("") + "</div>";
    function optionHtml(o) {
      var left = spotsLeft(o);
      return '<li><button type="button" class="opt-row" id="option-' + o.id + '" data-option="' + o.id + '" aria-haspopup="dialog">' +
        '<span class="r-icon">' + icon(TYPE_ICON[o.type]) + '<span class="sr">' + esc(typeLabel(o.type)) + ", </span></span>" +
        '<span class="r-main"><span class="r-title">' + esc(o.title) + '</span><span class="r-place">' + esc(o.place) + "</span>" +
        leadsHtml(o.leads) + "</span>" +
        '<span class="r-meta mono">' + (left ? left + " left" : "Full") + '</span><span class="mine-tag">Your pick</span></button></li>';
    }
    var panels = it.days.map(function (day, i) {
      var sorted = day.sessions.slice().sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
      var dayName = fmtWeekday(zoned(day.date, "12:00"), true);
      return '<div class="day-panel" role="tabpanel" id="panel-' + day.id + '" aria-labelledby="tab-' + day.id + '"' + (i ? " hidden" : "") + ' tabindex="0">' +
        '<div class="day-band"><h3 class="day-name">' + esc(dayName) + '</h3><p class="day-date mono">' + esc(day.title) + "</p></div>" +
        '<ol class="rows">' + sorted.map(function (x) {
          var t = sessionTimes(day, x);
          var time = '<span class="r-time mono"><time datetime="' + t.start.toISOString() + '">' + esc(fmtTime(t.start)) + '</time><span class="r-end"><span class="sr"> to </span>' + esc(fmtTime(t.end)) + "</span></span>";
          var ic = '<span class="r-icon">' + icon(TYPE_ICON[x.type]) + '<span class="sr">' + esc(typeLabel(x.type)) + ", </span></span>";
          if (x.choice) {
            return '<li class="row-item is-choice type-' + esc(x.type) + '" id="session-' + x.id + '"><div class="row row-static">' + time + ic +
              '<span class="r-main"><span class="r-title">' + esc(x.title) + "</span></span></div>" +
              '<ul class="opts">' + x.options.map(optionHtml).join("") + "</ul></li>";
          }
          return '<li class="row-item type-' + esc(x.type) + '" id="session-' + x.id + '"><button type="button" class="row" data-session="' + x.id + '" aria-haspopup="dialog">' +
            time + ic + '<span class="r-main"><span class="r-title">' + esc(x.title) + '</span><span class="r-place">' + esc(x.place) + "</span>" +
            leadsHtml(x.leads) + "</span></button></li>";
        }).join("") + "</ol></div>";
    }).join("");
    return sectionShell("itinerary", it.heading, (it.note ? '<p class="note">' + copy(it.note) + "</p>" : "") + tabs + panels +
      '<button type="button" class="btn btn-small ics-btn" data-ics="retreat">Add the retreat to your calendar</button>');
  };

  R.travel = function () {
    var tv = D.travel;
    function chips(list) {
      return '<p class="g-codes mono">' + list.map(function (s) {
        return '<span class="code">' + esc(shuttleCode(s)) + " " + esc(fmtTime(shuttleTimes(s).start)) + "</span>";
      }).join('<span aria-hidden="true"> / </span>') + "</p>";
    }
    function shuttleLine(kind) {
      if (kind === "depart") {
        var out = D.shuttles.filter(function (s) { return s.dir === "depart"; }).sort(function (a, b) { return a.depart < b.depart ? -1 : 1; });
        return '<p class="g-sub"><span class="ph">Placeholder</span> Shuttles from the ' + esc(out[0].from.toLowerCase()) + ": " +
          out.map(function (s) { return "to " + esc(s.to); }).join(", then ") + ".</p>" + chips(out);
      }
      var list = D.shuttles.filter(function (s) { return s.dir === "arrive" && s.mode === kind; });
      if (!list.length) return "";
      return '<p class="g-sub"><span class="ph">Placeholder</span> Wednesday shuttles from ' + esc(list[0].from) + ". Pick yours in the RSVP.</p>" + chips(list);
    }
    return sectionShell("travel", tv.heading, tv.groups.map(function (g) {
      return '<div class="group">' + (g.photo ? '<img class="duo group-photo" src="' + esc(g.photo.src) + '" alt="' + esc(g.photo.alt) + '" loading="lazy">' : "") +
        '<h3 class="group-title">' + esc(g.name) + '</h3><ul class="glist">' + g.rows.map(function (r) {
          return '<li class="g-row' + (r.mode ? " has-icon" : "") + '">' + (r.mode ? '<span class="g-icon">' + icon(MODE_ICON[r.mode]) + "</span>" : "") +
            '<div class="g-main"><p class="g-label">' + esc(r.label) + "</p>" + (r.body ? '<p class="g-body">' + copy(r.body) + "</p>" : "") +
            (r.shuttles ? shuttleLine(r.shuttles) : "") + "</div></li>";
        }).join("") + "</ul></div>";
    }).join(""));
  };

  R.packing = function () {
    var pk = D.packing;
    var total = pk.groups.reduce(function (n, g) { return n + g.items.length; }, 0);
    var head = '<div class="sec-head pack-band"><h2 class="section-title" id="packing-title">' + copy(pk.heading) + "</h2>" +
      '<p class="pack-count" id="pack-count" aria-live="polite"><span class="mono pack-n" id="pack-n">0/' + total + "</span> packed</p>" +
      '<div class="pack-meter" aria-hidden="true"><span id="pack-meter"></span></div></div>';
    return sectionShell("packing", pk.heading, '<div class="pack-groups">' + pk.groups.map(function (g, gi) {
      return '<fieldset class="group pack-group' + (gi === 0 ? " pack-essentials" : "") + '"><legend class="group-title">' + esc(g.name) + "</legend>" +
        (g.note ? '<p class="note">' + copy(g.note) + "</p>" : "") +
        '<ul class="glist">' + g.items.map(function (x) {
          return '<li><label class="g-row check-row"><input type="checkbox" class="box" data-pack="' + esc(x.id) + '"><span>' + esc(x.label) + "</span></label></li>";
        }).join("") + "</ul></fieldset>";
    }).join("") + "</div>", head);
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
    return '<fieldset class="field choice' + (opts.cls ? " " + opts.cls : "") + '" id="w-' + id + '" aria-describedby="e-' + id + '"><legend>' + esc(legend) +
      (opts.optional ? ' <span class="opt">(optional)</span>' : "") + "</legend>" +
      '<div class="choice-list">' + items.map(function (x) {
        return '<label class="chip-toggle' + (x.disabled ? " is-off" : "") + '"><input type="' + type + '" name="' + id + '" value="' + esc(x.id) + '"' + (x.disabled ? " disabled" : "") + ">" +
          (x.icon ? icon(x.icon) : "") + '<span class="ct-text"><span class="ct-label">' + esc(x.label) + "</span>" +
          (x.sub ? ' <span class="ct-sub mono">' + esc(x.sub) + "</span>" : "") + "</span></label>";
      }).join("") + '</div><span class="error" id="e-' + id + '"></span></fieldset>';
  }

  R.rsvp = function () {
    var r = D.rsvp, pick = choiceSession();
    var teams = '<option value="">Choose your team</option>' + r.teams.map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + "</option>"; }).join("");
    var activities = pick ? pick.options.map(function (o) {
      var left = spotsLeft(o);
      return { id: o.id, label: o.title, icon: TYPE_ICON[o.type], sub: left ? left + "/" + o.capacity + " left" : "Full", disabled: !left };
    }) : [];
    var head = '<div class="sec-head rsvp-head"><h2 class="section-title" id="rsvp-title">' + copy(r.heading) + "</h2>" +
      '<p class="demo" role="note">' + esc(r.demoNotice) + "</p></div>";
    return sectionShell("rsvp", r.heading,
      '<div class="mini-badge" id="mini-badge" aria-hidden="true"></div>' +
      '<div id="rsvp-out"><form class="reg-form" id="rsvp-form" novalidate>' +
        choiceGroup("attending", "Are you coming?", "radio", [{ id: "yes", label: "Yes, I'll be there" }, { id: "no", label: "No, I can't make it" }]) +
        field("name", "Full name", '<input type="text" id="f-name" name="name" autocomplete="name" aria-describedby="e-name">') +
        '<div class="rsvp-branch" id="rsvp-yes" hidden>' +
          field("email", "Work email", '<input type="email" id="f-email" name="email" autocomplete="email" inputmode="email" placeholder="name@' + esc(r.emailDomain) + '" aria-describedby="e-email">') +
          field("team", "Team", '<select id="f-team" name="team" aria-describedby="e-team">' + teams + "</select>") +
          choiceGroup("arriving", "How are you arriving?", "radio", r.arriving.map(function (x) { return { id: x.id, label: x.label, icon: MODE_ICON[x.id] }; })) +
          field("window", "Arrival window", '<select id="f-window" name="window" aria-describedby="h-window e-window" disabled><option value="">Choose how you are arriving first</option></select>',
            { hint: "Train and ALB windows match a retreat shuttle." }) +
          choiceGroup("dietary", "Dietary needs", "checkbox", r.dietary.map(function (x) { return { id: x.id, label: x.label, icon: DIET_ICON[x.id] }; }), { optional: true }) +
          field("dietnotes", "Tell us more", '<textarea id="f-dietnotes" name="dietnotes" aria-describedby="e-dietnotes"></textarea>', { hidden: true }) +
          (pick ? choiceGroup("activity", "Thursday afternoon", "radio", activities, { cls: "choice-rows" }) : "") +
          field("access", "Accessibility notes", '<textarea id="f-access" name="access" aria-describedby="h-access"></textarea>',
            { optional: true, hint: "Anything that helps us plan rooms, rides, or activities for you." }) +
        "</div>" +
        '<div class="rsvp-branch" id="rsvp-no" hidden>' +
          field("note", "Note", '<textarea id="f-note" name="note"></textarea>', { optional: true }) +
        "</div>" +
        '<button type="submit" class="btn btn-primary" id="rsvp-submit">Send RSVP</button>' +
      "</form></div>", head);
  };

  function contactsList() {
    return '<ul class="glist contact-list">' + D.contacts.items.map(function (x) {
      var tel = x.phone.replace(/[^\d+]/g, "");
      var shown = x.phone.replace(/^\+1-/, "").replace(/^(\d{3})-/, "($1) ");
      return '<li class="g-row contact' + (x.urgent ? " is-urgent" : "") + '"><div class="g-main"><p class="g-label">' + esc(x.name) + '</p><p class="g-body">' + esc(x.role) + "</p>" +
        (x.note ? '<p class="g-sub">' + copy(x.note) + "</p>" : "") + "</div>" +
        '<div class="c-actions"><a class="pill" href="tel:' + esc(tel) + '">' + icon("phone") + '<span><span class="sr">Call </span><span class="mono">' + esc(shown) + "</span></span></a>" +
        '<a class="pill" href="mailto:' + esc(x.email) + '">' + icon("mail") + '<span><span class="sr">Email </span>' + esc(x.email) + "</span></a></div></li>";
    }).join("") + "</ul>";
  }

  // ---------- badge ----------
  var BADGE_FIELDS = [["name", "Name"], ["team", "Team"], ["room", "Room"], ["shuttle", "Shuttle"], ["thursday", "Thursday"], ["dietary", "Dietary"]];
  function badgeHtml() {
    var m = D.meta;
    var head = '<div class="badge-head"><span class="badge-slot" aria-hidden="true"></span><p class="badge-event">' + esc(m.name) +
      '</p><p class="badge-org mono">' + esc(m.org) + " retreat</p></div>";
    return '<div class="badge-stage" id="badge-stage">' +
      '<div class="pendulum" id="pendulum">' +
      '<div class="lanyard" aria-hidden="true"></div>' +
      '<div class="badge" id="badge" role="group" aria-label="Your guest badge" data-mode="empty">' +
        '<div class="badge-card" id="badge-card">' +
          '<div class="badge-face badge-front" id="badge-front">' + head +
            '<p class="badge-greet" id="badge-greet"></p>' +
            '<dl class="badge-fields">' + BADGE_FIELDS.map(function (f) {
              return '<div class="bf bf-' + f[0] + '"><dt>' + f[1] + '</dt><dd id="bf-' + f[0] + '"></dd></div>';
            }).join("") + "</dl>" +
          "</div>" +
          '<div class="badge-face badge-back" id="badge-back" aria-hidden="true" inert>' + head +
            '<div class="qr" id="badge-qr"></div>' +
            '<p class="badge-ready">' + esc(D.rsvp.badge.ready) + "</p>" +
            '<p class="badge-code mono" id="badge-code"></p>' +
          "</div>" +
        "</div>" +
      "</div>" +
      "</div>" +
      '<div class="badge-actions" id="badge-actions" hidden>' +
        '<button type="button" class="btn btn-small" id="badge-flip" aria-pressed="true">Show front</button>' +
        '<button type="button" class="btn btn-small btn-primary" id="badge-save">Save badge</button>' +
      "</div>" +
    "</div>";
  }
  function setField(id, value) {
    var dd = $("bf-" + id);
    if (!dd) return;
    var empty = !value;
    dd.classList.toggle("is-empty", empty);
    if (empty) dd.innerHTML = '<span class="sr">Not filled in yet</span>';
    else dd.textContent = value;
  }
  // ---------- check-in QR ----------
  // The code holds a short URL back to this site: name, room, Thursday pick, arrival shuttle. No email, no dietary info.
  var QZ = 4; // quiet zone in modules, the birch border scanners need
  function checkinUrl(b) {
    var sh = b.shuttle.id ? byId(D.shuttles, b.shuttle.id) : null;
    var q = "n=" + encodeURIComponent(b.name.slice(0, 60)) + "&r=" + encodeURIComponent(b.room.replace(/\s+/g, "")) +
      (b.thursday ? "&t=" + encodeURIComponent(b.thursday.id) : "") + "&s=" + (sh ? shuttleCode(sh) : "DRIVE");
    return location.origin + location.pathname + "#checkin?" + q;
  }
  function makeQr(text) {
    var out = { url: text, size: 0, rows: [] };
    if (typeof window.qrcode !== "function") return out;
    try {
      var q = window.qrcode(0, "M");
      q.addData(text); q.make();
      out.size = q.getModuleCount();
      for (var r = 0; r < out.size; r++) { var row = ""; for (var c = 0; c < out.size; c++) row += q.isDark(r, c) ? "1" : "0"; out.rows.push(row); }
    } catch (e) { out.size = 0; out.rows = []; }
    return out;
  }
  function qrSvg(qr) {
    if (!qr.size) return '<p class="qr-missing">The code needs a connection to draw. Check in at the front desk with your name.</p>';
    var d = "", n = qr.size + QZ * 2;
    qr.rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) if (row.charAt(x) === "1") d += "M" + (x + QZ) + " " + (y + QZ) + "h1v1h-1z";
    });
    return '<svg viewBox="0 0 ' + n + " " + n + '" role="img" aria-label="QR code. ' + esc(D.rsvp.checkin.scan) + '." shape-rendering="crispEdges">' +
      '<rect width="' + n + '" height="' + n + '" class="qr-bg"/><path d="' + d + '" class="qr-fg"/></svg>';
  }
  function flipBadge(toBack, animate) {
    var card = $("badge-card");
    if (!card) return;
    if (!animate) { card.classList.add("no-anim"); requestAnimationFrame(function () { card.classList.remove("no-anim"); }); }
    card.classList.toggle("is-flipped", toBack);
    var front = $("badge-front"), back = $("badge-back");
    front.toggleAttribute("inert", toBack); front.setAttribute("aria-hidden", String(toBack));
    back.toggleAttribute("inert", !toBack); back.setAttribute("aria-hidden", String(!toBack));
    var btn = $("badge-flip");
    if (btn) { btn.textContent = toBack ? "Show front" : "Show check-in code"; btn.setAttribute("aria-pressed", String(toBack)); }
  }

  function shuttleShort(win) {
    if (!win) return "";
    var sh = byId(D.shuttles, win);
    return sh ? shuttleCode(sh) + " " + fmtWeekday(shuttleTimes(sh).start) + " " + fmtTime(shuttleTimes(sh).start) : "Driving, " + String(win).replace(/^drive:/, "");
  }
  function dietLabels(a) {
    var out = (a.dietary || []).filter(function (id) { return id !== "other"; }).map(function (id) { var d = byId(D.rsvp.dietary, id); return d ? d.label : id; });
    if (a.dietnotes) out.push(a.dietnotes);
    return out;
  }
  function optionTitle(id) { var c = choiceSession(), o = c && id ? byId(c.options, id) : null; return o ? o.title : ""; }

  // Paints the badge (and the phone mini badge) from answers. mode: empty, draft, declined, ready.
  function paintBadge(a, mode, room) {
    var b = $("badge");
    if (!b) return;
    a = a || {};
    var g = D.rsvp.badge, name = a.name || (state.guest ? state.guest.name : "");
    var greet = mode === "declined" ? g.declined.replace("{name}", firstName(name))
      : state.guest ? g.invited.replace("{name}", firstName(state.guest.name)) : g.empty;
    if (mode === "ready") greet = "See you upriver, " + firstName(name) + ".";
    b.setAttribute("data-mode", mode);
    $("badge-greet").textContent = greet;
    var diet = dietLabels(a);
    var v = mode === "declined" ? { name: name } : {
      name: name, team: a.team || (state.guest && !state.answers && !a.attending ? state.guest.team : ""), room: room || "",
      shuttle: shuttleShort(a.window), thursday: optionTitle(a.activity),
      dietary: diet.length ? diet.join(", ") : mode === "ready" ? "No restrictions" : ""
    };
    BADGE_FIELDS.forEach(function (f) { setField(f[0], v[f[0]]); });
    var mini = $("mini-badge");
    if (mini) {
      mini.setAttribute("data-mode", mode);
      mini.innerHTML = '<span class="mb-name' + (v.name ? "" : " is-empty") + '">' + esc(v.name || "Your name") + '</span><span class="mb-line">' +
        ["team", "shuttle", "thursday"].map(function (k) {
          return '<span class="mb-f' + (k === "shuttle" ? " mono" : "") + (v[k] ? "" : " is-empty") + '">' + esc(v[k] || BADGE_FIELDS.filter(function (f) { return f[0] === k; })[0][1]) + "</span>";
        }).join('<span class="mb-sep"> / </span>') + "</span>";
    }
  }

  function placeBadge() {
    var stage = $("badge-stage"), target = WIDE.matches ? $("badge-col") : $("hero-moment");
    if (stage && target && stage.parentNode !== target) target.appendChild(stage);
  }

  // Front and back side by side, drawn by hand so the PNG matches the palette exactly.
  function saveBadgePng() {
    var b = state.badge;
    if (!b) return;
    var css = getComputedStyle(document.documentElement);
    function tok(n) { return css.getPropertyValue(n).trim(); }
    var C = { orange: tok("--orange"), ink: tok("--ink"), birch: tok("--birch"), slate: tok("--slate") };
    var disp = '"Schibsted Grotesk", Arial, sans-serif', mono = '"Martian Mono", ui-monospace, monospace';
    var fontsReady = document.fonts && document.fonts.load ? Promise.all([
      document.fonts.load("800 40px " + disp), document.fonts.load("600 16px " + mono), document.fonts.load("400 16px " + mono)
    ]).catch(function () {}) : Promise.resolve();
    fontsReady.then(function () {
      var S = 2, W = 1040, H = 740, cv = document.createElement("canvas");
      cv.width = W * S; cv.height = H * S;
      var x = cv.getContext("2d");
      x.scale(S, S);
      x.fillStyle = C.slate; x.fillRect(0, 0, W, H);
      function rr(px, py, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(px, py, w, h, r); else x.rect(px, py, w, h); }
      function fit(text, max, size, weight, family) {
        var s = size;
        do { x.font = weight + " " + s + "px " + family; s -= 1; } while (x.measureText(text).width > max && s > 10);
        return text;
      }
      function card(ox) {
        rr(ox, 40, 460, 660, 24); x.fillStyle = C.orange; x.fill();
        x.save(); rr(ox, 40, 460, 120, [24, 24, 0, 0]); x.fillStyle = C.ink; x.fill(); x.restore();
        rr(ox + 190, 58, 80, 14, 7); x.fillStyle = C.slate; x.fill();
        x.fillStyle = C.birch; x.font = "800 34px " + disp; x.fillText(D.meta.name, ox + 28, 124);
        x.font = "400 13px " + mono; x.fillText((D.meta.org + " retreat").toUpperCase(), ox + 28, 146);
      }
      function fieldAt(ox, oy, label, value, size, w, code) {
        x.fillStyle = C.ink; x.font = "600 12px " + mono; x.fillText(label.toUpperCase(), ox, oy);
        fit(value, w, size, code ? "600" : "700", code ? mono : disp); x.fillText(value, ox, oy + size + 6);
      }
      card(20);
      var L = 48;
      fieldAt(L, 210, "Name", b.name, 40, 404);
      fieldAt(L, 300, "Team", b.team, 24, 190); fieldAt(L + 214, 300, "Room", b.room, 20, 190, true);
      fieldAt(L, 380, "Shuttle", shuttleShort(state.answers && state.answers.window), 18, 404, true);
      fieldAt(L, 460, "Thursday", b.thursday ? b.thursday.title : "", 24, 404);
      fieldAt(L, 540, "Dietary", b.dietary.join(", "), 20, 404);
      x.font = "400 12px " + mono; x.fillText("ID " + b.id.toUpperCase(), L, 670);
      card(560);
      var q = b.qr;
      if (q.size) {
        var cell = Math.floor(300 / (q.size + QZ * 2)), side = (q.size + QZ * 2) * cell, qx = 560 + (460 - side) / 2, qy = 186;
        x.fillStyle = C.birch; x.fillRect(qx, qy, side, side);
        x.fillStyle = C.ink;
        q.rows.forEach(function (row, y) { for (var i = 0; i < row.length; i++) if (row.charAt(i) === "1") x.fillRect(qx + (i + QZ) * cell, qy + (y + QZ) * cell, cell, cell); });
      }
      x.fillStyle = C.ink;
      x.font = "800 30px " + disp; x.fillText(D.rsvp.badge.ready, 588, 530);
      x.font = "400 13px " + mono; x.fillText((b.name + " / " + b.room).toUpperCase(), 588, 560);
      x.fillText(D.rsvp.checkin.scan.toUpperCase(), 588, 670);
      cv.toBlob(function (blob) { if (blob) download(blob, "upriver-27-badge.png"); }, "image/png");
    });
  }

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
    each('#itinerary [role="tab"]', function (t) {
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
      $("pack-n").textContent = n + "/" + boxes.length;
      $("pack-meter").style.width = (boxes.length ? n / boxes.length * 100 : 0) + "%";
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
    function live() {
      var a = readAnswers(form);
      paintBadge(a, a.attending === "no" ? "declined" : a.attending || a.name ? "draft" : "empty");
    }
    form.addEventListener("change", function (e) {
      if (e.target.name === "arriving") fillWindows();
      sync();
      live();
    });
    form.addEventListener("input", live);
    // Restore earlier answers when someone comes back to edit, otherwise pre-fill from ?g=<id>.
    if (state.answers) {
      Object.keys(state.answers).forEach(function (k) {
        var v = state.answers[k];
        each('[name="' + k + '"]', function (el) {
          if (el.type === "radio" || el.type === "checkbox") el.checked = [].concat(v).indexOf(el.value) > -1;
        }, form);
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
    live();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      function check(id, msg, focusEl) {
        var w = $("w-" + id), err = $("e-" + id);
        var target = focusEl || $("f-" + id) || (w && w.querySelector("input:not([disabled])"));
        if (target && !w.matches("fieldset")) target.setAttribute("aria-invalid", msg ? "true" : "false");
        if (w && w.matches("fieldset")) w.classList.toggle("is-invalid", !!msg);
        err.textContent = msg ? "Fix: " + msg : "";
        if (msg && !first) first = target;
      }
      function picked(name) { return form.querySelector('[name="' + name + '"]:checked'); }
      var att = picked("attending");
      check("attending", att ? "" : "Choose yes or no.");
      if (att) check("name", els.name.value.trim() ? "" : "Enter your name.");
      if (att && att.value === "yes") {
        var ev = els.email.value.trim();
        check("email", !ev ? "Enter your work email." : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ev) ? "Check the email format, for example name@" + D.rsvp.emailDomain + "." : "");
        check("team", els.team.value ? "" : "Choose your team.");
        check("arriving", picked("arriving") ? "" : "Choose how you're arriving.");
        check("window", els.window.value ? "" : picked("arriving") ? "Choose an arrival window." : "Choose how you're arriving first.");
        var other = form.querySelector('[name="dietary"][value="other"]');
        check("dietnotes", other.checked && !els.dietnotes.value.trim() ? "Tell us what to plan for." : "");
        if ($("w-activity")) check("activity", picked("activity") ? "" : "Pick a Thursday activity.");
      }
      if (first) { revealField(first); return; }
      state.answers = readAnswers(form);
      confirmRsvp(state.answers);
    });
  }

  // Scrolls the field (label, input and message) clear of the sticky top bar and mini badge, then focuses it.
  function revealField(el) {
    var w = el.closest(".field") || el, off = 12;
    var bar = document.querySelector(".topbar"), mini = $("mini-badge");
    if (bar && getComputedStyle(bar).position === "sticky") off += bar.offsetHeight;
    if (mini && getComputedStyle(mini).display !== "none") off += mini.offsetHeight;
    window.scrollTo({ top: Math.max(0, w.getBoundingClientRect().top + window.scrollY - off), behavior: soft() ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
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

  function roomFor(name) {
    var g = state.guest;
    if (g && g.name.toLowerCase() === name.toLowerCase()) return g.room;
    var h = hash(name.toLowerCase()), rooms = D.rsvp.rooms;
    return rooms[h % rooms.length] + " " + (1 + (h >>> 4) % 16);
  }
  function buildBadge(a) {
    var sh = byId(D.shuttles, a.window), pick = choiceSession(), opt = pick && a.activity ? byId(pick.options, a.activity) : null;
    var diet = dietLabels(a);
    var b = {
      id: state.guest && state.guest.name.toLowerCase() === a.name.toLowerCase() ? state.guest.id : "w" + hash(a.email).toString(36).slice(0, 5),
      name: a.name,
      team: a.team,
      room: roomFor(a.name),
      shuttle: sh ? { id: sh.id, label: shuttleLabel(sh), from: sh.from, start: shuttleTimes(sh).start.toISOString() }
        : { id: null, label: "No shuttle, driving (" + String(a.window).replace(/^drive:/, "") + ")" },
      thursday: opt ? { id: opt.id, title: opt.title, place: opt.place } : null,
      dietary: diet.length ? diet : ["No restrictions"]
    };
    b.qr = makeQr(checkinUrl(b));
    return b;
  }

  function markPick(id) {
    each(".opt-row", function (el) {
      var on = el.getAttribute("data-option") === id;
      el.classList.toggle("is-mine", on);
      el.setAttribute("aria-current", on ? "true" : "false");
    });
  }

  function confirmRsvp(a) {
    var r = D.rsvp, yes = a.attending === "yes";
    state.badge = yes ? buildBadge(a) : null;
    window.Upriver = { data: D, badge: state.badge };
    document.dispatchEvent(new CustomEvent("upriver:badge", { detail: state.badge }));
    var b = state.badge;
    markPick(b && b.thursday ? b.thursday.id : null);
    if (yes) {
      paintBadge(a, "ready", b.room);
      $("badge-qr").innerHTML = qrSvg(b.qr);
      $("badge-code").textContent = (r.checkin.scan + " / " + b.room).toUpperCase();
      $("badge-actions").hidden = false;
      setTimeout(function () { flipBadge(true, true); sway(); }, soft() ? 0 : 350);
    } else {
      paintBadge(a, "declined");
    }
    $("rsvp-out").innerHTML =
      '<div class="confirm" role="status" tabindex="-1" id="rsvp-confirm">' +
        "<h3>" + (yes ? "See you upriver, " + esc(firstName(a.name)) + "." : "Got it, " + esc(firstName(a.name)) + ".") + "</h3>" +
        "<p>" + copy(yes ? r.confirmYes : r.confirmNo) + (yes ? " Your badge is ready for check-in." : "") + "</p>" +
        '<div class="confirm-actions">' +
          (yes ? '<button type="button" class="btn btn-small" data-ics="retreat-mine">Add the retreat to your calendar</button>' +
            (b.shuttle.id ? '<button type="button" class="btn btn-small" data-ics="shuttle">Add shuttle <span class="mono">' + esc(shuttleCode(byId(D.shuttles, b.shuttle.id))) + "</span></button>" : "") +
            '<button type="button" class="btn btn-small" data-badge-save>Save badge</button>' : "") +
          '<button type="button" class="btn btn-small" id="rsvp-edit">Change your answers</button></div>' +
      "</div>";
    $("rsvp-confirm").focus();
    $("rsvp-edit").addEventListener("click", function () {
      $("rsvp").outerHTML = R.rsvp();
      $("badge-actions").hidden = true;
      flipBadge(false, true);
      wireForm();
      $("rsvp-form").querySelector("input").focus();
    });
  }

  // ---------- sheet ----------
  var opener = null;
  function openSheet(title, body, from, kind) {
    var dlg = $("sheet");
    opener = from || document.activeElement;
    dlg.setAttribute("data-kind", kind || "sheet");
    $("sheet-title").textContent = title;
    $("sheet-body").innerHTML = body;
    document.documentElement.classList.add("has-sheet");
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    $("sheet-close").focus();
  }
  function closeSheet() { var dlg = $("sheet"); if (dlg.open) { if (dlg.close) dlg.close(); else { dlg.removeAttribute("open"); onSheetClosed(); } } }
  function onSheetClosed() {
    document.documentElement.classList.remove("has-sheet");
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  }
  function wireSheet() {
    var dlg = $("sheet");
    $("sheet-close").innerHTML = icon("x");
    $("sheet-close").addEventListener("click", closeSheet);
    dlg.addEventListener("close", onSheetClosed);
    // A tap on the dimmed area lands on the dialog itself, not the panel.
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeSheet(); });
  }
  function sessionSheet(s, day, opt) {
    var t = sessionTimes(day, s), x = opt || s, mine = opt && state.badge && state.badge.thursday && state.badge.thursday.id === opt.id;
    return '<p class="sheet-meta"><span class="mono">' + esc(fmtWeekday(t.start) + " " + t.label) + '</span><span class="sheet-type">' + icon(TYPE_ICON[x.type]) + esc(typeLabel(x.type)) + "</span>" +
      (mine ? '<span class="tag-mine">Your pick</span>' : "") + "</p>" +
      '<p class="sheet-place">' + esc(x.place) + "</p>" +
      (x.detail ? "<p>" + copy(x.detail) + "</p>" : "") +
      (opt ? '<p class="mono sheet-cap">' + esc(spotsLeft(opt)) + " of " + esc(opt.capacity) + " spots left</p>" : "") +
      leadsHtml(x.leads, "leads-lg");
  }

  // ---------- nav ----------
  function wireNav(ids) {
    var links = ids.map(function (id) { return document.querySelector('#nav a[href="#' + id + '"]'); });
    var targets = ids.map(function (id) { return $(id); });
    var ticking = false;
    function update() {
      ticking = false;
      var line = window.innerHeight * 0.35, cur = 0;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) cur = i; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = targets.length - 1;
      links.forEach(function (a, i) { if (!a) return; if (i === cur) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function wireGlobal() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      var ics = t.closest("[data-ics]");
      if (ics) {
        var kind = ics.getAttribute("data-ics"), b = state.badge;
        if (kind === "retreat") downloadIcs(retreatEvents(null), "upriver-27.ics");
        if (kind === "retreat-mine" && b) downloadIcs(retreatEvents(b.thursday && b.thursday.id), "upriver-27.ics");
        if (kind === "shuttle" && b && b.shuttle.id) downloadIcs([shuttleEvent(byId(D.shuttles, b.shuttle.id))], "upriver-27-shuttle.ics");
        return;
      }
      var row = t.closest("[data-session]");
      if (row) { var f = findSession(row.getAttribute("data-session")); if (f) openSheet(f.s.title, sessionSheet(f.s, f.day), row); return; }
      var opt = t.closest("[data-option]");
      if (opt) {
        var c = choiceSession(), cs = findSession(c.id), o = byId(c.options, opt.getAttribute("data-option"));
        openSheet(o.title, sessionSheet(c, cs.day, o), opt);
        return;
      }
      var open = t.closest('[data-open="contacts"]');
      if (open) { openSheet(D.contacts.heading, contactsList(), open, "contacts"); return; }
      if (t.closest("#badge-flip")) { flipBadge(!$("badge-card").classList.contains("is-flipped"), true); return; }
      if (t.closest("#badge-save, [data-badge-save]")) { saveBadgePng(); return; }
    });
    $("help-btn").setAttribute("data-open", "contacts");
  }

  function renderChrome() {
    var m = D.meta, on = D.sections.filter(function (s) { return s.on && (R[s.id] || s.panel); });
    function panelBtn(s, cls, inner) {
      return '<button type="button" class="' + cls + '" data-open="' + s.id + '" aria-haspopup="dialog">' + inner + "</button>";
    }
    document.title = m.pageTitle || m.name;
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", plain(m.description));
    if (m.fictionNotice) { $("notice").textContent = m.fictionNotice; $("notice").hidden = false; }
    $("brand").innerHTML = '<span class="brand-mark mono" aria-hidden="true">' + esc(m.shortName) + '</span><span class="brand-name">' + esc(m.name) + "</span>";
    $("brand").setAttribute("aria-label", m.name + ", back to top");
    var welcomeOn = on.some(function (s) { return s.id === "welcome"; });
    $("welcome").hidden = !welcomeOn;
    if (welcomeOn) {
      $("hero").innerHTML = R.welcome();
      $("hero-moment").innerHTML = welcomePhoto();
      $("hero-after").innerHTML = welcomeAfter();
    }
    // Phones show five tabs; the rail from 1024px also lists contacts.
    $("nav").innerHTML = on.map(function (s) {
      var inner = '<span class="tab-short">' + esc(s.short || s.label) + '</span><span class="tab-long">' + esc(s.label) + "</span>";
      return '<li class="tab-' + s.id + '">' + (s.panel ? panelBtn(s, "tab-btn", inner) : '<a href="#' + s.id + '">' + inner + "</a>") + "</li>";
    }).join("");
    var pages = on.filter(function (s) { return !s.panel; });
    $("sections").innerHTML = pages.filter(function (s) { return s.id !== "welcome"; }).map(function (s) { return R[s.id](); }).join("");
    $("footer").innerHTML = '<div class="footer-inner"><p class="footer-word" aria-hidden="true">' + esc(m.name) + "</p>" +
      '<nav aria-label="Footer"><ul class="footer-links">' + on.map(function (s) {
        return "<li>" + (s.panel ? panelBtn(s, "link-btn", esc(s.label)) : '<a href="#' + s.id + '">' + esc(s.label) + "</a>") + "</li>";
      }).join("") + "</ul></nav>" +
      '<p class="footer-small">' + esc(m.fictionNotice || "") + "</p>" + (m.photoNote ? '<p class="footer-small">' + esc(m.photoNote) + "</p>" : "") + "</div>";
    return pages.map(function (s) { return s.id; });
  }

  // ---------- badge motion ----------
  // One damped spring drives the drop, the swing after a drag and the sway on confirm.
  // The pendulum pivots at the top of the lanyard (transform-origin 50% 0). Angles in degrees.
  var SW = { th: 0, w: 0, y: 0, vy: 0, zeta: 0.17, raf: 0, last: 0, stop: 0 };
  var SW_OMEGA = 6.9, Y_OMEGA = 10, Y_ZETA = 0.62, SW_MAX = 2400;
  function applySwing() {
    var p = $("pendulum");
    if (p) p.style.transform = SW.y || SW.th ? "translateY(" + SW.y.toFixed(1) + "px) rotate(" + SW.th.toFixed(2) + "deg)" : "";
  }
  function stopSwing() { if (SW.raf) cancelAnimationFrame(SW.raf); SW.raf = 0; }
  function runSwing(zeta) {
    SW.zeta = zeta; SW.stop = performance.now() + SW_MAX; SW.last = 0;
    if (!SW.raf) SW.raf = requestAnimationFrame(tickSwing);
  }
  function tickSwing(ts) {
    var dt = SW.last ? Math.min(0.032, (ts - SW.last) / 1000) : 0.016;
    SW.last = ts;
    // In the last 500ms the damping ramps up, so the motion always settles before the cap instead of snapping.
    var left = SW.stop - ts, zeta = left < 500 ? SW.zeta + (1 - Math.max(0, left) / 500) * 4 : SW.zeta;
    SW.w += (-SW_OMEGA * SW_OMEGA * SW.th - 2 * zeta * SW_OMEGA * SW.w) * dt; SW.th += SW.w * dt;
    SW.vy += (-Y_OMEGA * Y_OMEGA * SW.y - 2 * Y_ZETA * Y_OMEGA * SW.vy) * dt; SW.y += SW.vy * dt;
    var still = Math.abs(SW.th) < 0.05 && Math.abs(SW.w) < 0.5 && Math.abs(SW.y) < 0.5 && Math.abs(SW.vy) < 5;
    if (still || ts >= SW.stop) { SW.th = SW.w = SW.y = SW.vy = 0; SW.raf = 0; applySwing(); return; }
    applySwing();
    SW.raf = requestAnimationFrame(tickSwing);
  }
  // Confirm (tier 2): one sway as the card flips. Softer version: the flip crossfades and nothing sways.
  function sway() { if (soft()) return; SW.w += 55; runSwing(0.45); }

  // Mouse and pen only, so touch scrolling is never captured. Decorative: nothing here is focusable.
  function wireDrag() {
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    var stage = $("badge-stage"), pend = $("pendulum"), drag = null;
    function sync() { stage.classList.toggle("can-drag", fine.matches); }
    sync();
    if (fine.addEventListener) fine.addEventListener("change", sync);
    function angle(e) { return -Math.atan2(e.clientX - drag.px, e.clientY - drag.py) * 180 / Math.PI; }
    pend.addEventListener("pointerdown", function (e) {
      if (!fine.matches || e.pointerType === "touch" || e.button !== 0) return;
      e.preventDefault();
      stopSwing(); SW.y = SW.vy = 0;
      var r = stage.getBoundingClientRect();
      drag = { px: r.left + r.width / 2, py: r.top, t: performance.now() };
      drag.off = angle(e) - SW.th; drag.last = SW.th;
      pend.setPointerCapture(e.pointerId);
      stage.classList.add("is-dragging");
    });
    pend.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var now = performance.now(), th = Math.max(-40, Math.min(40, angle(e) - drag.off)), dt = Math.max(0.008, (now - drag.t) / 1000);
      SW.w = Math.max(-400, Math.min(400, 0.6 * SW.w + 0.4 * (th - drag.last) / dt));
      SW.th = th; drag.last = th; drag.t = now;
      applySwing();
    });
    function release() {
      if (!drag) return;
      drag = null;
      stage.classList.remove("is-dragging");
      // Tier 2: the softer version eases straight back with no swing.
      if (soft()) SW.w = 0;
      runSwing(soft() ? 1 : 0.17);
    }
    pend.addEventListener("pointerup", release);
    pend.addEventListener("pointercancel", release);
    pend.addEventListener("lostpointercapture", release);
  }

  function mountBadge() {
    $("badge-col").innerHTML = badgeHtml();
    placeBadge();
    var mq = WIDE.addEventListener ? WIDE : null;
    if (mq) WIDE.addEventListener("change", placeBadge); else WIDE.addListener(placeBadge);
    wireDrag();
    // Tier 1: the badge drops in once per page load for everyone, reduced motion included:
    // from above, overshoot, two or three damped swings, settled under 2.5s, no flashing.
    // Moving it between columns later does not replay it.
    SW.y = -($("pendulum").offsetHeight + 40); SW.vy = 0; SW.th = 10; SW.w = 0;
    applySwing();
    runSwing(0.17);
  }

  // ---------- check-in screen (opened from the QR URL) ----------
  function parseCheckin(hash) {
    var i = hash.indexOf("?");
    if (i < 0) return null;
    var p;
    try { p = new URLSearchParams(hash.slice(i + 1)); } catch (e) { return null; }
    var name = (p.get("n") || "").trim(), room = (p.get("r") || "").trim(), t = p.get("t"), s = (p.get("s") || "").toUpperCase();
    var rm = room.match(/^([A-Za-z]+)(\d{1,3})$/);
    var c = choiceSession(), opt = t ? (c ? byId(c.options, t) : null) : null;
    var arrive = D.shuttles.filter(function (x) { return x.dir === "arrive" && shuttleCode(x) === s; })[0];
    if (!name || name.length > 60 || !rm || (t && !opt) || (!arrive && s !== "DRIVE")) return null;
    var friday = arrive ? D.shuttles.filter(function (x) { return x.dir === "depart" && x.mode === arrive.mode; })[0] : null;
    return { name: name, room: rm[1] + " " + rm[2], opt: opt, session: c, friday: friday };
  }
  function checkinHtml(v) {
    var ci = D.rsvp.checkin, m = D.meta;
    if (!v) {
      return '<div class="ci-plain"><h1 class="ci-title" id="checkin-title">' + esc(ci.broken) + '</h1><p><a href="' + esc(location.pathname) + '" class="ci-link">' + esc(ci.brokenLink) + "</a></p></div>";
    }
    var thu = "";
    if (v.opt) {
      var cs = findSession(v.session.id), t = sessionTimes(cs.day, v.session);
      thu = esc(v.opt.title) + '<span class="ci-sub mono">' + esc(fmtWeekday(t.start) + " " + t.label) + "</span>";
    }
    var fri = v.friday ? '<span class="mono">' + esc(shuttleCode(v.friday) + " " + fmtTime(shuttleTimes(v.friday).start)) + '</span><span class="ci-sub">to ' + esc(v.friday.to) + "</span>" : "No shuttle, driving";
    return '<div class="ci-card">' +
      '<div class="badge-head"><span class="badge-slot" aria-hidden="true"></span><p class="badge-event">' + esc(m.name) + '</p><p class="badge-org mono">' + esc(m.org) + " retreat</p></div>" +
      '<div class="ci-body"><h1 class="ci-title" id="checkin-title">' + esc(ci.title) + "</h1>" +
        '<dl class="badge-fields ci-fields">' +
          '<div class="bf bf-name"><dt>Name</dt><dd>' + esc(v.name) + "</dd></div>" +
          '<div class="bf bf-room"><dt>Room</dt><dd>' + esc(v.room) + "</dd></div>" +
          (thu ? '<div class="bf bf-thursday"><dt>Thursday</dt><dd>' + thu + "</dd></div>" : "") +
          '<div class="bf bf-shuttle"><dt>Friday shuttle</dt><dd>' + fri + "</dd></div>" +
        "</dl>" +
        '<p class="ci-key">' + esc(ci.key) + "</p>" +
        '<button type="button" class="btn ci-done" id="checkin-done">' + esc(ci.done) + "</button>" +
      "</div></div>";
  }
  function showCheckin() {
    if (location.hash.indexOf("#checkin") !== 0) return;
    var dlg = $("checkin");
    $("checkin-body").innerHTML = checkinHtml(parseCheckin(location.hash));
    document.documentElement.classList.add("has-sheet");
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
    var done = $("checkin-done") || dlg.querySelector(".ci-link");
    if (done) done.focus();
  }
  function closeCheckin() {
    var dlg = $("checkin");
    if (dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
  }
  function wireCheckin() {
    var dlg = $("checkin");
    dlg.addEventListener("close", function () {
      document.documentElement.classList.remove("has-sheet");
      if (location.hash.indexOf("#checkin") === 0) history.replaceState(null, "", location.pathname + location.search);
      $("main").focus();
    });
    dlg.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#checkin-done")) closeCheckin(); });
    window.addEventListener("hashchange", showCheckin);
    showCheckin();
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
      var ids = renderChrome();
      mountBadge();
      wireTabs(); wirePacking(); wireForm(); wireGlobal(); wireSheet(); wireNav(ids); wireCheckin();
      window.Upriver = { data: D, badge: null };
      if (location.hash.length > 1 && location.hash.indexOf("#checkin") !== 0) {
        var target = $(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    })
    .catch(showError);
})();
