import json,hashlib,subprocess,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
out=Path('artifacts/coord34-r81-f');sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
assert sha=='f9b42c8c220841d40978db48969feaba8c52dc43' and not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
fixtures=Path('packages/migration-core/tests/fixtures/commerce');paths=[fixtures/'2026_10_04_000001_create_users.php',fixtures/'2026_10_04_000002_create_products.php']
originals={p.name:p.read_bytes() for p in paths};texts={n:data.decode('utf-8',errors='strict') for n,data in originals.items()};hashes={n:hashlib.sha256(data).hexdigest() for n,data in originals.items()}
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
 page.screenshot(path=str(out/'before-reimport.png'))
 page.get_by_label('匯入 PHP 檔案（取代目前清單）',exact=True).set_input_files([str(p.resolve()) for p in paths])
 expect(page.locator('.input-panel')).to_contain_text('匯入輸入 · 2 份 · 未修改')
 expect(reading).to_have_count(0);expect(page.locator('.reading-workspace')).to_have_count(0)
 assert page.locator('.project-results').count()==0 and page.locator('.summary-card').count()==0
 expect(page.locator('.input-panel')).to_contain_text('尚無有效結果，請分析專案')
 page.locator('details.input-management > summary').click()
 items=page.locator('.input-management .migration-list button');names=items.all_text_contents();assert names==list(texts)
 browserHashes={}
 for name in names:
  items.get_by_text(name,exact=True).click()
  assert page.locator('#migration-filename').input_value()==name
  content=page.locator('#project-source').input_value();assert content==texts[name]
  browserHashes[name]=hashlib.sha256(content.encode()).hexdigest()
 assert browserHashes==hashes
 assert all(p.read_bytes()==originals[p.name] for p in paths)
 page.screenshot(path=str(out/'after-reimport-invalidated.png'))
 assert not console and not errors and not http
 report={'task':'COORD34 / R8.1 short batch F','taskGroups':1,'productSHA':sha,'cleanBefore':True,'expected':'Existing multi-file import replaces analyzed 12-file commerce with exactly two selected valid UTF-8 fixtures and their original contents; prior results/workspace removed; reanalysis required','actual':{'precondition':'12/12 applied, 0 diagnostics','importCount':1,'contract':'replace, not append','inputCountAfter':2,'filenames':names,'browserPHPMatchesSelectedFiles':True,'browserPHPSHA256':browserHashes,'oldResultDOMCount':0,'oldWorkspaceDOMCount':0,'oldSummaryDOMCount':0,'requiresReanalysis':True,'diskUnchanged':True},'sourceFiles':[{'path':str(p),'sha256':hashes[p.name],'bytes':len(originals[p.name])} for p in paths],'result':'passed','consoleWarningsErrors':console,'pageerrors':errors,'httpErrors':http,'browser':b.version,'playwright':'1.62.0','url':'http://127.0.0.1:5205/','finishedAtTaipei':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(),'scope':'One reimport only; normal UTF-8 files are prerequisites, not full UTF-8/folder/path validation; no analysis after reimport'}
 (out/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('One reimport group passed; exactly 2 selected inputs, original bytes, old result removed, console clean');b.close()
assert not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
