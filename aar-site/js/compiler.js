/* AAR Compiler & Knowledge Center — js/compiler.js
   The guided compiler (compiler.html). Renders every stage from the definitions in stages.js.
   Navigation: compiler.html#s=<stage key>. All rendering uses AAR.h() (text nodes only). */
(function () {
  "use strict";
  var A = window.AAR, h = A.h;
  var S = { ack: false, p: null, saveTimer: 0, lastSave: null, saveError: "", open: {}, filters: {}, pendingImport: null };
  var $ = function (id) { return document.getElementById(id); };
  var WARN = "Do not enter classified, restricted, confidential, privileged, sensitive personal, protected health, or otherwise sensitive information. This tool is intended for general, non-sensitive AAR compilation. Your project data is stored locally in your browser and is not encrypted by this website.";
  var BACKUP_WARN = "Your project is stored locally in your browser. It is not uploaded to this website. Download regular backups. Clearing your browser data may permanently delete your project.";

  /* ---------- Saving ---------- */
  function touch() { if (!S.p) return; S.p.changedSinceBackup = true; clearTimeout(S.saveTimer); S.saveTimer = setTimeout(saveNow, 500); setStatus("Unsaved changes…");
    if (currentKey() === "improvement") { clearTimeout(S.ipTimer); S.ipTimer = setTimeout(refreshIP, 400); } }
  /* Keep the Improvement Plan dashboard current while the user edits actions, without re-rendering the form (focus stays put). */
  function refreshIP() { var old = document.querySelector(".ip-dash"); if (!old) return; var tmp = h("div"); renderIPDashboard(tmp); old.replaceWith(tmp.firstChild); }
  function saveNow() {
    clearTimeout(S.saveTimer);
    var r = A.saveState(S.ack, S.p);
    if (r.ok) { S.saveError = ""; S.lastSave = new Date(); setStatus("Saved in this browser at " + S.lastSave.toLocaleTimeString() + " (" + Math.ceil(r.bytes / 1024) + " KB)."); }
    else { S.saveError = r.msg; setStatus(r.msg, true); }
    renderNav();
    return r.ok;
  }
  function setStatus(msg, bad) { var el = $("save-status"); if (el) { el.textContent = msg; el.className = "save-status" + (bad ? " bad" : ""); } }
  window.addEventListener("beforeunload", function (e) { if (S.saveError) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- Routing ---------- */
  function currentKey() { var m = location.hash.match(/^#s=([a-z]+)$/); return m && A.stageByKey(m[1]) ? m[1] : (S.p ? S.p.stage : "setup"); }
  function go(key) { if (location.hash === "#s=" + key) render(); else location.hash = "s=" + key; }
  window.addEventListener("hashchange", function () { render(); });

  /* ---------- Shell ---------- */
  function render() {
    var main = A.clear($("stage"));
    if (!S.p) { renderIntro(main); renderNav(); return; }
    var key = currentKey(), st = A.stageByKey(key);
    if (S.p.stage !== key) { S.p.stage = key; saveNow(); }
    renderNav();
    document.title = (st.num ? "Stage " + st.num + ": " : "") + st.title + " | AAR Compiler";
    main.append(breadcrumb(st), stageHeader(st));
    if (st.kind === "dashboard") renderDashboard(main);
    else {
      main.append(guidance(st));
      var body = h("section", { class: "stage-body", "aria-label": st.title + " entries" });
      main.append(body);
      if (st.kind === "form") renderForm(body, st);
      else if (st.kind === "list") renderList(body, st);
      else if (st.kind === "analysis") renderAnalysis(body, st);
      else if (st.kind === "improvement") { renderIPDashboard(body); renderList(body, st); }
      else if (st.kind === "report") renderReportStage(body, st);
      else if (st.kind === "qc") renderQC(body);
      else if (st.kind === "export") renderExport(body);
      main.append(sideRefs(st), pager(st));
    }
    main.append(h("p", { id: "save-status", class: "save-status", role: "status" }, S.lastSave ? "Saved in this browser at " + S.lastSave.toLocaleTimeString() + "." : "Changes save automatically in this browser."));
    var hd = main.querySelector("h1"); if (hd && S.focusHeading) { hd.setAttribute("tabindex", "-1"); hd.focus({ preventScroll: false }); }
    S.focusHeading = true;
  }

  function renderNav() {
    var nav = $("stagenav"); if (!nav) return; A.clear(nav);
    nav.append(h("h2", { class: "nav-h", text: "AAR process" }));
    if (!S.p) { nav.append(h("p", { class: "muted", text: "Start or open a project to begin." })); return; }
    var pr = A.progress(S.p), key = currentKey();
    nav.append(h("p", { class: "nav-progress" }, h("progress", { max: pr.total, value: pr.done, "aria-label": "Stages complete" }), " " + pr.done + " of " + pr.total + " stages complete"));
    var ol = h("ol", { class: "stage-list" });
    A.STAGES.forEach(function (s) {
      var stt = s.num ? A.stageStatus(S.p, s.key) : "", label = { done: "Complete", partial: "In progress", empty: "Not started" }[stt] || "";
      ol.append(h("li", { class: "st-" + (stt || "dash") },
        h("a", { href: "#s=" + s.key, "aria-current": s.key === key ? "step" : null },
          h("span", { class: "st-num", "aria-hidden": "true", text: s.num ? String(s.num) : "◆" }),
          h("span", { class: "st-name", text: s.short }),
          stt ? h("span", { class: "st-state" }, h("span", { "aria-hidden": "true", text: stt === "done" ? "✓" : stt === "partial" ? "…" : "○" }), h("span", { class: "sr-only", text: ", " + label })) : null)));
    });
    /* On phones the stage list starts collapsed so the stage content comes first; the user's choice is remembered for the session. */
    if (S.navOpen === undefined) S.navOpen = window.matchMedia("(min-width: 901px)").matches;
    var det = h("details", { class: "stage-toggle" }, h("summary", { text: "All stages (key: ✓ complete, … in progress, ○ not started)" }), ol);
    det.open = S.navOpen; det.addEventListener("toggle", function () { S.navOpen = det.open; });
    nav.append(det);
  }

  function breadcrumb(st) {
    return h("nav", { class: "breadcrumb", "aria-label": "Breadcrumb" }, h("ol", null, h("li", null, h("a", { href: "index.html", text: "Home" })),
      h("li", null, h("a", { href: "#s=dashboard", text: "AAR Compiler" })), h("li", { "aria-current": "page", text: st.num ? "Stage " + st.num + ": " + st.title : st.title })));
  }
  function stageHeader(st) {
    var pr = A.progress(S.p), stt = st.num ? A.stageStatus(S.p, st.key) : "";
    return h("header", { class: "stage-head" },
      st.num ? h("p", { class: "kicker", text: "Stage " + st.num + " of 17" + (stt ? " · " + { done: "Complete", partial: "In progress", empty: "Not started" }[stt] : "") }) : h("p", { class: "kicker", text: S.p.forms.setup.aarTitle || S.p.forms.setup.projectTitle || "Untitled AAR project" }),
      h("h1", { text: st.title }),
      h("p", { class: "purpose" }, h("strong", { text: "Purpose: " }), st.purpose),
      h("div", { class: "progress-row" }, h("progress", { max: pr.total, value: pr.done, "aria-label": "Overall progress" }), h("span", { text: pr.pct + "% of stages complete" })));
  }

  function guidance(st) {
    var box = h("div", { class: "guidance" });
    if (st.instructions) box.append(h("details", { class: "panel", open: true }, h("summary", { text: "Instructions" }), h("ol", null, st.instructions.map(function (x) { return h("li", { text: x }); }))));
    if (st.questions && st.questions.length) box.append(h("details", { class: "panel" }, h("summary", { text: "Guiding questions" }), h("ul", null, st.questions.map(function (x) { return h("li", { text: x }); }))));
    var g = guideFor();
    if (st.focus && g) box.append(h("details", { class: "panel focus" }, h("summary", { text: "Focus areas for a " + g.title + " (from your event type)" }),
      h("p", { class: "muted", text: "These prompts come from the specialized guide for your event type. Change the event type in Stage 1 to switch guides." }),
      g.areas.map(function (a) { return h("div", { class: "focus-area" }, h("h3", { text: a.name }), h("ul", null, a.questions.map(function (q) { return h("li", { text: q }); }))); }),
      h("p", null, h("a", { href: "library.html#guides/" + g.key, text: "Read the full " + g.title + " guide" }))));
    if (st.concepts) box.append(conceptsTable());
    if (st.privacy) box.append(h("div", { class: "warning", role: "note" }, h("strong", { text: "Privacy warning: " }), "Record roles and organizations, not personal details. Contact details are optional, stored unencrypted in this browser, and are left out of every report and section export (they are kept only in your JSON backup). Do not enter phone numbers, home addresses or personal email addresses unless you truly need them."));
    return box;
  }
  function guideFor() { var gk = A.EVENT_GUIDE[S.p.forms.setup.eventType]; return gk && A.GUIDES ? A.GUIDES.filter(function (g) { return g.key === gk; })[0] : null; }
  function conceptsTable() {
    return h("details", { class: "panel" }, h("summary", { text: "Observation, finding, lesson, recommendation or corrective action?" }),
      h("table", { class: "concepts" }, h("thead", null, h("tr", null, h("th", { scope: "col", text: "Term" }), h("th", { scope: "col", text: "Meaning" }), h("th", { scope: "col", text: "Example" }))),
        h("tbody", null, A.CONCEPTS.map(function (c) { return h("tr", null, h("th", { scope: "row", text: c[0] }), h("td", { text: c[1] }), h("td", { text: c[2] })); }))));
  }

  /* ---------- Field controls ---------- */
  var uid = 0;
  function control(f, getV, setV, opts) {
    opts = opts || {};
    var id = "f" + (++uid), hint = f.help ? h("span", { class: "hint", id: id + "-h", text: f.help }) : null, req = f.req ? h("span", { class: "req", text: " (required)" }) : null, el, wrap;
    var describe = f.help ? id + "-h" : null;
    if (f.t === "refs") {
      var target = S.p.lists[f.list], cur = getV();
      wrap = h("fieldset", { class: "field refs" + (opts.wide ? " wide" : "") }, h("legend", null, f.l, req), hint);
      if (!target.length) { var tst = A.STAGES.filter(function (s) { return s.list === f.list; })[0]; wrap.append(h("p", { class: "muted" }, "No " + A.LISTS[f.list].noun + " records yet. ", tst ? h("a", { href: "#s=" + tst.key, text: "Add them in Stage " + tst.num + "." }) : null)); return wrap; }
      var box = h("div", { class: "checks" });
      target.forEach(function (r) {
        var cid = id + "-" + r.id, cb = h("input", { type: "checkbox", id: cid, value: r.id });
        cb.checked = cur.indexOf(r.id) >= 0;
        cb.addEventListener("change", function () { var v = getV().filter(function (x) { return x !== r.id; }); if (cb.checked) v.push(r.id); setV(v); });
        box.append(h("label", { class: "check", for: cid }, cb, " " + A.recordLabel(S.p, r.id)));
      });
      wrap.append(box); return wrap;
    }
    if (f.t === "textarea") { el = h("textarea", { id: id, rows: opts.rows || 4, maxlength: A.LONG_MAX, "aria-describedby": describe, "aria-required": f.req ? "true" : null, placeholder: f.ph || null }); el.value = getV() || ""; }
    else if (f.t === "select" || f.t === "ref") {
      el = h("select", { id: id, "aria-describedby": describe, "aria-required": f.req ? "true" : null }, h("option", { value: "", text: "Choose…" }));
      var choices = f.t === "select" ? f.opts.map(function (o) { return [o, o]; }) : S.p.lists[f.list].map(function (r) { return [r.id, A.recordLabel(S.p, r.id)]; });
      choices.forEach(function (c) { el.append(h("option", { value: c[0], text: c[1] })); });
      el.value = getV() || "";
    } else {
      var type = { date: "date", time: "time", url: "url" }[f.t] || "text";
      el = h("input", { id: id, type: type, maxlength: f.t === "url" ? 500 : A.TEXT_MAX, "aria-describedby": describe, "aria-required": f.req ? "true" : null, placeholder: f.ph || (f.t === "url" ? "https://" : null), autocomplete: "off", spellcheck: f.t === "url" ? "false" : null });
      el.value = getV() || "";
    }
    var err = h("span", { class: "err", id: id + "-e", role: "alert" });
    el.addEventListener(f.t === "select" || f.t === "ref" || f.t === "date" || f.t === "time" ? "change" : "input", function () {
      var v = A.cleanValue(f, el.value);
      if (f.t === "url" && el.value.trim() && !v) { err.textContent = "Only full https:// links are accepted. javascript:, data:, file: and plain http: links are blocked."; el.setAttribute("aria-invalid", "true"); return; }
      err.textContent = ""; el.removeAttribute("aria-invalid"); setV(v); if (opts.onChange) opts.onChange(v);
    });
    if (f.t === "url" && getV()) { /* show the stored link as a safe external link */ }
    wrap = h("div", { class: "field" + (f.t === "textarea" || opts.wide ? " wide" : "") }, h("label", { for: id }, f.l, req), hint, el, err);
    if (f.sensitive) wrap.append(h("span", { class: "hint warn-text", text: "Sensitive: stored unencrypted in this browser. Prefer leaving this blank." }));
    return wrap;
  }

  /* ---------- Form stages ---------- */
  function renderForm(body, st) {
    var data = S.p.forms[st.form];
    st.groups.forEach(function (g) {
      var fs = h("fieldset", { class: "group" }, h("legend", { text: g.title }));
      var grid = h("div", { class: "grid" });
      g.fields.forEach(function (f) { grid.append(control(f, function () { return data[f.k]; }, function (v) { data[f.k] = v; touch(); if (f.k === "eventType") { render(); } })); });
      fs.append(grid); body.append(fs);
    });
    body.append(checklist(st));
  }

  /* ---------- List stages (generic record editor) ---------- */
  function renderList(body, st) {
    var list = st.list, meta = A.LISTS[list], defs = st.fields, recs = S.p.lists[list];
    var fkey = list, flt = S.filters[fkey] = S.filters[fkey] || { q: "" };
    var tools = h("div", { class: "toolbar", role: "group", "aria-label": "List tools" });
    tools.append(h("button", { class: "btn", type: "button", onclick: function () {
      var r = A.newRecord(S.p, list); if (!r) { A.announce("Record limit reached (500)."); return; }
      S.open[r.id] = true; touch(); render(); var el = document.querySelector("[data-rec='" + r.id + "'] input, [data-rec='" + r.id + "'] select, [data-rec='" + r.id + "'] textarea"); if (el) el.focus(); A.announce(r.id + " added.");
    } }, "Add " + meta.noun));
    if (st.sort) tools.append(h("button", { class: "btn alt", type: "button", onclick: function () { S.p.lists[list] = A.chrono(recs); touch(); render(); A.announce("Sorted chronologically."); } }, "Sort chronologically"));
    if (list === "timeline") tools.append(h("button", { class: "btn alt", type: "button", onclick: function () { A.download(fileBase() + "-timeline.csv", A.sectionCSV.timeline(S.p), "text/csv"); } }, "Export timeline (CSV)"));
    body.append(tools);
    /* Filters */
    var filterFields = defs.filter(function (f) { return f.filter; });
    var fbar = h("div", { class: "filters", role: "search", "aria-label": "Filter " + meta.noun + " records" });
    var qid = "q-" + list, qi = h("input", { id: qid, type: "search", maxlength: 100, autocomplete: "off" }); qi.value = flt.q;
    qi.addEventListener("input", function () { flt.q = qi.value; drawRecords(); });
    fbar.append(h("div", { class: "field" }, h("label", { for: qid, text: "Search these records" }), qi));
    filterFields.forEach(function (f) {
      var vals = f.t === "select" ? f.opts : recs.map(function (r) { return r[f.k]; }).filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
      var sid = "flt-" + list + "-" + f.k, sel = h("select", { id: sid }, h("option", { value: "", text: "All" }), vals.map(function (v) { return h("option", { value: v, text: v }); }));
      sel.value = flt[f.k] || ""; sel.addEventListener("change", function () { flt[f.k] = sel.value; drawRecords(); });
      fbar.append(h("div", { class: "field" }, h("label", { for: sid, text: f.l }), sel));
    });
    body.append(fbar);
    var count = h("p", { class: "muted", role: "status" }), holder = h("div", { class: "records" });
    body.append(count, holder);
    function drawRecords() {
      A.clear(holder);
      var q = flt.q.trim().toLowerCase();
      var shown = recs.filter(function (r) {
        if (filterFields.some(function (f) { return flt[f.k] && r[f.k] !== flt[f.k]; })) return false;
        if (!q) return true;
        return (r.id + " " + defs.map(function (f) { return Array.isArray(r[f.k]) ? r[f.k].join(" ") : r[f.k]; }).join(" ")).toLowerCase().indexOf(q) >= 0;
      });
      count.textContent = recs.length ? "Showing " + shown.length + " of " + recs.length + " " + meta.noun + " records." : "No " + meta.noun + " records yet. Use \"Add " + meta.noun + "\" to create the first one.";
      shown.forEach(function (r) { holder.append(recordCard(st, r)); });
    }
    drawRecords();
    body.append(checklist(st));
  }

  function recordCard(st, r) {
    var list = st.list, meta = A.LISTS[list], defs = st.fields;
    var summaryText = h("span", { class: "rec-title" }), badges = h("span", { class: "badges" });
    function refreshSummary() {
      summaryText.textContent = r[meta.title] || "(untitled " + meta.noun + ")";
      A.clear(badges);
      defs.filter(function (f) { return f.t === "select" && r[f.k] && ["category", "status", "priority", "type", "label", "framework", "reliability", "significance", "interview"].indexOf(f.k) >= 0; })
        .forEach(function (f) { badges.append(h("span", { class: "badge b-" + A.slug(r[f.k]) }, h("span", { class: "sr-only", text: f.l + ": " }), r[f.k])); });
      var ok = defs.filter(function (f) { return f.req; }).every(function (f) { return Array.isArray(r[f.k]) ? r[f.k].length : String(r[f.k] || "").trim(); });
      badges.append(h("span", { class: "badge " + (ok ? "b-ok" : "b-todo"), text: ok ? "✓ Required fields complete" : "Required fields missing" }));
    }
    refreshSummary();
    var det = h("details", { class: "record", dataset: { rec: r.id } }, h("summary", null, h("span", { class: "rec-id", text: r.id }), " ", summaryText, " ", badges));
    if (S.open[r.id]) det.open = true;
    det.addEventListener("toggle", function () { S.open[r.id] = det.open; });
    var grid = h("div", { class: "grid" });
    defs.forEach(function (f) { grid.append(control(f, function () { return r[f.k]; }, function (v) { r[f.k] = v; touch(); refreshSummary(); })); });
    det.append(grid);
    if (list === "evidence" && r.link) det.append(h("p", null, "Link: ", A.ext(r.link, r.link.length > 60 ? r.link.slice(0, 60) + "…" : r.link)));
    if (list === "findings") {
      var qs = h("fieldset", { class: "field wide quality" }, h("legend", { text: "Finding quality checklist" }));
      st.quality.forEach(function (q, i) {
        var cid = "q-" + r.id + "-" + i, cb = h("input", { type: "checkbox", id: cid }); cb.checked = r.quality.indexOf(i) >= 0;
        cb.addEventListener("change", function () { r.quality = r.quality.filter(function (x) { return x !== i; }); if (cb.checked) r.quality.push(i); touch(); });
        qs.append(h("label", { class: "check", for: cid }, cb, " " + q));
      });
      det.append(qs, traceView(r));
    }
    det.append(h("div", { class: "rec-actions" }, h("button", { class: "btn danger", type: "button", onclick: function () {
      var refs = A.referencesTo(S.p, r.id);
      var msg = "Delete " + r.id + "?" + (refs.length ? "\n\nIt is linked from: " + refs.join(", ") + ". Those links will be removed." : "") + "\n\nThis cannot be undone (except from a backup).";
      if (!window.confirm(msg)) return;
      S.p.lists[list] = S.p.lists[list].filter(function (x) { return x.id !== r.id; }); A.removeReferences(S.p, r.id); touch(); render(); A.announce(r.id + " deleted.");
    } }, "Delete " + r.id)));
    return det;
  }

  function traceView(fnd) {
    var t = A.trace(S.p, fnd), row = function (label, arr) { return h("li", null, h("strong", { text: label + ": " }), arr.length ? arr.join(", ") : "none linked"); };
    return h("div", { class: "trace" }, h("h2", { class: "h-small", text: "Traceability chain" }),
      h("ol", { class: "chain" }, row("Objectives", t.objectives), row("Observations", t.observations), row("Evidence", t.evidence), h("li", null, h("strong", { text: "Finding: " }), fnd.id),
        row("Lessons", t.lessons), row("Recommendations", t.recommendations),
        h("li", null, h("strong", { text: "Corrective actions: " }), t.actions.length ? t.actions.map(function (a) { return a.id + " (owner: " + (a.owner || "unassigned") + ", due: " + (a.due ? A.fmtDate(a.due) : "no date") + ", " + (a.status || "no status") + (a.verification ? ", verified by: " + a.verification.slice(0, 60) : "") + ")"; }).join("; ") : "none linked")));
  }

  /* ---------- Analysis ---------- */
  function renderAnalysis(body, st) {
    var data = S.p.forms.analysis;
    var fs = h("fieldset", { class: "group" }, h("legend", { text: "Analysis prompts" }), h("p", { class: "hint", text: "Answer for the review as a whole. Short answers are fine; say \"Unknown\" when the evidence does not tell you." }));
    var grid = h("div", { class: "grid" });
    st.prompts.forEach(function (q, i) { var f = { k: "p" + i, l: q, t: "textarea" }; grid.append(control(f, function () { return data[f.k]; }, function (v) { data[f.k] = v; touch(); }, { rows: 2 })); });
    fs.append(grid); body.append(fs);
    if (A.FRAMEWORKS) body.append(h("details", { class: "panel" }, h("summary", { text: "Analytical frameworks: what they are and when to use them" }),
      A.FRAMEWORKS.map(function (fw) {
        return h("details", { class: "subpanel" }, h("summary", { text: fw.name }),
          h("p", { text: fw.explanation }), h("p", null, h("strong", { text: "When to use it: " }), fw.when),
          h("h4", { text: "Instructions" }), h("ol", null, fw.steps.map(function (s) { return h("li", { text: s }); })),
          h("h4", { text: "Example" }), h("p", { text: fw.example }),
          fw.resources && fw.resources.length ? h("p", null, "Reference: ", resLinks(fw.resources)) : null,
          h("p", null, h("a", { href: "library.html#templates/" + (fw.template || "rca"), text: "Printable worksheet" })));
      })));
    body.append(h("h2", { text: "Analysis worksheets" }), h("p", { class: "note-box", text: "The compiler never declares a root cause. Each worksheet records your reasoning, the evidence you relied on, and your confidence. Low confidence is an honest and acceptable answer." }));
    renderList(body, st);
  }

  /* ---------- Improvement Plan dashboard ---------- */
  function statTable(caption, obj) {
    var keys = Object.keys(obj); if (!keys.length) return null;
    return h("table", { class: "stat" }, h("caption", { text: caption }), h("tbody", null, keys.map(function (k) { return h("tr", null, h("th", { scope: "row", text: k }), h("td", { text: String(obj[k]) })); })));
  }
  function renderIPDashboard(body) {
    var s = A.ipStats(S.p);
    var box = h("section", { class: "ip-dash", "aria-labelledby": "ipd", "aria-live": "polite" }, h("h2", { id: "ipd", text: "Improvement Plan dashboard" }));
    box.append(h("ul", { class: "kpis" },
      h("li", null, h("span", { class: "kpi", text: String(s.total) }), " total actions"),
      h("li", null, h("span", { class: "kpi", text: String(s.overdue.length) }), " overdue"),
      h("li", null, h("span", { class: "kpi", text: String(s.upcoming.length) }), " due in the next 30 days"),
      h("li", null, h("span", { class: "kpi", text: String(s.completed) }), " completed"),
      h("li", null, h("span", { class: "kpi", text: String(s.verified) }), " verified or closed")));
    box.append(h("div", { class: "stat-grid" }, statTable("Actions by priority", s.priority), statTable("Actions by status", s.status), statTable("Actions by organization", s.org)));
    if (s.overdue.length) box.append(h("div", { class: "warning", role: "note" }, h("strong", { text: "Overdue: " }), s.overdue.map(function (a) { return a.id + " " + a.title + " (due " + A.fmtDate(a.due) + ")"; }).join("; ")));
    if (s.upcoming.length) box.append(h("p", null, h("strong", { text: "Upcoming deadlines: " }), s.upcoming.map(function (a) { return a.id + " " + A.fmtDate(a.due); }).join("; ")));
    box.append(h("div", { class: "toolbar" },
      h("button", { class: "btn alt", type: "button", onclick: function () { A.download(fileBase() + "-improvement-plan.csv", A.sectionCSV.actions(S.p), "text/csv"); } }, "Export Improvement Plan (CSV)"),
      h("button", { class: "btn alt", type: "button", onclick: function () { A.download(fileBase() + "-improvement-plan.md", A.renderReportMD(A.buildReport(S.p, ["cover", "improvement"])), "text/markdown"); } }, "Export Improvement Plan (Markdown)"),
      h("button", { class: "btn alt", type: "button", onclick: function () { printBlocks(["cover", "improvement"]); } }, "Print Improvement Plan")));
    body.append(box);
  }

  /* ---------- Report assembly ---------- */
  function sections() { return S.p.sections || A.REPORT_PRESETS[S.p.forms.report.preset] || A.REPORT_PRESETS["Comprehensive AAR"]; }
  function renderReportStage(body, st) {
    var data = S.p.forms.report, preview = h("div", { class: "preview", id: "preview", tabindex: "0", role: "region", "aria-label": "Report preview" });
    function redraw() { A.clear(preview).append(A.renderReportDOM(A.buildReport(S.p, sections()), 1)); }
    var presetF = st.fields[0];
    body.append(h("div", { class: "grid" }, control(presetF, function () { return data.preset; }, function (v) { data.preset = v || "Comprehensive AAR"; S.p.sections = null; touch(); render(); })));
    var fs = h("fieldset", { class: "group" }, h("legend", { text: "Sections to include" }), h("p", { class: "hint", text: "The preset sets these; you can change any of them." }));
    var box = h("div", { class: "checks cols" }), cur = sections();
    A.REPORT_SECTIONS.forEach(function (sc) {
      var cid = "sec-" + sc[0], cb = h("input", { type: "checkbox", id: cid }); cb.checked = cur.indexOf(sc[0]) >= 0;
      cb.addEventListener("change", function () { var s = sections().slice(); s = s.filter(function (x) { return x !== sc[0]; }); if (cb.checked) s.push(sc[0]);
        S.p.sections = A.REPORT_SECTIONS.map(function (x) { return x[0]; }).filter(function (k) { return s.indexOf(k) >= 0; }); touch(); redraw(); });
      box.append(h("label", { class: "check", for: cid }, cb, " " + sc[1]));
    });
    fs.append(box); body.append(fs);
    var nf = h("fieldset", { class: "group" }, h("legend", { text: "Narrative sections" })), grid = h("div", { class: "grid" });
    st.fields.slice(1).forEach(function (f) { grid.append(control(f, function () { return data[f.k]; }, function (v) { data[f.k] = v; touch(); clearTimeout(S.pv); S.pv = setTimeout(redraw, 400); }, { rows: f.k === "execSummary" ? 7 : 4 })); });
    nf.append(grid); body.append(nf);
    body.append(h("div", { class: "toolbar" }, h("button", { class: "btn", type: "button", onclick: function () { printBlocks(sections()); } }, "Print or save as PDF"),
      h("a", { class: "btn alt", href: "#s=export", text: "More export formats (Stage 17)" })));
    body.append(h("h2", { text: "Report preview" }), preview);
    redraw();
    body.append(checklist(st));
  }
  function printBlocks(secs) {
    var area = $("print-area"); A.clear(area).append(A.renderReportDOM(A.buildReport(S.p, secs)));
    document.body.classList.add("printing");
    var done = function () { document.body.classList.remove("printing"); A.clear(area); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(function () { if (document.body.classList.contains("printing")) done(); }, 60000);
  }

  /* ---------- Quality control ---------- */
  function renderQC(body) {
    var checks = A.qcChecks(S.p), groups = [], passed = checks.filter(function (c) { return c.ok; }).length;
    checks.forEach(function (c) { if (groups.indexOf(c.group) < 0) groups.push(c.group); });
    body.append(h("p", { class: "note-box" }, h("strong", { text: passed + " of " + checks.length + " checks passed. " }), "These checks measure completeness and linkage. They cannot tell you whether the report is correct; that judgment belongs to the review team and its reviewers."));
    groups.forEach(function (g) {
      var ul = h("ul", { class: "qc-list" });
      checks.filter(function (c) { return c.group === g; }).forEach(function (c) {
        var st = A.stageByKey(c.stage), manualIdx = -1;
        A.QC_MANUAL.forEach(function (m, i) { if (c.label.indexOf(m[0]) === 0) manualIdx = i; });
        var li = h("li", { class: c.ok ? "ok" : "todo" }, h("span", { class: "qc-mark", "aria-hidden": "true", text: c.ok ? "✓" : "✗" }), h("span", { class: "sr-only", text: c.ok ? "Passed: " : "Missing: " }), c.label);
        if (manualIdx >= 0) {
          var cid = "qcm-" + manualIdx, cb = h("input", { type: "checkbox", id: cid }); cb.checked = c.ok;
          cb.addEventListener("change", function () { if (cb.checked) S.p.qc[cid] = true; else delete S.p.qc[cid]; touch(); render(); });
          li.append(" ", h("label", { class: "check inline", for: cid }, cb, " A person has done this"));
        } else if (!c.ok) {
          if (c.detail) li.append(h("span", { class: "qc-detail", text: " " + c.detail }));
          if (st) li.append(" ", h("a", { href: "#s=" + st.key, text: "Go to Stage " + st.num + ": " + st.title }));
        }
        ul.append(li);
      });
      body.append(h("h2", { text: g }), ul);
    });
    var issues = A.integrity(S.p);
    body.append(h("h2", { text: "Data integrity" }), issues.length ? h("ul", { class: "qc-list" }, issues.map(function (x) { return h("li", { class: "todo", text: x }); })) : h("p", { text: "No duplicate IDs or broken links found." }));
    body.append(h("h2", { text: "Traceability" }));
    if (!S.p.lists.findings.length) body.append(h("p", { class: "muted", text: "Add findings in Stage 11 to see their traceability chains." }));
    else body.append(h("div", { class: "r-tablewrap" }, h("table", { class: "trace-table" },
      h("thead", null, h("tr", null, ["Finding", "Objectives", "Observations", "Evidence", "Lessons", "Recommendations", "Actions (owner, due)"].map(function (x) { return h("th", { scope: "col", text: x }); }))),
      h("tbody", null, S.p.lists.findings.map(function (fd) { var t = A.trace(S.p, fd);
        return h("tr", null, h("th", { scope: "row", text: fd.id }), [t.objectives, t.observations, t.evidence, t.lessons, t.recommendations].map(function (a) { return h("td", { text: a.length ? a.join(", ") : "None" }); }),
          h("td", { text: t.actions.length ? t.actions.map(function (a) { return a.id + " (" + (a.owner || "no owner") + ", " + (a.due || "no date") + ")"; }).join("; ") : "None" })); })))));
  }

  /* ---------- Export, backup, import, reset ---------- */
  function fileBase() { return "aar-" + A.slug(S.p.forms.setup.aarTitle || S.p.forms.setup.projectTitle || "project"); }
  function downloadBackup() {
    S.p.lastBackup = new Date().toISOString(); S.p.changedSinceBackup = false;
    A.download(fileBase() + "-backup-" + A.today() + ".json", A.backupText(S.p), "application/json");
    A.saveState(S.ack, S.p); renderNav(); A.announce("Backup downloaded.");
  }
  function renderExport(body) {
    body.append(h("div", { class: "warning", role: "note" }, h("strong", { text: "Important: " }), BACKUP_WARN));
    var grp = function (title, btns) { return h("section", { class: "export-group" }, h("h2", { text: title }), h("div", { class: "toolbar" }, btns)); };
    var B = function (label, fn, cls) { return h("button", { class: "btn " + (cls || "alt"), type: "button", onclick: fn }, label); };
    var blocks = function () { return A.buildReport(S.p, sections()); };
    body.append(grp("Save and back up", [B("Save now", function () { if (saveNow()) A.announce("Saved."); }, ""), B("Download JSON backup (full project)", downloadBackup, "")]));
    body.append(h("p", { class: "muted", text: S.p.lastBackup ? "Last backup downloaded " + new Date(S.p.lastBackup).toLocaleString() + (S.p.changedSinceBackup ? ". You have made changes since then." : ". No changes since then.") : "No backup downloaded yet." }));
    body.append(grp("Export the report (uses the sections chosen in Stage 15)", [
      B("Export HTML", function () { A.download(fileBase() + ".html", A.renderReportHTMLDoc(blocks(), S.p.forms.setup.aarTitle || "After-Action Report"), "text/html"); }),
      B("Export Markdown", function () { A.download(fileBase() + ".md", A.renderReportMD(blocks()), "text/markdown"); }),
      B("Export plain text", function () { A.download(fileBase() + ".txt", A.renderReportTXT(blocks()), "text/plain"); }),
      B("Print report", function () { printBlocks(sections()); }),
      B("Print Improvement Plan", function () { printBlocks(["cover", "improvement"]); })]));
    body.append(grp("Export individual sections (CSV opens in any spreadsheet)", [
      B("Timeline", function () { A.download(fileBase() + "-timeline.csv", A.sectionCSV.timeline(S.p), "text/csv"); }),
      B("Findings", function () { A.download(fileBase() + "-findings.csv", A.sectionCSV.findings(S.p), "text/csv"); }),
      B("Lessons learned", function () { A.download(fileBase() + "-lessons.csv", A.sectionCSV.lessons(S.p), "text/csv"); }),
      B("Corrective actions", function () { A.download(fileBase() + "-corrective-actions.csv", A.sectionCSV.actions(S.p), "text/csv"); })]));
    body.append(importPanel(true));
    body.append(h("section", { class: "export-group danger-zone" }, h("h2", { text: "Reset project" }),
      h("p", { text: "Deletes this project from this browser. Download a backup first if you might need it." }),
      h("div", { class: "toolbar" }, B("Download backup, then reset", function () { downloadBackup(); resetProject(); }, "danger"), B("Reset without backup", resetProject, "danger"))));
  }
  function resetProject() {
    if (!window.confirm("Delete this project from this browser? This cannot be undone without a backup.")) return;
    S.p = null; A.clearState(); S.ack = false; S.open = {}; S.filters = {}; location.hash = ""; render(); A.announce("Project deleted from this browser.");
  }
  function importPanel(existing) {
    var id = "imp-" + (++uid), input = h("input", { type: "file", id: id, accept: ".json,application/json" }), out = h("div", { class: "import-out", role: "status" });
    input.addEventListener("change", function () {
      var file = input.files[0]; input.value = ""; A.clear(out); if (!file) return;
      out.append(h("p", { text: "Checking " + file.name + "…" }));
      A.readImportFile(file).then(function (res) {
        var p = res.project, s = p.forms.setup; A.clear(out);
        out.append(h("h3", { text: "Import preview" }),
          h("dl", { class: "r-kv" }, [["Title", s.aarTitle || s.projectTitle || "(untitled)"], ["Event", s.eventName || "(none)"], ["Last modified", new Date(p.modified).toLocaleString()],
            ["Records", Object.keys(p.lists).map(function (l) { return p.lists[l].length + " " + l; }).join(", ")]].map(function (r) { return [h("dt", { text: r[0] }), h("dd", { text: r[1] })]; })));
        if (res.notes.length) out.append(h("div", { class: "warning" }, h("strong", { text: "Cleaned during import: " }), h("ul", null, res.notes.map(function (n) { return h("li", { text: n }); }))));
        if (S.p && existing) out.append(h("p", { class: "warning", text: "Importing replaces the project currently in this browser. Your current project is unchanged until you confirm." }),
          h("div", { class: "toolbar" }, h("button", { class: "btn alt", type: "button", onclick: downloadBackup }, "Back up current project first")));
        out.append(h("div", { class: "toolbar" }, h("button", { class: "btn", type: "button", onclick: function () {
          if (S.p && !window.confirm("Replace the current project with the imported one?")) return;
          S.p = p; S.ack = true; S.open = {}; S.filters = {}; saveNow(); A.announce("Project imported."); go("dashboard");
        } }, "Use this project"), h("button", { class: "btn alt", type: "button", onclick: function () { A.clear(out); A.announce("Import cancelled."); } }, "Cancel")));
      }, function (err) { A.clear(out); out.append(h("p", { class: "error", role: "alert", text: "Import failed: " + err.message })); });
    });
    return h("section", { class: "export-group" }, h("h2", { text: "Restore from a backup" }),
      h("p", { text: "Choose a .json backup made by this tool (2 MB maximum). The file is checked and cleaned, and you will see a preview before anything changes. Nothing is uploaded." }),
      h("div", { class: "field" }, h("label", { for: id, text: "Backup file (.json)" }), input), out);
  }

  /* ---------- Dashboard ---------- */
  function renderDashboard(main) {
    var p = S.p, pr = A.progress(p), s = A.ipStats(p), L = p.lists;
    var done = A.STAGES.filter(function (x) { return x.num && A.stageStatus(p, x.key) === "done"; }), todo = A.STAGES.filter(function (x) { return x.num && A.stageStatus(p, x.key) !== "done"; });
    var next = todo[0] || A.stageByKey("export");
    main.append(h("section", { class: "dash" },
      h("ul", { class: "kpis" },
        h("li", null, h("span", { class: "kpi", text: pr.pct + "%" }), " stages complete"),
        h("li", null, h("span", { class: "kpi", text: String(L.observations.length) }), " observations"),
        h("li", null, h("span", { class: "kpi", text: String(L.findings.length) }), " findings"),
        h("li", null, h("span", { class: "kpi", text: String(L.lessons.length) }), " lessons"),
        h("li", null, h("span", { class: "kpi", text: String(L.recommendations.length) }), " recommendations"),
        h("li", null, h("span", { class: "kpi", text: String(L.actions.length) }), " corrective actions"),
        h("li", null, h("span", { class: "kpi", text: String(s.overdue.length) }), " overdue actions")),
      h("p", null, h("strong", { text: "Suggested next stage: " }), "Stage " + next.num + ": " + next.title + ". ", h("a", { class: "btn", href: "#s=" + next.key, text: "Continue AAR" })),
      h("div", { class: "toolbar" }, [["observations", "View observations"], ["findings", "View findings"], ["lessons", "View lessons"], ["improvement", "View Improvement Plan"], ["report", "Assemble report"], ["export", "Export project"]]
        .map(function (x) { return h("a", { class: "btn alt", href: "#s=" + x[0], text: x[1] }); })),
      h("div", { class: "two-col" },
        h("section", null, h("h2", { text: "Completed stages (" + done.length + ")" }), done.length ? h("ul", null, done.map(function (x) { return h("li", null, h("a", { href: "#s=" + x.key, text: x.num + ". " + x.title })); })) : h("p", { class: "muted", text: "None yet." })),
        h("section", null, h("h2", { text: "Incomplete stages (" + todo.length + ")" }), todo.length ? h("ul", null, todo.map(function (x) { return h("li", null, h("a", { href: "#s=" + x.key, text: x.num + ". " + x.title }), " (" + (A.stageStatus(p, x.key) === "partial" ? "in progress" : "not started") + ")"); })) : h("p", { text: "All stages complete." }))),
      h("section", null, h("h2", { text: "Deadlines" }),
        s.overdue.length ? h("p", { class: "warning" }, h("strong", { text: "Overdue: " }), s.overdue.map(function (a) { return a.id + " " + a.title + " (" + A.fmtDate(a.due) + ")"; }).join("; ")) : h("p", { text: "No overdue corrective actions." }),
        s.upcoming.length ? h("p", null, h("strong", { text: "Due in the next 30 days: " }), s.upcoming.map(function (a) { return a.id + " (" + A.fmtDate(a.due) + ")"; }).join("; ")) : h("p", { class: "muted", text: "Nothing due in the next 30 days." })),
      h("div", { class: "warning", role: "note" }, h("strong", { text: "Reminder: " }), BACKUP_WARN, " ", h("a", { href: "#s=export", text: "Download a backup" }))));
  }

  /* ---------- Shared stage parts ---------- */
  function checklist(st) {
    if (!st.checklist) return null;
    var fs = h("fieldset", { class: "group checklist" }, h("legend", { text: "Stage checklist" }), h("p", { class: "hint", text: "Tick each item when you have done it. These are reminders for you; they do not change the stage status." }));
    st.checklist.forEach(function (c, i) {
      var key = st.key + "-" + i, cid = "ck-" + key, cb = h("input", { type: "checkbox", id: cid }); cb.checked = S.p.qc[key] === true;
      cb.addEventListener("change", function () { if (cb.checked) S.p.qc[key] = true; else delete S.p.qc[key]; touch(); });
      fs.append(h("label", { class: "check", for: cid }, cb, " " + c));
    });
    return fs;
  }
  function resLinks(ids) {
    return (ids || []).map(function (rid, i) { var r = (A.RESOURCES || []).filter(function (x) { return x.id === rid; })[0]; if (!r) return null;
      return [i ? "; " : "", A.ext(r.url, r.title)]; });
  }
  function sideRefs(st) {
    var box = h("aside", { class: "refs-box", "aria-label": "Related material for this stage" });
    var tpl = (st.templates || []).map(function (k) { var t = (A.TEMPLATES || []).filter(function (x) { return x.key === k; })[0]; return t ? h("li", null, h("a", { href: "library.html#templates/" + k, text: t.title })) : null; }).filter(Boolean);
    var kn = (st.knowledge || []).map(function (k) { var a = (A.KNOWLEDGE || []).filter(function (x) { return x.slug === k; })[0]; return a ? h("li", null, h("a", { href: "library.html#knowledge/" + k, text: a.title })) : null; }).filter(Boolean);
    var rs = (st.resources || []).map(function (k) { var r = (A.RESOURCES || []).filter(function (x) { return x.id === k; })[0]; return r ? h("li", null, A.ext(r.url, r.title), h("span", { class: "badge b-unverified", text: r.verified ? "Verified " + r.verified : "Link not yet verified" })) : null; }).filter(Boolean);
    if (kn.length) box.append(h("h2", { text: "Learn more" }), h("ul", null, kn));
    if (tpl.length) box.append(h("h2", { text: "Related templates" }), h("ul", null, tpl));
    if (rs.length) box.append(h("h2", { text: "Official resources" }), h("ul", null, rs), h("p", { class: "hint", text: "Official resources open the agency's website in a new tab." }));
    if (st.example) box.append(h("h2", { text: st.example.title }), h("div", { class: "example" }, st.example.lines.map(function (l) { return h("p", { text: l }); })));
    return box;
  }
  function pager(st) {
    var i = A.STAGES.indexOf(st), prev = A.STAGES[i - 1], next = A.STAGES[i + 1];
    return h("nav", { class: "pager", "aria-label": "Stage navigation" },
      prev ? h("a", { class: "btn alt", href: "#s=" + prev.key, rel: "prev" }, "← " + (prev.num ? "Stage " + prev.num + ": " : "") + prev.title) : h("span"),
      next ? h("a", { class: "btn", href: "#s=" + next.key, rel: "next" }, (next.num ? "Stage " + next.num + ": " : "") + next.title + " →") : h("span"));
  }

  /* ---------- Intro (no project yet) ---------- */
  function renderIntro(main) {
    document.title = "AAR Compiler | After-Action Review Compiler";
    main.append(h("nav", { class: "breadcrumb", "aria-label": "Breadcrumb" }, h("ol", null, h("li", null, h("a", { href: "index.html", text: "Home" })), h("li", { "aria-current": "page", text: "AAR Compiler" }))),
      h("header", { class: "stage-head" }, h("h1", { text: "AAR Compiler" }), h("p", { class: "purpose", text: "A guided, 17-stage workflow that helps you compile an evidence-supported After-Action Review and Improvement Plan, and assembles the report for you." })));
    if (!A.storageAvailable()) main.append(h("div", { class: "warning", role: "alert" }, h("strong", { text: "Browser storage is unavailable. " }), "You can still work, but nothing will be saved when you close this tab. Download JSON backups often."));
    var ackId = "ack", cb = h("input", { type: "checkbox", id: ackId }), start = h("button", { class: "btn", type: "button", disabled: true }, "Start a new AAR");
    cb.addEventListener("change", function () { start.disabled = !cb.checked; });
    start.addEventListener("click", function () { if (!cb.checked) return; S.ack = true; S.p = A.blankProject(); saveNow(); A.announce("New project created."); go("setup"); });
    main.append(h("section", { class: "privacy-gate", "aria-labelledby": "pg-h" },
      h("h2", { id: "pg-h", text: "Before you begin: privacy and storage" }),
      h("p", { class: "warning", text: WARN }),
      h("ul", null,
        h("li", { text: "This is a public static website. The compiler is not a secure document management system." }),
        h("li", { text: "Your project stays in this browser (localStorage). It is never sent to this website or anyone else." }),
        h("li", { text: "LocalStorage is not encrypted. Anyone using this browser profile, and some browser extensions, may be able to read it. Avoid shared computers." }),
        h("li", { text: BACKUP_WARN })),
      h("p", null, h("a", { href: "privacy.html", text: "Read the privacy page" }), " · ", h("a", { href: "security.html", text: "Read the security page" })),
      h("label", { class: "check big", for: ackId }, cb, " I understand. I will only enter general, non-sensitive information."),
      h("div", { class: "toolbar" }, start)));
    main.append(importPanel(false));
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var st = A.loadState(); S.ack = st.ack; S.p = st.ack ? st.project : null;
    if (S.p && S.p.stage && !location.hash) history.replaceState(null, "", "#s=" + (S.p.stage === "setup" && A.progress(S.p).done > 0 ? "dashboard" : S.p.stage));
    S.focusHeading = false;
    render();
    if (st.notes.length) A.announce(st.notes.join(" "));
  });
})();
