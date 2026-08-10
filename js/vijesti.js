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
  var SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQas23F-S7HZC4-ebZGRXkDebokWJdF49Any5J_1h9TqvchCpqZyBV_Nn_jzkYypv0D74xLT3O11WgU/pub?gid=0&single=true&output=csv";
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
    listEl.innerHTML = items.map(function (it, i) {
      var id   = "v" + (i + 1);
      var url  = location.origin + location.pathname + "#" + id;
      var img  = /^https?:\/\//.test(it.img)
        ? '<img loading="lazy" src="' + esc(it.img) + '" alt="' + esc(it.title) + '">' : "";
      var body = esc(it.text).replace(/\r?\n/g, "<br>");
      var time = it.date
        ? '<time datetime="' + it.date.toISOString().slice(0,10) + '">' + fmt(it.date) + '</time>' : "";
      var uEnc = encodeURIComponent(url);
      var tEnc = encodeURIComponent(it.title + " — " + url);
      var share =
        '<div class="share-bar" data-url="' + esc(url) + '" data-text="' + esc(it.title) + '">' +
          '<span class="share-label">Подијели:</span>' +
          '<a class="share-btn sb-viber" href="viber://forward?text=' + tEnc + '">Viber</a>' +
          '<a class="share-btn sb-fb" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + uEnc + '">Facebook</a>' +
          '<a class="share-btn sb-wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + tEnc + '">WhatsApp</a>' +
          '<button class="share-btn sb-ig" type="button">Instagram</button>' +
          '<button class="share-btn sb-copy" type="button">Копирај линк</button>' +
        '</div>';
      return '<article class="news-item" id="' + id + '">' + time +
             '<h3>' + esc(it.title) + '</h3>' + img +
             '<p>' + body + '</p>' + share + '</article>';
    }).join("");

    // ако је линк са ознаком поста (#v2), скролуј до те вијести
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  // — помоћне: обавјештење и копирање —
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "vij-toast"; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 300); }, 2000);
  }
  function copyText(s) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s);
    var ta = document.createElement("textarea"); ta.value = s; document.body.appendChild(ta);
    ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove();
    return Promise.resolve();
  }
  // Instagram нема дијељење линка преко веба → системски мени (мобилни) или копирај + отвори Instagram
  listEl.addEventListener("click", function (e) {
    var ig = e.target.closest(".sb-ig");
    var cp = e.target.closest(".sb-copy");
    if (ig) {
      var bar = ig.closest(".share-bar");
      var url = bar.getAttribute("data-url"), text = bar.getAttribute("data-text");
      if (navigator.share) { navigator.share({ title: text, text: text, url: url }).catch(function () {}); }
      else { copyText(text + " " + url).then(function () { window.open("https://www.instagram.com/", "_blank"); toast("Линк копиран — налијепи у Instagram причу или поруку"); }); }
    }
    if (cp) {
      copyText(cp.closest(".share-bar").getAttribute("data-url")).then(function () { toast("Линк копиран"); });
    }
  });

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
