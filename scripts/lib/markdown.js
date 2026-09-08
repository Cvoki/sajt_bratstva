"use strict";

/* Мали Markdown -> HTML претварач, без спољних зависности.
   Покрива подскуп који Decap-ов markdown widget производи за вести:
   пасуси, преломи реда, наслови, подебљано/курзив, `код`, линкови,
   слике, листе (обичне и нумерисане), цитат, хоризонтална линија.

   Сигурносни модел: цео улаз се прво HTML-escape-ује, па се тек онда
   уводи бела листа тагова. Ниједан сиров HTML из текста вести не пролази. */

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// дозвољене су само http(s), mailto и релативне путање (/, #, ./ ...)
function safeUrl(u) {
  u = String(u == null ? "" : u).trim().replace(/\s+/g, "");
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) {
    return /^(https?|mailto):/i.test(u) ? u : null;
  }
  return u || null;
}

function inline(text) {
  var out = esc(text);

  // слике: ![alt](src)  -- пре линкова
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, function (m, alt, src) {
    var u = safeUrl(src);
    return u ? '<img loading="lazy" src="' + esc(u) + '" alt="' + esc(alt) + '">' : esc(alt);
  });

  // линкови: [text](href)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, function (m, label, href) {
    var u = safeUrl(href);
    if (!u) return label;
    var ext = /^https?:/i.test(u);
    return '<a href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + label + "</a>";
  });

  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, "<strong>$2</strong>");
  out = out.replace(/(^|[^*_])([*_])(?=\S)([^*_]*?\S)\2(?!\2)/g, "$1<em>$3</em>");

  return out;
}

function renderMarkdown(md) {
  var src = String(md == null ? "" : md).replace(/\r\n?/g, "\n").trim();
  if (!src) return "";

  var blocks = src.split(/\n{2,}/);
  var html = [];

  blocks.forEach(function (block) {
    var lines = block.split("\n");

    if (lines.length === 1 && /^#{1,6}\s+/.test(lines[0])) {
      var level = lines[0].match(/^#+/)[0].length;
      var tag = level <= 2 ? "h4" : "h5";
      html.push("<" + tag + ">" + inline(lines[0].replace(/^#{1,6}\s+/, "")) + "</" + tag + ">");
      return;
    }

    if (/^([-*_])\1{2,}\s*$/.test(block.trim())) {
      html.push("<hr>");
      return;
    }

    if (lines.every(function (l) { return /^\s*[-*+]\s+/.test(l); })) {
      html.push("<ul>" + lines.map(function (l) {
        return "<li>" + inline(l.replace(/^\s*[-*+]\s+/, "")) + "</li>";
      }).join("") + "</ul>");
      return;
    }

    if (lines.every(function (l) { return /^\s*\d+\.\s+/.test(l); })) {
      html.push("<ol>" + lines.map(function (l) {
        return "<li>" + inline(l.replace(/^\s*\d+\.\s+/, "")) + "</li>";
      }).join("") + "</ol>");
      return;
    }

    if (lines.every(function (l) { return /^\s*>\s?/.test(l); })) {
      var quoted = lines.map(function (l) { return l.replace(/^\s*>\s?/, ""); }).join("\n");
      html.push("<blockquote>" + inline(quoted).replace(/\n/g, "<br>") + "</blockquote>");
      return;
    }

    html.push("<p>" + inline(block).replace(/\n/g, "<br>") + "</p>");
  });

  return html.join("\n");
}

// голи текст (за опис/excerpt и og:description)
function stripToText(md) {
  return String(md == null ? "" : md)
    .replace(/\r\n?/g, "\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(md, max) {
  max = max || 180;
  var t = stripToText(md);
  if (t.length <= max) return t;
  var cut = t.slice(0, max);
  var sp = cut.lastIndexOf(" ");
  if (sp > max * 0.5) cut = cut.slice(0, sp);
  return cut.replace(/[\s.,;:!?)\]]+$/, "") + "…";
}

module.exports = {
  renderMarkdown: renderMarkdown,
  stripToText: stripToText,
  excerpt: excerpt,
  esc: esc,
  safeUrl: safeUrl,
};
