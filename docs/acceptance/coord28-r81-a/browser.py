import json,hashlib,subprocess,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
out=Path('artifacts/coord28-r81-a');checks=[]
def check(id,expected,actual):checks.append({'id':id,'expected':expected,'actual':actual,'status':'passed'})
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert sha=='f9b42c8c220841d40978db48969feaba8c52dc43'
assert not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000},locale='zh-TW');console=[];pageerrors=[];http=[]
 page.on('console',lambda m:console.append({'type':m.type,'text':m.text}) if m.type in ['warning','error'] else None)
 page.on('pageerror',lambda e:pageerrors.append(str(e)))
 page.on('response',lambda r:http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 assert page.goto('http://127.0.0.1:5204/').status==200
 manage=page.locator('details.input-management');assert not manage.evaluate('(e)=>e.open')
 assert not page.locator('#project-source').is_visible()
 assert page.get_by_label('專案閱讀結果',exact=True).count()==0
 menus=page.locator('details.sample-menu');assert menus.count()==1
 page.locator('details.sample-menu > summary').click()
 options=page.locator('#project-example option').evaluate_all('(es)=>es.filter(e=>!e.disabled).map(e=>({value:e.value,label:e.textContent}))')
 assert len(options)==11
 chosen=[o for o in options if '訂單' in o['label']];assert len(chosen)==1
 check('A-entry','Single sample entry; 11 existing options remain discoverable; default editor collapsed',{'entryCount':1,'optionLabels':options,'editorOpen':False})
 page.locator('#project-example').select_option(chosen[0]['value'])
 expect(page.locator('.input-panel')).to_contain_text('示範輸入 · 12 份 · 未修改')
 assert page.get_by_label('專案閱讀結果',exact=True).count()==0
 assert not manage.evaluate('(e)=>e.open')
 filenames=page.locator('.input-management .migration-list button').all_text_contents()
 source=page.locator('#project-source').input_value();filename=page.locator('#migration-filename').input_value()
 assert len(filenames)==12
 check('A-load','Selecting commerce replaces inputs with 12 files without automatic analysis or opening editor',{'selected':chosen[0],'inputCount':len(filenames),'hasResult':False,'editorOpen':False})
 page.screenshot(path=str(out/'loaded-not-analyzed.png'))
 page.get_by_role('button',name='分析專案',exact=True).click()
 reading=page.get_by_label('專案閱讀結果',exact=True);expect(reading).to_be_visible()
 expect(page.get_by_role('heading',name='專案分析完成',exact=True)).to_be_visible()
 expect(page.locator('.summary-card')).to_contain_text('12 / 12 份已套用 · 0 筆診斷')
 expect(page.locator('.reading-workspace .schema-graph')).to_contain_text('5 張資料表 · 3 個外鍵關係')
 assert reading.evaluate('(e)=>e===document.activeElement')
 assert not manage.evaluate('(e)=>e.open') and not page.locator('#project-source').is_visible()
 assert page.locator('.input-management .migration-list button').all_text_contents()==filenames
 assert page.locator('#project-source').input_value()==source and page.locator('#migration-filename').input_value()==filename
 check('A-analyze','Analyze directly while editor remains collapsed; focus moves to completed reading result; inputs retained',{'summary':page.locator('.summary-card').inner_text(),'focus':reading.evaluate('(e)=>({tag:e.tagName,label:e.getAttribute("aria-label"),tabindex:e.getAttribute("tabindex")})'),'inputCount':12,'filenamesPreserved':True,'selectedSourceSHA256':hashlib.sha256(source.encode()).hexdigest(),'sourcePreserved':True,'editorOpen':False,'graph':'5 tables / 3 foreign keys'})
 result=json.loads(page.get_by_text('完整 ProjectAnalysis JSON',exact=True).locator('..').locator('pre').text_content())
 assert result['complete'] and result['appliedCount']==12 and len(result['diagnostics'])==0
 assert all(s['status']=='applied' for s in result['migrations'])
 tables=result['finalSchema']['tables'];assert len(tables)==5
 foreign=sum(len(t['foreignKeys']) for t in tables.values());assert foreign==3
 check('A-result','Browser-provided DTO confirms 12 applied, zero diagnostics, 5 final tables and 3 FK',{'appliedCount':12,'diagnostics':0,'tables':sorted(tables),'foreignKeys':foreign})
 reading.screenshot(path=str(out/'reading-result.png'))
 page.screenshot(path=str(out/'analysis-completed.png'))
 assert not console and not pageerrors and not http,{'console':console,'pageerrors':pageerrors,'http':http}
 check('A-console','Fresh Chromium has no console warning/error, pageerror or HTTP >=400',{'console':console,'pageerrors':pageerrors,'http':http})
 report={'task':'COORD28 / R8.1 short batch A','productSHA':sha,'cleanBefore':True,'browser':b.version,'playwright':'1.62.0','viewport':{'width':1440,'height':1000},'url':'http://127.0.0.1:5204/','finishedAtTaipei':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(),'taskGroups':1,'checks':checks,'result':'passed','scope':'Only commerce load -> no automatic analysis -> direct analysis -> reading result','note':'DTO observed using DOM textContent; no download or JSON-summary navigation; other tasks unrun.'}
 (out/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
 b.close()
assert not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
