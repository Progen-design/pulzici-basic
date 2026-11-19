"""Cílené ověření nové dílny přes skutečné UI v Chromium.

Zkrácení odpočtu a zbytku kola je pouze testovací zrychlení času;
stavové přechody probíhají skutečnou herní smyčkou.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf-8')
QA = ROOT / 'qa'
QA.mkdir(exist_ok=True)


def ready_round(page):
    if page.locator('#skipTutorialButton').is_visible():
        page.locator('#skipTutorialButton').click()
    page.evaluate('game.countdown = .01')
    page.wait_for_function("game.phase === 'playing'")
    assert page.evaluate('game.remaining') > 89


def finish_round(page):
    page.evaluate('game.remaining = .025')
    page.wait_for_function("!workshopState.transitioning && workshopState.stage !== 'playing'")


def run():
    checks = []
    errors = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                                     args=['--no-sandbox'])
        context = browser.new_context(viewport={'width':1360, 'height':980})
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.set_content(HTML, wait_until='load')
        expect(page.locator('#workshopTitle')).to_have_text('Zahraj si svůj příběh.')
        expect(page.locator('#gameLayout')).to_be_hidden()
        assert page.locator('[data-workshop-scenario]').count() == 3
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(QA / 'workshop_desktop.png'), full_page=True)
        checks.append('Úvod dílny, tři scénáře a desktop bez vodorovného přetečení')

        page.locator('[data-workshop-action="briefing"]').click()
        page.locator('[data-workshop-action="round"]').click()
        ready_round(page)
        assert page.evaluate('game.players.filter(p=>p.human).length') == 1
        start_x = page.evaluate('game.players[0].x')
        page.keyboard.press('ArrowRight', delay=220)
        assert page.evaluate('game.players[0].x') > start_x
        page.keyboard.press('Space', delay=650)
        page.wait_for_timeout(90)
        assert page.evaluate('game.players[0].charges') >= 1
        checks.append('Herní kolo má 90 s, jeden ovládaný Pulzík, klávesnice a výstřel')

        page.evaluate("window.dispatchEvent(new Event('blur'))")
        assert page.evaluate('paused') is True
        old_time = page.evaluate('game.remaining')
        page.wait_for_timeout(150)
        assert page.evaluate('game.remaining') == old_time
        page.locator('#resumeButton').click()
        assert page.evaluate('paused') is False
        checks.append('Ztráta zaměření automaticky zastaví čas; pokračování jej obnoví')

        page.locator('#startButton').click()
        ready_round(page)
        assert page.evaluate('workshopState.round') == 1
        checks.append('Restart opakuje aktuální kolo a neobchází dílnu')
        finish_round(page)
        expect(page.locator('#workshopTitle')).to_have_text('Teď si vyměňte role')
        expect(page.locator('#gameLayout')).to_be_hidden()
        assert page.evaluate('started') is False
        page.evaluate('startFromControl()')
        assert page.evaluate('started') is False
        checks.append('Konec prvního kola otevře výměnu rolí; staré startovací ovládání ji neobejde')

        page.locator('[data-workshop-action="round2"]').click()
        ready_round(page)
        assert page.evaluate('workshopState.round') == 2
        finish_round(page)
        expect(page.locator('#workshopTitle')).to_have_text('Co jste ve hře objevili?')
        assert page.locator('.question').all_text_contents() == ['Co postava chtěla?','Co se stalo?','Co by mohla udělat jinak?']
        page.locator('[data-workshop-action="story"]').click()
        expect(page.locator('.story-panel')).to_have_count(3)
        page.emulate_media(media='print')
        expect(page.locator('#printSheet')).to_be_visible()
        expect(page.locator('.app-shell')).to_be_hidden()
        page.pdf(path=str(QA / 'story_print_preview.pdf'), format='A4', print_background=True)
        page.emulate_media(media='screen')
        page.locator('[data-workshop-action="done"]').click()
        expect(page.locator('#workshopTitle')).to_have_text('Podělte se o svůj příběh')
        checks.append('Druhé kolo vede do reflexe, tří scén a dokončení; pracovní list má tiskový styl')

        # Sólotexty, oba další scénáře, stejné reálné dokončení kol.
        for scenario in ('ending', 'mood'):
            page.locator('[data-workshop-action="new"]').click()
            page.locator('[data-workshop-mode="solo"]').click()
            page.locator(f'[data-workshop-scenario="{scenario}"]').click()
            page.locator('[data-workshop-action="briefing"]').click()
            page.locator('[data-workshop-action="round"]').click()
            ready_round(page)
            finish_round(page)
            expect(page.locator('#workshopTitle')).to_have_text('Druhý pokus s novým plánem')
            page.locator('[data-workshop-action="round2"]').click()
            ready_round(page)
            finish_round(page)
            expect(page.locator('#workshopTitle')).to_have_text('Co jsi ve hře objevil?')
            page.locator('[data-workshop-action="story"]').click()
            assert page.locator('.workshop-intro').inner_text().startswith('Nakresli')
            page.locator('[data-workshop-action="done"]').click()
            expect(page.locator('#workshopTitle')).to_have_text('Představ svůj příběh')
        checks.append('Sólo průchod oběma dalšími scénáři včetně druhého pokusu a vlastního příběhu')

        page.locator('[data-workshop-action="free"]').click()
        expect(page.locator('#workshop')).to_be_hidden()
        page.locator('#difficultySelect').select_option('hard')
        page.locator('#startButton').click()
        ready_round(page)
        assert page.evaluate('game.difficulty') == 'hard'
        page.locator('#workshopTab').click()
        expect(page.locator('#switchDialog')).to_be_visible()
        page.locator('#cancelSwitch').click()
        assert page.evaluate('experience') == 'free'
        assert page.evaluate('paused') is False
        page.locator('#workshopTab').click()
        page.locator('#confirmSwitch').click()
        expect(page.locator('#workshopTitle')).to_have_text('Zahraj si svůj příběh.')
        assert page.evaluate('started') is False
        checks.append('Volná hra zachovává obtížnosti a přepnutí rozehrané aktivity vyžaduje potvrzení')

        # Skutečné nativní Fullscreen API, nikoli jen CSS ani mock.
        page.locator('#freePlayTab').click()
        page.locator('#fullscreenButton').click()
        page.wait_for_function('document.fullscreenElement === gameFrame')
        assert page.evaluate('immersiveMode') is False
        page.locator('#immersiveExit').click()
        page.wait_for_function('!document.fullscreenElement')
        checks.append('Desktop nativní fullscreen se zavře křížkem i bez mobilního překryvu')

        mobile = browser.new_context(viewport={'width':390,'height':844}, is_mobile=True,
                                     has_touch=True, device_scale_factor=1)
        mp = mobile.new_page()
        mp.on('pageerror', lambda e: errors.append(str(e)))
        mp.set_content(HTML, wait_until='load')
        assert mp.evaluate('document.documentElement.scrollWidth <= innerWidth')
        mp.screenshot(path=str(QA / 'workshop_mobile.png'), full_page=True)
        mp.locator('[data-workshop-action="briefing"]').click()
        mp.locator('[data-workshop-action="round"]').click()
        ready_round(mp)
        assert mp.evaluate('immersiveMode') is True
        assert mp.evaluate('gameFrame.parentNode === document.body') is True
        mp.screenshot(path=str(QA / 'workshop_mobile_game.png'), full_page=True)
        # Dotyk ve středu skutečného otočeného canvasu, ověření převodu souřadnic.
        box = mp.locator('#gameCanvas').bounding_box()
        mp.touchscreen.tap(box['x'] + box['width'] * .5, box['y'] + box['height'] * .6)
        assert mp.evaluate('touchControl.goal') is True
        assert abs(mp.evaluate('touchControl.x') - 660) < 4
        assert abs(mp.evaluate('touchControl.y') - 340) < 4
        finish_round(mp)
        expect(mp.locator('#workshopTitle')).to_have_text('Teď si vyměňte role')
        assert mp.evaluate('immersiveMode') is False
        assert mp.evaluate('gameFrame.parentNode.classList.contains("play-area")') is True
        assert mp.evaluate('document.documentElement.scrollWidth <= innerWidth')
        mp.screenshot(path=str(QA / 'workshop_mobile_swap.png'), full_page=True)
        checks.append('Mobil 390 × 844: čitelné pokyny, rozšířená aréna, dotykové souřadnice a automatický návrat po kole')

        mp.set_viewport_size({'width':844,'height':390})
        assert mp.evaluate('document.documentElement.scrollWidth <= innerWidth')
        mp.screenshot(path=str(QA / 'workshop_landscape.png'), full_page=True)
        checks.append('Mobil 844 × 390: pokyny bez vodorovného přetečení')
        assert errors == [], errors
        checks.append('Žádná neošetřená chyba JavaScriptu během testovaných průchodů')
        browser.close()
    report = {'passed':len(checks),'checks':checks,'page_errors':errors,
              'limitations':['Chromium emulace není ověření skutečného Safari/iPhonu.',
                             'Fyzické gamepady a pilot s rodinami nebyly v tomto běhu ověřeny.']}
    (QA / 'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    run()
