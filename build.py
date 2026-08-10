# -*- coding: utf-8 -*-
"""Генератор статичких страница за сајт Братства Чворо.
Излаз су чисти .html фајлови — за хостовање није потребан никакав build."""
import os

OUT = os.path.dirname(os.path.abspath(__file__))
TREE_URL = "https://www.familyecho.com/?c=gq5qok3m6lo1y4nj&f=650149128163099049"

# Навигација: (фајл, назив)
NAV = [
    ("index.html",      "Насловна"),
    ("o-bratstvu.html", "О братству"),
    ("istorija.html",   "Историја"),
    ("galerija.html",   "Галерија"),
    ("stablo.html",     "Породично стабло"),
    ("vijesti.html",    "Вијести"),
    ("podrska.html",    "Подршка"),
]

def head(title, desc, current):
    return f"""<!DOCTYPE html>
<html lang="sr-Cyrl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Братство Чворо</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title} — Братство Чворо">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/grb-512.jpg">
<meta property="og:type" content="website">
<link rel="icon" href="assets/favicon.png" type="image/png">
<script>document.documentElement.className+=" js";</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
{header(current)}
"""

def header(current):
    links = "\n".join(
        f'      <a href="{f}"{" aria-current=\"page\"" if f==current else ""}>{n}</a>'
        for f, n in NAV
    )
    return f"""<header class="site-header">
  <div class="wrap">
    <a class="brand" href="index.html">
      <img src="assets/grb-160.jpg" alt="Грб Братства Чворо" width="44" height="44">
      <span class="brand-text"><b>Братство Чворо</b><span>Романија · 1790</span></span>
    </a>
    <button class="nav-toggle" aria-label="Отвори мени" aria-expanded="false" aria-controls="nav">
      <span></span><span></span><span></span>
    </button>
    <nav class="nav" id="nav">
{links}
    </nav>
  </div>
</header>"""

def footer():
    links = "\n".join(f'      <a href="{f}">{n}</a>' for f, n in NAV)
    return f"""<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <img src="assets/grb-160.jpg" alt="Грб Братства Чворо" width="64" height="64">
      <div>
        <b>Братство Чворо</b><br>
        <span class="foot-slava">Крсна слава: Свети Лука</span> · Романија 1790
      </div>
      <nav>
{links}
      </nav>
    </div>
    <p class="copy">© <span id="year">2026</span> Братство Чворо. Сва права задржана.</p>
  </div>
</footer>
<script src="js/main.js"></script>
</body>
</html>"""

def page(fname, title, desc, body):
    html = head(title, desc, fname) + body + footer()
    with open(os.path.join(OUT, fname), "w", encoding="utf-8") as fh:
        fh.write(html)
    print("написано:", fname)

# заједничка ознака за уредника — гдје се мијења садржај
PH = '<p class="notice">✎ Мјесто за садржај — овдје убаци стварни текст.</p>'

# ---------------------------------------------------------------- НАСЛОВНА
index_body = f"""
<section class="hero">
  <div class="wrap">
    <p class="eyebrow eyebrow--light">Романија · 1790</p>
    <img class="hero-grb" src="assets/grb-512.jpg" alt="Грб Братства Чворо — Свети Лука, вук са Романије, укрштене пушке и часни крст">
    <h1>Братство Чворо</h1>
    <p class="slava">Крсна слава: <b>Свети Лука</b></p>
    <div class="hero-cta">
      <a class="btn btn--gold" href="stablo.html">Породично стабло</a>
      <a class="btn btn--light" href="podrska.html">Подржи братство</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap wrap--narrow" style="text-align:center">
    <p class="eyebrow">Добро дошли</p>
    <h2>Огњиште нашег братства</h2>
    <hr class="rule rule--center">
    <p>Ова страница чува памћење, поријекло и заједништво Братства Чворо са Романије.
       Овдје ћеш наћи наша обиљежја, историју, галерију, породично стабло и вијести из братства.</p>
    <p style="color:var(--ink-soft)"><em>{"— уводни текст замијени стварним кад буде спреман —"}</em></p>
  </div>
</section>

<section class="section section--paper2">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Разгледај</p>
      <h2>Дијелови сајта</h2>
    </div>
    <div class="cards">
      <a class="card reveal" href="o-bratstvu.html"><span class="card-eyebrow">Обиљежја</span><h3>О братству</h3><p>Значење грба, слава и симболи који нас представљају.</p></a>
      <a class="card reveal" href="istorija.html"><span class="card-eyebrow">Од 1790.</span><h3>Историја</h3><p>Пут братства кроз вијекове, од Романије до данас.</p></a>
      <a class="card reveal" href="galerija.html"><span class="card-eyebrow">Фотографије</span><h3>Галерија</h3><p>Слике из живота братства, старе и нове.</p></a>
      <a class="card reveal" href="stablo.html"><span class="card-eyebrow">Лоза</span><h3>Породично стабло</h3><p>Наше родословно стабло, повезано и живо.</p></a>
      <a class="card reveal" href="vijesti.html"><span class="card-eyebrow">Обавјештења</span><h3>Вијести</h3><p>Окупљања, слава и новости из братства.</p></a>
      <a class="card reveal" href="podrska.html"><span class="card-eyebrow">Донације</span><h3>Подршка</h3><p>Помози братству — подаци рачуна за уплате из иностранства.</p></a>
    </div>
  </div>
</section>

<section class="section section--navy">
  <div class="wrap wrap--narrow" style="text-align:center">
    <p class="eyebrow">Заједно</p>
    <h2>Остани у вези са братством</h2>
    <p>Придружи се нашој Вибер заједници и прати вијести, окупљања и прославу славе.</p>
    <div class="hero-cta">
      <!-- ⇩ ЗАМИЈЕНИ href стварним линком Вибер групе кад стигне -->
      <a class="btn btn--viber" href="https://invite.viber.com/?g=pEFxNg3_m1bvadQUHJLG6bvn3-BWfbu4" target="_blank" rel="noopener" data-viber>Придружи се Вибер заједници</a>
    </div>
  </div>
</section>
"""
page("index.html", "Насловна",
     "Званична страница Братства Чворо са Романије — обиљежја, историја, галерија, породично стабло и вијести.",
     index_body)

