"""R8.4 controlled reading/search/view regression; environment Chromium, no downloads."""
import json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1100});errors=[]
 page.on('console',lambda m:errors.append(m.text) if m.type in ['error','warning'] else None);page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('LMV_TEST_URL','http://127.0.0.1:5202'))
 def record(s):checks.append(s);print(s,flush=True)
 def control(name):return page.locator('.workspace-controls').get_by_role('button',name=name,exact=True)
 def tools():return page.get_by_label('工作區 ERD 搜尋與視野',exact=True)
 def node(name='users'):return page.get_by_role('button',name=f'選取或移動資料表 {name}',exact=True).first
 def transform():return page.locator('.erd-canvas > g').first.get_attribute('transform')
 def column(name):page.get_by_label('搜尋目前快照欄位',exact=True).fill(name);page.get_by_role('button',name=f'查看欄位 users.{name}',exact=True).click()
 def example(i,step=0):
  if not page.locator('.sample-menu').evaluate('(e)=>e.open'):page.locator('.sample-menu > summary').click()
  page.locator('#project-example').select_option(str(i));page.get_by_role('button',name='分析專案',exact=True).click();page.locator('.reading-workspace .migration-list button').nth(step).click()
 example(1,1);column('display_name');page.get_by_role('button',name='放大 ERD',exact=True).click()
 node().focus();node().press('ArrowRight');node().press('ArrowDown')
 node_at=node().get_attribute('transform');view=transform()
 control('下一份 migration').click();expect(page.locator('.workspace-details')).to_contain_text('目前欄位名稱：display_name');expect(page.get_by_label('搜尋目前快照欄位',exact=True)).to_have_value('display_name');assert transform()==view;assert node().get_attribute('transform')==node_at
 control('前一份 migration').click();assert transform()==view;assert node().get_attribute('transform')==node_at
 record('next/previous preserve full literal column, search, zoom/pan and manual geometry')
 # Real blank-canvas panning must remain through a side change.
 svg=page.locator('.erd-canvas');svg.scroll_into_view_if_needed();box=svg.bounding_box()
 page.mouse.move(box['x']+box['width']*.95,box['y']+box['height']*.9);page.mouse.down();page.mouse.move(box['x']+box['width']*.85,box['y']+box['height']*.8,steps=6);page.mouse.up()
 panned=transform();assert panned!=view;control('套用前').click();assert transform()==panned;expect(tools()).to_contain_text('users.display_name · 此側不存在');expect(tools().get_by_role('button',name='定位目前物件',exact=True)).to_be_disabled();expect(page.get_by_label('搜尋目前快照欄位',exact=True)).to_have_value('display_name');assert page.get_by_role('button',name='查看欄位 users.display_name',exact=True).count()==0
 control('套用後').click();assert transform()==panned
 record('canvas pan survives side change; missing column is not downgraded or replaced')
 # Search must not hide graph data.
 original_nodes=page.locator('.erd-node').count();page.get_by_label('搜尋 ERD 資料表',exact=True).fill('nothing');expect(tools()).to_contain_text('沒有符合的資料表');assert page.locator('.erd-node').count()==original_nodes;page.get_by_label('搜尋 ERD 資料表',exact=True).fill('users')
 record('central search no-match never filters schema or graph nodes')
 control('前後比較').click();assert page.get_by_role('button',name='放大 ERD',exact=True).count()==1;assert page.get_by_label('搜尋目前快照欄位',exact=True).count()==1
 page.get_by_label('比較搜尋側別',exact=True).select_option('before');expect(tools()).to_contain_text('Before · 套用前');assert page.get_by_role('button',name='查看欄位 users.display_name',exact=True).count()==0
 page.get_by_label('比較搜尋側別',exact=True).select_option('after');page.get_by_role('button',name='查看欄位 users.display_name',exact=True).click();expect(page.locator('section[aria-label="套用前資料表明細"]')).to_contain_text('沒有欄位 display_name');expect(page.locator('section[aria-label="套用後資料表明細"]')).to_contain_text('display_name')
 page.get_by_role('button',name='放大 ERD',exact=True).click();transforms=page.locator('.erd-canvas > g').evaluate_all('(es)=>es.map(e=>e.getAttribute("transform"))');assert len(transforms)==2 and transforms[0]==transforms[1]
 record('comparison searches one declared side and shares exactly one zoom tool set')
 # Source from a different step must not navigate or change view.
 origin=page.locator('.workspace-details [aria-label="操作來源 users.display_name"] button').first.element_handle();header=page.locator('.workspace-controls').inner_text();before=page.locator('.erd-canvas > g').evaluate_all('(es)=>es.map(e=>e.getAttribute("transform"))');origin.click()
 page.locator('.workspace-details .table-inspector details').first.evaluate('(e)=>e.open=false');page.get_by_role('button',name='返回原結構選取',exact=True).click();assert origin.is_visible() and origin.evaluate('(e)=>e===document.activeElement');assert page.locator('.workspace-controls').inner_text()==header;assert page.locator('.erd-canvas > g').evaluate_all('(es)=>es.map(e=>e.getAttribute("transform"))')==before;expect(page.get_by_label('搜尋目前快照欄位',exact=True)).to_have_value('display_name')
 record('collapsed source return preserves step/side/column/search/shared view and focus')
 control('套用後').click();column('nickname');view=transform();control('下一份 migration').click();expect(page.locator('.workspace-details')).to_contain_text('目前欄位名稱：nickname');expect(page.locator('.workspace-details')).to_contain_text('沒有欄位 nickname');assert transform()==view;control('前一份 migration').click();expect(page.get_by_label('搜尋目前快照欄位',exact=True)).to_have_value('nickname');assert transform()==view
 record('removed column remains selected across steps and recovers on known earlier snapshot')
 page.locator('#result-query').fill('no-file');expect(page.locator('.workspace-controls')).to_contain_text('不在篩選清單');control('下一份 migration').click();expect(page.locator('.workspace-controls')).to_contain_text('第 3／3 份');page.locator('#result-query').fill('');control('初始結構').click();expect(tools()).to_contain_text('已知空白 schema');expect(tools()).to_contain_text('users.nickname · 此側不存在');control('最終結構').click();expect(page.get_by_label('搜尋目前快照欄位',exact=True)).to_have_value('nickname');assert transform()==view
 record('filter and initial/final boundaries preserve reading query and use complete core order')
 # Explicit reset and locate use actual current known objects.
 expect(control('前一份 migration')).to_be_disabled();page.locator('.reading-workspace .migration-list button').nth(1).click();column('display_name');node().focus();node().press('ArrowRight');moved=node().get_attribute('transform');page.get_by_role('button',name='重設 ERD 位置',exact=True).click();assert node().get_attribute('transform')!=moved;expect(tools()).to_contain_text('目前目標：users.display_name')
 node().focus()
 for _ in range(65):node().press('ArrowRight')
 expect(tools()).to_contain_text('已離開視野');page.get_by_role('button',name='定位目前物件',exact=True).click();expect(tools()).to_contain_text('在視野內')
 record('current-only reset and explicit locate handle off-screen target without automatic navigation reset')
 example(7,0);page.get_by_role('button',name='選取或移動資料表 users',exact=True).click();view=transform();control('下一份 migration').click();expect(page.locator('.workspace-details')).to_contain_text('此快照沒有資料表 users');expect(tools()).to_contain_text('users · 此側不存在');assert transform()==view;control('前一份 migration').click();assert transform()==view
 record('table rename retains old literal and view; no automatic new-name selection')
 example(3,0);page.get_by_label('搜尋 ERD 資料表',exact=True).fill('users');page.get_by_role('button',name='聚焦資料表 users',exact=True).click();view=transform();node_at=node().get_attribute('transform');control('下一份 migration').click();expect(tools()).to_contain_text('快照未知');expect(page.get_by_label('搜尋 ERD 資料表',exact=True)).to_be_disabled();expect(page.get_by_label('搜尋 ERD 資料表',exact=True)).to_have_value('users');assert page.locator('.erd-canvas').count()==0;control('下一份 migration').click();expect(page.locator('.migration-reading')).to_contain_text('前序阻擋');control('前一份 migration').click();control('前一份 migration').click();assert transform()==view and node().get_attribute('transform')==node_at
 record('failed/blocked unknown states disable search, draw nothing and preserve recoverable view')
 control('下一份 migration').click();control('前後比較').click();page.get_by_label('比較搜尋側別',exact=True).select_option('after');expect(page.get_by_label('搜尋 ERD 資料表',exact=True)).to_be_disabled();page.get_by_label('比較搜尋側別',exact=True).select_option('before');expect(page.get_by_label('搜尋 ERD 資料表',exact=True)).to_be_enabled();expect(tools()).to_contain_text('Before · 套用前');assert page.locator('.erd-canvas').count()==0
 record('unknown comparison side never borrows the known side or paints partial inferred comparison')
 example(1,1);column('display_name');page.get_by_role('button',name='放大 ERD',exact=True).click();node().focus();node().press('ArrowRight');origin=page.locator('.workspace-details [aria-label="操作來源 users.display_name"] button').first.element_handle();origin.click();page.locator('.input-management > summary').click();page.get_by_role('button',name='分析專案',exact=True).click();assert page.get_by_label('結構操作原始碼',exact=True).count()==0;expect(page.get_by_label('搜尋目前快照欄位',exact=True)).to_have_value('');expect(page.get_by_label('搜尋 ERD 資料表',exact=True)).to_have_value('');expect(page.locator('.workspace-details')).to_contain_text('尚未選取')
 record('new analysis explicitly clears prior reading/source/search/selection/view generation')
 page.set_viewport_size({'width':390,'height':844});page.locator('.reading-workspace .migration-list button').nth(1).click();column('display_name');page.get_by_role('button',name='放大 ERD',exact=True).focus();page.get_by_role('button',name='放大 ERD',exact=True).press('Enter');view=transform();control('下一份 migration').focus();control('下一份 migration').press('Enter');assert transform()==view;assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');Path('artifacts').mkdir(exist_ok=True);tools().evaluate('(e)=>e.scrollIntoView({block:"start"})');page.screenshot(path='artifacts/r8-4-narrow.png')
 record('390px keyboard sequential reading preserves view without horizontal overflow')
 page.set_viewport_size({'width':1440,'height':1100});tools().evaluate('(e)=>e.scrollIntoView({block:"start"})');page.screenshot(path='artifacts/r8-4-desktop.png')
 if not page.locator('.input-management').evaluate('(e)=>e.open'):page.locator('.input-management > summary').click()
 original=page.locator('#project-source').input_value();page.locator('#project-source').fill(original+'\n// modified');assert page.locator('.reading-workspace').count()==0
 record('true input edit invalidates analysis and the complete reading/view/source context')
 assert not errors,errors
 browser.close()
Path('artifacts/r8-4-browser.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'passed':checks,'consoleErrors':errors},ensure_ascii=False,indent=2)+'\n')
