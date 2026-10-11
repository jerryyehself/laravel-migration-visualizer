import json, subprocess, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
root=Path('/workspace/laravel-migration-visualizer'); out=root/'artifacts/coord03'; out.mkdir(exist_ok=True)
checks=[]
def record(id,expected,actual): checks.append(dict(id=id,expected=expected,actual=actual,status='passed'))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000},locale='zh-TW')
 errors=[];responses=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type in ['error','warning'] else None)
 page.on('response',lambda r:responses.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 assert page.goto('http://127.0.0.1:5202/').status==200
 icon=page.locator('link[rel=icon]').get_attribute('href')
 assert page.request.get('http://127.0.0.1:5202'+icon).status==200
 record('IR-02','Declared favicon returns 200; fresh console has no errors',{'favicon':icon,'status':200})
 def load(name):
  page.get_by_role('button',name=name,exact=True).click();page.get_by_role('button',name='分析專案',exact=True).click()
 def step(i): page.locator('.reading-workspace .migration-list button').nth(i).click()
 def control(n): return page.locator('.workspace-controls').get_by_role('button',name=n,exact=True)
 def details(): return page.locator('.workspace-details')
 def dto():
  section=page.locator('summary').get_by_text('完整 ProjectAnalysis JSON',exact=True).locator('..')
  section.locator('summary').click()
  return json.loads(section.locator('pre').inner_text())
 load('載入成功範例'); step(1)
 expect(page.locator('.workspace-controls')).to_contain_text('第 2／3 份')
 page.get_by_label('搜尋目前快照欄位',exact=True).fill('display_name')
 page.get_by_role('button',name='查看欄位 users.display_name',exact=True).click()
 selected=details().locator('.column-detail[data-selected=true]')
 expect(selected).to_contain_text('display_name')
 record('R7-01','Step 2 after; column search selects users.display_name in fixed details',selected.inner_text())
 origin=details().locator('[aria-label="操作來源 users.display_name"] button').first.element_handle()
 state=page.locator('.workspace-controls').inner_text();view=page.locator('.erd-canvas > g').get_attribute('transform')
 for closed in [False,True]:
  origin.click();panel=page.get_by_label('結構操作原始碼',exact=True)
  expect(panel).to_be_visible();assert panel.evaluate('(e)=>e===document.activeElement')
  assert panel.locator('textarea,input,[contenteditable=true]').count()==0
  expect(panel).to_contain_text('PHP 唯讀')
  if closed: origin.evaluate('(e)=>{for(let x=e.parentElement;x;x=x.parentElement)if(x.tagName==="DETAILS")x.open=false}')
  page.get_by_role('button',name='返回原結構選取',exact=True).click()
  assert origin.is_visible() and origin.evaluate('(e)=>e===document.activeElement')
  assert page.locator('.workspace-controls').inner_text()==state
  assert page.locator('.erd-canvas > g').get_attribute('transform')==view
  expect(selected).to_contain_text('display_name')
 record('IR-01','Normal and all closed ancestor details return restores visible origin, focus, step, side, table, column and view',{'normal':True,'closedAncestors':True,'readonly':True})
 page.screenshot(path=str(out/'source-return-desktop.png'))
 origin.click();origin.evaluate('(e)=>e.style.display="none"')
 page.get_by_role('button',name='返回原結構選取',exact=True).click()
 notice=page.get_by_role('status').filter(has_text='原結構選取已失效')
 expect(notice).to_be_visible();assert notice.evaluate('(e)=>e===document.activeElement')
 origin.evaluate('(e)=>e.style.display=""')
 record('IR-01-fallback','Hidden original target produces a visible focused invalid-selection notice',notice.inner_text())
 control('前後比較').click()
 page.get_by_label('搜尋目前快照欄位',exact=True).nth(1).fill('display_name')
 page.get_by_role('button',name='查看欄位 users.display_name',exact=True).click()
 expect(details().get_by_label('套用前資料表明細',exact=True)).to_contain_text('沒有欄位 display_name')
 expect(details().get_by_label('套用後資料表明細',exact=True)).to_contain_text('display_name')
 record('R7-02','Comparison reads each own schema: display_name absent before and present after','Observed separate before/after details')
 control('套用後').click();control('下一份 migration').click()
 expect(details()).to_contain_text('目前表：users');assert details().locator('.column-detail[data-selected=true]').count()==0
 assert control('下一份 migration').is_disabled()
 page.locator('#result-query').fill('create_users')
 expect(page.locator('.workspace-controls')).to_contain_text('目前閱讀步驟不在篩選清單')
 control('前一份 migration').click();expect(page.locator('.workspace-controls')).to_contain_text('第 2／3 份')
 page.locator('#result-query').fill('')
 record('R7-03','R7 step switch retains literal table and clears column; filter keeps point; previous follows full order; endpoint disabled','All observed; R8.4 persistence contract not applied')
 node=page.get_by_role('button',name='選取或移動資料表 users',exact=True)
 node.focus();node.press('Space');expect(details()).to_contain_text('目前表：users')
 node.focus();node.press('Enter');old=node.get_attribute('transform');node.press('ArrowRight');assert node.get_attribute('transform')!=old
 record('R7-04','Space/Enter select table; ArrowRight moves node',{'keyboard':True})
 page.set_viewport_size({'width':390,'height':844})
 origin=details().locator('[aria-label="操作來源 users"] button').first.element_handle();origin.click()
 expect(page.get_by_label('結構操作原始碼',exact=True)).to_contain_text('create_users')
 page.get_by_role('button',name='返回原結構選取',exact=True).click()
 assert origin.is_visible() and origin.evaluate('(e)=>e===document.activeElement')
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(out/'workspace-390.png'),full_page=True)
 record('R7-05','390px source from other migration returns focus without horizontal overflow or changing current step','Observed step 2, original users selection, source create_users, focus restored')
 page.set_viewport_size({'width':1440,'height':1000})
 load('載入資料表生命週期範例');step(0);page.get_by_role('button',name='選取或移動資料表 users',exact=True).click();control('下一份 migration').click()
 expect(details()).to_contain_text('此快照沒有資料表 users');control('套用前').click();expect(details()).to_contain_text('查看 users 的欄位')
 record('R7-06','Rename keeps literal users query; absent after and exists before','No identity guess to members')
 for sample,n,counts,first in [('laravelio',9,{'applied':2,'failed':1,'blocked':6},2),('bookstack',103,{'applied':0,'failed':1,'blocked':102},0)]:
  files=sorted((root/'artifacts/research-inputs'/sample/'database/migrations').glob('*.php'));assert len(files)==n
  page.locator('#migration-files').set_input_files([str(f) for f in files]);page.get_by_role('button',name='分析專案',exact=True).click()
  result=dto();actual={k:sum(s['status']==k for s in result['migrations']) for k in counts}
  assert actual==counts and result['finalSchema'] is None and result['complete'] is False
  failed=result['migrations'][first];assert failed['schemaBefore'] is not None and failed['schemaAfter'] is None and failed['diff'] is None
  assert all(s['schemaBefore'] is None and s['schemaAfter'] is None and s['diff'] is None for s in result['migrations'][first+1:])
  assert page.locator('.reading-workspace .schema-graph').count()==0
  assert page.get_by_role('button',name='下載最終 Schema JSON',exact=True).is_disabled()
  step(first);expect(page.locator('.workspace-controls')).to_contain_text('失敗');control('套用前').click()
  if sample=='laravelio':
   page.get_by_role('button',name='選取或移動資料表 jobs',exact=True).click();expect(details()).to_contain_text('目前表：jobs')
  else: expect(page.locator('.workspace-center')).to_contain_text('沒有資料表')
  control('套用後').click();expect(details()).to_contain_text('此側快照未知')
  control('下一份 migration').click();expect(page.locator('.workspace-controls')).to_contain_text('已阻擋');assert page.locator('.reading-workspace .schema-graph').count()==0
  page.screenshot(path=str(out/(sample+'-unknown.png')))
  record('S-'+sample,'Full browser-imported DTO counts and null boundaries match pinned samples; final never replaced by prefix',{'files':n,'counts':actual,'final':None,'failedBeforeKnown':True,'blockedNull':True})
  (out/(sample+'-browser-dto.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 page.locator('#project-source').fill(page.locator('#project-source').input_value()+'\n// browser-only invalidation')
 assert page.locator('.reading-workspace').count()==0
 record('R7-07','Editing browser input invalidates analysis and workspace','Workspace removed; original disk sources unchanged')
 assert not errors and not responses,{'console':errors,'http':responses}
 record('C-01','All checked pages have zero console warning/error, pageerror, and HTTP >=400',{'console':errors,'http':responses})
 report={'productSHA':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'browser':browser.version,'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks,'consoleErrors':errors,'httpErrors':responses}
 (out/'independent-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
 browser.close()
