"use strict";

/* Плаћање картицом преко WSPay (WSPayForm - хостована страница за унос картице,
   сајт никад не додирује бројеве картица).
   Документација: https://docs.wspay.info/wspayform

   Потребне env варијабле (Netlify → Site settings → Environment variables):
     WSPAY_SHOP_ID     - ShopID добијен од WSPay-а
     WSPAY_SECRET_KEY  - тајни кључ добијен од WSPay-а (никад се не шаље у прегледач)
     WSPAY_FORM_URL    - адреса WSPay странице за пријем форме (sandbox/production,
                          добија се уз уговор - потврди тачну вредност у документацији)
     WSPAY_VERSION     - опционо, верзија протокола (провери тачну вредност у
                          документацији коју WSPay пошаље уз уговор; подразумевано "2.0")

   Док ове варијабле нису подешене, функција враћа 503 { configured:false } и
   фронтенд (js/payment.js) приказује "ускоро" уместо покушаја плаћања. */

const crypto = require("crypto");

function sha512(str) {
  return crypto.createHash("sha512").update(str, "utf8").digest("hex");
}

// WSPay очекује износ као "10,00" (зарез као децимални знак)
function formatAmount(amount) {
  return Number(amount).toFixed(2).replace(".", ",");
}

// за потпис: исти износ, али без тачака и зареза (нпр. "10,00" → "1000")
function stripAmountForSignature(formattedAmount) {
  return formattedAmount.replace(/[.,]/g, "");
}

function isConfigured() {
  return !!(process.env.WSPAY_SHOP_ID && process.env.WSPAY_SECRET_KEY && process.env.WSPAY_FORM_URL);
}

exports.handler = async function (event) {
  var headers = { "Content-Type": "application/json" };

  // GET = лагана провера статуса (да фронтенд зна да прикаже "ускоро" пре клика)
  if (event.httpMethod === "GET") {
    return { statusCode: 200, headers: headers, body: JSON.stringify({ configured: isConfigured() }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  if (!isConfigured()) {
    return { statusCode: 503, headers: headers, body: JSON.stringify({ configured: false }) };
  }

  var payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: "Bad Request" }) };
  }

  var amount = Number(payload.amount);
  if (!amount || amount <= 0) {
    return { statusCode: 400, headers: headers, body: JSON.stringify({ error: "Missing or invalid amount" }) };
  }

  var shopId = process.env.WSPAY_SHOP_ID;
  var secretKey = process.env.WSPAY_SECRET_KEY;
  var formUrl = process.env.WSPAY_FORM_URL;
  var version = process.env.WSPAY_VERSION || "2.0";

  var siteUrl = process.env.URL || ("https://" + (event.headers.host || ""));
  var shoppingCartId = "prilog-" + Date.now();
  var totalAmount = formatAmount(amount);

  // потпис: ShopID + SecretKey + ShoppingCartID + SecretKey + TotalAmount(без зареза) + SecretKey, SHA-512
  var signature = sha512(
    shopId + secretKey + shoppingCartId + secretKey + stripAmountForSignature(totalAmount) + secretKey
  );

  var fields = {
    ShopID: shopId,
    ShoppingCartID: shoppingCartId,
    Version: version,
    TotalAmount: totalAmount,
    ReturnURL: siteUrl + "/.netlify/functions/payment-callback?result=success",
    ReturnErrorURL: siteUrl + "/.netlify/functions/payment-callback?result=error",
    CancelURL: siteUrl + "/.netlify/functions/payment-callback?result=cancel",
    Lang: "SR",
    Signature: signature
  };

  return {
    statusCode: 200,
    headers: headers,
    body: JSON.stringify({ configured: true, formActionUrl: formUrl, fields: fields })
  };
};
