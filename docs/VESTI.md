# Вести — како раде

Секција „Вести" (`index.html#vijesti`) ради као git-базиран flat-file CMS: без базе,
без сервера, без `localStorage`. Уредник пише кроз `/admin`, а сваки Netlify deploy
претвара Markdown фајлове у `vesti.json` + помоћне фајлове које страница користи.

## Ток података

```
Уредник → /admin (Decap CMS) → commit .md у content/vesti/ на GitHub
      → Netlify deploy → npm test && npm run build → scripts/build-vesti.js
      → vesti.json + vesti/<slug>.html + vesti/rss.xml + sitemap.xml + robots.txt
      → fetch у js/vijesti.js → приказ у index.html (#najnovije и #vijesti)
```

## Компоненте

| Слој | Фајл | Шта ради |
|---|---|---|
| Уношење | `admin/index.html` | Decap CMS 3 (unpkg) + Netlify Identity widget |
| Конфиг CMS | `admin/config.yml` | backend `git-gateway` / грана `main`; колекција „vesti"; media у `slike/` |
| Извор | `content/vesti/*.md` | по један фајл по вести (frontmatter + тело); slug `{{year}}-{{month}}-{{day}}-{{slug}}` |
| Build | `scripts/build-vesti.js` | чита `.md`, `gray-matter` парсира frontmatter, генерише све излазе |
| Markdown → HTML | `scripts/lib/markdown.js` | безбедан претварач (escape па бела листа тагова), без зависности |
| Димензије слике | `scripts/lib/image-size.js` | чита ширину/висину из заглавља PNG/JPEG/GIF/WebP |
| Тестови | `scripts/build-vesti.test.js` | `npm test` (Node `--test`); Netlify их покреће пре build-а |
| Излаз (генерисан, у `.gitignore`) | `vesti.json` | низ вести са готовим `html`, `excerpt`, димензијама слике, категоријом |
| | `vesti/<slug>.html` | лака страница по вести са `og:` метама + redirect на `/#vest-<slug>` (за дељење) |
| | `vesti/rss.xml` | RSS фид вести |
| | `sitemap.xml`, `robots.txt` | SEO основе; адреса се узима из `process.env.URL` (Netlify је сам поставља) |
| Приказ | `js/vijesti.js` | `fetch("vesti.json")`, листа + пагинација + филтер + „најновије" преглед |
| Разметка/стил | `index.html` | секције `#najnovije` и `#vijesti`, инлајн CSS |
| Legacy рута | `vijesti.html` | meta-refresh redirect на `index.html#vijesti` |

## Поља једне вести (`admin/config.yml`)

| Поље | Тип | Напомена |
|---|---|---|
| `title` | string | наслов |
| `date` | datetime | само датум (`picker_utc`); неисправан датум → вест иде без датума |
| `category` | select | опционо: Слава / Помен / Окупљање / Обавештење (даје филтер-дугмад) |
| `image` | image | опционо, upload у `slike/`, јавна путања `/slike/...` |
| `caption` | string | опционо, опис испод слике |
| `body` | markdown | тело вести (подебљано, курзив, линкови, листе, цитат, наслови) |
| `draft` | boolean | **default укључен** — док је укључено, вест се не приказује |

## Шта `js/vijesti.js` ради

- Сортира по датуму опадајуће. Ако нема ставки → „Тренутно нема објављених вести."
- `#najnovije` (испод хероа): 3 најновије вести као картице, свака води на `#vest-<slug>`.
- `#vijesti`: филтер по категорији (ако има бар 2), листа од 6 + „Прикажи још".
- Свака вест: `<article id="vest-<slug>">` са датумом, категоријом, насловом,
  `<figure>` са сликом и описом, готовим HTML телом, share-баром.
- Share-бар дели адресу `.../vesti/<slug>.html` (та страница има `og:` мете па
  Facebook/Viber покажу прави наслов и слику, и одмах преусмере човека на секцију).
- Ако URL има `#vest-<slug>`, скролује до те вести.

## Локални преглед

```bash
npm install
npm test          # провера build логике
npm run build     # генерише vesti.json и остале фајлове из content/vesti/
python3 -m http.server 8000
# па отвори http://localhost:8000
```

`/admin` ради само на правом Netlify deploy-у (треба му Identity + Git Gateway).

## Галерија (исти механизам)

Фотографије галерије иду истим путем: колекција „Галерија" у `admin/config.yml`
(`content/galerija/*.md`, поља слика / опис / датум / редни број / сакриј),
`scripts/build-vesti.js` их сортира (редни број, па датум опадајуће) у `galerija.json`,
а `js/galerija.js` их приказује у секцији `#galerija`. Ако `galerija.json` не постоји
или је празан, `js/galerija.js` пада на ручни списак `SLIKE` у самом фајлу.

## Шта још није урађено

Види [`TODO.md`](./TODO.md) — компресија слика, editorial workflow.
