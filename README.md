# PULZÍCI BASIC – webová hra

Hratelný prototyp lokální 2D fyzikální party hry pro Juniorfest. Jedna aréna, režim Nárazovka, až čtyři hráči na klávesnici nebo gamepadech a boti.

## Spuštění

- Lokálně otevřete `index.html` v prohlížeči Chrome nebo Edge.
- Na Renderu vytvořte **Static Site** připojený k tomuto repozitáři (`main`).
- **Build Command:** `echo "Statická HTML hra – bez buildu"`
- **Publish Directory:** `.` (tečka = kořen repozitáře).
- Nasazení bude dostupné na adrese, kterou Render přidělí ve tvaru `https://<nazev>.onrender.com`.

## Provoz a soukromí

Hra nevyžaduje server, přihlášení, databázi ani placené API. Neindexování přes `robots.txt` a meta robots není přístupová ochrana: veřejný URL může otevřít kdokoli a klientský kód je v prohlížeči čitelný. Nedávejte do HTML hesla ani tajné klíče.

## Ověření před sdílením

Zkontrolujte přímé načtení domovské stránky, interaktivní návod, 90sekundové kolo, klávesnici (WASD / šipky), pauzu a odvetu. Ovladače vyzkoušejte přímo na cílovém počítači. Aktuálně jde o prototyp určený k testování, nikoli certifikované vydání pro veřejné akce.
