"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const md = require("./lib/markdown");
const { fromBuffer } = require("./lib/image-size");
const { readVesti, readGalerija, slugify, ogPage } = require("./build-vesti");

test("slugify normalizuje ime fajla", () => {
  assert.equal(slugify("2025-01-15-slava.md"), "2025-01-15-slava");
  assert.equal(slugify("2025-10-01-Слава Луке.md"), "2025-10-01-слава-луке");
  assert.equal(slugify(".md"), "stavka");
});

test("renderMarkdown pravi bezbedan HTML", () => {
  assert.equal(md.renderMarkdown("**bold**"), "<p><strong>bold</strong></p>");
  assert.match(md.renderMarkdown("- a\n- b"), /<ul><li>a<\/li><li>b<\/li><\/ul>/);
  assert.match(md.renderMarkdown("1. a\n2. b"), /<ol><li>a<\/li><li>b<\/li><\/ol>/);
  assert.match(md.renderMarkdown("[x](https://a.com)"), /href="https:\/\/a\.com"/);
});

test("renderMarkdown blokira skripte i opasne linkove", () => {
  const out = md.renderMarkdown("<script>alert(1)</script>");
  assert.ok(!out.includes("<script>"));
  assert.ok(out.includes("&lt;script&gt;"));
  assert.ok(!md.renderMarkdown("[x](javascript:alert(1))").includes("javascript:"));
});

test("excerpt skraćuje dug tekst na granici reči", () => {
  const long = "reč ".repeat(80);
  const ex = md.excerpt(long, 60);
  assert.ok(ex.length <= 62);
  assert.ok(ex.endsWith("…"));
});

test("image-size čita PNG i GIF zaglavlje", () => {
  const png = Buffer.alloc(24);
  png.writeUInt32BE(0x89504e47, 0);
  png.writeUInt32BE(640, 16);
  png.writeUInt32BE(360, 20);
  assert.deepEqual(fromBuffer(png), { width: 640, height: 360 });

  const gif = Buffer.from("GIF89a" + "\0".repeat(20), "binary");
  gif.writeUInt16LE(120, 6);
  gif.writeUInt16LE(80, 8);
  assert.deepEqual(fromBuffer(gif), { width: 120, height: 80 });
});

test("readVesti: sortira, izbacuje draft i prazne, hvata loš datum", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vesti-"));
  fs.writeFileSync(path.join(dir, "2025-01-01-stara.md"),
    "---\ntitle: Стара\ndate: 2025-01-01\n---\nТекст једне вести.");
  fs.writeFileSync(path.join(dir, "2025-06-01-nova.md"),
    "---\ntitle: Нова\ndate: 2025-06-01\ncategory: Слава\n---\n**Важно** обавештење.");
  fs.writeFileSync(path.join(dir, "2025-09-01-nacrt.md"),
    "---\ntitle: Нацрт\ndate: 2025-09-01\ndraft: true\n---\nНе приказуј.");
  fs.writeFileSync(path.join(dir, "2025-12-01-los-datum.md"),
    "---\ntitle: Лош датум\ndate: not-a-date\n---\nИпак има текст.");

  const rows = readVesti(dir);
  fs.rmSync(dir, { recursive: true, force: true });

  assert.equal(rows.length, 3, "нацрт се не броји");
  assert.equal(rows[0].title, "Нова", "најновије прво");
  assert.equal(rows[0].category, "Слава");
  assert.ok(rows[0].html.includes("<strong>Важно</strong>"));
  const losDatum = rows.find((r) => r.title === "Лош датум");
  assert.equal(losDatum.date, null, "неисправан датум -> null");
});

test("ogPage sadrži og: mete i redirect", () => {
  const html = ogPage({ slug: "test", title: "Проба", excerpt: "Опис.", date: "2025-06-01T00:00:00.000Z", img: "slike/x.jpg" });
  assert.match(html, /property="og:title" content="Проба"/);
  assert.match(html, /http-equiv="refresh"/);
  assert.match(html, /location\.replace\("\/#vest-test"\)/);
});

test("readGalerija: sortira po order pa datumu, izbacuje bez slike", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gal-"));
  fs.writeFileSync(path.join(dir, "a.md"), "---\nimage: /slike/a.jpg\ncaption: Прва\ndate: 2024-01-01\n---\n");
  fs.writeFileSync(path.join(dir, "b.md"), "---\nimage: /slike/b.jpg\ncaption: Друга\ndate: 2025-01-01\n---\n");
  fs.writeFileSync(path.join(dir, "c.md"), "---\nimage: /slike/c.jpg\ncaption: Истакнута\norder: 1\n---\n");
  fs.writeFileSync(path.join(dir, "d.md"), "---\ncaption: Без слике\n---\n");

  const rows = readGalerija(dir);
  fs.rmSync(dir, { recursive: true, force: true });

  assert.equal(rows.length, 3, "фото без слике се избацује");
  assert.equal(rows[0].opis, "Истакнута", "order 1 иде прво");
  assert.equal(rows[1].opis, "Друга", "потом најновије по датуму");
  assert.ok(!("date" in rows[0]) && !("order" in rows[0]), "интерна поља се не пишу");
});
