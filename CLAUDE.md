# Working in this repo

One-page event site. Plain HTML, CSS, vanilla JS. No framework, no build step. Deploys to GitHub Pages from `main`, root.

## Where things live
- `data/event.json` - all content. Change copy here, not in the markup.
  - `sections` sets order and on/off for every section. Nav and footer follow it. `welcome` renders into the hero. An entry with `"panel": true` (contacts) is not a page section: its nav and footer items open the panel.
  - Itinerary sessions carry `type` (meal, session, social, travel, free), `place`, optional `detail` and `leads` (ids in `people`). A session with `choice: true` lists `options`, each with `capacity` and `taken`.
  - `shuttles` drive the travel rows, the RSVP arrival windows, the badge, and the shuttle .ics (arrival shuttles carry an `address` used as the .ics location).
  - `guests` pre-fill the RSVP from `?g=<id>`.
  - `[PLACEHOLDER]` in any string shows a visible Placeholder tag.
- `styles.css` - design tokens at the top of `:root`. Change tokens first, then section styles.
- `assets/` - slate duotone photos (welcome, hotel, session leads). Credits in `assets/CREDITS.md`. Convert new photos to the same duotone before adding them.
- `app.js` - one renderer per section in the `R` object. To add a section: add a renderer `R.<id>`, then add `{ "id": "<id>", "label": "...", "on": true }` to `sections`.
- `#hero-moment` in `index.html` is reserved for the one big hero element.

## Built-in features (keep them working)
- App shell: phones get a sticky top bar (Help opens contacts) and a five-tab bottom bar; from 1024px a left rail, the content column, and the slate badge column. Rail and badge column run the full page height; their contents are sticky. Tabs highlight the section in view.
- Slide-up sheet (native `<dialog>`) for session details. Contacts live only in that panel: Home's Contacts row, Help, the rail item and the footer link open it. Below 1024px it is a bottom sheet, from 1024px a centered dialog. Closes with X, Escape and outside tap; focus returns to the opener.
- Guest badge (hero moment): one damped spring in app.js (pivot at the lanyard top) drops it in once with two or three swings, under 2.5s. Mouse and pen can drag it and it swings back; touch never drags. It fills live from the RSVP (mini badge follows the form on phones), sways once and flips to a real QR on confirmation, and "Save badge" exports a PNG drawn on canvas.
- Check-in: the QR encodes `<site>#checkin?n=<name>&r=<room>&t=<pick>&s=<arrival shuttle or DRIVE>`, no email or dietary info. That URL opens a full-screen check-in dialog; bad data shows "This badge couldn't be read". QR library: qrcode-generator 1.4.4 from cdnjs.
- Itinerary segmented control (arrow keys work, opens on today during the retreat), slate day bands, rows open the sheet. Your Thursday pick turns orange after RSVP. Leads show as 24px photo plus first name.
- One .ics for the whole retreat (UTC, folded at 75 bytes). After RSVP: the retreat with the chosen Thursday activity, plus the chosen shuttle as its own .ics.
- Packing checklist saved to localStorage (wrapped in try/catch).
- Demo RSVP with yes/no branches, validation and a confirmation state. Any valid email is accepted. On an error the first invalid field scrolls clear of the top bar and mini badge and takes focus. Nothing is sent anywhere.
- Badge data: after a yes RSVP, `window.Upriver.badge` holds name, team, room, shuttle, Thursday pick, dietary and `qr` (`url`, `size`, `rows` as strings of 0/1). A `upriver:badge` event fires on `document`.
- Skip link, visible focus, motion tiers (below).

## Motion tiers
Every motion effect has a tier. Add a new effect to this table, with its tier, in the same change that adds it.
- **Tier 1** plays for everyone, reduced motion included: once, under 5 seconds, no flashing.
- **Tier 2** has a softer version under `prefers-reduced-motion: reduce`.
- **Tier 3** runs for everyone and ships with a visible on/off toggle.
- `?motion=full` in the URL forces the full version of every effect (it sets `.motion-full` on `<html>`; `soft()` in app.js returns false). Use it for demos and review.
- Anything not in this table is switched off under reduced motion by the safety net at the top of `styles.css`.

| Effect | Where | Tier | Full version | Softer version (reduced motion) |
|---|---|---|---|---|
| Badge drop and swing | `mountBadge`, spring in app.js | 1 | Drops from above, overshoots, two or three damped swings, settles at about 2.4s | Same as full |
| Badge flip on RSVP confirm, plus one sway | `confirmRsvp`, `flipBadge`, `sway` | 2 | 700ms 3D turn, one sway on the lanyard | 200ms crossfade between faces, no sway |
| Badge flip from the Show front / Show check-in code button | `flipBadge` | 2 | 700ms 3D turn | 200ms crossfade |
| Badge swing back after a drag (mouse and pen only) | `wireDrag` | 2 | Damped swing back to rest | Eases straight back, no swing |
| Session sheet and contacts sheet (below 1024px) | `.sheet-panel` | 2 | 260ms slide up | 150ms fade |
| Contacts dialog (1024px and up) | `.sheet[data-kind="contacts"]` | 2 | 160ms fade and slight scale | 150ms fade |
| Smooth scroll for tab and anchor links, and to the first invalid RSVP field | `html` scroll-behavior, `revealField` | 2 | Smooth scroll | Jumps |
| Packing progress meter | `.pack-meter span` | 2 | 200ms width ease | Updates instantly |
| Button, pill, tab and chip hover colors | `.btn`, `.pill` and others | 2 | 120ms color fade | Changes instantly |
| Tier 3 effects | none yet | 3 | Any looping or ambient motion must ship with an on/off toggle | n/a |

## Rules
- No em dashes anywhere, in code comments or copy. Use a hyphen.
- Left-align text. No eyebrow labels over headings. No decorative numbering. No gradients. No drop shadows at rest.
- Every color means one thing: birch is the page, ink is text and focus, slate is structure (day bands, secondary surfaces, photos), orange is "you" (your badge, your picks, primary actions, the current tab). Keep at least one big field of color per screen.
- One radius for surfaces (`--r`), pills for controls. Flat at rest; the only shadow is the inset press feedback.
- Icons: Lucide, inline SVG, one stroke weight, only next to data (activity type, transport mode, dietary, contact method). They sit bare, never in a filled circle or chip. Never emoji.
- One container level per element: no cards or pills inside rows inside rounded groups. Grouped lists are for Travel and the contacts panel; Packing is a ruled checklist. No colored side strips.
- Tap targets come from `--tap`, which grows under `@media (pointer: coarse)`.
- Check 360, 390, 768, 1024 and 1280 px wide: no sideways scroll, no clipped headings.
- Commit and push after every finished change.
