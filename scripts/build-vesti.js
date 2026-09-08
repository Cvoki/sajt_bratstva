#!/usr/bin/env node
"use strict";

/* Build садржаја који уредник пише кроз /admin:

     content/vesti/*.md     -> vesti.json + vesti/<slug>.html (OG) + vesti/rss.xml
     content/galerija/*.md   -> galerija.json
     (обоје)                -> sitemap.xml + robots.txt

   Покреће се при сваком Netlify deploy-у преко `npm run build`. */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { renderMarkdown, excerpt, esc } = require("./lib/markdown");
const { imageSize } = require("./lib/image-size");

const ROOT = path.join(__dirname, "..");
const VESTI_CONTENT = path.join(ROOT, "content", "vesti");
const GALERIJA_CONTENT = path.join(ROOT, "content", "galerija");
const VESTI_JSON = path.join(ROOT, "vesti.json");
const GALERIJA_JSON = path.join(ROOT, "galerija.json");
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
    .replace(/[^0-9A-Za-zЀ-ӿ_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "stavka";
}

function toIso(value, file) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    warn(`${file}: неисправан датум "${value}" — иде без датума`);
    return null;
  }
  return d.toISOString();
}

// прочита ширину/висину слике из репоа (путања облика "/slike/x.jpg")
function imageDims(img, file) {
  if (!img) return { imgW: null, imgH: null };
  const local = path.join(ROOT, img.replace(/^\/+/, ""));
  if (!fs.existsSync(local)) {
    warn(`${file}: слика "${img}" не постоји у репоу`);
    return { imgW: null, imgH: null };
  }
  const dim = imageSize(local);
  return { imgW: dim ? dim.width : null, imgH: dim ? dim.height : null };
}

function mdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".md"));
}

function readVesti(dir) {
  return mdFiles(dir)
    .map((file) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const title = String(data.title || "").trim();
      const bodyMd = String(content || "").trim();
      const date = toIso(data.date, file);

      if (data.draft) return { _skip: true };
      if (!title && !bodyMd) {
        warn(`${file}: нема ни наслов ни текст — прескочено`);
        return { _skip: true };
      }

      let category = String(data.category || "").trim();
      if (category && CATEGORIES.indexOf(category) === -1) {
        warn(`${file}: непозната категорија "${category}" — игнорисана`);
        category = "";
      }

      const img = String(data.image || "").trim();
      const { imgW, imgH } = imageDims(img, file);

      return {
        slug: slugify(file),
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

function readGalerija(dir) {
  return mdFiles(dir)
    .map((file) => {
      const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const src = String(data.image || "").trim();
      if (data.draft) return { _skip: true };
      if (!src) {
        warn(`${file}: фотографија без слике — прескочено`);
        return { _skip: true };
      }
      const { imgW, imgH } = imageDims(src, file);
      return {
        src,
        opis: String(data.caption || "").trim(),
        date: toIso(data.date, file),
        order: Number.isFinite(+data.order) ? +data.order : null,
        w: imgW,
        h: imgH,
        _file: file,
      };
    })
    .filter((g) => !g._skip)
    .sort((a, b) => {
      if (a.order != null || b.order != null) {
        return (a.order == null ? Infinity : a.order) - (b.order == null ? Infinity : b.order);
      }
      const d = String(b.date || "").localeCompare(String(a.date || ""));
      return d !== 0 ? d : String(a._file).localeCompare(String(b._file));
    })
    .map(({ date, order, _file, ...g }) => g);
}

function ogPage(v) {
  const hash = "/#vest-" + v.slug;
  const url = SITE_URL + hash;
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
<meta http-equiv="refresh" content="0; url=${esc(hash)}">
<script>location.replace(${JSON.stringify(hash)});</script>
</head>
<body style="font-family:Georgia,serif;text-align:center;padding:40px;">
<p>Отварање вести… <a href="${esc(hash)}">Настави на страницу</a></p>
</body>
</html>
`;
}

function rss(items) {
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
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
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
  const vesti = readVesti(VESTI_CONTENT);
  const galerija = readGalerija(GALERIJA_CONTENT);

  fs.writeFileSync(VESTI_JSON, JSON.stringify(vesti, null, 2) + "\n", "utf8");
  fs.writeFileSync(GALERIJA_JSON, JSON.stringify(galerija, null, 2) + "\n", "utf8");

  fs.mkdirSync(VESTI_DIR, { recursive: true });
  rmDirContents(VESTI_DIR);
  for (const v of vesti) {
    fs.writeFileSync(path.join(VESTI_DIR, v.slug + ".html"), ogPage(v), "utf8");
  }
  fs.writeFileSync(path.join(VESTI_DIR, "rss.xml"), rss(vesti), "utf8");

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap(vesti), "utf8");
  fs.writeFileSync(path.join(ROOT, "robots.txt"), robots(), "utf8");

  console.log(
    `Записано: ${vesti.length} вести(и), ${galerija.length} фотографија(е) ` +
    `(vesti.json, galerija.json, vesti/*.html, vesti/rss.xml, sitemap.xml, robots.txt)` +
    (warnings.length ? `\n${warnings.length} упозорење(а).` : "")
  );
}

if (require.main === module) build();

module.exports = { readVesti, readGalerija, slugify, ogPage, rss, sitemap, SITE_URL };
