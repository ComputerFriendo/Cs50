# AAR Compiler & Knowledge Center

A static After-Action Review (AAR) compiler and knowledge center for Neocities. Plain HTML, CSS and JavaScript. No build step, server, account system, external dependency, analytics or tracking.

## Upload to Neocities

1. In your Neocities dashboard, create a folder, for example `aar`.
2. Upload these, keeping the folder structure:
   - `index.html`, `compiler.html`, `library.html`, `privacy.html`, `security.html`
   - the `css/`, `js/` and `data/` folders with everything inside them
3. Do **not** upload `tools/` or this README. They are for maintenance only.
4. Visit `https://<your-site>.neocities.org/aar/` and open the compiler.

All links inside the site are relative, so the site works in any folder.

## Files

| File | Purpose |
|---|---|
| `index.html` | Home page |
| `compiler.html` | The 17-stage AAR compiler |
| `library.html` | Knowledge Center, Official Guidance, Report Library, Templates, Specialized Guides, Glossary, Search, FAQ, About |
| `privacy.html`, `security.html` | Static pages that work without JavaScript |
| `css/site.css` | All styles, including print |
| `js/dom.js` | Safe DOM helpers (no innerHTML anywhere), link validation, downloads |
| `js/stages.js` | Every compiler stage, field, prompt, checklist and report preset. The project schema is built from this file |
| `js/store.js` | Project model, localStorage, JSON backup and strict import validation |
| `js/validate.js` | Stage status, quality-control checks, integrity checks, Improvement Plan statistics, traceability |
| `js/report.js` | Report assembly and HTML, Markdown, text and CSV exports |
| `js/compiler.js` | Compiler interface |
| `js/library.js` | Library pages and client-side search |
| `js/nav.js` | Header menu, header search, home page status |
| `data/*.js` | Content: resources, reports, knowledge articles and frameworks, glossary and FAQ, templates, specialized guides |
| `tools/build_pages.py` | Regenerates the five HTML pages from one shared header and footer (maintenance only) |

## Editing content

Each data file starts with its editing rules. In short:

- **Official resources and reports:** link only to official sources. Never invent titles or URLs. Set `verified: "YYYY-MM-DD"` after a person opens the link and confirms it. Until then the site shows "Link not yet verified".
- **Report summaries** are site-written and labelled that way. Add strengths, findings and lessons only when they come from the official document.
- **Compiler fields:** add a field to a stage in `js/stages.js`. Saving, import validation and the report pick it up automatically. Add the field to the report layout in `js/report.js` if it should be printed.
- **Page shells:** edit `tools/build_pages.py`, then run `python3 tools/build_pages.py` from this folder.

## Security notes

- Every page sets a Content Security Policy meta tag: only this site's scripts and styles, no inline code, no network connections, no frames, and Trusted Types enforced. Any accidental `innerHTML` would throw an error instead of running.
- Neocities cannot set HTTP headers, so `frame-ancestors`, HSTS, `X-Content-Type-Options` and `Permissions-Policy` cannot be set by this site. A script-based frame guard is used instead. See `security.html`.
- Project data is stored unencrypted in the user's browser under one key, `aarc.v1`.

## Known gaps (first release)

- **Official links:** none had been verified at build time, because the build environment could not reach government websites. Every link carries a "not yet verified" label until someone checks it.
- **Report library:** several entries have no confirmed official link yet. Those entries show the agency's website and a search tip instead.
- **Not yet built:** cross-report comparison, recurring-finding tracking, trend analysis and graphical relationship maps. Traceability is shown as a chain per finding and as a table in Quality Control.
