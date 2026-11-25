#!/usr/bin/env python3
"""Builds the five HTML pages from one shared header/footer so they never drift apart.
Run from the site folder:  python3 tools/build_pages.py   (only needed when editing page shells; the output is plain HTML).
Not needed on Neocities: upload the generated .html files, not this script."""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent

CSP = ("default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'none'; connect-src 'none'; "
       "media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none'; form-action 'none'; "
       "upgrade-insecure-requests; require-trusted-types-for 'script'; trusted-types 'none'")

LOGO = ('<svg class="logo" viewBox="0 0 36 36" aria-hidden="true" focusable="false"><rect width="36" height="36" rx="6" fill="#f2b134"/>'
        '<path d="M8 27 L18 8 L28 27 Z" fill="none" stroke="#0f1b2d" stroke-width="3" stroke-linejoin="round"/>'
        '<path d="M12.5 21.5 h11" stroke="#0f1b2d" stroke-width="3"/></svg>')

NAV = [("index.html", "Home", "home"), ("compiler.html", "AAR Compiler", "compiler"), ("library.html#knowledge", "Knowledge Center", ""),
       ("library.html#guidance", "Official Guidance", ""), ("library.html#reports", "Report Library", ""), ("library.html#templates", "Templates", ""),
       ("library.html#guides", "Specialized Guides", ""), ("library.html#glossary", "Glossary", ""), ("library.html#faq", "FAQ", ""),
       ("library.html#about", "About", ""), ("privacy.html", "Privacy", "privacy"), ("security.html", "Security", "security")]

def page(name, title, desc, data_page, scripts, body):
    nav = "".join(f'<li><a href="{h}"{f" data-page={dp!r}".replace(chr(39), chr(34)) if dp else ""}>{t}</a></li>' for h, t, dp in NAV)
    js = "".join(f'\n<script src="{s}"></script>' for s in scripts)
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- SECURITY: Neocities cannot send custom HTTP headers, so the Content Security Policy is set here as a meta tag.
     It allows only this site's own scripts and styles, no inline code, no network connections, no frames, and enforces Trusted Types.
     frame-ancestors, HSTS and other header-only protections cannot be set from a meta tag; see security.html. -->
<meta http-equiv="Content-Security-Policy" content="{CSP}">
<meta name="referrer" content="no-referrer">
<meta name="description" content="{desc}">
<title>{title}</title>
<link rel="stylesheet" href="css/site.css">
<link rel="icon" href="data:,">
</head>
<body data-page="{data_page}">
<a class="skip" href="#main">Skip to main content</a>
<header class="site-header">
  <div class="bar">
    <a class="brand" href="index.html">{LOGO}<span>AAR Compiler &amp; Knowledge Center<small>After-Action Review guidance, tools and references</small></span></a>
    <form id="site-search" class="site-search" role="search" action="library.html" method="get">
      <label class="sr-only" for="site-q">Search the site</label>
      <input id="site-q" name="q" type="search" maxlength="100" placeholder="Search guidance, reports, terms…" autocomplete="off">
      <button class="btn alt" type="submit">Search</button>
    </form>
    <a class="btn-compiler" href="compiler.html">Open the compiler</a>
    <button id="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
  </div>
  <nav id="site-nav" aria-label="Main"><ul>{nav}</ul></nav>
</header>
{body}
<footer class="site-footer"><div class="inner">
  <p><strong>Independent resource.</strong> This website is not an official government website and is not affiliated with any agency named on it. It does not replace agency requirements, policies, standards or professional judgment.</p>
  <p>No accounts, no analytics, no tracking, no cookies. Your AAR project stays in your browser. <a href="privacy.html">Privacy</a> · <a href="security.html">Security</a> · <a href="library.html#about">Sources and methodology</a></p>
