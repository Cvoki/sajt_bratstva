#!/usr/bin/env node
"use strict";

/* Build вести: content/vesti/*.md  ->  vesti.json + vesti/<slug>.html (OG) +
   vesti/rss.xml + sitemap.xml + robots.txt

   Покреће се при сваком Netlify deploy-у преко `npm run build`. */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { renderMarkdown, excerpt, esc } = require("./lib/markdown");
const { imageSize } = require("./lib/image-size");

const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "vesti");
const OUTPUT_JSON = path.join(ROOT, "vesti.json");
const VESTI_DIR = path.join(ROOT, "vesti");

// Netlify поставља URL на продукцијску адресу сајта; локално је fallback.
const SITE_URL = String(
  process.env.URL || process.env.DEPLOY_PRIME_URL || "https://bratstvo-cvoro.netlify.app"
).replace(/\/+$/, "");

const CATEGORIES = ["Слава", "Помен", "Окупљање", "Обавештење"];

const warnings = [];
function warn(msg) {
  warnings.push(msg);
  console.warn("  ⚠ " + msg);
}

function slugify(name) {
  return String(name)
    .replace(/\.md$/i, "")
    .trim()
    .replace(/[^0-9A-Za-zА-Яа-яЁёЂђЈјЉљЊњЋћЏџ_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "vest";
}

function readVesti(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);

      const slug = slugify(file);
      const title = String(data.title || "").trim();
      const bodyMd = String(content || "").trim();

      let date = null;
      if (data.date) {
        const d = new Date(data.date);
        if (isNaN(d.getTime())) warn(`${file}: неисправан датум "${data.date}" — вест иде без датума`);
        else date = d.toISOString();
      }

      if (!!data.draft) return { _skip: "draft" };
      if (!title && !bodyMd) {
        warn(`${file}: нема ни наслов ни текст — прескочено`);
        return { _skip: "empty" };
      }

      let category = String(data.category || "").trim();
      if (category && CATEGORIES.indexOf(category) === -1) {
        warn(`${file}: непозната категорија "${category}" — игнорисана`);
        category = "";
      }

      const img = String(data.image || "").trim();
      let imgW = null, imgH = null;
      if (img) {
        const local = path.join(ROOT, img.replace(/^\/+/, ""));
        if (fs.existsSync(local)) {
          const dim = imageSize(local);
          if (dim) { imgW = dim.width; imgH = dim.height; }
        } else {
          warn(`${file}: слика "${img}" не постоји у репоу`);
        }
      }

      return {
        slug,
        date,
        title,
        html: renderMarkdown(bodyMd),
        excerpt: excerpt(bodyMd, 180) || title,
        img,
        imgW,
        imgH,
        caption: String(data.caption || "").trim(),
        category,
      };
    })
    .filter((v) => !v._skip)
    .sort((a, b) => {
      const d = String(b.date || "").localeCompare(String(a.date || ""));
      return d !== 0 ? d : String(b.slug).localeCompare(String(a.slug));
    });
}

const MESECI = ["јануар","фебруар","март","април","мај","јун","јул",
                "август","септембар","октобар","новембар","децембар"];
function humanDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.getDate() + ". " + MESECI[d.getMonth()] + " " + d.getFullYear() + ".";
}

function ogPage(v) {
  const url = SITE_URL + "/#vest-" + v.slug;
  const image = SITE_URL + (v.img ? "/" + v.img.replace(/^\/+/, "") : "/assets/grb-512.jpg");
  const desc = v.excerpt || v.title;
  return `<!doctype html>
<html lang="sr">
<head>
<meta charset="utf-8">
<title>${esc(v.title)} — Братство Чворо</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Братство Чворо">
<meta property="og:title" content="${esc(v.title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
${v.date ? `<meta property="article:published_time" content="${esc(v.date)}">\n` : ""}<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=/#vest-${esc(v.slug)}">
<script>location.replace("/#vest-" + ${JSON.stringify(v.slug)});</script>
</head>
<body style="font-family:Georgia,serif;text-align:center;padding:40px;">
<p>Отварање вести… <a href="/#vest-${esc(v.slug)}">Настави на страницу</a></p>
</body>
</html>
`;
}

function rss(items) {
  const now = new Date().toUTCString();
  const entries = items.map((v) => {
    const link = SITE_URL + "/vesti/" + v.slug + ".html";
    return `  <item>
    <title>${esc(v.title)}</title>
    <link>${esc(link)}</link>
    <guid isPermaLink="true">${esc(link)}</guid>
    ${v.date ? `<pubDate>${new Date(v.date).toUTCString()}</pubDate>` : ""}
    <description>${esc(v.excerpt || v.title)}</description>
  </item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Братство Чворо — Вести</title>
  <link>${SITE_URL}/#vijesti</link>
  <description>Обавештења братства Чворо — окупљања, славе, помени.</description>
  <language>sr</language>
  <lastBuildDate>${now}</lastBuildDate>
${entries}
</channel>
</rss>
`;
}

function sitemap(items) {
  const urls = [`  <url><loc>${SITE_URL}/</loc></url>`].concat(
    items.map((v) => {
      const loc = `${SITE_URL}/vesti/${v.slug}.html`;
      return `  <url><loc>${loc}</loc>${v.date ? `<lastmod>${v.date.slice(0, 10)}</lastmod>` : ""}</url>`;
    })
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

function robots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function rmDirContents(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, f), { recursive: true, force: true });
  }
}

function build() {
  const vesti = readVesti(CONTENT_DIR);

  // vesti.json (изостави интерна поља)
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(vesti, null, 2) + "\n", "utf8");

  // vesti/ — очисти старо, па генериши OG странице + RSS
  fs.mkdirSync(VESTI_DIR, { recursive: true });
  rmDirContents(VESTI_DIR);
  for (const v of vesti) {
    fs.writeFileSync(path.join(VESTI_DIR, v.slug + ".html"), ogPage(v), "utf8");
  }
  fs.writeFileSync(path.join(VESTI_DIR, "rss.xml"), rss(vesti), "utf8");

  // sitemap + robots у корену
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap(vesti), "utf8");
  fs.writeFileSync(path.join(ROOT, "robots.txt"), robots(), "utf8");

  console.log(
    `Записано ${vesti.length} вести(и): vesti.json, vesti/*.html, vesti/rss.xml, sitemap.xml, robots.txt` +
    (warnings.length ? `\n${warnings.length} упозорење(а).` : "")
  );
}

if (require.main === module) build();

module.exports = { readVesti, slugify, ogPage, rss, sitemap, humanDate, SITE_URL };
