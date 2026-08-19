/* Братство Чворо — плаћање картицом (WSPay).
   Док WSPAY_* env варијабле нису подешене у Netlify-ју, дугме остаје
   онемогућено са поруком "ускоро" - активира се само додавањем кредencijala,
   без измене кода. */
(function () {
  "use strict";

  var btn = document.getElementById("cardPayBtn");
  var statusEl = document.getElementById("cardPayStatus");
  var amountEl = document.getElementById("cardPayAmount");
  if (!btn) return;

  var defaultLabel = btn.textContent;

  function showComingSoon() {
    btn.disabled = true;
    btn.textContent = "Плаћање картицом — ускоро";
    if (statusEl) statusEl.textContent = "Ова опција још није активирана.";
  }

  function submitToWspay(actionUrl, fields) {
    var form = document.createElement("form");
    form.method = "POST";
    form.action = actionUrl;
    Object.keys(fields).forEach(function (key) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = fields[key];
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }

  // провера статуса при учитавању - да дугме одмах покаже право стање
  fetch("/.netlify/functions/create-payment")
    .then(function (res) { return res.ok ? res.json() : { configured: false }; })
    .then(function (data) { if (!data.configured) showComingSoon(); })
    .catch(showComingSoon);

  btn.addEventListener("click", function () {
    var amount = parseFloat((amountEl && amountEl.value || "").replace(",", "."));
    if (!amount || amount <= 0) {
      if (statusEl) statusEl.textContent = "Унеси износ већи од нуле.";
      return;
    }
    btn.disabled = true;
    btn.textContent = "Повезивање…";

    fetch("/.netlify/functions/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount })
    }).then(function (res) {
      if (res.status === 503) { showComingSoon(); return null; }
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (data) {
      if (!data) return;
      submitToWspay(data.formActionUrl, data.fields);
    }).catch(function () {
      if (statusEl) statusEl.textContent = "Плаћање картицом тренутно није доступно.";
      btn.disabled = false;
      btn.textContent = defaultLabel;
    });
  });

  // порука о исходу ако се враћамо са WSPay странице
  var outcome = new URLSearchParams(location.search).get("placanje");
  if (outcome && statusEl) {
    var poruke = {
      uspesno: "Хвала! Уплата картицом је успешно примљена.",
      neuspesno: "Плаћање није успело. Покушај поново или користи банковни пренос.",
      otkazano: "Плаћање је отказано.",
      greska: "Дошло је до грешке при провери плаћања."
    };
    statusEl.textContent = poruke[outcome] || "";
  }
})();
