/* AAR Compiler & Knowledge Center — js/store.js
   Project model, local storage, backups and import validation.

   STORAGE: one localStorage key ("aarc.v1") holds { ack, project }. LocalStorage is NOT encrypted and is readable by any
   script on this site's origin. Only non-sensitive project data belongs here (see privacy.html).
   IMPORT: files are size-checked, parsed with JSON.parse only, then rebuilt field by field from the schema in stages.js.
   Unknown properties, wrong types, bad IDs, duplicate IDs and over-long values never survive. Nothing imported is ever
   treated as HTML or code. */
(function () {
  "use strict";
  var A = window.AAR;
  var KEY = "aarc.v1", FORMAT = "aar-compiler-project", SCHEMA = 1;
  var MAX_IMPORT = 2 * 1024 * 1024, MAX_RECORDS = 500;
  var ID_RE = /^[A-Z]{2,3}-\d{1,5}$/;
  var has = function (o, k) { return o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k); };
  var own = function (o, k) { return has(o, k) ? o[k] : undefined; };

  /* ---- Schema helpers ---- */
  function formDefs(form) {
    if (form === "analysis") {
      var st = A.stageByKey("analysis");
      return st.prompts.map(function (q, i) { return { k: "p" + i, l: q, t: "textarea" }; });
    }
    return A.formFields(form);
  }
  var FORMS = ["setup", "scope", "overview", "analysis", "report"];
  function cleanValue(f, v) {
    if (f.t === "refs") return (Array.isArray(v) ? v : []).filter(function (x) { return typeof x === "string" && ID_RE.test(x); }).slice(0, 200)
      .filter(function (x, i, a) { return a.indexOf(x) === i; });
    if (f.t === "ref") return typeof v === "string" && ID_RE.test(v) ? v : "";
    if (typeof v !== "string") return "";
    if (f.t === "textarea") return A.clean(v, A.LONG_MAX);
    if (f.t === "date") return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) ? v : "";
    if (f.t === "time") return /^\d{2}:\d{2}$/.test(v) ? v : "";
    if (f.t === "select") return f.opts.indexOf(v) >= 0 ? v : "";
    if (f.t === "url") { var u = A.clean(v, 500).trim(); return !u || A.isHttps(u) ? u : ""; }
    return A.clean(v, A.TEXT_MAX);
  }
  A.cleanValue = cleanValue;

  function blank() {
    var p = { format: FORMAT, schema: SCHEMA, id: "P-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase(),
      created: new Date().toISOString(), modified: new Date().toISOString(), stage: "setup", seq: {}, forms: {}, lists: {}, qc: {}, sections: null, lastBackup: "", changedSinceBackup: true };
    FORMS.forEach(function (fm) { p.forms[fm] = {}; formDefs(fm).forEach(function (f) { p.forms[fm][f.k] = f.t === "refs" ? [] : ""; }); });
    p.forms.report.preset = "Comprehensive AAR";
    Object.keys(A.LISTS).forEach(function (l) { p.lists[l] = []; p.seq[A.LISTS[l].prefix] = 0; });
    return p;
  }
  A.blankProject = blank;

  /* Rebuild a project from untrusted data. Returns { project, notes[] } or throws Error with a plain message. */
  function sanitize(raw) {
    var notes = [];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("The file is not an AAR project.");
    if (own(raw, "format") !== FORMAT) throw new Error("The file is not an AAR Compiler project (format marker missing).");
    if (own(raw, "schema") !== SCHEMA) throw new Error("This project uses schema version " + String(own(raw, "schema")).slice(0, 10) + ", which this version of the site does not support.");
    var p = blank();
    var id = own(raw, "id"); if (typeof id === "string" && /^P-[A-Z0-9]{4,20}$/.test(id)) p.id = id; else notes.push("Project ID was missing or invalid; a new one was assigned.");
    ["created", "modified", "lastBackup"].forEach(function (k) { var v = own(raw, k); if (typeof v === "string" && v.length < 40 && !isNaN(Date.parse(v))) p[k] = v; });
    p.changedSinceBackup = own(raw, "changedSinceBackup") !== false;
    var st = own(raw, "stage"); if (typeof st === "string" && A.stageByKey(st)) p.stage = st;
    var F = own(raw, "forms");
    FORMS.forEach(function (fm) { var src = own(F, fm); formDefs(fm).forEach(function (f) { if (has(src, f.k)) p.forms[fm][f.k] = cleanValue(f, src[f.k]); }); });
    if (!p.forms.report.preset) p.forms.report.preset = "Comprehensive AAR";
    var Ls = own(raw, "lists");
    Object.keys(A.LISTS).forEach(function (l) {
      var arr = own(Ls, l), defs = A.listFields(l), pre = A.LISTS[l].prefix, seen = {}, max = 0, dropped = 0;
      if (arr === undefined) return;
      if (!Array.isArray(arr)) { notes.push("The " + l + " list was not a list and was ignored."); return; }
      if (arr.length > MAX_RECORDS) { notes.push("Only the first " + MAX_RECORDS + " " + l + " records were kept."); arr = arr.slice(0, MAX_RECORDS); }
      arr.forEach(function (r) {
        var rid = own(r, "id");
        if (typeof rid !== "string" || !ID_RE.test(rid) || rid.split("-")[0] !== pre || seen[rid]) { dropped++; return; }
        seen[rid] = 1; max = Math.max(max, +rid.split("-")[1]);
        var rec = { id: rid };
        defs.forEach(function (f) { rec[f.k] = has(r, f.k) ? cleanValue(f, r[f.k]) : (f.t === "refs" ? [] : ""); });
        if (l === "findings") rec.quality = (Array.isArray(own(r, "quality")) ? r.quality : []).filter(function (x) { return Number.isInteger(x) && x >= 0 && x < 8; });
        p.lists[l].push(rec);
      });
      if (dropped) notes.push(dropped + " " + l + " record(s) had a missing, invalid or duplicate ID and were dropped.");
      var sq = own(own(raw, "seq"), pre); p.seq[pre] = Math.max(max, Number.isInteger(sq) && sq >= 0 && sq < 100000 ? sq : 0);
    });
    var qc = own(raw, "qc"); if (qc && typeof qc === "object") Object.keys(qc).slice(0, 300).forEach(function (k) { if (/^[a-z]{2,16}-\d{1,2}$/.test(k) && qc[k] === true) p.qc[k] = true; });
    var sec = own(raw, "sections"); if (Array.isArray(sec)) { var valid = A.REPORT_SECTIONS.map(function (x) { return x[0]; }); p.sections = sec.filter(function (s) { return valid.indexOf(s) >= 0; }); }
    return { project: p, notes: notes };
  }
  A.sanitizeProject = sanitize;

  /* ---- Local storage ---- */
  function readRaw() { try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  A.storageAvailable = function () { try { localStorage.setItem(KEY + ".t", "1"); localStorage.removeItem(KEY + ".t"); return true; } catch (e) { return false; } };
  A.loadState = function () {
    var raw = readRaw(), out = { ack: false, project: null, notes: [] };
    if (!raw || typeof raw !== "object") return out;
    out.ack = raw.ack === true;
    if (raw.project) { try { var r = sanitize(raw.project); out.project = r.project; out.notes = r.notes; } catch (e) { out.notes = ["The saved project could not be read and was not loaded: " + e.message]; } }
    return out;
  };
  A.saveState = function (ack, project) {
    if (project) project.modified = new Date().toISOString();
    var s = JSON.stringify({ ack: !!ack, project: project || null });
    try { localStorage.setItem(KEY, s); return { ok: true, bytes: s.length }; }
    catch (e) { return { ok: false, bytes: s.length, msg: "Could not save to this browser (storage may be full or blocked). Download a JSON backup now." }; }
  };
  A.clearState = function () { try { localStorage.removeItem(KEY); } catch (e) {} };
  A.hasSavedProject = function () { var r = readRaw(); return !!(r && r.project); };
  A.savedTitle = function () { var r = readRaw(); try { return A.clean(r.project.forms.setup.aarTitle || r.project.forms.setup.projectTitle || "", 120); } catch (e) { return ""; } };

  /* ---- Records ---- */
  A.newRecord = function (p, list) {
    if (p.lists[list].length >= MAX_RECORDS) return null;
    var pre = A.LISTS[list].prefix; p.seq[pre] = (p.seq[pre] || 0) + 1;
    var n = p.seq[pre], id = pre + "-" + String(n).padStart(3, "0"), rec = { id: id };
    A.listFields(list).forEach(function (f) { rec[f.k] = f.t === "refs" ? [] : ""; });
    if (list === "findings") rec.quality = [];
    p.lists[list].push(rec); return rec;
  };
  A.findRecord = function (p, id) {
    for (var l in p.lists) for (var i = 0; i < p.lists[l].length; i++) if (p.lists[l][i].id === id) return { list: l, rec: p.lists[l][i] };
    return null;
  };
  /* Every place a record ID is referenced (used to warn before deleting). */
  A.referencesTo = function (p, id) {
    var out = [];
    Object.keys(p.lists).forEach(function (l) {
      var defs = A.listFields(l).filter(function (f) { return f.t === "refs" || f.t === "ref"; });
      p.lists[l].forEach(function (r) { defs.forEach(function (f) { var v = r[f.k]; if (v === id || (Array.isArray(v) && v.indexOf(id) >= 0)) out.push(r.id); }); });
    });
    return out.filter(function (x, i, a) { return a.indexOf(x) === i; });
  };
  A.removeReferences = function (p, id) {
    Object.keys(p.lists).forEach(function (l) {
      var defs = A.listFields(l).filter(function (f) { return f.t === "refs" || f.t === "ref"; });
      p.lists[l].forEach(function (r) { defs.forEach(function (f) { if (f.t === "ref" && r[f.k] === id) r[f.k] = ""; else if (Array.isArray(r[f.k])) r[f.k] = r[f.k].filter(function (x) { return x !== id; }); }); });
    });
  };
  A.recordLabel = function (p, id) {
    var f = A.findRecord(p, id); if (!f) return id + " (missing)";
    var t = f.rec[A.LISTS[f.list].title] || ""; return id + (t ? " " + String(t).slice(0, 70) : "");
  };

  /* ---- Backup files ---- */
  A.backupText = function (p) { return JSON.stringify(p, null, 2); };
  A.readImportFile = function (file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error("No file chosen."));
      if (!/\.json$/i.test(file.name)) return reject(new Error("Choose a .json backup file."));
      if (file.size > MAX_IMPORT) return reject(new Error("The file is larger than 2 MB, which is more than any valid project backup."));
      file.text().then(function (txt) {
        var raw; try { raw = JSON.parse(txt); } catch (e) { return reject(new Error("The file is not valid JSON.")); }
        try { if (depth(raw, 0) > 8) throw new Error("The file is nested more deeply than a project backup can be."); resolve(sanitize(raw)); }
        catch (e) { reject(e); }
      }, function () { reject(new Error("The file could not be read.")); });
    });
  };
  function depth(o, d) { if (d > 8) return d; if (!o || typeof o !== "object") return d; var m = d; for (var k in o) if (has(o, k)) m = Math.max(m, depth(o[k], d + 1)); return m; }
})();
