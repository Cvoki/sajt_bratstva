<div align="right">

[Српски](README.md) · **English**

</div>

<div align="center">
  <img src="assets/grb-160.jpg" alt="Coat of arms of the Čvoro Brotherhood" width="110">

# Čvoro Brotherhood

**Romanija · 1790**

Website of the Čvoro family brotherhood from Romanija - the coat of arms, history, family tree, gallery and news in one place.

</div>

---

## About the project

In 1790 three brothers came to Romanija and started the line that grew into one of the largest families in the Sarajevo–Romanija region. This site exists so that memory doesn't stay locked in houses and notebooks, but is available to anyone carrying the name or looking for their roots.

It's built as a **single page** you move through, from the coat of arms to today's news. Plain HTML, CSS and JavaScript - no database, no server, no display libraries. Which means it will still work in twenty years, and hosting costs nothing.

The key decision: **content changes without touching code.** News is written through an admin panel at `/admin`, photos are dropped into a folder. Whoever takes over doesn't need to know a single line of HTML.

## What's on the site

| Section | Content |
|---|---|
| **Emblems** | The meaning of each part of the coat of arms - St. Luke as the patron saint, Romanija with the wolf, crossed rifles, the cross, the oak wreath, the ribbon with the year |
| **History** | The origins of the brotherhood and a timeline across generations |
| **Gallery** | Photographs from gatherings, with a lightbox view |
| **Family tree** | An embedded tree from the FamilyEcho platform |
| **News** | Announcements entered through the admin panel (`/admin`) |
| **Support** | Donation account with an IBAN copy button and a Viber contact |

## Built with

`HTML5` · `CSS3` · `JavaScript` (no libraries) · `Decap CMS` · `Netlify Identity` · `FamilyEcho`

The site stays static for visitors - menu, lightbox, copy-to-clipboard, animations are handwritten. The only build step is for news: on every publish, a small Node script (`scripts/build-vesti.js`) turns the files in `content/vesti/` into `vesti.json`, which `js/vijesti.js` loads on the page.

## Structure

```
.
├── index.html          # the whole site: all sections, styles and content
├── admin/               # Decap CMS admin panel (/admin) - login and news form
│   ├── index.html
│   └── config.yml
├── content/vesti/       # one .md file per news item (written by the admin panel)
├── scripts/
│   └── build-vesti.js   # generates vesti.json from content/vesti/ at build time
├── vesti.json           # generated file - the news the site reads (don't edit by hand)
├── js/
│   ├── main.js         # menu, lightbox, IBAN copy, animations
│   ├── galerija.js     # photo list
│   └── vijesti.js      # loads and renders vesti.json
├── assets/             # coat of arms in several sizes, favicon
├── slike/              # gallery photographs and news images
├── netlify.toml         # build command for Netlify
└── *.html              # redirects from old addresses to sections
```

Pages like `istorija.html` and `podrska.html` remain as redirects to the matching section, so links shared earlier still work.

## Colours and typography

The palette comes from the coat of arms itself:

| Colour | Hex | Meaning |
|---|---|---|
| Deep navy | `#0E2148` | shield background, header |
| Gold | `#C6A24C` | ribbons, headings, highlights |
| Crimson | `#8E1B22` | the cross, accents |
| Parchment | `#F4EFE3` | page background |

Type: **Playfair Display** for headings, **Spectral** for body text, **PT Sans** for small labels. All in Cyrillic - for a site like this that isn't a detail but part of the identity.

## Adding content

### A news item

News is entered through the admin panel at `/admin`, after logging in with an account the site administrator has approved (Netlify Identity). The editor fills in a title, text, date and image, turns off the "Draft" option and publishes - no code, no Google Sheet. The panel commits the change to GitHub itself, and Netlify runs `npm run build` on that deploy, which refreshes `vesti.json`.

### A photograph

1. Drop the file into the `slike/` folder - lowercase, no spaces or diacritics (`slava-2025.jpg`, not `Слава 2025.jpg`).
2. Add a line to `js/galerija.js`:

```js
{ f: "slava-2025.jpg", opis: "Слава Свети Лука 2025." },
```

3. Save and push to GitHub - this can be done through the GitHub website itself, with no software at all.

## Running it

```bash
git clone https://github.com/Cvoki/sajt_bratstva.git
cd sajt_bratstva
```

Open `index.html` in a browser - to preview news locally, generate `vesti.json` first:

```bash
npm install
npm run build
python3 -m http.server 8000
# then open http://localhost:8000
```

The admin panel (`/admin`) only works on a real Netlify deploy (it needs Identity + Git Gateway), not locally.

## Hosting

The site is static and hosted on **Netlify**. Connect the repository and every change publishes itself, usually within a minute.

## Setting up the admin panel (once, in the Netlify dashboard)

These steps have to be done by hand in Netlify - they can't be done through code:

1. Connect the Netlify site to this GitHub repository.
2. **Site settings → Identity → Enable Identity.**
3. **Identity → Registration → Invite only** (so no one can self-register as an editor).
4. **Identity → Services → Enable Git Gateway.**
5. **Identity → Invite users** - invite the actual editor by email; they get a link to set a password.
6. Check on `/admin` that login and publishing work before retiring the old workflow.

## Card payments

Alongside the IBAN, the site has a ready (but inactive) card payment option via WSPay - it activates once credentials are added in Netlify. Full instructions: [`docs/PAYMENTS.md`](docs/PAYMENTS.md).

## License

The code is free to use and learn from. **The coat of arms, photographs, texts and family data belong to the Čvoro Brotherhood** and are not for reuse without the brotherhood's consent.

---

<div align="center">
  <sub>Built by <a href="https://github.com/Cvoki">Luka Cvoro</a> - <a href="mailto:lukac95@gmail.com">lukac95@gmail.com</a></sub>
</div>
