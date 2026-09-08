"use strict";

/* Чита димензије слике (ширина/висина) директно из заглавља фајла,
   без спољних зависности. Подржани формати: PNG, JPEG, GIF, WebP (VP8/VP8L/VP8X).
   Враћа { width, height } или null ако формат није препознат. */

const fs = require("fs");

function fromBuffer(buf) {
  if (buf.length < 24) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A, IHDR ширина@16 висина@20 (BE)
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // GIF: "GIF87a"/"GIF89a", ширина@6 висина@8 (LE, 16-bit)
  if (buf.toString("ascii", 0, 3) === "GIF") {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }

  // JPEG: FF D8 ... тражи SOF маркер
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) { off++; continue; }
      const marker = buf[off + 1];
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        off += 2;
        continue;
      }
      const len = buf.readUInt16BE(off + 2);
      const isSOF =
        (marker >= 0xc0 && marker <= 0xcf) &&
        marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) {
        return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
      }
      off += 2 + len;
    }
    return null;
  }

  // WebP: "RIFF"...."WEBP"
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const fmt = buf.toString("ascii", 12, 16);
    if (fmt === "VP8X") {
      return {
        width: 1 + buf.readUIntLE(24, 3),
        height: 1 + buf.readUIntLE(27, 3),
      };
    }
    if (fmt === "VP8 ") {
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      };
    }
    if (fmt === "VP8L" && buf[20] === 0x2f) {
      const b = buf.readUInt32LE(21);
      return {
        width: (b & 0x3fff) + 1,
        height: ((b >> 14) & 0x3fff) + 1,
      };
    }
    return null;
  }

  return null;
}

function imageSize(filePath) {
  let buf;
  try {
    const fd = fs.openSync(filePath, "r");
    buf = Buffer.alloc(65536);
    const read = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    buf = buf.subarray(0, read);
  } catch (e) {
    return null;
  }
  try {
    const dim = fromBuffer(buf);
    if (dim && dim.width > 0 && dim.height > 0) {
      return { width: dim.width, height: dim.height };
    }
  } catch (e) {
    /* непрепознато заглавље — врати null */
  }
  return null;
}

module.exports = { imageSize: imageSize, fromBuffer: fromBuffer };
