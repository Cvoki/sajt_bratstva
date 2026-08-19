/* Братство Чворо — галерија.
   Слике стоје у фолдеру  slike/  .
   Да додаш слику:
     1) убаци фајл у фолдер  slike/  (нпр. slava-2025.jpg)
     2) допиши један ред у списак испод, по узору на примјере.
   Редослед у списку = редослед на сајту. */
(function () {
  "use strict";

  var SLIKE = [
    // { f: "slava-2025.jpg",        opis: "Слава Свети Лука 2025." },
    // { f: "okupljanje-miosici.jpg", opis: "Окупљање у Миошићима" },
  ];

  var grid = document.getElementById("galerija-grid");
  var prazno = document.getElementById("galerija-prazno");
  if (!grid) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  if (!SLIKE.length) return;              // нема слика → остаје порука „чека фотографије"
  if (prazno) prazno.style.display = "none";

  grid.innerHTML = SLIKE.map(function (s) {
    var src = "slike/" + s.f;
    var alt = esc(s.opis || "Фотографија братства");
    return '<a class="gtile" data-full="' + esc(src) + '">' +
             '<img loading="lazy" src="' + esc(src) + '" alt="' + alt + '" ' +
             'onerror="this.closest(\'.gtile\').style.display=\'none\'">' +
           '</a>';
  }).join("");
})();
