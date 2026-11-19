# Ověření pracovní verze PULZÍCI 1.2

Datum: 19. listopadu 2026.

## Výsledek

**Prošlo 12 skupin jednotkových kontrol skutečného aplikačního skriptu v Node VM s testovací atrapou DOM. Prošla syntaktická kontrola JavaScriptu. Skutečný browserový ani vizuální test se v tomto prostředí nepodařilo spustit.**

Tento report není potvrzením kompatibility s iPhonem, Androidem nebo fyzickými gamepady. Pilot s dětmi a rodinami neproběhl.

## Provedené jednotkové kontroly

| Oblast | Výsledek a rozsah |
| --- | --- |
| Výchozí obrazovka | Tři scénáře dílny, skrytá herní aréna, výchozí rodinná varianta. |
| Ochrana průvodce | Staré startovací ovládání nemůže přeskočit zadání. |
| Herní kolo | 90 sekund, jeden člověk v dílně, zachovaný pohyb podle původní fyziky. |
| Výstřel | Nabíjení a puštění v herní logice vytvoří výpad. |
| Automatická pauza | Obsluha události blur zastaví čas; pokračování obnoví hru. |
| Restart | Opakuje aktuální kolo, neposouvá pořadí v dílně. |
| První dokončení | Rodinná varianta přejde do výměny rolí. |
| Druhé dokončení | Přechod do tří základních otázek, tvorby tří scén a dokončení. Návrat z tvorby k otázkám funguje. |
| Sólo varianta | Oba další scénáře projdou dvěma koly, novým plánem a vlastní tvorbou. |
| Přepínání aktivit | Volná hra zachová nastavenou obtížnost. Zrušení i potvrzení přepnutí rozehrané aktivity mají správný stav. |
| Fullscreen exit | Logika zavření volá exitFullscreen také bez mobilního překryvu. API je v tomto testu atrapou. |
| Manifest | Orientace `any` dovoluje pokyny na výšku. |

Testy spouští skutečné funkce načtené z `index.html`, nikoli přepsanou kopii implementace. DOM, kreslení a API prohlížeče jsou testovací atrapy. Čas je při koncích kol zkrácen, stavový přechod však provádí původní herní smyčka.

## Co je blokované prostředím

Pokus o spuštění Playwright s instalovaným Chromium `/usr/bin/chromium` skončil ještě před načtením stránky systémovou chybou:

```text
socket() failed: Operation not permitted
```

Omezení nebylo obcházeno. Browserový průchod v `tests/test_workshop.py` je připraven, ale není vykázán jako úspěšný. Jeho plánované kontroly zahrnují reálné ovládání, nativní fullscreen, mobilní dotyk, portrét 390 × 844, landscape 844 × 390 a tiskový výstup.

Ověření přes připojený prohlížeč nebylo dostupné, protože chyběl připojený kontext. Cloudový prohlížeč výslovně zakázal otevření lokálního souboru protokolem `file:`. Ani toto omezení nebylo obcházeno. Následná nezávislá kontrola zdrojového kódu potvrdila soulad průvodce s metodikou; nenahrazuje běh v prohlížeči.

## Otevřené přejímací kontroly

1. Spustit připravený browserový test v povoleném prostředí a vizuálně projít všechny obrazovky, včetně tisku.
2. Ověřit dotyk, změnu orientace, rozšířené zobrazení a návrat ke čtení na skutečném iPhonu v Safari a Androidu v Chrome.
3. Ověřit volnou hru a všechny používané ovladače na cílovém Windows PC v Chrome a Edge.
4. Provést jeden pilot s rodinou a jednotlivcem; sledovat srozumitelnost zadání, střídání rolí a dokončení příběhu, upravit souhrn připomínek.

Do dokončení těchto kontrol má být verze vedena jako pracovní návrh k vyzkoušení.

## Opakování kontrol

```bash
node tests/test_state.js
python3 tests/test_workshop.py
```

Jednotkové testy potřebují pouze Node.js. Browserový test navíc Python, Playwright a dostupný Chromium. Generované QA soubory nejsou součástí aplikace.
