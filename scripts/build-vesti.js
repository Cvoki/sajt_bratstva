#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const CONTENT_DIR = path.join(__dirname, "..", "content", "vesti");
const OUTPUT_FILE = path.join(__dirname, "..", "vesti.json");

function readVesti() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, f), "utf8");
      const { data, content } = matter(raw);
      return {
        date: data.date ? new Date(data.date).toISOString() : null,
        title: data.title || "",
        text: content.trim(),
        img: data.image || "",
        draft: !!data.draft,
      };
    })
    .filter((v) => !v.draft && (v.title || v.text))
    .map(({ draft, ...v }) => v)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

const vesti = readVesti();
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(vesti, null, 2) + "\n", "utf8");
console.log(`Записано ${vesti.length} вести(и) у ${path.relative(process.cwd(), OUTPUT_FILE)}`);
