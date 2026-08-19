# Шта треба довршити (ван кода)

Кôд је спреман, али неколико ствари се подешава ручно у Netlify контролној табли,
не кроз git. Овде је списак свега што чека - прати редом.

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
