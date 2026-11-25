/* AAR Compiler & Knowledge Center — js/validate.js
   Stage completeness, quality-control checks, data-integrity checks, Improvement Plan statistics and traceability.
   These checks measure completeness and linkage only. Passing them does not mean a report is correct. */
(function () {
  "use strict";
  var A = window.AAR;
  var filled = function (v) { return Array.isArray(v) ? v.length > 0 : !!String(v || "").trim(); };
  var DONE_STATUSES = ["Completed", "Verified", "Closed"];
  var STRENGTHS = ["Strength", "Best practice"];

  function reqOK(rec, defs) { return defs.filter(function (f) { return f.req; }).every(function (f) { return filled(rec[f.k]); }); }

  /* Returns "done", "partial" or "empty" for the stage navigation. Status is always shown as text too, never by color alone. */
  A.stageStatus = function (p, key) {
    var st = A.stageByKey(key); if (!st) return "empty";
    if (st.kind === "form") {
      var defs = A.formFields(st.form), any = defs.some(function (f) { return filled(p.forms[st.form][f.k]); });
      return defs.filter(function (f) { return f.req; }).every(function (f) { return filled(p.forms[st.form][f.k]); }) ? "done" : any ? "partial" : "empty";
    }
    if (st.kind === "list" || st.kind === "improvement") {
      var L = p.lists[st.list]; if (!L.length) return "empty";
      return L.every(function (r) { return reqOK(r, A.listFields(st.list)); }) ? "done" : "partial";
    }
    if (st.kind === "analysis") {
      var answered = Object.keys(p.forms.analysis).filter(function (k) { return filled(p.forms.analysis[k]); }).length, an = p.lists.analyses;
      if (!answered && !an.length) return "empty";
      return answered >= 5 && an.length && an.every(function (r) { return reqOK(r, A.listFields("analyses")); }) ? "done" : "partial";
    }
    if (st.kind === "report") { var r = p.forms.report; return filled(r.execSummary) && filled(r.conclusion) ? "done" : (filled(r.execSummary) || filled(r.methodology) || filled(r.conclusion)) ? "partial" : "empty"; }
    if (st.kind === "qc") { var c = A.qcChecks(p); return c.every(function (x) { return x.ok; }) ? "done" : c.some(function (x) { return x.ok; }) ? "partial" : "empty"; }
    if (st.kind === "export") return p.lastBackup ? "done" : "empty";
    return "empty";
  };
  A.progress = function (p) {
    var st = A.STAGES.filter(function (s) { return s.num > 0; }), d = st.filter(function (s) { return A.stageStatus(p, s.key) === "done"; }).length;
    return { done: d, total: st.length, pct: Math.round(d / st.length * 100) };
  };

  /* Quality-control checks (stage 16). manual: true means a person must confirm it. */
  A.QC_MANUAL = [["Objectives are clear", "objectives"], ["Lessons reviewed by the review team", "lessons"], ["Report reviewed by someone outside the drafting team", "report"]];
  A.qcChecks = function (p) {
    var f = p.forms, L = p.lists, out = [];
    function add(group, label, ok, stage, detail) { out.push({ group: group, label: label, ok: !!ok, stage: stage, detail: detail || "" }); }
    function all(list, test, what) { var arr = L[list]; if (!arr.length) return [false, "None recorded yet."]; var bad = arr.filter(function (r) { return !test(r); }); return [!bad.length, bad.length ? what + ": " + bad.map(function (r) { return r.id; }).slice(0, 12).join(", ") : ""]; }
    var x;
    add("Administrative", "Title present", filled(f.setup.aarTitle), "setup");
    add("Administrative", "Event information complete", ["eventName", "eventType", "date", "location", "org"].every(function (k) { return filled(f.setup[k]); }), "setup", "Needs event name, type, date, location and organization.");
    add("Administrative", "Author identified", filled(f.setup.author), "setup");
    add("Administrative", "Review date documented", filled(f.setup.reviewStart), "setup");
    add("Administrative", "Scope defined", filled(f.scope.statement) && filled(f.scope.period), "scope", "Needs a scope statement and time period.");
    add("Objectives", "Objectives documented", L.objectives.length > 0, "objectives");
    x = all("objectives", function (r) { return filled(r.criteria); }, "Missing evaluation criteria"); add("Objectives", "Evaluation criteria identified", x[0], "objectives", x[1]);
    add("Event documentation", "Event overview completed", filled(f.overview.situation) && filled(f.overview.description), "overview");
    add("Event documentation", "Timeline created", L.timeline.length > 0, "timeline");
    add("Event documentation", "Participants identified", L.participants.length > 0, "participants");
    add("Event documentation", "Supporting information documented", L.evidence.length > 0, "evidence");
    x = all("evidence", function (r) { return filled(r.source); }, "No source"); add("Evidence", "Sources identified", x[0], "evidence", x[1]);
    x = all("observations", function (r) { return filled(r.evidence); }, "No linked evidence"); add("Evidence", "Sources linked to observations", x[0], "observations", x[1]);
    x = all("findings", function (r) { return filled(r.evidence); }, "No linked evidence"); add("Evidence", "Sources linked to findings", x[0], "findings", x[1]);
    x = all("evidence", function (r) { return filled(r.reliability); }, "Reliability not marked"); add("Evidence", "Unverified information identified", x[0], "evidence", x[1]);
    add("Analysis", "Observations documented", L.observations.length > 0, "observations");
    add("Analysis", "Strengths identified", L.observations.some(function (r) { return STRENGTHS.indexOf(r.category) >= 0; }), "observations");
    add("Analysis", "Areas for improvement identified", L.observations.some(function (r) { return r.category && STRENGTHS.indexOf(r.category) < 0 && r.category !== "Neutral observation"; }), "observations");
    add("Analysis", "Analysis completed", A.stageStatus(p, "analysis") === "done", "analysis", "Answer at least five prompts and complete each worksheet.");
    x = all("findings", function (r) { return filled(r.observations) && filled(r.evidence) && filled(r.conclusion); }, "Unsupported"); add("Analysis", "Findings supported", x[0], "findings", x[1]);
    add("Lessons", "Lessons identified", L.lessons.length > 0, "lessons");
    x = all("lessons", function (r) { return filled(r.findings); }, "Not linked"); add("Lessons", "Lessons linked to findings", x[0], "lessons", x[1]);
    add("Improvement plan", "Recommendations documented", L.recommendations.length > 0, "recommendations");
    add("Improvement plan", "Corrective actions developed", L.actions.length > 0, "improvement");
    x = all("actions", function (r) { return filled(r.owner); }, "No owner"); add("Improvement plan", "Owners assigned", x[0], "improvement", x[1]);
    x = all("actions", function (r) { return filled(r.due); }, "No due date"); add("Improvement plan", "Deadlines assigned", x[0], "improvement", x[1]);
    x = all("actions", function (r) { return filled(r.criteria); }, "No completion criteria"); add("Improvement plan", "Completion criteria established", x[0], "improvement", x[1]);
    add("Final report", "Report assembled", filled(f.report.execSummary) && filled(f.report.conclusion), "report", "Needs an executive summary and conclusion.");
    add("Final report", "Sources documented", filled(f.report.references), "report", "Add references for Appendix E.");
    add("Final report", "Appendices completed", L.timeline.length > 0 && L.evidence.length > 0, "report", "Appendices A and B need timeline and evidence records.");
    add("Final report", "Final version saved", !!p.lastBackup && !p.changedSinceBackup, "export", "Download a JSON backup after your last change.");
    A.QC_MANUAL.forEach(function (m, i) { add(i === 0 ? "Objectives" : i === 1 ? "Lessons" : "Final report", m[0] + " (manual check)", p.qc["qcm-" + i] === true, m[1]); });
    return out;
  };

  /* Data-integrity checks: duplicate IDs and links that point at deleted records. */
  A.integrity = function (p) {
    var issues = [], ids = {};
    Object.keys(p.lists).forEach(function (l) { p.lists[l].forEach(function (r) { if (!r.id) issues.push("A " + l + " record has no ID."); else if (ids[r.id]) issues.push("Duplicate ID " + r.id + "."); ids[r.id] = l; }); });
    Object.keys(p.lists).forEach(function (l) {
      var defs = A.listFields(l).filter(function (f) { return f.t === "refs" || f.t === "ref"; });
      p.lists[l].forEach(function (r) { defs.forEach(function (f) {
        [].concat(r[f.k] || []).forEach(function (id) { if (id && ids[id] !== f.list) issues.push(r.id + " links to " + id + " in \"" + f.l + "\", but that record does not exist."); });
      }); });
    });
    return issues;
  };

  /* Improvement Plan dashboard figures. */
  A.ipStats = function (p) {
    var acts = p.lists.actions, today = A.today(), soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    var by = function (k) { var o = {}; acts.forEach(function (a) { var v = a[k] || "Not set"; o[v] = (o[v] || 0) + 1; }); return o; };
    var open = function (a) { return DONE_STATUSES.indexOf(a.status) < 0; };
    return { total: acts.length, priority: by("priority"), status: by("status"), org: by("org"),
      overdue: acts.filter(function (a) { return open(a) && a.due && a.due < today; }),
      upcoming: acts.filter(function (a) { return open(a) && a.due && a.due >= today && a.due <= soon; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }),
      completed: acts.filter(function (a) { return a.status === "Completed"; }).length,
      verified: acts.filter(function (a) { return a.status === "Verified" || a.status === "Closed"; }).length };
  };

  /* Traceability chain for one finding: objectives, observations, evidence, lessons, recommendations, actions. */
  A.trace = function (p, fnd) {
    var L = p.lists, obs = L.observations.filter(function (o) { return fnd.observations.indexOf(o.id) >= 0; });
    var objs = [].concat(fnd.objectives); obs.forEach(function (o) { objs = objs.concat(o.objectives); });
    var ev = [].concat(fnd.evidence); obs.forEach(function (o) { ev = ev.concat(o.evidence); });
    var uniq = function (a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); };
    var lessons = L.lessons.filter(function (l) { return l.findings.indexOf(fnd.id) >= 0; });
    var recs = L.recommendations.filter(function (r) { return r.findings.indexOf(fnd.id) >= 0; });
    var recIds = recs.map(function (r) { return r.id; });
    var acts = L.actions.filter(function (a) { return a.findings.indexOf(fnd.id) >= 0 || a.recommendations.some(function (r) { return recIds.indexOf(r) >= 0; }); });
    return { objectives: uniq(objs), observations: obs.map(function (o) { return o.id; }), evidence: uniq(ev), lessons: lessons.map(function (l) { return l.id; }), recommendations: recIds, actions: acts };
  };
})();
