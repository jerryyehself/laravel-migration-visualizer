import json,hashlib,subprocess,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
out=Path('artifacts/coord31-r81-d');sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
assert sha=='f9b42c8c220841d40978db48969feaba8c52dc43' and not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
def disk():return {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(Path('packages/migration-core/tests/fixtures/commerce').glob('*.php'))}
originalDisk=disk()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000},locale='zh-TW');console=[];errors=[];http=[]
 page.on('console',lambda m:console.append(m.text) if m.type in ['warning','error'] else None)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 assert page.goto('http://127.0.0.1:5205/').status==200
 page.locator('details.sample-menu > summary').click();page.locator('#project-example').select_option(label='載入訂單系統範例（12 檔）（示範）')
 page.locator('details.input-management > summary').click()
 editor=page.locator('#project-source');original=editor.input_value();filename=page.locator('#migration-filename').input_value()
 names=page.locator('.input-management .migration-list button').all_text_contents();assert len(names)==12
 addition='\n// COORD31 analyzable browser copy\n';editor.fill(original+addition)
 page.get_by_role('button',name='分析專案',exact=True).click()
 reading=page.get_by_label('專案閱讀結果',exact=True);expect(reading).to_be_visible()
 expect(page.locator('.summary-card')).to_contain_text('12 / 12 份已套用 · 0 筆診斷')
 assert editor.input_value()==original+addition
 page.locator('details.input-management > summary').click()
 restore=page.get_by_role('button',name='還原此檔至載入版本',exact=True);expect(restore).to_be_enabled()
 page.screenshot(path=str(out/'before-restore-analyzed-copy.png'))
 restore.click()
 assert editor.input_value()==original and page.locator('#migration-filename').input_value()==filename
 expect(reading).to_have_count(0);expect(page.locator('.reading-workspace')).to_have_count(0)
 assert page.locator('.project-results').count()==0 and page.locator('.summary-card').count()==0
 expect(page.locator('.input-panel')).to_contain_text('示範輸入 · 12 份 · 未修改')
 expect(page.locator('.input-panel')).to_contain_text('尚無有效結果，請分析專案')
 expect(restore).to_be_disabled()
 assert page.locator('.input-management .migration-list button').all_text_contents()==names
 assert disk()==originalDisk
 page.screenshot(path=str(out/'after-restore-invalidated.png'))
 assert not console and not errors and not http
 report={'task':'COORD31 / R8.1 short batch D','taskGroups':1,'productSHA':sha,'cleanBefore':True,'expected':'Restore currently analyzed edited browser copy: original PHP restored, prior results/workspace removed, input list retained, disk unchanged','actual':{'modifiedFilename':filename,'appendedComment':addition,'analyzedEditedCopy':'12/12 applied, 0 diagnostics','originalPHPRecovered':True,'originalFilenamePreserved':True,'originalPHPSHA256':hashlib.sha256(original.encode()).hexdigest(),'oldResultDOMCount':0,'oldWorkspaceDOMCount':0,'oldSummaryDOMCount':0,'inputCount':12,'inputListPreserved':True,'unmodifiedStatus':True,'restoreDisabledAfter':True,'requiresReanalysis':True,'diskHashesUnchanged':True},'diskSHA256':originalDisk,'result':'passed','consoleWarningsErrors':console,'pageerrors':errors,'httpErrors':http,'browser':b.version,'playwright':'1.62.0','url':'http://127.0.0.1:5205/','finishedAtTaipei':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(),'scope':'Only restore invalidation; analysis of edited copy is necessary precondition; no analysis after restore or other checks'}
 (out/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False));b.close()
assert not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
