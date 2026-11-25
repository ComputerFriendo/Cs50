// tools/build_single.mjs
// Builds single/index.html: the whole site as ONE readable, organized, self-contained page.
//   - A table of contents with line numbers at the top of the file
//   - Color-coded section banners (🟦 page structure, 🟩 styles, 🟥 security, 🟨 core logic, 🟪 content data, 🟧 interface)
//   - Developer notes at the start of every section
//   - Every inline <style> and <script> is allowed by its exact SHA-256 hash in the Content Security Policy
// Usage, from the aar-site/ folder:  node tools/build_single.mjs
// No dependencies.
import fs from "node:fs";
import crypto from "node:crypto";

const read = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trim(); /* no trailing spaces: some editors strip them, which would change the fingerprints */
const between = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error("marker not found: " + a); return s.slice(i + a.length, j); };
const patch = (s, from, to, name) => { if (!s.includes(from)) throw new Error("patch failed in " + name + ": " + from); return s.replace(from, to); };
const sha = (s) => "'sha256-" + crypto.createHash("sha256").update(s, "utf8").digest("base64") + "'";

/* Internal links become hash routes on the single page. */
const relink = (s) => s
  .replace(/compiler\.html#s=/g, "#s=").replace(/compiler\.html#/g, "#").replace(/compiler\.html/g, "#compiler")
  .replace(/library\.html#/g, "#").replace(/library\.html/g, "#knowledge")
  .replace(/index\.html/g, "#home").replace(/privacy\.html/g, "#privacy").replace(/security\.html/g, "#security");

/* ---------- Page structure taken from the multi-page site ---------- */
const index = read("index.html"), lib = read("library.html"), priv = read("privacy.html"), sec = read("security.html");
const dedent = (s) => s.replace(/^\n+|\s+$/g, "").split("\n").map((l) => "  " + l.replace(/^\s{0,2}/, "")).join("\n");
const header = dedent(relink(between(index, '<header class="site-header">', "</header>"))
  .replace(/<form id="site-search"[^>]*>/, '<form id="site-search" class="site-search" role="search">')
  .replace(/ data-page="(home|compiler|privacy|security)"/g, ' data-view="$1"'));
const footer = dedent(relink(between(index, '<footer class="site-footer">', "</footer>")));
const home = dedent(relink(between(index, '<main id="main">', "</main>")));
const libnav = dedent(relink(between(lib, '<nav id="libnav" class="side" aria-label="Library sections">', "</nav>")));
const privacy = dedent(relink(between(priv, '<main id="main" class="content">', "</main>")));
const security = dedent(relink(between(sec, '<main id="main" class="content">', "</main>")));

/* ---------- Scripts, with the small changes the single page needs ---------- */
const SP = "/* SINGLE-PAGE EDITION: ";
let compiler = read("js/compiler.js");
compiler = patch(compiler, "function render() {", 'function render() {\n    ' + SP + 'render only while the compiler view is showing. */\n    if (A.view() !== "compiler") return;', "compiler");
compiler = patch(compiler, "if (S.p && S.p.stage && !location.hash)", 'if (S.p && S.p.stage && location.hash === "#compiler") /* SINGLE-PAGE EDITION: #compiler resumes the saved stage */', "compiler");
let library = read("js/library.js");
library = patch(library, "function route() {", 'var routedOnce = false; ' + SP + 'kept here because window.AAR is frozen after load. */\n  function route() {\n    ' + SP + 'render only while the library view is showing. */\n    if (A.view() !== "library") return;', "library");
library = patch(library, "if (A.routedOnce)", "if (routedOnce)", "library");
library = patch(library, "A.routedOnce = true;", "routedOnce = true;", "library");
let nav = read("js/nav.js");
nav = patch(nav, 'if (/library\\.html$/.test(location.pathname)) location.hash = "search?q=" + encodeURIComponent(q); else location.href = target;',
  'location.hash = "search?q=" + encodeURIComponent(q); ' + SP + "search is a view on this page. */", "nav");

/* ---------- New code for the single page ---------- */
const ROUTER = `(function () {
  "use strict";
  var A = window.AAR;
  /* Which hash belongs to which view. Anything unknown shows the home view. */
  var LIBRARY_SECTIONS = /^(knowledge|guidance|reports|templates|guides|glossary|search|faq|about)$/;
  var TITLES = { home: "AAR Compiler & Knowledge Center", privacy: "Privacy | AAR Compiler", security: "Security | AAR Compiler" };
  var VIEWS = ["home", "compiler", "library", "privacy", "security"];

  A.view = function () {
    var hash = location.hash.replace(/^#/, ""), first = hash.split(/[\\/?]/)[0];
    if (/^s=/.test(hash) || hash === "compiler") return "compiler";
    if (LIBRARY_SECTIONS.test(first)) return "library";
    if (hash === "privacy" || hash === "security") return hash;
    return "home";
  };

  var last = null;
  function show() {
    var v = A.view();
    VIEWS.forEach(function (k) { document.getElementById("v-" + k).hidden = k !== v; });
    /* Mark the current menu item for screen readers and the gold underline. */
    var first = location.hash.slice(1).split(/[\\/?]/)[0];
    document.querySelectorAll("#site-nav a").forEach(function (a) {
      var on = v === "library" ? a.getAttribute("href") === "#" + first : a.getAttribute("data-view") === v;
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (TITLES[v]) document.title = TITLES[v];
    if (v !== last) { window.scrollTo(0, 0); var menu = document.getElementById("site-nav"); if (menu) menu.classList.remove("open"); }
    last = v;
  }
  window.addEventListener("hashchange", show);
  document.addEventListener("DOMContentLoaded", function () {
    show();
    /* The skip link moves focus without changing the hash (changing it would switch views). */
    var skip = document.querySelector(".skip");
    if (skip) skip.addEventListener("click", function (e) { e.preventDefault(); var m = document.getElementById("main"); m.setAttribute("tabindex", "-1"); m.focus(); });
  });
})();`;

const LOCKDOWN = `(function () {
  "use strict";
  var A = window.AAR;

  /* 1. Deep-freeze all content and configuration (every ALL-CAPS property: RESOURCES, STAGES, TEMPLATES...).
        Nothing can alter official links, stage definitions or templates after the page loads. */
  function deepFreeze(o) {
    if (o && typeof o === "object" && !Object.isFrozen(o)) {
      Object.freeze(o);
      Object.getOwnPropertyNames(o).forEach(function (k) { deepFreeze(o[k]); });
    }
    return o;
  }
  Object.keys(A).forEach(function (k) { if (/^[A-Z_]+$/.test(k)) deepFreeze(A[k]); });

  /* 2. Freeze the AAR namespace itself, so no function (safeHref, h, sanitizeProject...) can be replaced. */
  Object.freeze(A);
  try { Object.defineProperty(window, "AAR", { value: A, writable: false, configurable: false }); } catch (e) { /* already locked */ }

  /* 3. Freeze the built-in prototypes, so prototype pollution (for example a "__proto__" key in an imported file)
        cannot add properties to every object. The import code already drops such keys; this is a second layer. */
  [Object.prototype, Array.prototype, Function.prototype, String.prototype, Number.prototype, Boolean.prototype].forEach(Object.freeze);
})();`;

/* ---------- Sections: color, number, title, source, dev notes ---------- */
const C = { page: "🟦", style: "🟩", sec: "🟥", core: "🟨", data: "🟪", ui: "🟧" };
const scripts = [
  { n: "5.1", c: C.sec, t: "Safe DOM helpers and frame guard", src: "js/dom.js", notes: [
    "WHAT: AAR.h() builds elements from text only; AAR.safeHref() allows only #links and https:// URLs; AAR.ext() makes safe external links; downloads; screen-reader announcements.",
    "SECURITY: the only way any script on this page puts text on screen. Never add innerHTML, outerHTML, insertAdjacentHTML, document.write, eval or new Function anywhere.",
    "SECURITY: the frame guard at the top hides the page if another site loads it in a frame (Neocities cannot send frame-ancestors headers).",
    "DEPENDS ON: nothing. Must stay the first script."] },
  { n: "5.2", c: C.core, t: "Compiler stages, fields and report presets", src: "js/stages.js", notes: [
    "WHAT: defines all 17 stages: purpose, instructions, guiding questions, fields, checklists, links to templates and resources.",
    "EDITING: add a field here and saving, import validation and the dashboard pick it up automatically. Add it to section 5.11 (report) if it should print.",
    "SECURITY: the saved-project schema is generated from these definitions, so imported files cannot contain fields that are not declared here."] },
  { n: "5.3", c: C.sec, t: "Project storage, backup and strict import validation", src: "js/store.js", notes: [
    "WHAT: the project model; saves to localStorage under ONE key, \"aarc.v1\"; JSON backup; import.",
    "SECURITY: imports must be .json, under 2 MB, nested no deeper than 8 levels, format \"aar-compiler-project\", schema 1. Every value is rebuilt field by field: wrong types, unknown keys, bad IDs, non-https links and broken references are dropped.",
    "PRIVACY: localStorage is not encrypted. Users are told not to enter sensitive information."] },
  { n: "5.4", c: C.data, t: "Content: official guidance library", src: "data/resources.js", notes: [
    "RULES: official sources only. Never invent titles or URLs. Set verified: \"YYYY-MM-DD\" only after a person opens the link and confirms it.",
    "STATUS: no link has been verified yet; the site labels each one \"Link not yet verified\"."] },
  { n: "5.5", c: C.data, t: "Content: completed report archive", src: "data/reports.js", notes: [
    "RULES: summaries are written for this site and labelled that way. Add findings or lessons only when they come from the official document.",
    "STATUS: five entries have url: null (no confirmed official link yet); they show the agency site and a search tip."] },
  { n: "5.6", c: C.data, t: "Content: Knowledge Center articles and analysis frameworks", src: "data/knowledge.js", notes: [
    "WHAT: the how-to articles (What is an AAR, writing findings, and so on) and the analysis frameworks used in Stage 10.",
    "These are site-written explanations, not official guidance."] },
  { n: "5.7", c: C.data, t: "Content: glossary and FAQ", src: "data/glossary.js", notes: ["WHAT: glossary terms with plain-language definitions, and the FAQ."] },
  { n: "5.8", c: C.data, t: "Content: templates", src: "data/templates.js", notes: ["WHAT: printable templates (charter, observation form, findings, Improvement Plan...). Each can be previewed, printed or downloaded."] },
  { n: "5.9", c: C.data, t: "Content: specialized AAR guides", src: "data/guides.js", notes: ["WHAT: focus areas for emergency management, exercises, cyber, safety, infrastructure, public health and more."] },
  { n: "5.10", c: C.core, t: "Quality control, integrity checks and statistics", src: "js/validate.js", notes: [
    "WHAT: stage completion status, the quality-control checklist, broken-reference checks, Improvement Plan statistics, finding-to-evidence traceability.",
    "DEPENDS ON: 5.2, 5.3."] },
  { n: "5.11", c: C.core, t: "Report assembly and exports", src: "js/report.js", notes: [
    "WHAT: turns the project into report blocks, then renders them as page preview, HTML file, Markdown, plain text and CSV.",
    "SECURITY: HTML export serializes DOM built from text nodes, so user text stays text. CSV cells that start with = + - @ get an apostrophe (spreadsheet formula injection).",
    "PRIVACY: participant contact details are never included in reports."] },
  { n: "5.12", c: C.ui, t: "Router: one view at a time", code: ROUTER, notes: [
    "WHAT: decides which view is visible from the address hash: #home, #compiler or #s=<stage>, #knowledge #guidance #reports #templates #guides #glossary #search #faq #about, #privacy, #security.",
    "NEW in the single-page edition. Sections 5.14 and 5.15 check AAR.view() before drawing."] },
  { n: "5.13", c: C.ui, t: "Header: menu button, site search, home page", src: "js/nav.js", notes: [
    "WHAT: mobile menu toggle, header search (runs in the browser; nothing is sent anywhere), saved-project status and featured links on the home view."] },
  { n: "5.14", c: C.ui, t: "AAR compiler interface", src: "js/compiler.js", notes: [
    "WHAT: draws the stage sidebar and the current stage: forms, record lists, dashboard, report preview, quality control, export and import.",
    "SECURITY: autosaves through 5.3 only. Imports show a preview and need confirmation before replacing the project. Reset deletes the storage key.",
    "DEPENDS ON: everything above."] },
  { n: "5.15", c: C.ui, t: "Knowledge Center and library interface", src: "js/library.js", notes: [
    "WHAT: draws the Knowledge Center, Official Guidance (with filters), Report Library, Templates, Guides, Glossary, Search, FAQ and About."] },
  { n: "5.16", c: C.sec, t: "Lockdown (must stay last)", code: LOCKDOWN, notes: [
    "WHAT: after every script above has loaded, freezes the content data, the AAR namespace and the built-in prototypes.",
    "WHY: even if an attacker found a way to run code later, they could not swap the link checker, change official URLs or pollute prototypes.",
    "IF YOU ADD CODE that writes to window.AAR at runtime, keep that state in a local variable instead (see routedOnce in 5.15)."] },
];

const contentOf = (s) => s.code || relink({ "js/compiler.js": compiler, "js/library.js": library, "js/nav.js": nav }[s.src] || read(s.src));

/* ---------- Banners ---------- */
const RULE = "═".repeat(96);
const marker = (n) => "SECTION " + n + " ";
const jsBanner = (s) => ["/* " + RULE, "   " + s.c + " " + marker(s.n) + "· " + s.t.toUpperCase() + (s.src ? "   (source: " + s.src + ")" : "   (single-page edition)"),
  "   " + "─".repeat(96), ...s.notes.map((x) => "   • " + x), "   " + RULE + " */"].join("\n");
const htmlBanner = (c, n, t, notes) => ["<!-- " + RULE, "     " + c + " " + marker(n) + "· " + t.toUpperCase(), ...(notes || []).map((x) => "     • " + x), "     " + RULE + " -->"].join("\n");

/* ---------- Style ---------- */
const css = "\n/* " + RULE + "\n   " + C.style + " " + marker("2") + "· STYLES   (source: css/site.css)\n   " + "─".repeat(96) +
  "\n   • One stylesheet. Its own numbered parts are listed in the table of contents (2.1 to 2.10).\n   • System fonts only, no external requests. Status is never shown by color alone.\n" +
  "   • Editing anything inside this <style> changes its fingerprint: re-run tools/build_single.mjs so the security policy matches.\n   " + RULE + " */\n" +
  read("css/site.css").replace(/\/\* (\d+)\. ([^*]+?) \*\//g, (m, d, t) => "/* " + "─".repeat(20) + " " + C.style + " " + marker("2." + d) + "· " + t.trim() + " " + "─".repeat(20) + " */") +
  "\n\n/* " + C.style + " " + marker("2.11") + "· Single-page edition: hidden views must stay hidden even when a view class sets display. */\n[hidden] { display: none !important; }\n";
const cssParts = [...read("css/site.css").matchAll(/\/\* (\d+)\. ([^*]+?) \*\//g)].map((m) => ["2." + m[1], m[2].replace(/:.*$/, "").trim()]);
cssParts.push(["2.11", "Single-page edition: hidden views"]);

const scriptBlocks = scripts.map((s) => { const body = "\n" + jsBanner(s) + "\n" + contentOf(s) + "\n"; if (/<\/script|<!--/i.test(body)) throw new Error("unsafe sequence in " + (s.src || s.t)); return { s, body }; });

const csp = [
  "default-src 'none'",
  "script-src " + scriptBlocks.map((b) => sha(b.body)).join(" "),
  "style-src " + sha(css),
  "img-src 'self' data:", "font-src 'none'", "connect-src 'none'", "media-src 'none'", "object-src 'none'", "frame-src 'none'", "child-src 'none'",
  "worker-src 'none'", "manifest-src 'none'", "base-uri 'none'", "form-action 'none'", "upgrade-insecure-requests",
  "require-trusted-types-for 'script'", "trusted-types 'none'",
].join("; ");

/* ---------- Table of contents (line numbers filled in after the page is assembled) ---------- */
const toc = [
  ["1", C.page, "Head: security policy and page settings"],
  ["2", C.style, "Styles"], ...cssParts.map(([n, t]) => [n, C.style, t]),
  ["3", C.page, "Page structure: header and menu"],
  ["4", C.page, "Views: one is visible at a time"],
  ["4.1", C.page, "Home view"], ["4.2", C.page, "Compiler view"], ["4.3", C.page, "Library view"], ["4.4", C.page, "Privacy view"], ["4.5", C.page, "Security view"], ["4.6", C.page, "Footer and live region"],
  ["5", C.core, "Scripts (they run in this order)"], ...scripts.map((s) => [s.n, s.c, s.t]),
];
const tocLine = (n, c, t, line) => "       " + c + " " + (n.padEnd(5)) + " " + (t + " ").padEnd(64, ".") + " line " + String(line).padStart(5);

const assemble = (lines) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"> <!-- must stay in the first 1024 bytes: the security fingerprints only match when the page is read as UTF-8 -->
<!-- ${RULE}
     AAR COMPILER & KNOWLEDGE CENTER  ·  single-file edition
     ${RULE}

     HOW THIS FILE WORKS
       • The whole website is this one file. Upload it to Neocities as index.html. No other files are needed.
       • All pages are views of this page, chosen by the address: #home, #compiler, #knowledge, #templates, #privacy...
       • Projects are saved only in the visitor's own browser (localStorage key "aarc.v1"). Nothing is uploaded.

     ⚠ BEFORE YOU EDIT
       • The security policy (section 1) allows each <style> and <script> block only by its exact fingerprint (SHA-256 hash).
         Changing even one character inside a block stops that block from running.
       • Edit the multi-file source (css/, js/, data/) and run:  node tools/build_single.mjs
       • Editing the HTML outside <style> and <script> (text, links) is safe.

     COLOR KEY
       ${C.page} page structure (HTML)    ${C.style} styles (CSS)       ${C.sec} security
       ${C.core} core logic               ${C.data} content data        ${C.ui} interface

     TABLE OF CONTENTS
${toc.map(([n, c, t], i) => tocLine(n, c, t, lines[i] || 0)).join("\n")}
     ${RULE} -->
${htmlBanner(C.page, "1", "Head: security policy and page settings", [
  "Content-Security-Policy (CSP): blocks everything by default. Scripts and styles run only if their SHA-256 hash is listed.",
  "  No network connections (connect-src 'none'), no frames, no plugins, no form submission, no <base> tag hijacking.",
  "  Trusted Types: any attempt to use innerHTML or similar HTML-string sinks throws an error instead of running.",
  "Referrer policy: no-referrer, so external sites never learn which page sent the visitor.",
  "NOT POSSIBLE on Neocities (needs real HTTP headers): frame-ancestors, HSTS, X-Content-Type-Options, Permissions-Policy.",
  "  The frame guard in section 5.1 is the substitute for frame-ancestors."])}
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="no-referrer">
<meta name="format-detection" content="telephone=no">
<meta name="description" content="Compile a complete After-Action Review step by step, with official guidance, report examples, templates and a report generator. Free, private, runs in your browser.">
<title>AAR Compiler & Knowledge Center</title>
<link rel="icon" href="data:,">
<style>${css}</style>
</head>
<body>
${htmlBanner(C.page, "3", "Page structure: header and menu", [
  "Skip link, logo, site search (runs in the browser; the form never submits anywhere), compiler button and the main menu.",
  "Menu links are hash links (#compiler, #knowledge...). data-view marks which view each link belongs to."])}
<a class="skip" href="#main">Skip to main content</a>
<header class="site-header">
${header}
</header>

${htmlBanner(C.page, "4", "Views: one is visible at a time", [
  "Each view is a <div id=\"v-...\">. The router (section 5.12) shows one and hides the rest with the hidden attribute.",
  "The compiler (5.14) draws into #stage and #stagenav; the library (5.15) draws into #lib."])}
<main id="main">

${htmlBanner(C.page, "4.1", "Home view   (#home)")}
<div id="v-home">
${home}
</div>

${htmlBanner(C.page, "4.2", "Compiler view   (#compiler, #s=<stage>)", ["Filled in by section 5.14."])}
<div id="v-compiler" class="page with-side" hidden>
  <nav id="stagenav" class="side" aria-label="AAR compiler stages"></nav>
  <div class="content"><div id="stage"><p>Loading the compiler…</p></div></div>
</div>

${htmlBanner(C.page, "4.3", "Library view   (#knowledge #guidance #reports #templates #guides #glossary #search #faq #about)", ["Filled in by section 5.15."])}
<div id="v-library" class="page with-side" hidden>
  <nav id="libnav" class="side" aria-label="Library sections">
${libnav}
  </nav>
  <div class="content"><div id="lib"><p>Loading…</p></div></div>
</div>

${htmlBanner(C.page, "4.4", "Privacy view   (#privacy)", ["Static text. Keep it accurate if the site's behaviour ever changes."])}
<div id="v-privacy" class="page" hidden><div class="content">
${privacy}
</div></div>

${htmlBanner(C.page, "4.5", "Security view   (#security)", ["Static text. Keep it accurate if the security setup changes."])}
<div id="v-security" class="page" hidden><div class="content">
${security}
</div></div>

</main>

${htmlBanner(C.page, "4.6", "Footer and live region", ["#live announces status changes to screen readers. #print-area holds the report while printing."])}
<footer class="site-footer">
${footer}
</footer>
<div id="live" class="sr-only" aria-live="polite"></div>
<div id="print-area"></div>
<noscript><p class="page warning">This site needs JavaScript.</p></noscript>

<!-- ${RULE}
     ${C.core} SECTION 5 · SCRIPTS
     • Sixteen blocks, run top to bottom. Each block starts with its own color-coded banner and developer notes.
     • 5.1 must stay first and 5.16 must stay last.
     ${RULE} -->
${scriptBlocks.map((b) => "<script>" + b.body + "</script>").join("\n")}
</body>
</html>
`;

/* Assemble twice: first to find where each section starts, then with the real line numbers.
   The table of contents has the same number of lines both times, so the numbers stay correct. */
const findLines = (html) => { const L = html.split("\n"); return toc.map(([n]) => { const want = marker(n) + "·"; const i = L.findIndex((l, k) => k > 40 && l.includes(want)); if (i < 0) throw new Error("no marker " + n); return i + 1; }); };
let html = assemble([]);
const lines = findLines(html);
html = assemble(lines);
const check = findLines(html);
if (check.join() !== lines.join()) throw new Error("table of contents line numbers moved");

fs.mkdirSync("single", { recursive: true });
fs.writeFileSync("single/index.html", html);
console.log("single/index.html", Buffer.byteLength(html), "bytes,", html.split("\n").length, "lines,", scriptBlocks.length, "script blocks");
