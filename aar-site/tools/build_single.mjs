// Builds single/index.html: the whole site as ONE self-contained, minified page (easy to paste on a phone).
// Usage (from aar-site/): node tools/build_single.mjs   (needs esbuild: NODE_PATH or local node_modules)
// Inline code is allowed by exact SHA-256 hashes in the CSP, so the policy stays as strict as the multi-file site.
import fs from "node:fs";
import crypto from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const esbuild = require(process.env.ESBUILD || "esbuild");

const read = (f) => fs.readFileSync(f, "utf8");
const between = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error("marker " + a); return s.slice(i + a.length, j); };

// Internal links become hash routes on the single page.
const relink = (s) => s
  .replace(/compiler\.html#s=/g, "#s=")
  .replace(/compiler\.html#/g, "#")
  .replace(/compiler\.html/g, "#compiler")
  .replace(/library\.html#/g, "#")
  .replace(/library\.html/g, "#knowledge")
  .replace(/index\.html/g, "#home")
  .replace(/privacy\.html/g, "#privacy")
  .replace(/security\.html/g, "#security");

const index = read("index.html"), lib = read("library.html"), priv = read("privacy.html"), sec = read("security.html");
const header = relink(between(index, '<header class="site-header">', "</header>"))
  .replace(/<form id="site-search"[^>]*>/, '<form id="site-search" class="site-search" role="search">')
  .replace(/ data-page="(home|compiler|privacy|security)"/g, ' data-view="$1"');
const footer = relink(between(index, '<footer class="site-footer">', "</footer>"));
const home = relink(between(index, '<main id="main">', "</main>"));
const libnav = relink(between(lib, '<nav id="libnav" class="side" aria-label="Library sections">', "</nav>"));
const privacy = relink(between(priv, '<main id="main" class="content">', "</main>"));
const security = relink(between(sec, '<main id="main" class="content">', "</main>"));

// Patch the page scripts so each renders only when its view is showing.
let compiler = read("js/compiler.js")
  .replace("function render() {", 'function render() { if (A.view() !== "compiler") return;')
  .replace("if (S.p && S.p.stage && !location.hash)", 'if (S.p && S.p.stage && location.hash === "#compiler")');
let library = read("js/library.js").replace("function route() {", 'function route() { if (A.view() !== "library") return;');
let nav = read("js/nav.js").replace(/if \(\/library\\\.html\$\/\.test\(location\.pathname\)\) location\.hash = ([^;]+); else location\.href = target;/, "location.hash = $1;");
for (const [n, s, k] of [["compiler", compiler, "A.view() !== \"compiler\""], ["library", library, "A.view() !== \"library\""], ["nav", nav, "location.hash = \"search"]]) if (!s.includes(k)) throw new Error("patch failed: " + n);

// Small router: one view visible at a time, chosen by the hash.
const router = `(function () {
  "use strict";
  var A = window.AAR, LIB = /^(knowledge|guidance|reports|templates|guides|glossary|search|faq|about)$/;
  var TITLES = { home: "AAR Compiler & Knowledge Center", privacy: "Privacy | AAR Compiler", security: "Security | AAR Compiler" };
  A.view = function () {
    var h = location.hash.replace(/^#/, ""), first = h.split(/[\\/?]/)[0];
    if (/^s=/.test(h) || h === "compiler") return "compiler";
    if (LIB.test(first)) return "library";
    if (h === "privacy" || h === "security") return h;
    return "home";
  };
  var last = null;
  function show() {
    var v = A.view();
    ["home", "compiler", "library", "privacy", "security"].forEach(function (k) { document.getElementById("v-" + k).hidden = k !== v; });
    document.querySelectorAll("#site-nav a").forEach(function (a) {
      var href = a.getAttribute("href").slice(1).split(/[\\/?]/)[0], on = (v === "library") ? href === location.hash.slice(1).split(/[\\/?]/)[0] : (a.getAttribute("data-view") === v);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (TITLES[v]) document.title = TITLES[v];
    if (v !== last) { window.scrollTo(0, 0); var nav = document.getElementById("site-nav"); if (nav) nav.classList.remove("open"); }
    last = v;
  }
  window.addEventListener("hashchange", show);
  document.addEventListener("DOMContentLoaded", function () {
    show();
    var skip = document.querySelector(".skip");
    if (skip) skip.addEventListener("click", function (e) { e.preventDefault(); var m = document.getElementById("main"); m.setAttribute("tabindex", "-1"); m.focus(); });
  });
})();`;

const order = ["js/dom.js", "js/stages.js", "js/store.js", "data/resources.js", "data/reports.js", "data/knowledge.js", "data/glossary.js",
  "data/templates.js", "data/guides.js", "js/validate.js", "js/report.js"];
const parts = order.map((f) => relink(read(f)));
parts.push(router, relink(nav), relink(compiler), relink(library));
const min = (code) => esbuild.transformSync(code, { minify: true, charset: "utf8", target: "es2018" }).code.trim();
const js = parts.map(min).join("\n").replace(/<\/(script)/gi, "<\\/$1");
const css = esbuild.transformSync(read("css/site.css") + "\n[hidden]{display:none!important}", { loader: "css", minify: true }).code.trim();
const hash = (s) => "'sha256-" + crypto.createHash("sha256").update(s, "utf8").digest("base64") + "'";

const csp = `default-src 'none'; script-src ${hash(js)}; style-src ${hash(css)}; img-src 'self' data:; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests; require-trusted-types-for 'script'; trusted-types 'none'`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- AAR Compiler & Knowledge Center, single-file edition. Do not edit the <style> or <script> below by hand:
     the security policy allows them only by exact fingerprint (hash), so any change stops them running.
     Rebuild with tools/build_single.mjs instead. -->
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="no-referrer">
<meta name="description" content="Compile a complete After-Action Review step by step, with official guidance, report examples, templates and a report generator. Free, private, runs in your browser.">
<title>AAR Compiler & Knowledge Center</title>
<link rel="icon" href="data:,">
<style>${css}</style>
</head>
<body>
<a class="skip" href="#main">Skip to main content</a>
<header class="site-header">${header}</header>
<main id="main">
<div id="v-home">${home}</div>
<div id="v-compiler" class="page with-side" hidden><nav id="stagenav" class="side" aria-label="AAR compiler stages"></nav><div class="content"><div id="stage"><p>Loading the compiler…</p></div></div></div>
<div id="v-library" class="page with-side" hidden><nav id="libnav" class="side" aria-label="Library sections">${libnav}</nav><div class="content"><div id="lib"><p>Loading…</p></div></div></div>
<div id="v-privacy" class="page" hidden><div class="content">${privacy}</div></div>
<div id="v-security" class="page" hidden><div class="content">${security}</div></div>
</main>
<footer class="site-footer">${footer}</footer>
<div id="live" class="sr-only" aria-live="polite"></div>
<div id="print-area"></div>
<noscript><p class="page warning">This site needs JavaScript.</p></noscript>
<script>${js}</script>
</body>
</html>
`;
fs.mkdirSync("single", { recursive: true });
fs.writeFileSync("single/index.html", html);
console.log("single/index.html", Buffer.byteLength(html), "bytes");
