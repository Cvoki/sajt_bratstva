/* Братство Чворо — интеракције (без спољних библиотека) */
(function () {
  "use strict";

  /* --- мени за мобилни --- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* --- lightbox за галерију --- */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var lbClose = lb.querySelector(".lb-close");
    document.querySelectorAll("[data-lightbox]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        var full = link.getAttribute("href");
        if (!full || full === "#") return; // празно мјесто — не отварај
        e.preventDefault();
        lbImg.src = full;
        lbImg.alt = link.getAttribute("data-alt") || "";
        lb.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    });
    function closeLb() {
      lb.classList.remove("open");
      lbImg.src = "";
      document.body.style.overflow = "";
    }
    lbClose && lbClose.addEventListener("click", closeLb);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLb(); });
  }

  /* --- копирање (IBAN, SWIFT...) --- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy") || "";
      var done = function () {
        var old = btn.textContent;
        btn.textContent = "Копирано ✓";
        btn.classList.add("done");
        setTimeout(function () { btn.textContent = old; btn.classList.remove("done"); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fallback);
      } else { fallback(); }
      function fallback() {
        var t = document.createElement("textarea");
        t.value = text; document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(t);
      }
    });
  });

  /* --- скролл откривање --- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* --- текућа година у подножју --- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
