/* Братство Чворо — вести.
   Уредник пише преко админ панела (/admin), сајт учитава vesti.json
   који се генерише при сваком build-у из фајлова у content/vesti/. */
(function () {
  "use strict";

  var statusEl = document.getElementById("vijesti-status");
  var listEl = document.getElementById("vijesti-lista");
  if (!statusEl || !listEl) return;

  var MESECI = ["јануар","фебруар","март","април","мај","јун","јул",
                "август","септембар","октобар","новембар","децембар"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  function fmt(d) {
    return d ? d.getDate() + ". " + MESECI[d.getMonth()] + " " + d.getFullYear() + "." : "";
  }

  function render(rows) {
    var items = (rows || []).map(function (r) {
      return {
        date:  r.date ? new Date(r.date) : null,
        title: (r.title || "").trim(),
        text:  (r.text || "").trim(),
        img:   (r.img || "").trim()
      };
    }).filter(function (it) {
      return it.title || it.text;
    });

    items.sort(function (a, b) {
      if (a.date && b.date) return b.date - a.date;   // најновије прво
      if (a.date) return -1; if (b.date) return 1; return 0;
    });

    if (!items.length) {
      statusEl.textContent = "Тренутно нема објављених вести.";
      statusEl.style.display = "";
      return;
    }
    statusEl.style.display = "none";
    listEl.innerHTML = items.map(function (it, i) {
      var id   = "v" + (i + 1);
      var url  = location.origin + location.pathname + "#" + id;
      var img  = it.img
        ? '<img loading="lazy" src="' + esc(it.img) + '" alt="' + esc(it.title) + '">' : "";
      var body = esc(it.text).replace(/\r?\n/g, "<br>");
      var time = it.date
        ? '<time datetime="' + it.date.toISOString().slice(0,10) + '">' + fmt(it.date) + '</time>' : "";
      var uEnc = encodeURIComponent(url);
      var tEnc = encodeURIComponent(it.title + " — " + url);
      var share =
        '<div class="share-bar" data-url="' + esc(url) + '" data-text="' + esc(it.title) + '">' +
          '<span class="share-label">Подели:</span>' +
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

    // ако је линк са ознаком поста (#v2), скролуј до те вести
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  // — помоћне: обавештење и копирање —
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
  // Instagram нема дељење линка преко веба → системски мени (мобилни) или копирај + отвори Instagram
  listEl.addEventListener("click", function (e) {
    var ig = e.target.closest(".sb-ig");
    var cp = e.target.closest(".sb-copy");
    if (ig) {
      var bar = ig.closest(".share-bar");
      var url = bar.getAttribute("data-url"), text = bar.getAttribute("data-text");
      if (navigator.share) { navigator.share({ title: text, text: text, url: url }).catch(function () {}); }
      else { copyText(text + " " + url).then(function () { window.open("https://www.instagram.com/", "_blank"); toast("Линк копиран — налепи у Instagram причу или поруку"); }); }
    }
    if (cp) {
      copyText(cp.closest(".share-bar").getAttribute("data-url")).then(function () { toast("Линк копиран"); });
    }
  });

  fetch("vesti.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(render)
    .catch(function () { statusEl.textContent = "Тренутно није могуће учитати вести."; });
})();
