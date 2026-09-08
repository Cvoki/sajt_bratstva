/* Братство Чворо — вести.
   Уредник пише преко админ панела (/admin); build (scripts/build-vesti.js)
   претвара content/vesti/*.md у vesti.json (наслов, датум, готов и очишћен HTML,
   слика с димензијама, категорија). Овде се то само приказује. */
(function () {
  "use strict";

  var statusEl = document.getElementById("vijesti-status");
  var listEl = document.getElementById("vijesti-lista");
  if (!statusEl || !listEl) return;

  var filterEl = document.getElementById("vijesti-filter");
  var moreBtn = document.getElementById("vijesti-vise");
  var najnovijeSec = document.getElementById("najnovije");
  var najnovijeGrid = document.getElementById("najnovije-grid");
  var rssWrap = document.getElementById("vijesti-rss");

  var PAGE = 6;
  var MESECI = ["јануар","фебруар","март","април","мај","јун","јул",
                "август","септембар","октобар","новембар","децембар"];

  var allRows = [];
  var activeCat = "";
  var shown = 0;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function fmt(d) {
    return d ? d.getDate() + ". " + MESECI[d.getMonth()] + " " + d.getFullYear() + "." : "";
  }

  function normalize(r) {
    return {
      slug: String(r.slug || "").trim(),
      date: r.date ? new Date(r.date) : null,
      title: String(r.title || "").trim(),
      html: String(r.html || "").trim(),
      excerpt: String(r.excerpt || "").trim(),
      img: String(r.img || "").trim(),
      imgW: r.imgW || null,
      imgH: r.imgH || null,
      caption: String(r.caption || "").trim(),
      category: String(r.category || "").trim()
    };
  }

  function postUrl(slug) {
    return location.origin + "/vesti/" + encodeURIComponent(slug) + ".html";
  }

  function shareBar(it) {
    var url = postUrl(it.slug);
    var uEnc = encodeURIComponent(url);
    var tEnc = encodeURIComponent(it.title + " — " + url);
    return (
      '<div class="share-bar" data-url="' + esc(url) + '" data-text="' + esc(it.title) + '">' +
        '<span class="share-label">Подели:</span>' +
        '<a class="share-btn sb-viber" href="viber://forward?text=' + tEnc + '">Viber</a>' +
        '<a class="share-btn sb-fb" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + uEnc + '">Facebook</a>' +
        '<a class="share-btn sb-wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + tEnc + '">WhatsApp</a>' +
        '<button class="share-btn sb-ig" type="button">Instagram</button>' +
        '<button class="share-btn sb-copy" type="button">Копирај линк</button>' +
      "</div>"
    );
  }

  function figure(it) {
    if (!it.img) return "";
    var dims = (it.imgW && it.imgH) ? ' width="' + it.imgW + '" height="' + it.imgH + '"' : "";
    var img = '<img loading="lazy" src="' + esc(it.img) + '" alt="' + esc(it.title) + '"' + dims + ">";
    if (!it.caption) return img;
    return "<figure>" + img + "<figcaption>" + esc(it.caption) + "</figcaption></figure>";
  }

  function articleHtml(it) {
    var time = it.date
      ? '<time datetime="' + it.date.toISOString().slice(0, 10) + '">' + fmt(it.date) + "</time>"
      : "";
    var cat = it.category ? '<span class="news-cat">' + esc(it.category) + "</span>" : "";
    var body = it.html || ("<p>" + esc(it.excerpt).replace(/\r?\n/g, "<br>") + "</p>");
    return (
      '<article class="news-item" id="vest-' + esc(it.slug) + '">' +
        '<div class="news-meta">' + time + cat + "</div>" +
        "<h3>" + esc(it.title) + "</h3>" +
        figure(it) +
        '<div class="news-body">' + body + "</div>" +
        shareBar(it) +
      "</article>"
    );
  }

  function visibleRows() {
    return activeCat ? allRows.filter(function (r) { return r.category === activeCat; }) : allRows;
  }

  function renderPage(reset) {
    var rows = visibleRows();
    if (reset) { listEl.innerHTML = ""; shown = 0; }
    var slice = rows.slice(shown, shown + PAGE);
    listEl.insertAdjacentHTML("beforeend", slice.map(articleHtml).join(""));
    shown += slice.length;
    if (moreBtn) moreBtn.hidden = shown >= rows.length;
  }

  function buildFilter() {
    if (!filterEl) return;
    var cats = [];
    allRows.forEach(function (r) {
      if (r.category && cats.indexOf(r.category) === -1) cats.push(r.category);
    });
    if (cats.length < 2) { filterEl.hidden = true; return; }
    filterEl.hidden = false;
    filterEl.innerHTML =
      '<button type="button" class="news-filter-btn is-active" data-cat="">Све</button>' +
      cats.map(function (c) {
        return '<button type="button" class="news-filter-btn" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
      }).join("");
    filterEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".news-filter-btn");
      if (!btn) return;
      activeCat = btn.getAttribute("data-cat") || "";
      filterEl.querySelectorAll(".news-filter-btn").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      renderPage(true);
    });
  }

  function renderNajnovije() {
    if (!najnovijeSec || !najnovijeGrid) return;
    var top = allRows.slice(0, 3);
    if (!top.length) return;
    najnovijeGrid.innerHTML = top.map(function (it) {
      return (
        '<a class="post post-link" href="#vest-' + esc(it.slug) + '">' +
          (it.img ? '<img class="post-img" loading="lazy" src="' + esc(it.img) + '" alt="' + esc(it.title) + '">' : '<span class="post-bar"></span>') +
          '<span class="pbody">' +
            '<span class="pdate">' + (it.date ? fmt(it.date) : "Вест") + "</span>" +
            "<span class=\"ptitle\">" + esc(it.title) + "</span>" +
            "<span class=\"pexc\">" + esc(it.excerpt) + "</span>" +
          "</span>" +
        "</a>"
      );
    }).join("");
    najnovijeSec.hidden = false;
  }

  function render(rows) {
    allRows = (rows || []).map(normalize).filter(function (it) {
      return it.title || it.html || it.excerpt;
    });
    allRows.sort(function (a, b) {
      if (a.date && b.date) return b.date - a.date;
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });

    if (!allRows.length) {
      statusEl.textContent = "Тренутно нема објављених вести.";
      statusEl.hidden = false;
      return;
    }
    statusEl.hidden = true;
    if (rssWrap) rssWrap.hidden = false;

    buildFilter();
    renderPage(true);
    renderNajnovije();

    if (location.hash) {
      // мали одмак да се слике поставе пре скроловања
      setTimeout(function () {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }, 80);
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

  if (moreBtn) moreBtn.addEventListener("click", function () { renderPage(false); });

  fetch("vesti.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(render)
    .catch(function () { statusEl.textContent = "Тренутно није могуће учитати вести."; });
})();
