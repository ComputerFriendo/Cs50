/* AAR Compiler & Knowledge Center — js/nav.js
   Site header behaviour on every page: mobile menu toggle, header search, current-page marking, home page status.
   The header search never submits anywhere: it opens library.html#search?q=... and searching happens in the browser. */
(function () {
  "use strict";
  var A = window.AAR;
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("menu-btn"), nav = document.getElementById("site-nav");
    if (btn && nav) btn.addEventListener("click", function () { var open = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", String(open)); });
    var form = document.getElementById("site-search");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = A.clean(document.getElementById("site-q").value, 100).trim();
      var target = "library.html#search?q=" + encodeURIComponent(q);
      if (/library\.html$/.test(location.pathname)) location.hash = "search?q=" + encodeURIComponent(q); else location.href = target;
    });
    var page = document.body.getAttribute("data-page");
    document.querySelectorAll("#site-nav a[data-page]").forEach(function (a) { if (a.getAttribute("data-page") === page) a.setAttribute("aria-current", "page"); });

    /* Home page: show "Continue" with the saved project's title, and featured resources from the data files. */
    var cont = document.getElementById("continue-status");
    if (cont) {
      var has = A.hasSavedProject && A.hasSavedProject();
      cont.textContent = has ? "Saved project in this browser: " + (A.savedTitle() || "Untitled AAR project") + "." : "No saved project in this browser yet.";
    }
    var feat = document.getElementById("featured");
    if (feat && A.RESOURCES) {
      var h = A.h, pick = function (arr, k, ids) { return ids.map(function (id) { return arr.filter(function (x) { return x[k] === id; })[0]; }).filter(Boolean); };
      feat.append(
        h("div", { class: "card" }, h("h3", { text: "Official guidance" }), h("ul", null, pick(A.RESOURCES, "id", ["hseep-page", "hseep-doctrine", "nist-800-61r3", "osha-incident"]).map(function (r) { return h("li", null, A.ext(r.url, r.title.split(":")[0])); })),
          h("p", null, h("a", { href: "library.html#guidance", text: "All official guidance" }))),
        h("div", { class: "card" }, h("h3", { text: "Report examples" }), h("ul", null, pick(A.REPORTS, "id", ["fema-2017", "uvalde-cir", "cascadia-2016"]).map(function (r) { return h("li", null, h("a", { href: "library.html#reports?id=" + r.id, text: r.title })); })),
          h("p", null, h("a", { href: "library.html#reports", text: "Browse the report library" }))),
        h("div", { class: "card" }, h("h3", { text: "Templates" }), h("ul", null, pick(A.TEMPLATES, "key", ["charter", "observation", "findings", "improvement-plan"]).map(function (t) { return h("li", null, h("a", { href: "library.html#templates/" + t.key, text: t.title })); })),
          h("p", null, h("a", { href: "library.html#templates", text: "All templates" }))));
    }
  });
})();
