"use strict";

/* Прима повратни позив од WSPay-а (ReturnURL/ReturnErrorURL/CancelURL) и
   ПРЕ него што поверује да је плаћање успело, проверава потпис на серверу -
   никад се не верује директно параметрима у URL-у без провере. */

const crypto = require("crypto");

function sha512(str) {
  return crypto.createHash("sha512").update(str, "utf8").digest("hex");
}

function redirect(path) {
  return { statusCode: 302, headers: { Location: path }, body: "" };
}

exports.handler = async function (event) {
  var target = "/#podrska";
  var q = event.queryStringParameters || {};

  var shopId = process.env.WSPAY_SHOP_ID;
  var secretKey = process.env.WSPAY_SECRET_KEY;
  if (!shopId || !secretKey) return redirect(target + "?placanje=greska");

  if (q.result === "cancel") return redirect(target + "?placanje=otkazano");

  var shoppingCartId = q.ShoppingCartID;
  var success = q.Success;
  var approvalCode = q.ApprovalCode;
  var signature = q.Signature;
  if (!shoppingCartId || !signature) return redirect(target + "?placanje=greska");

  // потпис за проверу: ShopID + SecretKey + ShoppingCartID + SecretKey + Success + SecretKey + ApprovalCode + SecretKey
  var expected = sha512(
    shopId + secretKey + shoppingCartId + secretKey + (success || "") + secretKey + (approvalCode || "") + secretKey
  );

  if (expected !== signature) return redirect(target + "?placanje=greska");

  var uspesno = success === "1" || String(success).toLowerCase() === "true";
  return redirect(target + "?placanje=" + (uspesno ? "uspesno" : "neuspesno"));
};
