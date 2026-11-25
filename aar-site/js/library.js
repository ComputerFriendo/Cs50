/* AAR Compiler & Knowledge Center — js/library.js
   Renders library.html: Knowledge Center, Official Guidance, Report Library, Templates, Specialized Guides, Glossary, Search, FAQ, About.
   Routes: library.html#knowledge, #knowledge/<slug>, #guidance, #reports, #templates, #templates/<key>, #guides, #guides/<key>,
   #glossary, #search?q=..., #faq, #about. Search is entirely client-side over the data files; nothing is sent anywhere. */
(function () {
  "use strict";
  var A = window.AAR, h = A.h, $ = function (id) { return document.getElementById(id); };
  var byId = function (arr, k, v) { return (arr || []).filter(function (x) { return x[k] === v; })[0]; };
  var STAGE = function (k) { var s = A.stageByKey(k); return s ? h("a", { href: "compiler.html#s=" + k, text: (s.num ? "Stage " + s.num + ": " : "") + s.title }) : null; };
  var join = function (nodes, sep) { var out = []; nodes.filter(Boolean).forEach(function (n, i) { if (i) out.push(sep || ", "); out.push(n); }); return out; };
  var verifiedBadge = function (v) { return h("span", { class: "badge " + (v ? "b-ok" : "b-unverified"), text: v ? "Link verified " + v : "Link not yet verified" }); };
  var resLink = function (id) { var r = byId(A.RESOURCES, "id", id); return r ? A.ext(r.url, r.title) : null; };
  var tplLink = function (k) { var t = byId(A.TEMPLATES, "key", k); return t ? h("a", { href: "#templates/" + k, text: t.title }) : null; };
  var repLink = function (id) { var r = byId(A.REPORTS, "id", id); return r ? h("a", { href: "#reports?id=" + id, text: r.title }) : null; };
  var artLink = function (s) { var a = byId(A.KNOWLEDGE, "slug", s); return a ? h("a", { href: "#knowledge/" + s, text: a.title }) : null; };
  var SECTIONS = { knowledge: "Knowledge Center", guidance: "Official Guidance", reports: "Report Library", templates: "Templates", guides: "Specialized AAR Guides", glossary: "Glossary", search: "Search", faq: "FAQ", about: "About, Sources and Methodology" };

  function route() {
    var raw = location.hash.replace(/^#/, "") || "knowledge", qi = raw.indexOf("?"), path = (qi < 0 ? raw : raw.slice(0, qi)).split("/"), params = new URLSearchParams(qi < 0 ? "" : raw.slice(qi + 1));
    var sec = SECTIONS[path[0]] ? path[0] : "knowledge", sub = path[1] || "";
    var main = A.clear($("lib")), title;
    document.querySelectorAll("#libnav a").forEach(function (a) { var on = a.getAttribute("href") === "#" + sec; if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    var crumbs = [h("li", null, h("a", { href: "index.html", text: "Home" })), h("li", null, sub ? h("a", { href: "#" + sec, text: SECTIONS[sec] }) : SECTIONS[sec])];
    if (sec === "knowledge") title = sub ? article(main, sub) : knowledgeIndex(main);
    else if (sec === "guidance") title = guidance(main, params);
    else if (sec === "reports") title = reports(main, params);
    else if (sec === "templates") title = sub ? template(main, sub) : templatesIndex(main);
    else if (sec === "guides") title = sub ? guide(main, sub) : guidesIndex(main);
    else if (sec === "glossary") title = glossary(main, params);
    else if (sec === "search") title = search(main, params);
    else if (sec === "faq") title = faq(main);
    else title = about(main);
    if (sub && title) crumbs.push(h("li", { "aria-current": "page", text: title })); else crumbs[1].setAttribute("aria-current", "page");
    main.prepend(h("nav", { class: "breadcrumb", "aria-label": "Breadcrumb" }, h("ol", null, crumbs)));
    document.title = (title || SECTIONS[sec]) + " | AAR Knowledge Center";
    if (A.routedOnce) { var hd = main.querySelector("h1"); if (hd) { hd.setAttribute("tabindex", "-1"); hd.focus(); } }
    A.routedOnce = true;
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", route);

  /* ---------- Knowledge Center ---------- */
  function knowledgeIndex(main) {
    main.append(h("h1", { text: "Knowledge Center" }), h("p", { class: "lead", text: "Plain-language guidance on every part of an After-Action Review. Each page links to the compiler stage where you apply it, plus templates, official resources and example reports." }),
      h("p", { class: "note-box", text: "Knowledge Center pages are explanations written for this site. They are not official guidance. Official sources are listed on each page and in Official Guidance." }));
    var groups = []; A.KNOWLEDGE.forEach(function (a) { if (groups.indexOf(a.group) < 0) groups.push(a.group); });
    groups.forEach(function (g) {
      main.append(h("h2", { text: g }), h("ul", { class: "cards" }, A.KNOWLEDGE.filter(function (a) { return a.group === g; }).map(function (a) {
        return h("li", { class: "card" }, h("h3", null, h("a", { href: "#knowledge/" + a.slug, text: a.title })), h("p", { text: a.summary }), h("p", { class: "meta" }, "Compiler: ", STAGE(a.stage)));
      })));
    });
    return null;
  }
  function article(main, slug) {
    var a = byId(A.KNOWLEDGE, "slug", slug);
    if (!a) { main.append(h("h1", { text: "Page not found" }), h("p", null, h("a", { href: "#knowledge", text: "Back to the Knowledge Center" }))); return "Not found"; }
    var list = function (t, items, ordered) { return items && items.length ? [h("h2", { text: t }), h(ordered ? "ol" : "ul", null, items.map(function (x) { return h("li", { text: x }); }))] : null; };
    main.append(h("p", { class: "kicker", text: a.group }), h("h1", { text: a.title }), h("p", { class: "lead", text: a.summary }),
      h("h2", { text: "Explanation" }), a.body.map(function (p) { return h("p", { text: p }); }),
      list("Step by step", a.steps, true), list("Examples", a.examples), list("Common mistakes", a.mistakes),
      h("h2", { text: "Checklist" }), h("ul", { class: "checklist-static" }, a.checklist.map(function (x) { return h("li", { text: "☐ " + x }); })),
      h("aside", { class: "refs-box" },
        h("h2", { text: "Apply it" }), h("p", null, h("a", { class: "btn", href: "compiler.html#s=" + a.stage, text: "Open " + (A.stageByKey(a.stage).num ? "Stage " + A.stageByKey(a.stage).num + ": " : "") + A.stageByKey(a.stage).title })),
        a.resources.length ? [h("h2", { text: "Official resources" }), h("ul", null, a.resources.map(function (r) { return h("li", null, resLink(r)); }))] : null,
        a.templates.length ? [h("h2", { text: "Templates" }), h("ul", null, a.templates.map(function (t) { return h("li", null, tplLink(t)); }))] : null,
        a.reports.length ? [h("h2", { text: "Example reports" }), h("ul", null, a.reports.map(function (r) { return h("li", null, repLink(r)); }))] : null),
      h("p", { class: "muted", text: "Site-written explanation, not official guidance." }));
    return a.title;
  }

  /* ---------- Filters helper ---------- */
  function filterBar(label, fields, state, onChange) {
    var bar = h("div", { class: "filters", role: "search", "aria-label": label });
    fields.forEach(function (f) {
      var id = "flt-" + f.k, el;
      if (f.options) { el = h("select", { id: id }, h("option", { value: "", text: "All" }), f.options.map(function (o) { return h("option", { value: o, text: o }); })); }
      else el = h("input", { id: id, type: "search", maxlength: 100, autocomplete: "off" });
      el.value = state[f.k] || "";
      el.addEventListener(f.options ? "change" : "input", function () { state[f.k] = el.value; onChange(); });
      bar.append(h("div", { class: "field" }, h("label", { for: id, text: f.l }), el));
    });
    return bar;
  }
  var uniq = function (arr) { return arr.filter(function (x, i) { return x && arr.indexOf(x) === i; }).sort(); };
  var flat = function (arr) { return [].concat.apply([], arr); };
  var textMatch = function (q, parts) { q = String(q || "").trim().toLowerCase(); if (!q) return true; var hay = parts.join(" ").toLowerCase(); return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; }); };

  /* ---------- Official guidance ---------- */
  function guidance(main, params) {
    var R = A.RESOURCES, st = { q: params.get("q") || "", agency: params.get("agency") || "", level: "", category: "", status: "" };
    main.append(h("h1", { text: "Official Guidance" }),
      h("p", { class: "lead", text: "Official government guidance, methodologies, standards and tools relevant to after-action reviews. Every entry links to the agency's own website." }),
      h("div", { class: "warning", role: "note" }, h("strong", { text: "Verification status: " }), "Each entry shows when a person last confirmed its link. Entries marked \"Link not yet verified\" were compiled without access to the agency site. Confirm the document on the agency's site before relying on it. Superseded guidance is labelled."),
      h("p", { class: "muted" }, "Agencies covered: ", uniq(R.map(function (r) { return r.agency; })).join(", "), "."));
    var holder = h("div");
    main.append(filterBar("Filter official resources", [{ k: "q", l: "Search" }, { k: "agency", l: "Agency", options: uniq(R.map(function (r) { return r.agency; })) },
      { k: "level", l: "Government level", options: uniq(R.map(function (r) { return r.level; })) }, { k: "category", l: "Category", options: uniq(flat(R.map(function (r) { return r.categories; }))) },
      { k: "status", l: "Status", options: uniq(R.map(function (r) { return r.status; })) }], st, draw), holder);
    function draw() {
      A.clear(holder);
      var list = R.filter(function (r) { return (!st.agency || r.agency === st.agency) && (!st.level || r.level === st.level) && (!st.category || r.categories.indexOf(st.category) >= 0) && (!st.status || r.status === st.status) &&
        textMatch(st.q, [r.title, r.agency, r.description, r.type, r.categories.join(" "), r.tags.join(" ")]); });
      holder.append(h("h2", { class: "sr-only", text: "Resources" }), h("p", { class: "muted", role: "status", text: list.length + " of " + R.length + " resources shown." }), h("ul", { class: "cards" }, list.map(resourceCard)));
    }
    draw();
    main.append(h("h2", { text: "State, county, municipal and other public agencies" }), h("dl", { class: "r-kv" }, A.RESOURCE_GAPS.map(function (g) { return [h("dt", { text: g[0] }), h("dd", { text: g[1] })]; })));
    return null;
  }
  function resourceCard(r) {
    return h("li", { class: "card", id: "res-" + r.id },
      h("h3", null, A.ext(r.url, r.title)),
      h("p", { class: "meta" }, r.agency + " · " + r.level + " · " + r.type + " · " + r.format + (r.published ? " · Published " + r.published : "")),
      h("p", null, verifiedBadge(r.verified), " ", h("span", { class: "badge " + (r.status === "Current" ? "b-neutral" : "b-todo"), text: "Status: " + r.status })),
      h("p", { text: r.description }), r.notes ? h("p", { class: "note-box", text: r.notes }) : null,
      h("p", { class: "meta" }, "Categories: " + r.categories.join(", ")),
      r.stage.length ? h("p", { class: "meta" }, "Use in: ", join(r.stage.map(STAGE))) : null,
      r.related.length ? h("p", { class: "meta" }, "Related: ", join(r.related.map(function (x) { var o = byId(A.RESOURCES, "id", x); return o ? h("a", { href: "#guidance?q=" + encodeURIComponent(o.title.split(":")[0]), text: o.title.split(":")[0] }) : null; }))) : null);
  }

  /* ---------- Report library ---------- */
  function reports(main, params) {
    var R = A.REPORTS, st = { q: "", agency: "", category: "", type: "", year: "", format: "" }, only = params.get("id");
    main.append(h("h1", { text: "Report Library" }), h("p", { class: "lead", text: "Publicly available government after-action reports and related reviews, organized for study. Links go to the original official source wherever it has been confirmed." }),
      h("div", { class: "warning", role: "note" }, h("strong", { text: "About these entries: " }), "Summaries are written by this site and are not official government analysis. Strengths, findings and lessons are only listed when taken directly from the official document; otherwise the entry says so. Some entries are investigations or commissions rather than AARs and are labelled that way."));
    if (only) { var one = byId(R, "id", only); if (one) { main.append(h("p", null, h("a", { href: "#reports", text: "Show all reports" })), h("h2", { class: "sr-only", text: "Report" }), h("ul", { class: "cards" }, reportCard(one))); return one.title; } }
    var holder = h("div"), year = function (r) { return (r.published || "").slice(0, 4); };
    main.append(filterBar("Filter reports", [{ k: "q", l: "Search" }, { k: "agency", l: "Agency", options: uniq(R.map(function (r) { return r.agency; })) },
      { k: "category", l: "Incident type / category", options: uniq(flat(R.map(function (r) { return r.categories; }))) }, { k: "type", l: "Report type", options: uniq(R.map(function (r) { return r.type; })) },
      { k: "year", l: "Publication year", options: uniq(R.map(year)) }, { k: "format", l: "Document format", options: uniq(R.map(function (r) { return r.format; })) }], st, draw), holder);
    function draw() {
      A.clear(holder);
      var list = R.filter(function (r) { return (!st.agency || r.agency === st.agency) && (!st.category || r.categories.indexOf(st.category) >= 0) && (!st.type || r.type === st.type) && (!st.year || year(r) === st.year) && (!st.format || r.format === st.format) &&
        textMatch(st.q, [r.title, r.agency, r.event, r.jurisdiction, r.summary, r.tags.join(" ")]); });
      holder.append(h("h2", { class: "sr-only", text: "Reports" }), h("p", { class: "muted", role: "status", text: list.length + " of " + R.length + " reports shown." }), h("ul", { class: "cards" }, list.map(reportCard)));
    }
    draw();
    main.append(h("p", { class: "muted", text: "Filters for finding type and corrective-action type will appear once entries include findings taken from the official documents." }));
    return null;
  }
  function reportCard(r) {
    var arr = function (label, a) { return h("div", null, h("h4", { text: label }), a.length ? h("ul", null, a.map(function (x) { return h("li", { text: x }); })) : h("p", { class: "muted", text: "Not yet summarized. Read the official report." })); };
    return h("li", { class: "card", id: "rep-" + r.id },
      h("h3", { text: r.title }),
      h("p", { class: "meta", text: r.agency + " · " + r.type + " · Event: " + r.event + " (" + r.eventDate + ") · Published " + r.published + " · " + r.jurisdiction }),
      h("p", null, r.url ? [A.ext(r.url, "Official source"), " ", verifiedBadge(r.verified)] : [h("span", { class: "badge b-todo", text: "Official link not yet confirmed" }), " ", r.searchHint || "", " ", r.agencySite ? A.ext(r.agencySite, "Agency website") : null]),
      h("p", null, h("strong", { text: "Site summary (not official analysis): " }), r.summary),
      h("details", null, h("summary", { text: "Strengths, findings, lessons and corrective actions" }), arr("Major strengths", r.strengths), arr("Major findings", r.findings), arr("Lessons learned", r.lessons), arr("Corrective actions", r.actions)),
      h("p", { class: "meta", text: "Categories: " + r.categories.join(", ") + " · Format: " + r.format + " · Tags: " + r.tags.join(", ") }),
      r.related.length ? h("p", { class: "meta" }, "Related: ", join(r.related.map(repLink))) : null);
  }

  /* ---------- Templates ---------- */
  function templatesIndex(main) {
    main.append(h("h1", { text: "Templates" }), h("p", { class: "lead", text: "Printable, downloadable worksheets for every stage of an AAR. Open a template to print it or download it as Markdown, plain text or HTML." }),
      h("p", { class: "note-box", text: "These are worksheets created for this site, not official forms. For the official HSEEP AAR/IP template, see FEMA's HSEEP resources in Official Guidance." }),
      h("h2", { class: "sr-only", text: "All templates" }), h("ul", { class: "cards" }, A.TEMPLATES.map(function (t) { return h("li", { class: "card" }, h("h3", null, h("a", { href: "#templates/" + t.key, text: t.title })), h("p", { text: t.purpose }), h("p", { class: "meta" }, "Compiler: ", STAGE(t.stage))); })));
    return null;
  }
  function tplBlocks(t, blank) {
    var B = [{ t: "h1", text: t.title }, { t: "p", text: t.purpose }];
    t.sections.forEach(function (s) {
      B.push({ t: "h2", text: s.h });
      if (s.prompts) B.push({ t: "prompts", items: s.prompts });
      if (s.table) { var rows = []; for (var i = 0; i < (s.rows || 10); i++) rows.push(s.table.map(function () { return ""; })); B.push({ t: "table", head: s.table, rows: rows }); }
    });
    if (!blank && t.example.length) { B.push({ t: "h2", text: "Example" }); t.example.forEach(function (e) { B.push({ t: "p", text: e }); }); }
    return B;
  }
  function tplDOM(blocks, shift) {
    var root = h("article", { class: "report template-doc" }), sh = shift || 0;
    blocks.forEach(function (b) {
      if (b.t === "h1") root.append(h("h" + (1 + sh), { text: b.text }));
      else if (b.t === "h2") root.append(h("h" + (2 + sh), { text: b.text }));
      else if (b.t === "p") root.append(h("p", { text: b.text }));
      else if (b.t === "prompts") root.append(h("ol", { class: "prompts" }, b.items.map(function (x) { return h("li", null, x ? h("span", { text: x }) : null, h("span", { class: "blank", "aria-hidden": "true" })); })));
      else if (b.t === "table") root.append(h("div", { class: "r-tablewrap" }, h("table", { class: "blank-table" }, h("thead", null, h("tr", null, b.head.map(function (c) { return h("th", { scope: "col", text: c }); }))),
        h("tbody", null, b.rows.map(function (r) { return h("tr", null, r.map(function () { return h("td", null, " "); })); })))));
    });
    return root;
  }
  function tplMD(blocks) {
    var o = [], e = function (s) { return String(s).replace(/([\\`*_\[\]<>|#])/g, "\\$1"); };
    blocks.forEach(function (b) {
      if (b.t === "h1") o.push("# " + e(b.text), ""); else if (b.t === "h2") o.push("## " + e(b.text), ""); else if (b.t === "p") o.push(e(b.text), "");
      else if (b.t === "prompts") { b.items.forEach(function (x, i) { o.push((i + 1) + ". " + e(x || "") + "  ", "   ______________________________________________", ""); }); }
      else if (b.t === "table") { o.push("| " + b.head.map(e).join(" | ") + " |", "|" + b.head.map(function () { return " --- "; }).join("|") + "|"); b.rows.forEach(function () { o.push("|" + b.head.map(function () { return "   "; }).join("|") + "|"); }); o.push(""); }
    });
    return o.join("\n");
  }
  function tplTXT(blocks) {
    var o = [];
    blocks.forEach(function (b) {
      if (b.t === "h1") o.push(b.text.toUpperCase(), ""); else if (b.t === "h2") o.push(b.text, new Array(b.text.length + 1).join("-"), ""); else if (b.t === "p") o.push(b.text, "");
      else if (b.t === "prompts") b.items.forEach(function (x, i) { o.push((i + 1) + ". " + (x || ""), "   ____________________________________________", ""); });
      else if (b.t === "table") { o.push("Columns: " + b.head.join(" | "), ""); b.rows.forEach(function (r, i) { o.push((i + 1) + ". " + b.head.map(function (c) { return c + ": ____"; }).join("  ")); }); o.push(""); }
    });
    return o.join("\n");
  }
  function template(main, key) {
    var t = byId(A.TEMPLATES, "key", key);
    if (!t) { main.append(h("h1", { text: "Template not found" }), h("p", null, h("a", { href: "#templates", text: "All templates" }))); return "Not found"; }
    var blank = tplBlocks(t, true), full = tplBlocks(t, false), st = A.stageByKey(t.stage);
    main.append(h("p", { class: "kicker", text: "Template" }), h("h1", { text: t.title }),
      h("dl", { class: "r-kv" }, [["Purpose", t.purpose], ["Intended audience", t.audience], ["When to use", t.when]].map(function (r) { return [h("dt", { text: r[0] }), h("dd", { text: r[1] })]; })),
      h("h2", { text: "Instructions" }), h("ol", null, t.instructions.map(function (x) { return h("li", { text: x }); })),
      h("div", { class: "toolbar" },
        h("button", { class: "btn", type: "button", onclick: function () { printNode(tplDOM(blank)); } }, "Print blank template"),
        h("button", { class: "btn alt", type: "button", onclick: function () { A.download("aar-template-" + t.key + ".md", tplMD(blank), "text/markdown"); } }, "Download Markdown"),
        h("button", { class: "btn alt", type: "button", onclick: function () { A.download("aar-template-" + t.key + ".txt", tplTXT(blank), "text/plain"); } }, "Download text"),
        h("button", { class: "btn alt", type: "button", onclick: function () { A.download("aar-template-" + t.key + ".html", htmlDoc(tplDOM(blank), t.title), "text/html"); } }, "Download HTML")),
      h("h2", { text: "Blank template (preview)" }), h("div", { class: "preview", tabindex: "0", role: "region", "aria-label": "Blank template preview" }, tplDOM(blank, 1)),
      t.example.length ? [h("h2", { text: "Example" }), h("div", { class: "example" }, t.example.map(function (e) { return h("p", { text: e }); }))] : null,
      h("aside", { class: "refs-box" }, h("h2", { text: "Related" }),
        h("p", null, "Compiler stage: ", STAGE(t.stage), st ? ". The compiler can fill much of this in for you." : ""),
        t.resources.length ? h("p", null, "Official guidance: ", join(t.resources.map(resLink), "; ")) : null));
    void full;
    return t.title;
  }
  function htmlDoc(node, title) {
    var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); };
    return "<!DOCTYPE html>\n<html lang=\"en\"><head><meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'\">" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>" + esc(title) + "</title><style>body{font:15px/1.5 Arial,Helvetica,sans-serif;max-width:900px;margin:20px auto;padding:0 16px;color:#111}" +
      "h1{font-size:24px;border-bottom:4px solid #0f1b2d}h2{font-size:18px;margin-top:22px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #888;padding:6px;text-align:left;height:26px}th{background:#eef1f5}" +
      ".prompts li{margin:10px 0}.blank{display:block;border-bottom:1px solid #888;height:24px}</style></head><body>\n" + node.outerHTML + "\n</body></html>\n";
  }
  function printNode(node) {
    var area = $("print-area"); A.clear(area).append(node); document.body.classList.add("printing");
    var done = function () { document.body.classList.remove("printing"); A.clear(area); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done); window.print(); setTimeout(function () { if (document.body.classList.contains("printing")) done(); }, 60000);
  }

  /* ---------- Specialized guides ---------- */
  function guidesIndex(main) {
    main.append(h("h1", { text: "Specialized AAR Guides" }), h("p", { class: "lead", text: "Different events need different questions. Each guide lists focus areas and questions. When you choose an event type in Stage 1 of the compiler, the matching guide's prompts appear automatically in the relevant stages." }),
      h("h2", { class: "sr-only", text: "All guides" }), h("ul", { class: "cards" }, A.GUIDES.map(function (g) { return h("li", { class: "card" }, h("h3", null, h("a", { href: "#guides/" + g.key, text: g.title })), h("p", { text: g.summary }), h("p", { class: "meta", text: "Event types: " + g.eventTypes.join(", ") })); })));
    return null;
  }
  function guide(main, key) {
    var g = byId(A.GUIDES, "key", key);
    if (!g) { main.append(h("h1", { text: "Guide not found" })); return "Not found"; }
    main.append(h("p", { class: "kicker", text: "Specialized guide" }), h("h1", { text: g.title }), h("p", { class: "lead", text: g.summary }),
      h("p", { class: "meta", text: "Applied automatically for event types: " + g.eventTypes.join(", ") + "." }),
      g.areas.map(function (a) { return h("section", { class: "focus-area" }, h("h2", { text: a.name }), h("ul", null, a.questions.map(function (q) { return h("li", { text: q }); }))); }),
      h("aside", { class: "refs-box" }, h("h2", { text: "Use this guide" }), h("p", null, h("a", { class: "btn", href: "compiler.html#s=setup", text: "Start in the compiler (choose the event type in Stage 1)" })),
        g.resources.length ? [h("h2", { text: "Official resources" }), h("ul", null, g.resources.map(function (r) { return h("li", null, resLink(r)); }))] : null,
        g.reports.length ? [h("h2", { text: "Example reports" }), h("ul", null, g.reports.map(function (r) { return h("li", null, repLink(r)); }))] : null));
    return g.title;
  }

  /* ---------- Glossary ---------- */
  function glossary(main, params) {
    var st = { q: params.get("q") || "" }, holder = h("div");
    main.append(h("h1", { text: "Glossary" }), h("p", { class: "lead", text: "Key AAR terms with plain-language explanations and examples. Definitions are written for this site; where an official definition exists, the entry tells you where to find it." }),
      filterBar("Search the glossary", [{ k: "q", l: "Search terms" }], st, draw), holder);
    function draw() {
      A.clear(holder);
      var list = A.GLOSSARY.filter(function (g) { return textMatch(st.q, [g.term, g.def, g.plain, g.related.join(" ")]); }).sort(function (a, b) { return a.term < b.term ? -1 : 1; });
      holder.append(h("p", { class: "muted", role: "status", text: list.length + " of " + A.GLOSSARY.length + " terms shown." }));
      list.forEach(function (g) {
        holder.append(h("section", { class: "term", id: "term-" + A.slug(g.term) }, h("h2", { text: g.term }),
          h("dl", { class: "r-kv" },
            h("dt", { text: "Definition" }), h("dd", { text: g.def }), h("dt", { text: "Plain language" }), h("dd", { text: g.plain }),
            g.formal ? [h("dt", { text: "Formal definition" }), h("dd", { text: g.formal })] : null,
            h("dt", { text: "Example" }), h("dd", { text: g.example }),
            h("dt", { text: "Related terms" }), h("dd", null, join(g.related.map(function (r) { return h("a", { href: "#glossary?q=" + encodeURIComponent(r), text: r }); }))),
            h("dt", { text: "Compiler stages" }), h("dd", null, join(g.stages.map(STAGE))),
            g.resources.length ? [h("dt", { text: "Resources" }), h("dd", null, join(g.resources.map(resLink), "; "))] : null)));
      });
    }
    draw();
    return null;
  }

  /* ---------- Search (client-side only) ---------- */
  function index() {
    var I = [];
    A.KNOWLEDGE.forEach(function (a) { I.push({ type: "Knowledge page", topic: a.group, title: a.title, text: a.summary + " " + a.body.join(" "), href: "#knowledge/" + a.slug }); });
    A.RESOURCES.forEach(function (r) { I.push({ type: "Official guidance", agency: r.agency, level: r.level, year: (r.published || "").slice(0, 4), topic: r.categories.join(", "), title: r.title, text: r.description + " " + r.tags.join(" "), href: "#guidance?q=" + encodeURIComponent(r.title.split(":")[0]), ext: r.url }); });
    A.REPORTS.forEach(function (r) { I.push({ type: "Completed report", agency: r.agency, level: r.jurisdiction, year: (r.published || "").slice(0, 4), topic: r.categories.join(", "), title: r.title, text: r.summary + " " + r.event + " " + r.tags.join(" "), href: "#reports?id=" + r.id }); });
    A.TEMPLATES.forEach(function (t) { I.push({ type: "Template", title: t.title, text: t.purpose + " " + t.when, href: "#templates/" + t.key }); });
    A.GLOSSARY.forEach(function (g) { I.push({ type: "Glossary", title: g.term, text: g.def + " " + g.plain, href: "#glossary?q=" + encodeURIComponent(g.term) }); });
    A.GUIDES.forEach(function (g) { I.push({ type: "Specialized guide", title: g.title, text: g.summary + " " + g.areas.map(function (a) { return a.name; }).join(" "), href: "#guides/" + g.key }); });
    A.STAGES.forEach(function (s) { I.push({ type: "Compiler guidance", title: (s.num ? "Stage " + s.num + ": " : "") + s.title, text: s.purpose + " " + (s.instructions || []).join(" ") + " " + (s.questions || []).join(" "), href: "compiler.html#s=" + s.key }); });
    A.FAQ.forEach(function (f) { I.push({ type: "FAQ", title: f[0], text: f[1], href: "#faq" }); });
    return I;
  }
  function search(main, params) {
    var I = index(), st = { q: params.get("q") || "", type: "", agency: "", level: "", year: "" }, holder = h("div");
    main.append(h("h1", { text: "Search" }), h("p", { class: "lead", text: "Search every page, resource, report, template, glossary term and compiler stage. Search runs entirely in your browser; your search terms are not sent anywhere." }),
      filterBar("Search the site", [{ k: "q", l: "Search terms" }, { k: "type", l: "Content type", options: uniq(I.map(function (x) { return x.type; })) },
        { k: "agency", l: "Agency", options: uniq(I.map(function (x) { return x.agency; })) }, { k: "level", l: "Government level or jurisdiction", options: uniq(I.map(function (x) { return x.level; })) },
        { k: "year", l: "Year", options: uniq(I.map(function (x) { return x.year; })) }], st, draw), holder);
    function draw() {
      A.clear(holder);
      if (!st.q.trim() && !st.type && !st.agency && !st.level && !st.year) { holder.append(h("p", { class: "muted", text: "Type a word or choose a filter." })); return; }
      var q = st.q.trim().toLowerCase();
      var res = I.filter(function (x) { return (!st.type || x.type === st.type) && (!st.agency || x.agency === st.agency) && (!st.level || x.level === st.level) && (!st.year || x.year === st.year) && textMatch(q, [x.title, x.text, x.topic || "", x.agency || ""]); })
        .map(function (x) { var t = x.title.toLowerCase(); return { x: x, score: q && t.indexOf(q) >= 0 ? 2 : 1 }; }).sort(function (a, b) { return b.score - a.score; }).map(function (r) { return r.x; });
      holder.append(h("p", { class: "muted", role: "status", text: res.length + " result" + (res.length === 1 ? "" : "s") + "." }),
        h("ul", { class: "results" }, res.slice(0, 100).map(function (x) { return h("li", null, h("a", { href: x.href, text: x.title }), " ", h("span", { class: "badge b-neutral", text: x.type }), x.agency ? h("span", { class: "meta", text: " · " + x.agency }) : null, h("p", { class: "snippet", text: x.text.slice(0, 180) + (x.text.length > 180 ? "…" : "") })); })));
    }
    draw();
    return null;
  }

  /* ---------- FAQ and About ---------- */
  function faq(main) {
    main.append(h("h1", { text: "Frequently asked questions" }), A.FAQ.map(function (f) { return h("details", { class: "panel" }, h("summary", { text: f[0] }), h("p", { text: f[1] })); }));
    return null;
  }
  function about(main) {
    main.append(h("h1", { text: "About, Sources and Methodology" }),
      h("h2", { text: "What this site is" }),
      h("p", { text: "The AAR Compiler & Knowledge Center helps people compile After-Action Reviews from beginning to end. Its centerpiece is a guided 17-stage compiler; the knowledge center, official guidance library, report archive, templates and glossary support it." }),
      h("h2", { text: "Independence and disclaimer" }),
      h("p", { text: "This is an independent informational resource. It is not an official government website and is not affiliated with or endorsed by any agency named on it. It does not replace agency requirements, policies, standards or professional judgment." }),
      h("h2", { text: "How sources are chosen" }),
      h("ul", null, h("li", { text: "Official guidance entries link only to government domains or the agency's own repository." }),
        h("li", { text: "Titles, agencies and links are never invented. When an exact official link has not been confirmed, the entry says so and gives the agency's main site and a search tip instead." }),
        h("li", { text: "Each entry records the date a person last verified its link. At launch, the build environment could not reach government websites, so every entry shows \"Link not yet verified\" until checked." }),
        h("li", { text: "Superseded or archived guidance stays listed but is clearly labelled, with the replacement named where known." })),
      h("h2", { text: "What is official and what is not" }),
      h("ul", null, h("li", { text: "Official: the documents behind each Official Guidance and Report Library link." }),
        h("li", { text: "Site-written: Knowledge Center pages, report summaries, glossary definitions, templates, specialized guides, compiler instructions and examples. Examples use fictional events." })),
      h("h2", { text: "Methodology of the compiler" }),
      h("p", { text: "The compiler follows the common logic of AAR practice: plan, document, compare expected with actual performance, analyze causes, decide what must change, assign corrective actions and verify them. Its record types (observations, findings, lessons, recommendations, corrective actions) and the AAR/IP pairing follow terms widely used in emergency management, including FEMA's HSEEP, without reproducing official forms." }),
      h("p", { text: "The compiler never generates findings or root causes. It organizes the user's evidence and reasoning, checks completeness and linkage, and assembles the report." }),
      h("h2", { text: "Maintaining this site" }),
      h("p", { text: "Content lives in plain data files (data/*.js) with editing rules at the top of each. Add a resource, report, template, glossary term or guide by adding one entry. Re-check links periodically and update their verified dates." }),
      h("p", null, h("a", { href: "privacy.html", text: "Privacy" }), " · ", h("a", { href: "security.html", text: "Security" })));
    return null;
  }
})();
