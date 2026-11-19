# PULZÍCI Zahraj si svůj příběh

Pracovní verze 1.2.2 pro Juniorfest. Jedna fyzikální aréna Nárazovka je doplněna průvodcem pro rodinnou tvůrčí dílnu. Volná hra zůstává dostupná samostatně.

## Co je součástí aplikace

- Volná hra Nárazovka: 90 sekund, čtyři Pulzíci, bod za vytlačení soupeře.
- Obtížnost botů lehká, střední a těžká.
- Klávesnice pro jednoho hráče; další místní hráči používají vlastní gamepady. Chybějící ovladače zastupují boti.
- Dotykové ovládání jednoho hráče proti botům: klepnutí určí cíl, podržení nabíjí, puštění vystřelí.
- Herní nácvik, pauza, zvuk, restart a odveta ve volné hře.
- Průběžné body všech čtyř Pulzíků přímo v aréně pod časovačem, také při zvětšení a na celé obrazovce.
- Tvůrčí dílna ve variantách **Hrajeme spolu** a **Hraju sám**.
- Tři scénáře: **Jeden okamžik, dva pohledy**, **Změň konec příběhu**, **Nálada mění příběh**.
- Dvě herní kola po 90 sekundách, výměna rolí nebo nový plán, reflexe, tvorba tříobrázkového příběhu na papíře a jeho představení.
- Po každém kole přehled bodů a pořadí včetně remíz. Výsledky obou kol zůstávají dostupné při navazujícím tvoření; kola se nesčítají, protože se mohou střídat hráči.
- Tisk jednoduchého pracovního listu přímo z obrazovky tvorby nebo dokončení.
- Bez účtů, backendu, online multiplayeru, zadávání jmen nebo ukládání dětských příběhů.

## Spuštění

1. Otevřete `index.html` v aktuálním prohlížeči. Soubor obsahuje vlastní styly, skript, grafiku i syntetické zvuky; samotná hra nepotřebuje internet.
2. Zvolte **Tvůrčí dílna** nebo **Volná hra**.
3. V dílně vyberte účastníky a jednu výzvu, pak klikněte na **Připravit výzvu**.
4. Postupujte podle zadání. Připravte si papír a tužku; po druhém kole aplikace přejde k otázkám a tvorbě.

Přibližná délka celé dílny je navržena na 15–20 minut. Skutečná délka a srozumitelnost zadání se mají ověřit pilotem. Mladším dětem může pokyny přečíst dospělý. Na jednom zařízení se ve dvojici střídá hráč a pozorovatel; nejde o síťovou kooperativní hru.

Ve scénáři **Změň konec příběhu** vzniká pomoc a domluva postav až v tvořeném příběhu. Pravidla samotné arény zůstávají soutěžní.

## Zobrazení a ovládání

- Počítač: šipky pro pohyb, mezerník pro nabití a výstřel; Esc pro pauzu.
- Gamepad: páčka pro pohyb a tlačítko A pro nabití a výstřel. Fyzická dostupnost a kompatibilita zařízení vyžaduje přejímací test.
- Mobil: klepnutí na arénu, podržení a puštění. Tlačítko zvětšení používá rozšířené zobrazení i tam, kde není nativní fullscreen dostupný.
- Herní rám lze zavřít křížkem. Po dokončení kola dílny se aplikace vrátí k pokynům v běžné orientaci stránky.
- Při opuštění okna nebo skrytí stránky se rozehraná hra pozastaví. Pokračování je výslovné.
- Čas kola i úvodní odpočet běží podle skutečně uplynulého aktivního času, i při pomalém vykreslování. Pauza se do času kola nezapočítává.
- Restart v dílně opakuje právě probíhající kolo; nevynechává další kroky.
- Každé kolo začíná na nule. Restart nerozšiřuje historii o nedohrané kolo. Výsledky jsou jen v paměti této aktivity; nová výzva nebo potvrzené přepnutí je vymaže.
- Přepnutí z rozehrané aktivity vyžaduje potvrzení. Po znovunačtení stránky se dílna otevírá od začátku.

`manifest.webmanifest` má orientaci `any`, aby čtení a tvoření nebylo nuceně otočené. Přidání na plochu a chování lišt závisí na prohlížeči a zařízení. Není přítomen service worker, proto nelze slibovat offline dostupnost webové instalace po pouhém načtení stránky. Místní HTML na PC je samostatné.

## Soubory

- `index.html` – samostatná aplikace.
- `manifest.webmanifest`, `pulzici-icon.svg`, `robots.txt` – soubory pro webové vystavení.
- `CHANGELOG.md` – rozsah změn.
- `TEST_REPORT.md` – provedené kontroly a neověřená místa.
- `tests/test_state.js` – jednotkové testy v Node VM s atrapou DOM.
- `tests/test_workshop.py` – připravený browserový průchod přes Playwright.

Tisknutelná metodika a podrobnější pracovní materiály jsou dodány samostatně jako dokumenty. Aplikace na ně není síťově závislá.

## Ověření

Jednotkové testy bez dalších balíčků:

```bash
node tests/test_state.js
```

Připravené browserové testy vyžadují Python, Playwright a Chromium v `/usr/bin/chromium`:

```bash
python3 tests/test_workshop.py
```

Lokální automatizovaný browserový test se v prostředí přípravy nemohl spustit kvůli systémovému zákazu vytvoření socketu. Ve veřejné verzi 1.2 byly následně přes cloudový Chrome ověřeny načtení stránky, příprava výzvy, spuštění nácviku, zvětšení arény a návrat; ve verzi 1.2.1 také viditelné a průběžně aktualizované skóre v běžné i zvětšené aréně. Přesný rozsah ověření verze 1.2.2 uvádí `TEST_REPORT.md`. Skutečný Safari na iPhonu, Chrome na Androidu, Chrome/Edge na cílovém Windows a používané gamepady zůstávají k přejímacímu ověření.

## Původ verze

Základem je PULZÍCI BASIC v1.1 z repozitáře `Progen-design/pulzici-basic`, commit `e7e9998f64457ad8534d11ef059f4db104c45e11`. Nová verze rozšiřuje použití hry o tvůrčí dílnu. Pilot s rodinami zatím neproběhl.
