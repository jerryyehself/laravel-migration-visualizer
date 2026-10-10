"""Optional real-browser regression; uses the environment's Playwright/Chromium.
Start Vite first. No download interaction or changes to project dependencies.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

base = os.environ.get('LMV_TEST_URL', 'http://127.0.0.1:5202')
checks = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('console', lambda msg: errors.append(msg.text) if msg.type in ['error', 'warning'] else None)
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base)
    page.get_by_role('button', name='載入成功範例', exact=True).click()
    page.get_by_role('button', name='分析專案', exact=True).click()
    page.locator('.reading-workspace .migration-list button').nth(1).click()
    page.get_by_label('搜尋目前快照欄位', exact=True).fill('display_name')
    page.get_by_role('button', name='查看欄位 users.display_name', exact=True).click()
    origin = page.locator('[aria-label="操作來源 users.display_name"] button').first.element_handle()
    for collapse in [False, True]:
        origin.click()
        if collapse:
            page.locator('.table-inspector details').evaluate('(e) => e.open = false')
        page.get_by_role('button', name='返回原結構選取', exact=True).click()
        assert origin.is_visible() and origin.evaluate('(e) => e === document.activeElement')
        assert '第 2／3 份' in page.locator('.workspace-controls').inner_text()
        checks.append('collapsed details restored with focus' if collapse else 'normal source return retains focus and snapshot')
    Path('artifacts').mkdir(exist_ok=True)
    page.screenshot(path='artifacts/source-return-restored.png')
    origin.click()
    origin.evaluate('(e) => e.style.display = "none"')
    page.get_by_role('button', name='返回原結構選取', exact=True).click()
    notice = page.get_by_role('status').filter(has_text='原結構選取已失效')
    assert notice.is_visible() and notice.evaluate('(e) => e === document.activeElement')
    checks.append('unfocusable origin has visible focused fallback notice')
    # Exercise actual browser DOM, including nested native details and disconnected nodes.
    cases = page.evaluate('''async () => {
      const { restoreSourceFocus } = await import('/src/source-return.ts');
      const host = document.createElement('div');
      host.innerHTML = '<details><summary>Outer</summary><details><summary>Inner</summary><button>Return target</button></details></details>';
      document.body.append(host);
      const button = host.querySelector('button');
      const nested = restoreSourceFocus(button) && [...host.querySelectorAll('details')].every(e => e.open) && document.activeElement === button;
      button.style.display = 'none'; const hidden = !restoreSourceFocus(button);
      button.remove(); const detached = !restoreSourceFocus(button);
      const nonfocus = document.createElement('div'); nonfocus.textContent='Not focusable'; host.append(nonfocus);
      const unfocusable = !restoreSourceFocus(nonfocus);
      const missing = !restoreSourceFocus(null); host.remove();
      return { nested, hidden, detached, unfocusable, missing };
    }''')
    assert all(cases.values()), cases
    checks.extend(cases)
    assert page.request.get(base + '/favicon.svg').status == 200
    assert not errors, errors
    checks.append('fresh-page console and favicon resource are clean')
    browser.close()
report = {'passed': checks, 'consoleErrors': errors}
Path('artifacts/source-return-browser.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