# ---------------------------------------------------------------- О БРАТСТВУ
symbols = [
    ("Свети Лука", "Крсна слава братства. Свети апостол и јеванђелист Лука приказан је на грбу као заштитник и духовно огњиште лозе."),
    ("Вук са Романије", "Симбол постојаности, слободе и планинског поријекла братства — вук који вије на врховима Романије."),
    ("Укрштене пушке", "Ратничка традиција и одбрана огњишта — знак храбрости предака кроз бурне вијекове."),
    ("Часни крст", "Православна вјера као темељ братства — „Цар славе“, знак под којим се лоза окупља."),
    ("Храстов вијенац", "Снага, дуговјечност и коријен рода — храст као древни српски симбол постојања."),
    ("Романија · 1790", "Планина и година од које братство памти свој траг — мјесто поријекла и почетна тачка лозе."),
]
sym_html = "\n".join(
    f'      <div class="symbol reveal"><h3>{t}</h3><p>{d}</p></div>' for t, d in symbols
)
o_body = f"""
<div class="page-head">
  <div class="wrap"><p class="eyebrow eyebrow--light">Обиљежја</p><h1>О братству</h1>
  <p>Грб Братства Чворо носи причу о вјери, поријеклу и постојаности. Ево шта представља сваки његов дио.</p></div>
</div>
<section class="section">
  <div class="wrap">
    <div style="text-align:center; max-width:720px; margin:0 auto 1.5rem">
      <img src="assets/grb.jpg" alt="Грб Братства Чворо" style="width:min(320px,70vw); margin:0 auto; border:2px solid var(--gold); border-radius:6px; box-shadow:0 8px 26px rgba(21,35,63,.18)">
    </div>
    <div class="wrap--narrow" style="text-align:center">
      <hr class="rule rule--center">
      <p>{"— овдје иде уводни текст о братству, поријеклу и слави —"}</p>
    </div>
    <div class="symbols">
{sym_html}
    </div>
  </div>
</section>
"""
page("o-bratstvu.html", "О братству",
     "Значење грба Братства Чворо — Свети Лука, вук са Романије, укрштене пушке, часни крст и храстов вијенац.",
     o_body)

# ---------------------------------------------------------------- ИСТОРИЈА
ist_body = f"""
<div class="page-head">
  <div class="wrap"><p class="eyebrow eyebrow--light">Од 1790.</p><h1>Историја братства</h1>
  <p>Пут Братства Чворо кроз вијекове — од Романије до данас.</p></div>
</div>
<section class="section">
  <div class="wrap wrap--narrow">
    <p class="notice">✎ Ова страница је припремљена за твој историјски текст. Испод је примјер временске осе — замијени године и описе стварним подацима.</p>
    <ul class="timeline">
      <li class="reveal"><span class="year">1790.</span><p>Почетак памћења братства на Романији. <em>(унеси стварни догађај)</em></p></li>
      <li class="reveal"><span class="year">18–19. вијек</span><p>Живот, сеобе и ратничка традиција предака. <em>(допуни)</em></p></li>
      <li class="reveal"><span class="year">20. вијек</span><p>Братство кроз ратове и обнове. <em>(допуни)</em></p></li>
      <li class="reveal"><span class="year">Данас</span><p>Братство у отаџбини и дијаспори, окупљено око славе Светог Луке. <em>(допуни)</em></p></li>
    </ul>
  </div>
</section>
"""
page("istorija.html", "Историја",
     "Историја Братства Чворо од 1790. године до данас.", ist_body)

