# Rentoule Projects Website

Premium renovations, extensions and selective custom homes, Canberra ACT.

## Tech
- Static HTML, CSS and JS. No framework, no build step on Netlify.
- Hosted on Netlify. Pushes to `main` deploy to production automatically.
- Serverless function: `netlify/functions/hubspot-deal-create.js` (HubSpot deal automation).

## Structure
| Path | Page |
|---|---|
| `/` | Home |
| `/services/` | Services (plus `/services/<specialist>/` landing pages) |
| `/how-we-work/` | Process, PSA and client portal |
| `/projects/` | Case studies |
| `/canberra-renovation-guide/` | The free guide |
| `/blog/` | Journal index and articles |
| `/about/`, `/contact/`, `/careers/` | Company pages |
| `/success-consult/` | Post-enquiry page (noindex) |
| `/internal/` | Team pages (legacy layout, noindex) |

## Design system
- `assets/css/rp.css` - one stylesheet for every public page.
- `assets/js/rp.js` - header, menu, tabs, process stepper, guide navigation, careers form.
- `base.css`, `style.css`, `app.js` - legacy files kept only for `/internal/`.

## Shared header, footer and head
The header, footer and shared `<head>` (fonts, stylesheet, Meta Pixel, HubSpot, attribution, Clarity) live in `tools/partials/`. Every page marks those regions with `<!-- rp:head -->`, `<!-- rp:header -->` and `<!-- rp:footer -->` comments.

After editing a partial, run from the repository root:

```
python3 tools/rp_build.py
```

and commit the updated pages. `/tools/` is never served (see `netlify.toml`).

## Adding a journal article
Copy an existing article folder in `blog/`, edit the content and meta, then add a card to `blog/index.html` and an entry to `sitemap.xml`.

## Integrations (do not remove)
- HubSpot enquiry form embed and deal hook: `contact/index.html`
- Careers application (Netlify Forms): `careers/index.html`
- Attribution: `tracking.js`, loaded on every page via the shared head

## Landing pages (homepage, Projects, About)

- `assets/css/landing.css` and `assets/js/landing.js` hold the full-screen sections, the scroll glide
  (a small scroll moves to the next section; long sections scroll normally), the big hero logo that
  settles into the header, and the reviews carousel. Pages opt in by linking both files and using the
  `.hc-*` components. Article, guide and service landing pages do not use them, so reading stays normal.
- Brand palette: cream and stone grounds, deep forest instead of black, gold for actions and accents.
  Headings carry no italic or script flourishes; the script lives in the logo.