</div></footer>
<div id="live" class="sr-only" aria-live="polite"></div>
<div id="print-area"></div>
<noscript><p class="page warning">The compiler, search and library need JavaScript. The privacy and security pages work without it.</p></noscript>{js}
</body>
</html>
'''
    (ROOT / name).write_text(html, encoding="utf-8")

CORE = ["js/dom.js", "js/stages.js", "js/store.js"]
DATA = ["data/resources.js", "data/reports.js", "data/knowledge.js", "data/glossary.js", "data/templates.js", "data/guides.js"]

STEPS = [("setup", "Initiate"), ("scope", "Scope"), ("objectives", "Objectives"), ("overview", "Background"), ("timeline", "Timeline"), ("evidence", "Evidence"),
         ("participants", "Participants"), ("interviews", "Debrief"), ("observations", "Observations"), ("analysis", "Analysis"), ("findings", "Findings"),
         ("lessons", "Lessons Learned"), ("recommendations", "Recommendations"), ("improvement", "Improvement Plan"), ("report", "Report Assembly"),
         ("qc", "Quality Control"), ("export", "Export")]
steps = "".join(f'<li><a href="compiler.html#s={k}">{t}</a></li>' for k, t in STEPS)

page("index.html", "AAR Compiler & Knowledge Center | After-Action Review guidance and tools",
     "Compile a complete After-Action Review step by step, with official guidance, report examples, templates and a report generator. Free, private, runs in your browser.",
     "home", CORE + ["data/resources.js", "data/reports.js", "data/templates.js", "js/nav.js"], f'''
<main id="main">
  <section class="hero"><div class="page">
    <p class="kicker">After-Action Review compiler and knowledge center</p>
    <h1>Compile a complete After-Action Review, from first notes to final report</h1>
    <p>This site guides you through every stage of an After-Action Review using structured guidance, official reference material, templates and examples, then assembles your entries into a structured report and Improvement Plan. Everything runs in your browser.</p>
    <div class="toolbar">
      <a class="btn primary" href="compiler.html#s=setup">START A NEW AAR</a>
      <a class="btn alt" href="compiler.html#s=dashboard">CONTINUE AN AAR</a>
      <a class="btn alt" href="library.html#guidance">EXPLORE OFFICIAL GUIDANCE</a>
      <a class="btn alt" href="library.html#reports">BROWSE REPORTS</a>
      <a class="btn alt" href="library.html#templates">VIEW TEMPLATES</a>
    </div>
    <p id="continue-status" role="status"></p>
  </div></section>
  <div class="page">
    <section class="content">
      <h2>The AAR process in 17 stages</h2>
      <p>The compiler follows this progression. Each stage explains its purpose, gives instructions and guiding questions, and links to templates, official resources and examples. You can work in any order and come back at any time.</p>
      <ol class="process">{steps}</ol>
      <h2>Featured resources</h2>
      <div id="featured" class="two-col"></div>
      <h2>Learn the method</h2>
      <div class="two-col">
        <div class="card"><h3><a href="library.html#knowledge/what-is">What is an AAR?</a></h3><p>The purpose, the process and the products of an After-Action Review.</p></div>
        <div class="card"><h3><a href="library.html#knowledge/findings">How to develop findings</a></h3><p>Turn observations and evidence into supported conclusions.</p></div>
        <div class="card"><h3><a href="library.html#guides">Specialized AAR guides</a></h3><p>Focus areas for emergency management, exercises, cyber, safety, infrastructure, public health and more.</p></div>
      </div>
      <h2>Disclaimer</h2>
      <p class="note-box">This website is an independent informational resource. It is not an official government website unless explicitly stated, and it does not replace agency requirements, policies, standards or professional judgment. Links to official sources are provided for reference; confirm documents on the agency's own site.</p>
      <h2>Your privacy</h2>
      <p>No accounts, no tracking, no analytics. AAR projects are stored only in your own browser, unencrypted, and are never sent to this website. Do not enter sensitive information. <a href="privacy.html">Read the privacy page</a>.</p>
    </section>
  </div>
</main>''')

page("compiler.html", "AAR Compiler | After-Action Review Compiler",
     "A guided 17-stage After-Action Review compiler with evidence, findings, lessons, Improvement Plan, quality control and report exports. Runs entirely in your browser.",
     "compiler", CORE + DATA + ["js/validate.js", "js/report.js", "js/nav.js", "js/compiler.js"], '''
<div class="page with-side">
  <nav id="stagenav" class="side" aria-label="AAR compiler stages"></nav>
  <main id="main" class="content"><div id="stage"><p>Loading the compiler…</p></div></main>
</div>''')

page("library.html", "AAR Knowledge Center",
     "After-Action Review knowledge center: how-to guides, official government guidance, a report archive, templates, specialized guides, a glossary and site search.",
     "library", CORE + DATA + ["js/nav.js", "js/library.js"], '''
