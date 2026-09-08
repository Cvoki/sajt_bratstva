/* Братство Чворо — галерија.
   Фотографије се додају кроз админ панел (/admin → Галерија); build
   (scripts/build-vesti.js) прави galerija.json који се овде учитава.
   Ако galerija.json још не постоји, пада на ручни списак SLIKE испод. */
(function () {
  "use strict";

  var grid = document.getElementById("galerija-grid");
  var prazno = document.getElementById("galerija-prazno");
  if (!grid) return;

  // Ручни списак (само за преглед пре него што админ панел проради).
  var SLIKE = [
    // { f: "slava-2025.jpg", opis: "Слава Свети Лука 2025." },
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function tile(src, opis, w, h) {
    var dims = (w && h) ? ' width="' + w + '" height="' + h + '"' : "";
    return '<a class="gtile" data-full="' + esc(src) + '">' +
             '<img loading="lazy" src="' + esc(src) + '" alt="' + esc(opis || "Фотографија братства") + '"' + dims + ' ' +
             'onerror="this.closest(\'.gtile\').style.display=\'none\'">' +
           "</a>";
  }

  function render(list) {
    if (!list || !list.length) return false;
    grid.innerHTML = list.map(function (it) {
      return tile(it.src, it.opis, it.w, it.h);
    }).join("");
    if (prazno) prazno.hidden = true;
    return true;
  }

  fetch("galerija.json", { cache: "no-store" })
    .then(function (res) { return res.ok ? res.json() : []; })
    .then(function (rows) {
      if (render(rows)) return;
      // нема генерисане галерије → пробај ручни списак
      render(SLIKE.map(function (s) { return { src: "slike/" + s.f, opis: s.opis }; }));
    })
    .catch(function () {
      render(SLIKE.map(function (s) { return { src: "slike/" + s.f, opis: s.opis }; }));
    });
})();
