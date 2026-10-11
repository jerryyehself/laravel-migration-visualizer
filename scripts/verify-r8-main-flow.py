"""R8.1 browser regression, using environment Playwright/Chromium; no downloads."""
import json, os, hashlib, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
checks=[]
base=os.environ.get('LMV_TEST_URL','http://127.0.0.1:5202')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1100})
 errors=[]
 page.on('console',lambda msg:errors.append(msg.text) if msg.type in ['error','warning'] else None)
 page.on('pageerror',lambda error:errors.append(str(error)))
 def analyze():
  page.get_by_role('button',name='分析專案',exact=True).click()
  expect(page.locator('.reading-workspace')).to_be_visible()
  expect(page.get_by_label('專案閱讀結果',exact=True)).to_be_focused()
  expect(page.locator('.input-management')).not_to_have_attribute('open','')
 def manage():
  if not page.locator('.input-management').evaluate('(e)=>e.open'):
   page.locator('.input-management > summary').click()
 def example(i):
  if not page.locator('.sample-menu').evaluate('(e)=>e.open'): page.locator('.sample-menu > summary').click()
  page.locator('#project-example').select_option(str(i))
  expect(page.locator('.reading-workspace')).to_have_count(0)
 def record(s): checks.append(s);print(s,flush=True)
 page.goto(base)
 expect(page.locator('#project-source')).not_to_be_visible()
 expect(page.locator('.input-panel')).to_contain_text('示範輸入 · 3 份 · 未修改')
 assert page.locator('#project-example option').count()==12
 analyze()
 expect(page.locator('#project-source')).not_to_be_visible()
 assert page.locator('.reading-workspace').count()==1
 record('default demonstration -> analyze -> reading without editor')
 # Fold management without unmounting the workspace or changing result.
 page.locator('.reading-workspace .migration-list button').nth(1).click()
 page.get_by_role('button',name='選取或移動資料表 users',exact=True).click()
 header=page.locator('.workspace-controls').inner_text()
 manage(); original=page.locator('#project-source').input_value()
 page.locator('.input-management > summary').click()
 assert page.locator('.workspace-controls').inner_text()==header
 expect(page.locator('.workspace-details')).to_contain_text('目前表：users')
 record('management expand/collapse retains result and reading selection')
 page.locator('nav[aria-label="工作台工具"] summary').focus()
 page.locator('nav[aria-label="工作台工具"] summary').press('Enter')
 page.get_by_role('button',name='單檔練習',exact=True).click()
 expect(page.locator('.reading-workspace')).not_to_be_visible()
 page.get_by_role('button',name='返回多檔閱讀',exact=True).focus()
 page.get_by_role('button',name='返回多檔閱讀',exact=True).press('Enter')
 expect(page.locator('nav[aria-label="工作台工具"] summary')).to_be_focused()
 assert page.locator('.workspace-controls').inner_text()==header
 expect(page.locator('.workspace-details')).to_contain_text('目前表：users')
 manage();assert page.locator('#project-source').input_value()==original
 record('keyboard tool entry and return retain project copies/result/step/table')
 page.locator('#project-source').fill(original+'\n// browser copy')
 expect(page.locator('.reading-workspace')).to_have_count(0)
 assert page.locator('.input-panel').inner_text().find('1 份已修改')>=0
 page.get_by_role('button',name='單檔練習',exact=True).click()
 page.get_by_role('button',name='返回多檔閱讀',exact=True).focus()
 page.get_by_role('button',name='返回多檔閱讀',exact=True).press('Enter')
 expect(page.locator('nav[aria-label="工作台工具"] summary')).to_be_focused()
 assert page.locator('#project-source').input_value()==original+'\n// browser copy'
 expect(page.locator('.reading-workspace')).to_have_count(0)
 page.get_by_role('button',name='還原此檔至載入版本',exact=True).click()
 assert page.locator('#project-source').input_value()==original
 analyze()
 record('PHP edit invalidates result; restore keeps loaded bytes and requires analysis')
 manage();filename=page.locator('#migration-filename').input_value()
 page.locator('#migration-filename').fill('invalid.php')
 expect(page.locator('.reading-workspace')).to_have_count(0)
 analyze()
 expect(page.get_by_label('首要問題',exact=True)).to_contain_text('檔名排序')
 assert page.locator('.reading-workspace .schema-graph').count()==0
 manage();page.get_by_role('button',name='還原此檔至載入版本',exact=True).click()
 assert page.locator('#migration-filename').input_value()==filename
 record('filename edit invalidates; ordering problem is visible and final remains unknown')
 # All eleven demonstrations remain independently loadable and require analysis.
 for i,count in enumerate([3,3,12,3,3,4,4,4,4,3,3]):
  example(i)
  expect(page.locator('.input-panel')).to_contain_text(f'示範輸入 · {count} 份')
  analyze()
  assert page.locator('.reading-workspace .migration-list button').count()==count
 record('all 11 demonstrations retain file counts and manual analysis')
 example(3);analyze()
 expect(page.get_by_label('首要問題',exact=True)).to_contain_text('PHP 分析')
 assert not page.locator('.all-diagnostics').evaluate('(e)=>e.open')
 page.locator('.all-diagnostics > summary').click()
 assert page.locator('.all-diagnostics .diagnostic').count()>=2
 # Primary problem opens actual source; diagnostic edit opens hidden management.
 page.get_by_label('首要問題',exact=True).get_by_role('button').first.click()
 expect(page.get_by_label('診斷原始碼定位',exact=True)).to_be_visible()
 page.get_by_role('button',name='到輸入區修改此檔',exact=True).click()
 expect(page.locator('#project-source')).to_be_focused()
 assert 'unsupported' in page.locator('#migration-filename').input_value()
 selected=page.locator('#project-source').evaluate('(e)=>e.value.slice(e.selectionStart,e.selectionEnd)')
 assert selected.strip()
 assert page.locator('.reading-workspace').count()==1
 record('full diagnostics retained; edit opens correct file and focuses core source line without invalidating')
 # Collapsed export entry keeps unknown-final guard, without download interaction.
 page.get_by_text('分析工具：JSON 匯出',exact=True).click()
 assert page.get_by_role('button',name='下載最終 Schema JSON',exact=True).is_disabled()
 record('secondary export entry remains discoverable and unknown final stays disabled')
 example(7);analyze()
 expect(page.locator('.workspace-center')).to_contain_text('已知的空白 schema')
 record('known-empty final is distinct from unknown')
 # Real upload replaces demonstration; original file is never edited.
 path=Path('packages/migration-core/tests/fixtures/project/2026_01_01_000000_create_users.php')
 raw=path.read_bytes();digest=hashlib.sha256(raw).hexdigest()
 page.locator('#migration-files').set_input_files(str(path.resolve()))
 expect(page.locator('.reading-workspace')).to_have_count(0)
 expect(page.locator('.input-panel')).to_contain_text('匯入輸入 · 1 份')
 analyze();manage()
 assert page.locator('#project-source').input_value()==raw.decode()
 page.locator('#project-source').fill(raw.decode()+'\n// copy only')
 assert hashlib.sha256(path.read_bytes()).hexdigest()==digest
 page.get_by_role('button',name='還原此檔至載入版本',exact=True).click()
 analyze()
 record('PHP upload replaces list; copy edit/restore leaves original file intact')
 manage();page.get_by_role('button',name='移除此檔',exact=True).click()
 expect(page.locator('.reading-workspace')).to_have_count(0)
 assert page.get_by_role('button',name='分析專案',exact=True).is_disabled()
 record('remove invalidates result and empty input disables analysis')
 folder=Path('apps/web/tests/fixtures/folder-import/migrations').resolve()
 page.locator('#migration-folder').set_input_files(str(folder))
 expect(page.locator('.input-panel')).to_contain_text('已匯入 2 份 PHP，略過 1 份非 PHP')
 analyze();manage()
 expect(page.locator('[aria-label="待分析檔案（輸入順序）"]')).to_contain_text('nested/')
 record('folder import preserves nested paths and reports ignored non-PHP file')
 page.locator('#migration-files').set_input_files({'name':'2026_10_11_000000_bad.php','mimeType':'text/plain','buffer':bytes([255])})
 expect(page.get_by_role('alert')).to_be_visible()
 expect(page.locator('.reading-workspace')).to_have_count(0)
 record('invalid UTF-8 is rejected without retaining old analysis')
 page.set_viewport_size({'width':390,'height':844})
 example(1)
 page.get_by_role('button',name='分析專案',exact=True).focus()
 page.get_by_role('button',name='分析專案',exact=True).press('Enter')
 expect(page.locator('.reading-workspace')).to_be_visible()
 page.locator('.reading-workspace .migration-list button').nth(1).click()
 page.get_by_role('button',name='選取或移動資料表 users',exact=True).click()
 page.locator('.workspace-controls').get_by_role('button',name='下一份 migration',exact=True).click()
 expect(page.locator('.workspace-controls')).to_contain_text('第 3／3 份')
 assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
 Path('artifacts').mkdir(exist_ok=True)
 page.locator('.workspace-controls').scroll_into_view_if_needed()
 page.screenshot(path='artifacts/r8-1-narrow.png')
 record('390px keyboard analysis and sequential reading have no horizontal overflow')
 page.set_viewport_size({'width':1440,'height':1100});page.evaluate('scrollTo(0,0)')
 page.screenshot(path='artifacts/r8-1-desktop.png')
 assert not errors,errors
 browser.close()
report={'commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'passed':checks,'consoleErrors':errors}
Path('artifacts/r8-1-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
