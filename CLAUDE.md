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
- `app.js` - one renderer per section in the `R` object. To add a section: add a renderer `R.<id>`, then add `{ "id": "<id>", "label": "...", "on": true }` to `sections`.
- `#hero-moment` in `index.html` is reserved for the one big hero element.

## Built-in features (keep them working)
- Itinerary day tabs (arrow keys work, opens on today during the retreat). Session leads show as avatar plus first name.
- One .ics for the whole retreat (UTC, folded at 75 bytes). After RSVP: the retreat with the chosen Thursday activity, plus the chosen shuttle as its own .ics.
- Packing checklist saved to localStorage (wrapped in try/catch).
- Demo RSVP with yes/no branches, validation and a confirmation state. Nothing is sent anywhere.
- Badge data: after a yes RSVP, `window.Upriver.badge` holds name, team, room, shuttle, Thursday pick, dietary and a fake QR (`qr.rows`, 25 strings of 0/1). A `upriver:badge` event fires on `document`.
- Skip link, visible focus, reduced-motion support.

## Rules
- No em dashes anywhere, in code comments or copy. Use a hyphen.
- Left-align text. No eyebrow labels over headings. No decorative numbering. No gradients. No drop shadows at rest.
- Every color means one thing (a track, a state, the selected ticket). Keep at least one big field of color per screen.
- Check 360, 390, 768 and 1280 px wide: no sideways scroll, no clipped headings.
- Commit and push after every finished change.