# ---------------------------------------------------------------- ГАЛЕРИЈА
tiles = "\n".join(
    f'      <a href="#" data-lightbox data-alt="Слика {i}"><span class="placeholder">Слика {i}</span></a>'
    for i in range(1, 9)
)
gal_body = f"""
<div class="page-head">
  <div class="wrap"><p class="eyebrow eyebrow--light">Фотографије</p><h1>Галерија</h1>
  <p>Слике из живота братства — окупљања, слава, стари и нови дани.</p></div>
</div>
<section class="section">
  <div class="wrap">
    <p class="notice">✎ Празна мјеста испод су спремна за слике. Кад пошаљеш фотографије, свака се убацује као <code>&lt;a href="images/slika.jpg" data-lightbox&gt;&lt;img src="images/slika.jpg"&gt;&lt;/a&gt;</code> и отвара се увећано на клик.</p>
    <div class="gallery">
{tiles}
    </div>
  </div>
</section>
<div class="lightbox" id="lightbox" aria-hidden="true">
  <button class="lb-close" aria-label="Затвори">×</button>
  <img src="" alt="">
</div>
"""
page("galerija.html", "Галерија",
     "Фотографије из живота Братства Чворо.", gal_body)

# ---------------------------------------------------------------- СТАБЛО
stablo_body = f"""
<div class="page-head">
  <div class="wrap"><p class="eyebrow eyebrow--light">Лоза</p><h1>Породично стабло</h1>
  <p>Родословно стабло Братства Чворо, повезано директно са FamilyEcho.</p></div>
</div>
<section class="section">
  <div class="wrap">
    <div class="tree-frame">
      <iframe src="{TREE_URL}" title="Породично стабло Братства Чворо" loading="lazy"></iframe>
    </div>
    <p class="tree-note">Ако се стабло не прикаже унутар оквира, отвори га директно:
      <a href="{TREE_URL}" target="_blank" rel="noopener">Отвори породично стабло у новом прозору →</a>
    </p>
  </div>
</section>
"""
page("stablo.html", "Породично стабло",
     "Родословно стабло Братства Чворо — повезано са FamilyEcho.", stablo_body)

# ---------------------------------------------------------------- ВИЈЕСТИ
vij_body = f"""
<div class="page-head">
  <div class="wrap"><p class="eyebrow eyebrow--light">Обавјештења</p><h1>Вијести из братства</h1>
  <p>Окупљања, прослава славе и новости.</p></div>
</div>
<section class="section">
  <div class="wrap wrap--narrow">
    <div id="vijesti-status" class="notice">Учитавање вијести…</div>
    <div class="news-list" id="vijesti-lista"></div>
  </div>
</section>
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
<script src="js/vijesti.js"></script>
"""
page("vijesti.html", "Вијести",
     "Вијести и обавјештења Братства Чворо.", vij_body)

# ---------------------------------------------------------------- ПОДРШКА
pod_body = f"""
<div class="page-head">
  <div class="wrap"><p class="eyebrow eyebrow--light">Донације</p><h1>Подржи братство</h1>
  <p>Свака помоћ значи очувању заједништва и обиљежавању славе. Хвала!</p></div>
</div>
<section class="section">
  <div class="wrap">
    <div class="donate-grid">
      <div class="account">
        <p class="eyebrow" style="margin-bottom:1rem">Подаци за уплату из иностранства</p>
        <div class="acct-row"><span class="k">Прималац</span><span class="v">Братство Чворо<br><span style="font-weight:400;font-size:.85rem;color:var(--ink-soft)">Миошићи бб</span></span></div>
        <div class="acct-row"><span class="k">IBAN</span><span class="v">BA39 5517 0025 2442 4825
          <button class="copy-btn" data-copy="BA395517002524424825">Копирај</button></span></div>
        <div class="acct-row"><span class="k">SWIFT / BIC</span><span class="v">BLBABA22
          <button class="copy-btn" data-copy="BLBABA22">Копирај</button></span></div>
        <div class="acct-row"><span class="k">Банка</span><span class="v">UniCredit Bank Banja Luka</span></div>
        <div class="acct-row"><span class="k">Валута</span><span class="v">BAM / EUR</span></div>
        <div class="acct-row"><span class="k">Сврха уплате</span><span class="v">Донација — Братство Чворо</span></div>
      </div>
      <aside class="support-aside">
        <h3>Како уплатити</h3>
        <p>Из иностранства користи <b>IBAN</b> и <b>SWIFT/BIC</b> у својој банци или мобилној апликацији. Као сврху упиши „Донација — Братство Чворо“.</p>
        <p style="color:#cabfa9;font-size:.9rem">Напомена: BiH још није у SEPA систему (очекује се око 2027), па уплате из иностранства иду као обичан међународни трансфер.</p>
        <hr class="rule">
        <h3>Питања?</h3>
        <p>Јави се преко наше Вибер заједнице.</p>
        <a class="btn btn--viber" href="https://invite.viber.com/?g=pEFxNg3_m1bvadQUHJLG6bvn3-BWfbu4" target="_blank" rel="noopener" data-viber>Вибер заједница</a>
      </aside>
    </div>
  </div>
</section>
"""
page("podrska.html", "Подршка",
     "Подржи Братство Чворо — подаци рачуна за уплате из иностранства.", pod_body)

print("\\nГотово — све странице генерисане.")