<div class="page with-side">
  <nav id="libnav" class="side" aria-label="Library sections"><ul>
    <li><a href="#knowledge">Knowledge Center</a></li><li><a href="#guidance">Official Guidance</a></li><li><a href="#reports">Report Library</a></li>
    <li><a href="#templates">Templates</a></li><li><a href="#guides">Specialized Guides</a></li><li><a href="#glossary">Glossary</a></li>
    <li><a href="#search">Search</a></li><li><a href="#faq">FAQ</a></li><li><a href="#about">About, sources and methodology</a></li>
    <li><a href="compiler.html">Open the AAR Compiler</a></li></ul></nav>
  <main id="main" class="content"><div id="lib"><p>Loading…</p></div></main>
</div>''')

page("privacy.html", "Privacy | AAR Compiler & Knowledge Center", "How the AAR Compiler handles your information: no accounts, no tracking, local-only project storage.",
     "privacy", ["js/dom.js", "js/nav.js"], '''
<div class="page"><main id="main" class="content">
<nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="index.html">Home</a></li><li aria-current="page">Privacy</li></ol></nav>
<h1>Privacy</h1>
<p class="lead">Short version: this site does not collect your AAR project. It stays in your browser, unencrypted, until you delete it or clear your browser data.</p>
<div class="warning" role="note"><strong>Do not enter sensitive information.</strong> Do not enter classified, restricted, confidential, privileged, sensitive personal, protected health, or otherwise sensitive information. This tool is intended for general, non-sensitive AAR compilation. Your project data is stored locally in your browser and is not encrypted by this website.</div>
<h2>What this site is</h2>
<ul>
  <li>A static website: a set of fixed files (HTML, CSS, JavaScript) served by the hosting provider, Neocities. There is no application server and no database behind it.</li>
  <li>There are no user accounts, logins or passwords.</li>
</ul>
<h2>What happens to your AAR project</h2>
<ul>
  <li>The compiler stores your project in your browser's <strong>localStorage</strong> under one key named <code>aarc.v1</code>. It is never sent to this website or to anyone else.</li>
  <li>LocalStorage is <strong>not encrypted</strong>. Anyone who can use your browser profile can read it, and browser extensions with broad permissions may be able to as well.</li>
  <li>Your project can be lost if you clear browser data, use private browsing, or switch browsers or devices. <strong>Download regular JSON backups</strong> from Stage 17.</li>
  <li>Files you export (HTML, Markdown, text, CSV, JSON) are saved by your browser to your device. Nothing is uploaded.</li>
  <li>Imported backup files are read inside your browser and are not uploaded.</li>
  <li>Participant contact details, if you choose to enter them, are left out of every report and section export. They remain in your JSON backup.</li>
</ul>
<h2>What this site does not do</h2>
<ul>
  <li>No analytics, advertising, tracking pixels, session recording or fingerprinting scripts are included in these files.</li>
  <li>No cookies are set by these files.</li>
  <li>No third-party scripts, fonts or images are loaded. The pages' security policy blocks network connections from scripts entirely.</li>
  <li>Site search runs in your browser. Search terms are not sent anywhere.</li>
</ul>
<h2>What the hosting provider may see</h2>
<p>Like any web host, Neocities receives standard request information when your browser downloads these pages (for example your IP address and browser type). That is governed by Neocities' own policies, not this site's. This site has not verified what Neocities logs.</p>
<h2>External links</h2>
<p>Official resources and report links lead to third-party websites, mostly government agencies. Those sites have their own privacy policies and may use cookies or analytics. This site does not control them. External links open in a new tab and are marked with ↗ and the destination's name.</p>
<h2>Shared and public computers</h2>
<p>Avoid using the compiler on shared or public computers. If you must, download a backup and then use <strong>Reset project</strong> in Stage 17 before you leave, and close the browser.</p>
<h2>Changes</h2>
<p>If the site's behaviour changes (for example if analytics were ever considered), this page will be updated first. Any such change would be reviewed separately for privacy and necessity.</p>
<p><a href="security.html">Read the security page</a></p>
</main></div>''')

page("security.html", "Security | AAR Compiler & Knowledge Center", "Security model, protections and known limitations of the AAR Compiler static website.",
     "security", ["js/dom.js", "js/nav.js"], '''
