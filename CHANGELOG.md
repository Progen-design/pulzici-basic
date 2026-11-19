# Změny ve verzi 1.2.1

Datum přípravy: 19. listopadu 2026.

- Průběžné skóre všech čtyř postav je přesunuté přímo do arény pod časovač. Je součástí rámu při nativním fullscreen i rozšířeném zobrazení a nezachytává ovládací dotyky.
- Po prvním i druhém kole dílny se zobrazují body a pořadí všech postav. Výsledky obou kol jsou samostatné a zůstávají dostupné při reflexi, tvorbě i dokončení.
- Nová kola začínají od nuly. Restart rozehraného kola nemění výsledek předchozího kola; nová aktivita historii vyčistí. Data zůstávají pouze v paměti stránky.
- Remízy mají společné pořadí a všechny vítězné postavy jsou označené také ve volné hře.
- Automatizované kontroly jsou rozšířené o výsledky, remízy, zachování historie a restarty. Rozsah skutečného browserového ověření je v `TEST_REPORT.md`.

# Změny ve verzi 1.2

Datum přípravy: 19. listopadu 2026.

## Nová tvůrčí dílna

- Nový název PULZÍCI Zahraj si svůj příběh a přepínač mezi dílnou a volnou hrou.
- Varianta pro rodinu či dvojici se střídáním rolí na jednom zařízení a samostatná varianta pro jednotlivce.
- Tři obsahové scénáře: Jeden okamžik dva pohledy, Změň konec příběhu a Nálada mění příběh.
- Řízený postup zadání, první kolo, výměna rolí nebo nový plán, druhé kolo, reflexe, tři scény na papíře a dokončení.
- Pokyny a příběhová část se zobrazují mimo rozšířenou herní arénu. Po každém kole se aréna zavře a průvodce získá zaměření.
- Každé kolo má původních 90 sekund. Herní mechanika Nárazovky zůstává stejná.
- Opakování nácviku a restart v dílně zachovávají aktuální pořadí kola.
- Přepnutí rozehrané aktivity má potvrzení a možnost návratu.
- Přístupný tisk jednoduchého listu se třemi prázdnými scénami; žádné ukládání dětských textů nebo jmen.

## Opravy a návaznosti

- Křížek pro zavření nativního desktopového fullscreen již nevyžaduje zapnutý mobilní překryv.
- Při nedostupném fullscreen se na desktopu použije rozšířené zobrazení v rámci stránky.
- Opuštění okna nebo skrytí stránky pozastaví rozehranou hru a vynuluje vstupy.
- Manifest dovoluje orientaci zařízení `any`, aby pokyny zůstaly čitelné také na výšku.
- Opraveno několik českých popisků a překlep v pokračování hry.
- Odstraněno průběžné hlasité oznamování každé změny HUD čtečce obrazovky.

## Stav ověření

Prošly syntaktická kontrola JavaScriptu a jednotkové testy aplikačních přechodů v Node VM s atrapou DOM. Skutečný browserový průchod je připraven, ale zablokovaný prostředím. Vizuální, hardwarové a rodinné pilotní ověření zůstává otevřené; podrobnosti jsou v `TEST_REPORT.md`.
