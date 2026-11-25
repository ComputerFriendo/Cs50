/* AAR Compiler & Knowledge Center — js/dom.js
   Safe DOM helpers shared by every page.
   SECURITY RULES (see security.html):
   - This site never uses innerHTML, outerHTML assignment, insertAdjacentHTML, document.write, eval or new Function.
   - All text goes in through textContent / text nodes, so user text can never become markup or script.
   - Links pass through AAR.safeHref(): only same-site relative links and https:// links are allowed.
   - The CSP on every page also enforces Trusted Types, so an accidental innerHTML would throw instead of running. */
(function () {
  "use strict";
  var A = window.AAR = window.AAR || {};

  /* Frame guard: Neocities cannot send frame-ancestors headers, and a meta CSP cannot either.
     If the page is framed by another site, hide it and try to break out. (Defense in depth only.) */
  if (window.top !== window.self) {
    document.documentElement.classList.add("framed");
    try { window.top.location.href = window.self.location.href; } catch (e) { /* cross-origin: page stays hidden by CSS */ }
  }

  /* Strip control and bidirectional-override characters (used to disguise text) and cap length. */
  A.clean = function (v, max) {
    if (typeof v !== "string") return "";
    return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g, "").slice(0, max || 200);
  };

  /* Only relative same-site links and https:// URLs survive. javascript:, data:, file:, vbscript:, http: and malformed URLs are rejected. */
  A.safeHref = function (u) {
    u = String(u == null ? "" : u).trim();
    if (!u) return "";
    if (/^#[\w\-\/?=&.%()!*'~+,]*$/.test(u)) return u;
    if (/^[\w\-]+\.html(#[\w\-\/?=&.%()!*'~+,]*)?$/.test(u)) return u;
    try { var x = new URL(u); return x.protocol === "https:" && x.hostname ? x.href : ""; } catch (e) { return ""; }
  };
  A.isHttps = function (u) { var s = A.safeHref(u); return !!s && /^https:/.test(s); };
  A.host = function (u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };

  /* h("tag", {attrs}, ...children) builds an element safely. */
  A.h = function (tag, attrs) {
    var el = document.createElement(tag), k, v, i;
    if (attrs) for (k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
      v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k === "href") { var s = A.safeHref(v); if (s) el.setAttribute("href", s); }
      else if (k === "dataset") { for (var d in v) el.dataset[d] = v[d]; }
      else if (k === "style" || k === "src" || k === "srcdoc" || k.slice(0, 2) === "on") continue; /* never set these from data */
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, String(v));
    }
    for (i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  };
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  A.clear = function (el) { while (el && el.firstChild) el.removeChild(el.firstChild); return el; };

  /* External link: https only, new tab with rel="noopener noreferrer", destination shown, labelled as external. */
  A.ext = function (url, text, cls) {
    var s = A.safeHref(url);
    if (!s || !/^https:/.test(s)) return A.h("span", { class: cls || "" }, text);
    return A.h("a", { href: s, target: "_blank", rel: "noopener noreferrer", class: "ext " + (cls || "") },
      text, A.h("span", { class: "ext-host", text: " (" + A.host(s) + ")" }),
      A.h("span", { class: "sr-only", text: ", opens an external site in a new tab" }));
  };

  /* File download from text. Nothing is uploaded; the browser saves the file. */
  A.download = function (name, text, mime) {
    var blob = new Blob([text], { type: (mime || "text/plain") + ";charset=utf-8" });
    var u = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = u; a.download = name; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 1500);
  };

  /* Polite status message for screen readers and sighted users. */
  A.announce = function (msg) {
    var el = document.getElementById("live");
    if (el) { el.textContent = ""; setTimeout(function () { el.textContent = msg; }, 30); }
  };

  A.today = function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  A.fmtDate = function (s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return s || "";
    var p = s.split("-"), M = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return M[+p[1] - 1] + " " + (+p[2]) + ", " + p[0];
  };
  A.slug = function (s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "aar"; };
})();
