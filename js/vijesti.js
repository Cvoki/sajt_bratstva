/* Братство Чворо — вијести из Google табеле.
   Уредник пише у табелу, сајт је чита и приказује. Без кода, без пријаве. */
(function () {
  "use strict";

  /* ==========================================================
     ⇩⇩⇩  ЗАЛИЈЕПИ ОВДЈЕ ЛИНК ОБЈАВЉЕНЕ GOOGLE ТАБЕЛЕ (CSV)  ⇩⇩⇩
     (Табела → Датотека → Дијели → Објави на вебу → CSV)
     Изгледа овако:
     https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv
     ========================================================== */
  var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1Ip3jb4w5zqk--CqRjhunUARk5rBIm7pH0t0BKwZtTvM/edit?usp=sharing";
  /* ⇧⇧⇧  само залијепи линк између наводника горе  ⇧⇧⇧ */

  var statusEl = document.getElementById("vijesti-status");
  var listEl = document.getElementById("vijesti-lista");
  if (!statusEl || !listEl) return;

  var MJESECI = ["јануар","фебруар","март","април","мај","јун","јул",
                 "август","септембар","октобар","новембар","децембар"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  // нађи вриједност колоне по више могућих назива (ћирилица/латиница)
  function pick(row, names) {
    var keys = Object.keys(row);
    for (var i = 0; i < names.length; i++) {
      for (var j = 0; j < keys.length; j++) {
        if (keys[j].trim().toLowerCase() === names[i]) return row[keys[j]];
      }
    }
    return "";
  }

  function parseDate(s) {
    s = (s || "").trim(); if (!s) return null;
    var m;
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return new Date(+m[1], +m[2]-1, +m[3]);
    if ((m = s.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/))) return new Date(+m[3], +m[2]-1, +m[1]);
    var d = new Date(s); return isNaN(d.getTime()) ? null : d;
  }

  function fmt(d) {
    return d ? d.getDate() + ". " + MJESECI[d.getMonth()] + " " + d.getFullYear() + "." : "";
  }

  function render(rows) {
    var items = rows.map(function (r) {
      return {
        date:  parseDate(pick(r, ["датум","datum","date"])),
        title: (pick(r, ["наслов","naslov","title"]) || "").trim(),
        text:  (pick(r, ["текст","tekst","text"]) || "").trim(),
        img:   (pick(r, ["слика","slika","image","фото"]) || "").trim(),
        pub:   (pick(r, ["објави","objavi","objavljeno","publish"]) || "").trim().toLowerCase()
      };
    }).filter(function (it) {
      if (!it.title && !it.text) return false;                          // празан ред
      if (["не","ne","no","false","0"].indexOf(it.pub) !== -1) return false; // скривено
      return true;
    });

    items.sort(function (a, b) {
      if (a.date && b.date) return b.date - a.date;   // најновије прво
      if (a.date) return -1; if (b.date) return 1; return 0;
    });

    if (!items.length) {
      statusEl.textContent = "Тренутно нема објављених вијести.";
      statusEl.style.display = "";
      return;
    }
    statusEl.style.display = "none";
    listEl.innerHTML = items.map(function (it) {
      var img  = /^https?:\/\//.test(it.img)
        ? '<img loading="lazy" src="' + esc(it.img) + '" alt="' + esc(it.title) + '">' : "";
      var body = esc(it.text).replace(/\r?\n/g, "<br>");
      var time = it.date
        ? '<time datetime="' + it.date.toISOString().slice(0,10) + '">' + fmt(it.date) + '</time>' : "";
      return '<article class="news-item">' + time +
             '<h3>' + esc(it.title) + '</h3>' + img +
             '<p>' + body + '</p></article>';
    }).join("");
  }

  if (!SHEET_CSV_URL) {
    statusEl.innerHTML = "Вијести још нису повезане с Google табелом. " +
      "(Залијепи CSV линк табеле у фајл <code>js/vijesti.js</code>.)";
    return;
  }
  if (typeof Papa === "undefined") {
    statusEl.textContent = "Није учитан читач табеле.";
    return;
  }
  Papa.parse(SHEET_CSV_URL, {
    download: true, header: true, skipEmptyLines: true,
    complete: function (res) {
      try { render(res.data || []); }
      catch (e) { statusEl.textContent = "Грешка при приказу вијести."; }
    },
    error: function () { statusEl.textContent = "Тренутно није могуће учитати вијести."; }
  });
})();
