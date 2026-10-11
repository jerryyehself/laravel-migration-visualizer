"""R8.3 exact-name browser regression using environment Chromium; no downloads."""
import json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1100});errors=[]
 page.on('console',lambda m:errors.append(m.text) if m.type in ['error','warning'] else None)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('LMV_TEST_URL','http://127.0.0.1:5202'))
 def record(s):checks.append(s);print(s,flush=True)
 def example(i,step=0):
  if not page.locator('.sample-menu').evaluate('(e)=>e.open'):page.locator('.sample-menu > summary').click()
  page.locator('#project-example').select_option(str(i));page.get_by_role('button',name='分析專案',exact=True).click();page.locator('.reading-workspace .migration-list button').nth(step).click()
 def panel():return page.get_by_label('名稱相關步驟',exact=True)
 def lookup(table,column=''):
  panel().get_by_label('精確資料表名稱',exact=True).fill(table);panel().get_by_label('精確欄位名稱（留空查整表）',exact=True).fill(column);panel().get_by_role('button',name='查詢名稱相關步驟',exact=True).click();expect(panel()).to_be_focused()
 def rows():return panel().locator('ol > li')
 def header():return page.locator('.workspace-controls').inner_text()
 example(1,1)
 page.get_by_label('搜尋目前快照欄位',exact=True).fill('nickname');page.get_by_role('button',name='查看欄位 users.nickname',exact=True).click();page.get_by_role('button',name='查看此名稱相關步驟 users.nickname',exact=True).click()
 assert rows().count()==2
 assert rows().evaluate_all('(es)=>es.map(e=>e.dataset.migrationIndex)')==['1','2']
 expect(rows().nth(0)).to_contain_text('columnAdded');expect(rows().nth(1)).to_contain_text('columnRemoved')
 record('search/details entry lists only nickname add/remove at original indices')
 before=header();origin=rows().nth(1).get_by_role('button',name='查看相關 PHP',exact=False).first
 origin.focus();origin.press('Enter');expect(page.get_by_label('結構操作原始碼',exact=True)).to_be_visible();assert header()==before
 page.get_by_role('button',name='返回原結構選取',exact=True).click();expect(origin).to_be_focused();assert header()==before;expect(panel()).to_contain_text('查詢：users.nickname')
 record('keyboard PHP preview preserves original step/query and return focus')
 rows().nth(1).get_by_role('button',name='查看此步比較',exact=True).click()
 expect(page.locator('.workspace-controls')).to_contain_text('第 3／3 份');expect(panel()).to_contain_text('查詢：users.nickname');expect(page.locator('.workspace-details')).to_contain_text('目前欄位名稱：nickname');expect(page.locator('.workspace-details')).to_contain_text('此側沒有欄位 nickname')
 record('related-step comparison retains deleted column literal and own-side absence')
 lookup('users','display_name');expect(rows().nth(0)).to_contain_text('renameColumn');expect(rows().nth(1)).to_contain_text('columnChanged');expect(rows().nth(1)).to_contain_text('dropColumn');expect(rows().nth(1)).to_contain_text('addColumn')
 record('display_name explicit rename remains separate from later rebuild net change')
 lookup('users','name');assert rows().count()==2
 rows().nth(1).get_by_role('button',name='查詢改名新名稱 display_name',exact=True).click();expect(panel()).to_contain_text('查詢：users.display_name')
 record('rename new literal query occurs only after explicit user click')
 lookup('users','name');expect(rows().nth(0)).to_contain_text('tableAdded');rows().nth(0).get_by_text('涉及名稱的整表已知內容',exact=True).click();expect(rows().nth(0)).to_contain_text('name (string)')
 record('initial whole-table column evidence is visible without invented column diff')
 before=header();count=page.locator('.reading-workspace .migration-list button').count();lookup('users','missing');assert rows().count()==0;expect(panel()).to_contain_text('沒有此精確名稱的相關證據');assert header()==before;assert page.locator('.reading-workspace .migration-list button').count()==count
 record('exact no-match query preserves complete migration list and reading step')
 example(7);lookup('members','id');expect(panel()).to_contain_text('tableRemoved');expect(panel()).to_contain_text('最終：不存在')
 lookup('users','id');expect(panel()).to_contain_text('renameTable');expect(panel()).not_to_contain_text('drop_members.php')
 record('table rename literals remain separate and dropped-table columns are searchable')
 example(5,2);lookup('users','id');expect(panel()).to_contain_text('關係上下文');expect(panel()).to_contain_text('posts');expect(panel()).to_contain_text('users');expect(panel()).to_contain_text('引用表被修改')
 record('foreign-key reference evidence is explicitly relationship context')
 example(3,1);lookup('users');expect(panel()).to_contain_text('最終：快照未知');expect(panel()).to_contain_text('失敗：未套用');expect(panel()).to_contain_text('前序阻擋：未套用')
 failed=rows().filter(has=page.locator('h4',has_text='第 2 份'));expect(failed.get_by_role('button',name='查看此步比較',exact=True)).to_be_disabled();failed.get_by_role('button',name='查看套用前',exact=True).click();expect(page.locator('.workspace-controls')).to_contain_text('套用前')
 blocked=rows().filter(has=page.locator('h4',has_text='第 3 份'));blocked.get_by_role('button',name='查看此步診斷／語法',exact=True).click();expect(page.locator('.migration-reading')).to_contain_text('前序阻擋');expect(panel()).to_contain_text('查詢：users')
 record('failed before and blocked diagnostics navigation keeps unknown boundary')
 lookup('unknown','nickname');expect(panel()).to_contain_text('沒有相關證據不等於沒有變化');assert rows().count()==0
 record('no evidence in incomplete project never claims no future changes')
 page.set_viewport_size({'width':390,'height':844});example(1,1);lookup('users','nickname');button=rows().nth(1).get_by_role('button',name='查看此步比較',exact=True);button.focus();button.press('Enter');expect(panel()).to_contain_text('查詢：users.nickname');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 Path('artifacts').mkdir(exist_ok=True);panel().evaluate('(e)=>e.scrollIntoView({block:"start"})');page.screenshot(path='artifacts/r8-3-narrow.png')
 record('390px keyboard related-step navigation has no horizontal overflow')
 page.set_viewport_size({'width':1440,'height':1100});panel().evaluate('(e)=>e.scrollIntoView({block:"start"})');page.screenshot(path='artifacts/r8-3-desktop.png')
 assert not errors,errors
 browser.close()
Path('artifacts/r8-3-browser.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'passed':checks,'consoleErrors':errors},ensure_ascii=False,indent=2)+'\n')
