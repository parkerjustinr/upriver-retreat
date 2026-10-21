# Working in this repo

One-page event site. Plain HTML, CSS, vanilla JS. No framework, no build step. Deploys to GitHub Pages from `main`, root.

## Where things live
- `data/event.json` - all content. Change copy here, not in the markup.
  - `sections` sets order and on/off for every section. Nav and footer follow it. `welcome` renders into the hero.
  - Itinerary sessions carry `type` (meal, session, social, travel, free), `place`, optional `detail` and `leads` (ids in `people`). A session with `choice: true` lists `options`, each with `capacity` and `taken`.
  - `shuttles` drive the travel rows, the RSVP arrival windows, the badge, and the shuttle .ics.
  - `guests` pre-fill the RSVP from `?g=<id>`.
  - `[PLACEHOLDER]` in any string shows a visible Placeholder tag.
- `styles.css` - design tokens at the top of `:root`. Change tokens first, then section styles.
- `assets/` - slate duotone photos (welcome, hotel, session leads). Credits in `assets/CREDITS.md`. Convert new photos to the same duotone before adding them.
- `app.js` - one renderer per section in the `R` object. To add a section: add a renderer `R.<id>`, then add `{ "id": "<id>", "label": "...", "on": true }` to `sections`.
- `#hero-moment` in `index.html` is reserved for the one big hero element.

## Built-in features (keep them working)
- App shell: phones get a sticky top bar (Help opens contacts) and a five-tab bottom bar; from 1024px a left rail, the content column, and the badge sticky in a right column. Tabs highlight the section in view.
- Slide-up sheet (native `<dialog>`) for session details and contacts. Closes with X, Escape and outside tap; focus returns to the opener.
- Guest badge (hero moment): drops in once, fills live from the RSVP (mini badge follows the form on phones), flips to the fake QR on confirmation, "Save badge" exports a PNG drawn on canvas.
- Itinerary segmented control (arrow keys work, opens on today during the retreat), slate day bands, rows open the sheet. Your Thursday pick turns orange after RSVP. Leads show as 24px photo plus first name.
- One .ics for the whole retreat (UTC, folded at 75 bytes). After RSVP: the retreat with the chosen Thursday activity, plus the chosen shuttle as its own .ics.
- Packing checklist saved to localStorage (wrapped in try/catch).
- Demo RSVP with yes/no branches, validation and a confirmation state. Nothing is sent anywhere.
- Badge data: after a yes RSVP, `window.Upriver.badge` holds name, team, room, shuttle, Thursday pick, dietary and a fake QR (`qr.rows`, 25 strings of 0/1). A `upriver:badge` event fires on `document`.
- Skip link, visible focus, reduced-motion support.

## Rules
- No em dashes anywhere, in code comments or copy. Use a hyphen.
- Left-align text. No eyebrow labels over headings. No decorative numbering. No gradients. No drop shadows at rest.
- Every color means one thing: birch is the page, ink is text and focus, slate is structure (day bands, secondary surfaces, photos), orange is "you" (your badge, your picks, primary actions, the current tab). Keep at least one big field of color per screen.
- One radius for surfaces (`--r`), pills for controls. Flat at rest; the only shadow is the inset press feedback.
- Icons: Lucide, inline SVG, one stroke weight, only next to data (activity type, transport mode, dietary, contact method). They sit bare, never in a filled circle or chip. Never emoji.
- One container level per element: no cards or pills inside rows inside rounded groups. Grouped lists are for Travel; Packing is a ruled checklist and Contacts is a slate field. No colored side strips.
- Tap targets come from `--tap`, which grows under `@media (pointer: coarse)`.
- Check 360, 390, 768, 1024 and 1280 px wide: no sideways scroll, no clipped headings.
- Commit and push after every finished change.