<div class="page"><main id="main" class="content">
<nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="index.html">Home</a></li><li aria-current="page">Security</li></ol></nav>
<h1>Security</h1>
<p class="lead">This site is designed to keep its attack surface small. It is not perfectly secure, and it is not a secure document system.</p>
<h2>Architecture</h2>
<ul>
  <li>Static files only (HTML, CSS, JavaScript and JavaScript data files), hosted on Neocities. No server-side code, database, uploads or user accounts.</li>
  <li>All compiler processing happens in your browser. Projects are stored in your browser's localStorage and leave your device only when you export them.</li>
  <li>No external libraries, CDNs, fonts, analytics or third-party scripts. Every script is a file on this site.</li>
</ul>
<h2>Threat model summary</h2>
<div class="r-tablewrap" tabindex="0" role="region" aria-label="Threat model table"><table>
  <thead><tr><th scope="col">Threat</th><th scope="col">How the site responds</th><th scope="col">What remains</th></tr></thead>
  <tbody>
    <tr><td>Malicious text pasted into fields (cross-site scripting)</td><td>All text is inserted with text nodes only; the code never uses innerHTML, document.write, eval or new Function. The CSP blocks inline scripts and enforces Trusted Types.</td><td>Browser bugs or extensions outside the site's control.</td></tr>
    <tr><td>Malicious or malformed backup file</td><td>Only .json under 2 MB; parsed with JSON.parse; nesting depth limited; rebuilt field by field from a fixed schema with type, length, ID and reference checks; unknown properties dropped; preview and confirmation before anything is replaced.</td><td>A well-formed file with misleading but harmless text.</td></tr>
    <tr><td>Dangerous links</td><td>User-entered links must be https://; javascript:, data:, file:, vbscript: and malformed URLs are rejected. External links open with rel="noopener noreferrer". No URL is fetched automatically.</td><td>A legitimate https site that is itself harmful.</td></tr>
    <tr><td>Spreadsheet formula injection in CSV exports</td><td>Cells beginning with = + - @ are prefixed with an apostrophe.</td><td>None known.</td></tr>
    <tr><td>Shared computer, other people or extensions reading data</td><td>Warnings before starting; no sensitive fields requested; contact details excluded from reports; one clearly named storage key; Reset deletes it.</td><td>LocalStorage is not encrypted. Do not enter sensitive information.</td></tr>
    <tr><td>Framing (clickjacking)</td><td>Scripts hide the page and try to break out if it is loaded inside another site's frame.</td><td>A header-based frame-ancestors policy cannot be set on Neocities (see below).</td></tr>
    <tr><td>Data loss</td><td>Autosave, manual save, storage error messages, JSON backup and restore.</td><td>Clearing browser data deletes the project unless you have a backup.</td></tr>
  </tbody>
</table></div>
<h2>Security headers on Neocities</h2>
<p>Neocities does not let site owners set custom HTTP response headers. As a result:</p>
<ul>
  <li><strong>Content-Security-Policy</strong> is delivered as a meta tag on every page: only this site's scripts and styles, no inline code, no network connections, no frames, no plugins, no form submission, and Trusted Types enforced.</li>
  <li><strong>frame-ancestors</strong>, <strong>Strict-Transport-Security</strong>, <strong>X-Content-Type-Options</strong> and <strong>Permissions-Policy</strong> cannot be set from a meta tag. Whether Neocities sends any of them by default has not been verified for this site. You can check in your browser's developer tools (Network tab, response headers).</li>
  <li><strong>Referrer-Policy</strong> is set to no-referrer with a meta tag.</li>
  <li>HTTPS is provided by Neocities. All links on this site use https://.</li>
</ul>
<h2>Recommended practices for users</h2>
<ul>
  <li>Enter only general, non-sensitive information. Refer to sensitive records by description and keep them in your organization's approved system.</li>
  <li>Download a JSON backup after each working session and store it as you would any work document.</li>
  <li>Avoid shared computers; if unavoidable, back up and reset before leaving.</li>
  <li>Keep your browser up to date and limit extensions with access to all sites.</li>
  <li>Confirm official documents on the agency's own website before relying on them.</li>
</ul>
<h2>Testing</h2>
<p>Before publishing, the compiler was tested with script-like text, HTML tags, malicious-looking URLs and malformed or hostile backup files to confirm content stays inert. Testing covers this site only.</p>
<h2>Reporting a problem</h2>
<p>If you find a security problem, contact the site owner through their Neocities profile. Do not test against systems you do not own or have permission to test.</p>
<p><a href="privacy.html">Read the privacy page</a></p>
</main></div>''')
print("built")
