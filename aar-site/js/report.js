/* AAR Compiler & Knowledge Center — js/report.js
   Report assembly and exports. The report is first built as a neutral list of blocks (headings, paragraphs, tables...),
   then rendered three ways: safe DOM (preview and print), Markdown, and plain text. The HTML export serializes the DOM
   preview, which was built with text nodes only, so user text can never become markup. Exports contain no scripts.
   Participant contact details are never included in any report or export except the full JSON backup. */
(function () {
  "use strict";
  var A = window.AAR, h = A.h;
  var nz = function (v) { return Array.isArray(v) ? v.length > 0 : !!String(v || "").trim(); };
  var ids = function (a) { return (a || []).join(", "); };
  var STRENGTH = ["Strength", "Best practice"], SIGNIF = ["Significant event", "Unexpected outcome", "Neutral observation"];

  function chrono(list) { return list.slice().sort(function (a, b) { var x = (a.date || "9999") + (a.time || ""), y = (b.date || "9999") + (b.time || ""); return x < y ? -1 : x > y ? 1 : 0; }); }
  A.chrono = chrono;

  /* Build report blocks. sections = array of section keys to include. */
  A.buildReport = function (p, sections) {
    var f = p.forms, L = p.lists, B = [], s = f.setup;
    var on = function (k) { return sections.indexOf(k) >= 0; };
    var H1 = function (t) { B.push({ t: "h1", text: t }); }, H2 = function (t) { B.push({ t: "h2", text: t }); }, H3 = function (t) { B.push({ t: "h3", text: t }); }, H4 = function (t) { B.push({ t: "h4", text: t }); };
    var P = function (t) { if (nz(t)) B.push({ t: "p", text: t }); };
    var NOTE = function (t) { B.push({ t: "note", text: t }); };
    var KV = function (rows) { rows = rows.filter(function (r) { return nz(r[1]); }); if (rows.length) B.push({ t: "kv", rows: rows }); };
    var TABLE = function (head, rows) { if (rows.length) B.push({ t: "table", head: head, rows: rows }); else NOTE("No records."); };
    var TEXTSEC = function (title, value, missing) { H2(title); if (nz(value)) P(value); else NOTE(missing || "Not yet written."); };

    if (on("cover")) {
      B.push({ t: "cover", text: s.aarTitle || s.projectTitle || "After-Action Report" });
      KV([["Event", s.eventName], ["Event type", [s.eventType, s.incidentType].filter(nz).join(": ")], ["Date", [A.fmtDate(s.date), s.start && s.end ? s.start + " to " + s.end : s.start].filter(nz).join(", ")],
        ["Location", [s.location, s.jurisdiction].filter(nz).join(", ")], ["Organization", s.org], ["Author", s.author], ["Review lead", s.lead], ["Version", s.version], ["Report date", A.fmtDate(s.reportDate)], ["Report ID", s.reportId]]);
      if (nz(s.handling)) NOTE("Handling: " + s.handling);
      B.push({ t: "break" });
    }
    if (on("exec")) {
      H2("1. Executive summary");
      if (nz(f.report.execSummary)) P(f.report.execSummary); else NOTE("Executive summary not yet written (Stage 15).");
      P("This review documented " + L.observations.length + " observation(s), " + L.findings.length + " finding(s), " + L.lessons.length + " lesson(s), " +
        L.recommendations.length + " recommendation(s) and " + L.actions.length + " corrective action(s).");
    }
    if (on("overview")) {
      H2("2. Event overview"); var o = f.overview, any = false;
      [["Situation", "situation"], ["Background", "background"], ["Event description", "description"], ["Pre-event conditions", "preconditions"], ["Trigger", "trigger"], ["Major event phases", "phases"],
        ["Operating environment", "environment"], ["Organizations involved", "orgs"], ["Resources involved", "resources"], ["Relevant plans", "plans"], ["Relevant procedures", "procedures"],
        ["Relevant policies", "policies"], ["Constraints", "constraints"], ["External conditions", "external"]].forEach(function (x) { if (nz(o[x[1]])) { any = true; H3(x[0]); P(o[x[1]]); } });
      if (!any) NOTE("Event overview not yet written (Stage 4).");
    }
    if (on("purpose")) TEXTSEC("3. Purpose", f.scope.purpose, "Purpose not yet stated (Stage 2).");
    if (on("scope")) {
      H2("4. Scope"); var c = f.scope;
      if (nz(c.statement)) P(c.statement); else NOTE("Scope statement not yet written (Stage 2).");
      KV([["Time period", c.period], ["Included activities", c.included], ["Excluded activities", c.excluded], ["Review boundaries", c.boundaries], ["Organizations", c.orgs],
        ["Intended use", c.use], ["Limitations", c.limitations], ["Assumptions", c.assumptions]]);
    }
    if (on("method")) {
      H2("5. Methodology"); P(f.report.methodology);
      P("Records compiled for this review: " + L.timeline.length + " timeline entries, " + L.evidence.length + " evidence items, " + L.participants.length + " participants or organizations, " +
        L.interviews.length + " interview records and " + L.analyses.length + " analysis worksheets.");
    }
    if (on("objectives")) {
      H2("6. Objectives"); if (!L.objectives.length) NOTE("No objectives recorded (Stage 3).");
      L.objectives.forEach(function (r) { H3(r.id + " " + r.title); P(r.description);
        KV([["Intended outcome", r.outcome], ["Evaluation criteria", r.criteria], ["Success criteria", r.success], ["Applicable standards", r.standards], ["Relevant policies", r.policies], ["Relevant plans", r.plans], ["Related organizations", r.orgs]]); });
    }
    if (on("timeline")) {
      H2("7. Event timeline");
      TABLE(["Date", "Time", "Event", "Responsible", "Outcome", "Source"], chrono(L.timeline).map(function (r) { return [A.fmtDate(r.date), r.time, r.event, r.org, r.outcome, r.source]; }));
    }
    if (on("participants")) {
      H2("8. Participants and organizations");
      TABLE(["ID", "Organization", "Role", "Area of involvement", "Participation"], L.participants.map(function (r) { return [r.id, r.org, r.role, r.area, r.participation]; }));
    }
    function obsBlock(r) { H4(r.id + " " + r.title);
      KV([["Category", r.category], ["Description", r.description], ["Expected condition", r.expected], ["Actual condition", r.actual], ["Impact", r.impact], ["Contributing factors", r.factors],
        ["Significance", r.significance], ["Supporting evidence", ids(r.evidence)], ["Related objectives", ids(r.objectives)], ["Related timeline", ids(r.timeline)]]); }
    if (on("observations")) {
      H2("9. Observations");
      var gs = [["9.1 Strengths", function (r) { return STRENGTH.indexOf(r.category) >= 0; }],
        ["9.2 Areas for improvement", function (r) { return r.category && STRENGTH.indexOf(r.category) < 0 && SIGNIF.indexOf(r.category) < 0; }],
        ["9.3 Significant observations", function (r) { return !r.category || SIGNIF.indexOf(r.category) >= 0; }]];
      gs.forEach(function (g) { B.push({ t: "h2b", text: g[0] }); var rows = L.observations.filter(g[1]); if (!rows.length) NOTE("None recorded."); rows.forEach(obsBlock); });
    }
    if (on("analysis")) {
      H2("10. Analysis");
      var st = A.stageByKey("analysis");
      st.prompts.forEach(function (q, i) { var a = f.analysis["p" + i]; if (nz(a)) { H3(q); P(a); } });
      L.analyses.forEach(function (r) { H3(r.id + " " + r.framework + ": " + r.problem);
        KV([["Observations analyzed", ids(r.observations)], ["Step 1", r.why1], ["Step 2", r.why2], ["Step 3", r.why3], ["Step 4", r.why4], ["Step 5", r.why5], ["Contributing factors", r.factors],
          ["Barriers or controls", r.barriers], ["Evidence relied on", ids(r.evidence)], ["Conclusion", r.conclusion], ["Confidence", r.confidence]]); });
      if (!L.analyses.length && !st.prompts.some(function (q, i) { return nz(f.analysis["p" + i]); })) NOTE("Analysis not yet recorded (Stage 10).");
      else NOTE("Conclusions in this section are the review team's judgments based on the evidence listed.");
    }
    if (on("findings")) {
      H2("11. Findings"); if (!L.findings.length) NOTE("No findings recorded (Stage 11).");
      L.findings.forEach(function (r) { H3(r.id + " " + r.title);
        KV([["Category", r.category], ["Significance", r.significance], ["Expected condition", r.expected], ["Actual condition", r.actual], ["Supporting evidence", ids(r.evidence)],
          ["Contributing factors", r.factors], ["Impact", r.impact], ["Conclusion", r.conclusion], ["Recommendation", r.recommendationText], ["Related observations", ids(r.observations)], ["Related objectives", ids(r.objectives)]]); });
    }
    if (on("lessons")) {
      H2("12. Lessons learned"); if (!L.lessons.length) NOTE("No lessons recorded (Stage 12).");
      L.lessons.forEach(function (r) { H3(r.id + " " + r.title);
        KV([["Category", r.category], ["Description", r.description], ["Why it matters", r.why], ["What should change", r.change], ["Applicability", r.applicability], ["Intended audience", r.audience],
          ["Related findings", ids(r.findings)], ["Supporting evidence", ids(r.evidence)], ["Status", r.status]]); });
    }
    if (on("recommendations")) {
      H2("13. Recommendations"); if (!L.recommendations.length) NOTE("No recommendations recorded (Stage 13).");
      L.recommendations.forEach(function (r) { H3(r.id + " " + r.title);
        KV([["Related findings", ids(r.findings)], ["Description", r.description], ["Intended outcome", r.outcome], ["Priority", r.priority], ["Responsible organization", r.org],
          ["Required resources", r.resources], ["Dependencies", r.dependencies], ["Suggested timeline", r.timeline], ["Validation method", r.validation]]); });
    }
    if (on("improvement")) {
      H2("14. Improvement plan");
      TABLE(["ID", "Corrective action", "Owner", "Organization", "Priority", "Due", "Status", "Completion criteria", "Linked to"],
        L.actions.map(function (r) { return [r.id, r.title, r.owner, r.org, r.priority, A.fmtDate(r.due), r.status, r.criteria, ids(r.recommendations.concat(r.findings))]; }));
    }
    if (on("conclusion")) TEXTSEC("15. Conclusion", f.report.conclusion, "Conclusion not yet written (Stage 15).");
    var app = false;
    function appendix(t) { if (!app) { B.push({ t: "break" }); H1("Appendices"); app = true; } H2(t); }
    if (on("appA")) { appendix("Appendix A. Timeline");
      TABLE(["ID", "Date", "Time", "Category", "Event", "Decision / action", "Responsible", "Outcome", "Source", "Links"],
        chrono(L.timeline).map(function (r) { return [r.id, A.fmtDate(r.date), r.time, r.category, r.event, [r.decision, r.action].filter(nz).join(" / "), r.org, r.outcome, r.source, ids(r.objectives.concat(r.observations, r.evidence))]; })); }
    if (on("appB")) { appendix("Appendix B. Evidence inventory");
      TABLE(["ID", "Title", "Type", "Date", "Source", "Reliability", "Relevance", "Link"], L.evidence.map(function (r) { return [r.id, r.title, r.type, A.fmtDate(r.date), r.source, r.reliability, r.relevance, r.link]; })); }
    if (on("appC")) { appendix("Appendix C. Interview summaries");
      if (!L.interviews.length) NOTE("No interview records.");
      L.interviews.forEach(function (r) { H3(r.id + " " + r.question);
        KV([["Participant", r.participant ? A.recordLabel(p, r.participant) : ""], ["Date", A.fmtDate(r.date)], ["Response type", r.label], ["Response", r.response], ["Key observation", r.key]]); }); }
    if (on("appD")) { appendix("Appendix D. Supporting documentation"); if (nz(f.report.supporting)) P(f.report.supporting); else NOTE("None listed."); }
    if (on("appE")) { appendix("Appendix E. References");
      var refs = String(f.report.references || "").split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
      if (refs.length) B.push({ t: "list", items: refs }); else NOTE("No references listed."); }
    B.push({ t: "foot", text: "Compiled with the AAR Compiler, an independent tool. Completeness checks do not establish that this report is correct; findings are the review team's responsibility." });
    return B;
  };

  /* ---- Renderers ---- */
  /* shift = 1 renders headings one level down (h1 becomes h2) so an in-page preview does not add extra main headings. */
  A.renderReportDOM = function (blocks, shift) {
    var root = h("article", { class: "report", id: "report-doc" }), tbl, sh = shift || 0;
    var H = function (n) { return "h" + Math.min(6, n + sh); };
    blocks.forEach(function (b) {
      if (b.t === "cover") root.append(h("header", { class: "r-cover" }, h("p", { class: "r-kicker", text: "After-Action Report" }), h(H(1), { text: b.text })));
      else if (b.t === "h1") root.append(h(H(1), { text: b.text }));
      else if (b.t === "h2") root.append(h(H(2), { text: b.text }));
      else if (b.t === "h2b") root.append(h(H(3), { class: "r-sub", text: b.text }));
      else if (b.t === "h3") root.append(h(H(3), { text: b.text }));
      else if (b.t === "h4") root.append(h(H(4), { text: b.text }));
      else if (b.t === "p") root.append(h("p", { class: "r-p", text: b.text }));
      else if (b.t === "note") root.append(h("p", { class: "r-note", text: b.text }));
      else if (b.t === "foot") root.append(h("p", { class: "r-foot", text: b.text }));
      else if (b.t === "break") root.append(h("hr", { class: "r-break" }));
      else if (b.t === "list") root.append(h("ol", null, b.items.map(function (x) { return h("li", { text: x }); })));
      else if (b.t === "kv") root.append(h("dl", { class: "r-kv" }, b.rows.map(function (r) { return [h("dt", { text: r[0] }), h("dd", { class: "r-p", text: r[1] })]; })));
      else if (b.t === "table") {
        tbl = h("table", null, h("thead", null, h("tr", null, b.head.map(function (x) { return h("th", { scope: "col", text: x }); }))),
          h("tbody", null, b.rows.map(function (r) { return h("tr", null, r.map(function (c) { return h("td", { text: c || "" }); })); })));
        root.append(h("div", { class: "r-tablewrap" }, tbl));
      }
    });
    return root;
  };
  var mdEsc = function (s) { return String(s || "").replace(/([\\`*_\[\]<>|#])/g, "\\$1"); };
  A.renderReportMD = function (blocks) {
    var out = [];
    blocks.forEach(function (b) {
      if (b.t === "cover") out.push("# " + mdEsc(b.text), "");
      else if (b.t === "h1") out.push("# " + mdEsc(b.text), "");
      else if (b.t === "h2") out.push("## " + mdEsc(b.text), "");
      else if (b.t === "h2b") out.push("### " + mdEsc(b.text), "");
      else if (b.t === "h3") out.push("### " + mdEsc(b.text), "");
      else if (b.t === "h4") out.push("#### " + mdEsc(b.text), "");
      else if (b.t === "p") out.push(mdEsc(b.text).replace(/\n/g, "  \n"), "");
      else if (b.t === "note" || b.t === "foot") out.push("_" + mdEsc(b.text) + "_", "");
      else if (b.t === "break") out.push("---", "");
      else if (b.t === "list") { b.items.forEach(function (x, i) { out.push((i + 1) + ". " + mdEsc(x)); }); out.push(""); }
      else if (b.t === "kv") { b.rows.forEach(function (r) { out.push("- **" + mdEsc(r[0]) + ":** " + mdEsc(r[1]).replace(/\n/g, " ")); }); out.push(""); }
      else if (b.t === "table") {
        var cell = function (c) { return mdEsc(c).replace(/\n/g, " "); };
        out.push("| " + b.head.map(cell).join(" | ") + " |", "|" + b.head.map(function () { return " --- "; }).join("|") + "|");
        b.rows.forEach(function (r) { out.push("| " + r.map(cell).join(" | ") + " |"); }); out.push("");
      }
    });
    return out.join("\n");
  };
  A.renderReportTXT = function (blocks) {
    var out = [], line = function (ch, t) { return new Array(Math.min(t.length, 78) + 1).join(ch); };
    blocks.forEach(function (b) {
      if (b.t === "cover" || b.t === "h1") out.push(b.text.toUpperCase(), line("=", b.text), "");
      else if (b.t === "h2") out.push(b.text, line("-", b.text), "");
      else if (b.t === "h2b") out.push(b.text, "");
      else if (b.t === "h3" || b.t === "h4") out.push("* " + b.text, "");
      else if (b.t === "p") out.push(b.text, "");
      else if (b.t === "note" || b.t === "foot") out.push("[" + b.text + "]", "");
      else if (b.t === "break") out.push("", "");
      else if (b.t === "list") { b.items.forEach(function (x, i) { out.push((i + 1) + ". " + x); }); out.push(""); }
      else if (b.t === "kv") { b.rows.forEach(function (r) { out.push(r[0] + ": " + String(r[1]).replace(/\n/g, "\n    ")); }); out.push(""); }
      else if (b.t === "table") { b.rows.forEach(function (r) { out.push(b.head.map(function (hd, i) { return r[i] ? hd + ": " + String(r[i]).replace(/\n/g, " ") : ""; }).filter(Boolean).join(" | ")); }); out.push(""); }
    });
    return out.join("\n");
  };
  var REPORT_CSS = "body{font:15px/1.55 Georgia,'Times New Roman',serif;color:#111;max-width:860px;margin:24px auto;padding:0 18px}h1,h2,h3,h4{font-family:Arial,Helvetica,sans-serif;color:#0f1b2d}" +
    "h1{font-size:26px}h2{font-size:20px;border-bottom:2px solid #0f1b2d;padding-bottom:4px;margin-top:28px}h3{font-size:16px;margin:18px 0 6px}h4{font-size:15px;margin:16px 0 6px}.r-cover{border-bottom:6px solid #0f1b2d;margin-bottom:12px}" +
    ".r-kicker{font:700 12px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#465a74}.r-p{white-space:pre-wrap}.r-note{font-style:italic;color:#555}.r-foot{font-size:12px;color:#555;border-top:1px solid #ccc;padding-top:8px;margin-top:30px}" +
    "dl.r-kv{display:grid;grid-template-columns:minmax(120px,max-content) 1fr;gap:4px 14px}dt{font-weight:700;font-family:Arial,sans-serif;font-size:13px}dd{margin:0}" +
    "table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #bbb;padding:5px 7px;text-align:left;vertical-align:top}th{background:#eef1f5}hr.r-break{border:0;page-break-after:always}" +
    "@media print{body{margin:0}h2,h3,h4{page-break-after:avoid}tr{page-break-inside:avoid}}";
  A.renderReportHTMLDoc = function (blocks, title) {
    var node = A.renderReportDOM(blocks), esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); };
    return "<!DOCTYPE html>\n<html lang=\"en\"><head><meta charset=\"utf-8\">\n" +
      "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'\">\n" +
      "<meta name=\"referrer\" content=\"no-referrer\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>" + esc(title) + "</title>\n<style>" + REPORT_CSS + "</style></head><body>\n" +
      node.outerHTML + "\n</body></html>\n";
  };

  /* CSV with spreadsheet formula-injection guard (cells starting with = + - @ are prefixed with '). */
  A.toCSV = function (head, rows) {
    var q = function (x) { x = String(x == null ? "" : x); if (/^[=+\-@\t\r]/.test(x)) x = "'" + x; return "\"" + x.replace(/"/g, "\"\"") + "\""; };
    return [head.map(q).join(",")].concat(rows.map(function (r) { return r.map(q).join(","); })).join("\r\n");
  };
  A.sectionCSV = {
    timeline: function (p) { return A.toCSV(["ID", "Date", "Time", "Category", "Event", "Description", "Decision", "Action", "Responsible organization", "Outcome", "Objectives", "Observations", "Evidence", "Source", "Notes"],
      chrono(p.lists.timeline).map(function (r) { return [r.id, r.date, r.time, r.category, r.event, r.description, r.decision, r.action, r.org, r.outcome, ids(r.objectives), ids(r.observations), ids(r.evidence), r.source, r.notes]; })); },
    findings: function (p) { return A.toCSV(["ID", "Title", "Category", "Significance", "Expected", "Actual", "Evidence", "Contributing factors", "Impact", "Conclusion", "Recommendation", "Observations", "Objectives"],
      p.lists.findings.map(function (r) { return [r.id, r.title, r.category, r.significance, r.expected, r.actual, ids(r.evidence), r.factors, r.impact, r.conclusion, r.recommendationText, ids(r.observations), ids(r.objectives)]; })); },
    lessons: function (p) { return A.toCSV(["ID", "Title", "Category", "Description", "Why it matters", "What should change", "Applicability", "Audience", "Findings", "Evidence", "Status"],
      p.lists.lessons.map(function (r) { return [r.id, r.title, r.category, r.description, r.why, r.change, r.applicability, r.audience, ids(r.findings), ids(r.evidence), r.status]; })); },
    actions: function (p) { return A.toCSV(["ID", "Title", "Description", "Owner", "Organization", "Priority", "Start", "Due", "Status", "Completion criteria", "Verification method", "Verification evidence", "Findings", "Recommendations", "Resources", "Dependencies", "Notes"],
      p.lists.actions.map(function (r) { return [r.id, r.title, r.description, r.owner, r.org, r.priority, r.start, r.due, r.status, r.criteria, r.verification, ids(r.verificationEvidence), ids(r.findings), ids(r.recommendations), r.resources, r.dependencies, r.notes]; })); }
  };
})();
