import json,hashlib,subprocess,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
out=Path('artifacts/coord29-r81-b')
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert sha=='f9b42c8c220841d40978db48969feaba8c52dc43'
assert not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000},locale='zh-TW');console=[];pageerrors=[];http=[]
 page.on('console',lambda m:console.append(m.text) if m.type in ['warning','error'] else None)
 page.on('pageerror',lambda e:pageerrors.append(str(e)))
 page.on('response',lambda r:http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 assert page.goto('http://127.0.0.1:5205/').status==200
 page.locator('details.sample-menu > summary').click()
 page.locator('#project-example').select_option(label='載入訂單系統範例（12 檔）（示範）')
 page.get_by_role('button',name='分析專案',exact=True).click()
 reading=page.get_by_label('專案閱讀結果',exact=True);expect(reading).to_be_visible()
 expect(page.locator('.summary-card')).to_contain_text('12 / 12 份已套用 · 0 筆診斷')
 original=reading.element_handle()
 def inputs():return {'filenames':page.locator('.input-management .migration-list button').all_text_contents(),'selectedFilename':page.locator('#migration-filename').input_value(),'selectedPHP':page.locator('#project-source').input_value()}
 def result():return page.get_by_text('完整 ProjectAnalysis JSON',exact=True).locator('..').locator('pre').text_content()
 before=inputs();dto=result();assert len(before['filenames'])==12
 page.locator('.reading-workspace').screenshot(path=str(out/'before-project.png'))
 page.get_by_label('工作台工具',exact=True).locator('summary').click()
 page.get_by_role('button',name='單檔練習',exact=True).click()
 back=page.get_by_role('button',name='返回多檔閱讀',exact=True);expect(back).to_be_visible();expect(reading).not_to_be_visible()
 page.screenshot(path=str(out/'single-tool.png'))
 back.click();expect(reading).to_be_visible()
 after=inputs();dtoAfter=result();assert before==after and dto==dtoAfter
 assert original.evaluate('(e)=>e.isConnected') and reading.evaluate('(e,original)=>e===original',original)
 expect(page.locator('.summary-card')).to_contain_text('12 / 12 份已套用 · 0 筆診斷')
 expect(page.locator('.reading-workspace .schema-graph')).to_contain_text('5 張資料表 · 3 個外鍵關係')
 page.locator('.reading-workspace').screenshot(path=str(out/'after-project.png'))
 assert not console and not pageerrors and not http,{'console':console,'pageerrors':pageerrors,'http':http}
 report={'task':'COORD29 / R8.1 short batch B','taskGroups':1,'productSHA':sha,'cleanBefore':True,'expected':'Analyzed commerce project -> single-file tool -> direct return retains same-page multi-file inputs and analyzed result, without editing single-file input','actual':{'inputCount':12,'filenames':before['filenames'],'inputPreserved':before==after,'selectedPHPSHA256':hashlib.sha256(before['selectedPHP'].encode()).hexdigest(),'dtoPreserved':dto==dtoAfter,'dtoSHA256Before':hashlib.sha256(dto.encode()).hexdigest(),'dtoSHA256After':hashlib.sha256(dtoAfter.encode()).hexdigest(),'sameResultDOMRetained':True,'projectHiddenInSingleMode':True,'returnedResult':'12/12 applied, 0 diagnostics, 5 tables, 3 foreign keys'},'result':'passed','consoleWarningsErrors':console,'pageerrors':pageerrors,'httpErrors':http,'browser':b.version,'playwright':'1.62.0','viewport':{'width':1440,'height':1000},'url':'http://127.0.0.1:5205/','finishedAtTaipei':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(),'otherChecks':'Unrun: other examples, imports, diagnostics, input invalidation, narrow/keyboard, R7/IR, full verify, R8.2-6; no downloads'}
 (out/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False));b.close()
assert not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
