import json,hashlib,subprocess,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
out=Path('artifacts/coord33-r81-e');sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
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
 page.get_by_role('button',name='分析專案',exact=True).click()
 reading=page.get_by_label('專案閱讀結果',exact=True);expect(reading).to_be_visible()
 expect(page.locator('.summary-card')).to_contain_text('12 / 12 份已套用 · 0 筆診斷')
 page.locator('details.input-management > summary').click()
 items=page.locator('.input-management .migration-list button');before=items.all_text_contents();assert len(before)==12
 removed='2026_10_04_000012_rename_index.php'
 assert page.locator('#migration-filename').input_value()==removed
 inputHashes={}
 for name in before:
  items.get_by_text(name,exact=True).click()
  inputHashes[name]=hashlib.sha256(page.locator('#project-source').input_value().encode()).hexdigest()
 items.get_by_text(removed,exact=True).click()
 page.screenshot(path=str(out/'before-remove.png'))
 page.get_by_role('button',name='移除此檔',exact=True).click()
 after=items.all_text_contents();assert len(after)==11 and after==[n for n in before if n!=removed]
 expect(reading).to_have_count(0);expect(page.locator('.reading-workspace')).to_have_count(0)
 assert page.locator('.project-results').count()==0 and page.locator('.summary-card').count()==0
 expect(page.locator('.input-panel')).to_contain_text('示範輸入 · 11 份 · 未修改')
 expect(page.locator('.input-panel')).to_contain_text('尚無有效結果，請分析專案')
 afterHashes={}
 for name in after:
  items.get_by_text(name,exact=True).click()
  afterHashes[name]=hashlib.sha256(page.locator('#project-source').input_value().encode()).hexdigest()
 assert afterHashes=={n:h for n,h in inputHashes.items() if n!=removed}
 assert disk()==originalDisk
 page.screenshot(path=str(out/'after-remove-invalidated.png'))
 assert not console and not errors and not http
 report={'task':'COORD33 / R8.1 short batch E','taskGroups':1,'productSHA':sha,'cleanBefore':True,'expected':'Remove only browser-copy rename_index from analyzed commerce: 11 exact remaining inputs with unchanged PHP; old result/workspace removed; disk unchanged','actual':{'precondition':'12/12 applied, 0 diagnostics','removedFilename':removed,'inputCountBefore':12,'inputCountAfter':11,'remainingFilenames':after,'exactRemovedFileAbsent':True,'remainingInputHashesPreserved':True,'oldResultDOMCount':0,'oldWorkspaceDOMCount':0,'oldSummaryDOMCount':0,'requiresReanalysis':True,'diskHashesUnchanged':True},'remainingBrowserPHPSHA256':afterHashes,'diskSHA256':originalDisk,'result':'passed','consoleWarningsErrors':console,'pageerrors':errors,'httpErrors':http,'browser':b.version,'playwright':'1.62.0','url':'http://127.0.0.1:5205/','finishedAtTaipei':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(),'scope':'One browser-copy removal only; no reanalysis/restore/reimport or other tasks; selecting remaining inputs is read-only content preservation check'}
 (out/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('One removal group passed; 11 inputs retained; old result removed; disk and console clean');b.close()
assert not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
