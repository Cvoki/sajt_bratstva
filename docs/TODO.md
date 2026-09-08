# Шта треба довршити

Први део (1–3) се подешава ручно у Netlify контролној табли, не кроз git - прати редом.
Измене у коду око вести и SEO основа су **урађене** (види „Урађено" на дну);
остаје још неколико ставки у „Остатак сајта".

## 1. Netlify Identity (админ панел за вести)

Без овога, `/admin` не ради (пријава и објављивање вести).

1. Повежи Netlify сајт са GitHub спремиштем `Cvoki/sajt_bratstva`, ако већ није повезан.
2. **Site settings → Identity → Enable Identity.**
3. **Identity → Registration → Invite only.**
4. **Identity → Services → Enable Git Gateway.**
5. **Identity → Invite users** - позови уредника имејлом.
6. Провери на `/admin` да пријава и објава вести раде.

## 2. Плаћање картицом (WSPay)

Тренутно неактивно - дугме показује "Плаћање картицом - ускоро", ништа се не наплаћује.
Пуно упутство: [`PAYMENTS.md`](./PAYMENTS.md).

1. Пријава код WSPay-а (https://www.wspay.info/) као Братство Чворо, потписан уговор.
2. Од WSPay-а стижу: **ShopID**, **Secret Key**, **адреса WSPay странице** (sandbox и production), верзија протокола.
3. Унети у **Netlify → Site settings → Environment variables**:

   | Име варијабле | Вредност |
   |---|---|
   | `WSPAY_SHOP_ID` | ShopID од WSPay-а |
   | `WSPAY_SECRET_KEY` | тајни кључ (никад у git, само у Netlify) |
   | `WSPAY_FORM_URL` | адреса WSPay странице за пријем форме |
   | `WSPAY_VERSION` | опционо, ако се разликује од `2.0` |

4. **Netlify → Deploys → Trigger deploy** да функције виде нове варијабле.
5. Прво тестирати са sandbox подацима (тест картице од WSPay-а), тек онда пребацити на production ShopID.

## 3. Пресељење на приватни рачунар

Овај repo је рађен на фирминиом рачунару. За наставак на приватном:

```bash
git clone https://github.com/Cvoki/sajt_bratstva.git
cd sajt_bratstva
npm install
npm run build
```

- `node_modules/` је (привремено) гурнут у git ради лакшег преузимања - иначе се то не ради,
  нормално стоји у `.gitignore` и свако повуче зависности сам преко `npm install`.
  Кад технике стану на своје место, вредело би избацити `node_modules/` из git-а
  (`git rm -r --cached node_modules` + враћање у `.gitignore`) да repo остане мали.
- `.env` фајл није потребан локално - функције читају Netlify environment variables
  директно из `process.env`, подешавају се само горе наведеним корацима у Netlify контролној табли.
- Ако желиш да тестираш Netlify функције (WSPay) локално пре deploy-а, треба `netlify-cli`
  (`npm install -g netlify-cli`, па `netlify dev`) - није обавезно, само олакшава тестирање.

## Остатак сајта (у коду) — још није урађено

- **Галерија у Decap** - сада се фотографије додају ручно у `js/galerija.js`; направити
  „galerija" колекцију да породица додаје слике без кода.
- **Слике** у `assets/` и `slike/` - компресија, конзистентне величине.
- **Editorial workflow** у `admin/config.yml` - кад буде више од једног уредника
  (уредник прави нацрт, администратор одобрава).
- После селидбе: избацити `node_modules/` из git-а
  (`git rm -r --cached node_modules`, па откључати ред у `.gitignore`).

## Урађено (вести + SEO основе)

Како вести раде сада: [`VESTI.md`](./VESTI.md).

- **Трајни линкови по вести** — ознаке су сада `id="vest-<slug>"` (име `.md` фајла),
  не померају се кад изађе нова вест. `scripts/build-vesti.js` + `js/vijesti.js`.
- **Markdown се исцртава** — `scripts/lib/markdown.js` претвара тело у безбедан HTML
  у build-у (escape па бела листа тагова), `vesti.json` носи готов `html`.
- **Open Graph по вести** — build прави `vesti/<slug>.html` са `og:` метама и
  redirect-ом на `/#vest-<slug>`; share-bar дели ту адресу.
- **Пагинација** — првих 6 вести + „Прикажи још" (без новог fetch-а).
- **RSS** — `vesti/rss.xml`, линк у `<head>` од `index.html`.
- **„Најновије" преглед** — секција `#najnovije` испод хероа, 3 најновије вести
  (сакривена ако нема вести).
- **Слике** — `width`/`height` се читају у build-у (`scripts/lib/image-size.js`),
  ново поље „Опис слике" (`caption`) → `<figure><figcaption>`.
- **Категорије** — ново `select` поље у Decap-у (Слава/Помен/Окупљање/Обавештење),
  филтер-дугмад изнад листе.
- **Отпорност build-а + тестови** — неисправан датум/празна вест/непостојећа слика
  не руше build (само упозорење); `npm test` (`scripts/build-vesti.test.js`),
  Netlify build је `npm test && npm run build`.
- **SEO основе** — `sitemap.xml`, `robots.txt`, OG тагови на `index.html` (генеришу се
  у build-у из `process.env.URL` који Netlify сам поставља на праву адресу).
- **Чишћење** — уклоњен стари коментар/CSS из „Google табела" фазе; додат `.gitignore`
  (изузима генерисане `vesti.json`, `vesti/`, `sitemap.xml`, `robots.txt`).
