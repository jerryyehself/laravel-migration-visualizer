"""R8.5 real Chromium checks; no downloads or dependency changes."""
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
 def example(i,step=0):
  if not page.locator('.sample-menu').evaluate('(e)=>e.open'):page.locator('.sample-menu > summary').click()
  page.locator('#project-example').select_option(str(i));page.get_by_role('button',name='分析專案',exact=True).click();page.locator('.reading-workspace .migration-list button').nth(step).click()
 def control(s):return page.locator('.workspace-controls').get_by_role('button',name=s,exact=True)
 def column(name):page.get_by_label('搜尋目前快照欄位',exact=True).fill(name);page.get_by_role('button',name=f'查看欄位 users.{name}',exact=True).click()
 def sources():
  d=page.locator('.workspace-sources')
  if not d.evaluate('(e)=>e.open'):d.locator('> summary').click()
  return d
 def advanced():
  d=page.locator('.advanced-analysis')
  if not d.evaluate('(e)=>e.open'):d.locator('> summary').focus();d.locator('> summary').press('Enter')
  return d
 example(1,1);column('display_name');control('前後比較').click()
 assert page.locator('.operation-source-list').count()==1
 assert not page.locator('.workspace-sources').evaluate('(e)=>e.open')
 for label in ['套用前','套用後']:
  d=page.get_by_label(label+'資料表明細',exact=True);expect(d).to_contain_text('欄位 ·');expect(d).to_contain_text('索引 ·');expect(d).to_contain_text('外鍵 ·');assert d.locator('.operation-source-list').count()==0
 expect(page.get_by_label('套用前資料表明細',exact=True)).to_contain_text('此側沒有欄位 display_name')
 record('comparison keeps columns/indexes/FK first, own-side absence and one closed complete source list')
 page.get_by_role('button',name='相關變更',exact=True).focus();page.get_by_role('button',name='相關變更',exact=True).press('Enter');expect(page.get_by_label('名稱相關步驟',exact=True)).to_be_focused()
 page.get_by_role('button',name='結構明細',exact=True).press('Enter');expect(page.get_by_label('目前閱讀側別結構明細',exact=True)).to_be_focused()
 page.get_by_role('button',name='PHP 來源',exact=True).press('Enter');expect(page.locator('.workspace-sources > summary')).to_be_focused()
 control('進階分析').press('Enter');expect(page.locator('.advanced-analysis > summary')).to_be_focused();page.locator('.advanced-analysis > summary').press('Enter')
 record('keyboard shortcut entries directly reach structure/related/source/advanced regions without changing reading')
 s=sources();expect(s).to_contain_text('完整分析來源包含後續步驟');expect(s).to_contain_text('第 3 份 · 靜態已套用 · 目前時點之後的來源（未表示已套用）')
 control('套用前').click();expect(sources()).to_contain_text('第 2 份 · 靜態已套用 · 目前時點之後的來源');control('前後比較').click()
 record('complete analysis order distinguishes future and current-step-before operations from current applied structure')
 header=page.locator('.workspace-controls').inner_text();query=page.get_by_label('搜尋目前快照欄位',exact=True).input_value();view=page.locator('.erd-canvas > g').evaluate_all('(es)=>es.map(e=>e.getAttribute("transform"))')
 origin=s.get_by_role('button',name='查看 PHP 來源',exact=False).last.element_handle();origin.click();expect(page.get_by_label('結構操作原始碼',exact=True)).to_contain_text('PHP 唯讀')
 s.evaluate('(e)=>e.open=false');page.get_by_role('button',name='返回原結構選取',exact=True).focus();page.get_by_role('button',name='返回原結構選取',exact=True).press('Enter')
 assert s.evaluate('(e)=>e.open') and origin.evaluate('(e)=>e===document.activeElement');assert header==page.locator('.workspace-controls').inner_text();assert query==page.get_by_label('搜尋目前快照欄位',exact=True).input_value();assert view==page.locator('.erd-canvas > g').evaluate_all('(es)=>es.map(e=>e.getAttribute("transform"))')
 record('readonly preview returns through collapsed source ancestor preserving step/side/literal/query/view/focus')
 page.get_by_label('跨表屬性變更摘要',exact=True).get_by_role('button',name='查看涉及此名稱的 PHP 操作',exact=True).first.focus();page.get_by_label('跨表屬性變更摘要',exact=True).get_by_role('button',name='查看涉及此名稱的 PHP 操作',exact=True).first.press('Enter')
 expect(page.locator('.workspace-sources > summary')).to_be_focused();assert page.locator('.operation-source-list').count()==1
 record('summary source entry uses the same single list with keyboard discoverable focus')
 assert not page.locator('.advanced-analysis').evaluate('(e)=>e.open');expect(page.get_by_label('跨表屬性變更摘要',exact=True)).to_be_visible()
 d=advanced();expect(d).to_contain_text('Schema Before（套用前）');expect(d).to_contain_text('Schema After（套用後）');expect(d).to_contain_text('第 2 份')
 d.get_by_text('完整快照、diff 與 operations',exact=True).click();expect(d.get_by_role('heading',name='SchemaDiff',exact=True)).to_be_visible()
 record('advanced is closed by default while main summary remains visible; historical tables have explicit step and side')
 d.get_by_text('分析工具：JSON 匯出',exact=True).click();expect(d.get_by_role('button',name='下載完整分析 JSON',exact=True)).to_be_enabled();expect(d.get_by_role('button',name='下載最終 Schema JSON',exact=True)).to_be_enabled()
 d.get_by_text('完整 ProjectAnalysis JSON',exact=True).click();serialized=d.locator('details').filter(has=page.locator('summary',has_text='完整 ProjectAnalysis JSON')).last.locator('pre').inner_text()
 page.get_by_label('搜尋 ERD 資料表',exact=True).fill('no-match');page.get_by_role('button',name='放大 ERD',exact=True).click();assert d.locator('details').filter(has=page.locator('summary',has_text='完整 ProjectAnalysis JSON')).last.locator('pre').inner_text()==serialized
 record('both export controls remain available and full DTO is byte-identical after query/view changes; no download performed')
 example(3,1);expect(page.get_by_role('heading',name='專案分析未完成',exact=True)).to_be_visible();assert not page.locator('.advanced-analysis').evaluate('(e)=>e.open');d=advanced();d.get_by_text('分析工具：JSON 匯出',exact=True).click();expect(d.get_by_role('button',name='下載最終 Schema JSON',exact=True)).to_be_disabled();expect(d.get_by_role('button',name='下載完整分析 JSON',exact=True)).to_be_enabled();expect(d).to_contain_text('最後可信 Schema · 僅成功前綴，非最終')
 d.locator('.all-diagnostics > summary').click();expect(d.locator('.all-diagnostics .diagnostic').first).to_be_visible()
 record('failed project keeps primary incomplete boundary visible; advanced diagnostics/prefix stay distinct and final export disabled')
 # Input buffers, not downloads: check explicit values in actual rendered details.
 if not page.locator('.input-management').evaluate('(e)=>e.open'):page.locator('.input-management > summary').click()
 php="<?php return new class extends Migration {function up(){Schema::create('users',function($t){$t->boolean('flag')->default(false);$t->integer('zero')->default(0);$t->string('nil')->nullable()->default(null);$t->string('plain');$t->enum('kind',['b','a']);});}};"
 page.locator('#migration-files').set_input_files([{'name':'2026_10_11_000001_values.php','mimeType':'text/x-php','buffer':php.encode()}]);page.get_by_role('button',name='分析專案',exact=True).click();page.get_by_role('button',name='聚焦資料表 users',exact=True).click()
 inspector=page.locator('.workspace-details .table-inspector');expect(inspector.locator('.column-detail').filter(has=page.get_by_role('heading',name='flag · boolean',exact=True))).to_contain_text('false');expect(inspector).to_contain_text('預設值（default）');expect(inspector).to_contain_text('NULL');expect(inspector).to_contain_text('預設值：未指定');expect(inspector).to_contain_text('"b" → "a"')
 record('actual input renders Chinese labels and explicit null/false/zero/absence plus ordered allowed values')
 page.set_viewport_size({'width':390,'height':844});column('flag');s=sources();s.locator('> summary').focus();s.locator('> summary').press('Enter');s.locator('> summary').press('Enter');origin=s.get_by_role('button',name='查看 PHP 來源',exact=False).first;origin.focus();origin.press('Enter');page.get_by_role('button',name='返回原結構選取',exact=True).press('Enter');expect(origin).to_be_focused();d=advanced();expect(d.get_by_text('分析工具：JSON 匯出',exact=True)).to_be_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');Path('artifacts').mkdir(exist_ok=True);page.locator('.workspace-details').evaluate('(e)=>e.scrollIntoView({block:"start"})');page.screenshot(path='artifacts/r8-5-narrow.png')
 record('390px keyboard discovers details/sources/advanced and restores focused origin without horizontal overflow')
 page.set_viewport_size({'width':1440,'height':1100});page.locator('.workspace-details').evaluate('(e)=>e.scrollIntoView({block:"start"})');page.screenshot(path='artifacts/r8-5-desktop.png')
 if not page.locator('.input-management').evaluate('(e)=>e.open'):page.locator('.input-management > summary').click()
 page.locator('#project-source').fill(php+'\n//changed');assert page.locator('.reading-workspace').count()==0;assert page.locator('.advanced-analysis').count()==0
 record('true copy modification invalidates source/details/advanced with the analysis generation')
 # Render the existing readonly preview in a real DOM for source metadata boundaries
 # that supported core operations normally locate precisely. No parser/DTO changes.
 probe=page.evaluate("""async () => {
   const React=(await import('/node_modules/.vite/deps/react.js')).default;
   const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
   const {OperationSourcePanel}=await import('/src/components/OperationSources.tsx');
   const host=document.createElement('div');host.id='source-boundary-probe';document.body.append(host);
   window.sourceBoundaryRoot=createRoot(host);
   window.renderSourceBoundary=(mode)=>{
     const file={filename:'probe.php',source:'<?php\\n// readonly opening'};
     const hit={migrationIndex:0,operationIndex:0,filename:'probe.php',status:'applied',operation:{kind:'createTable'},source:{file:mode==='missing'?'unknown.php':'probe.php',line:0,column:0}};
     window.sourceBoundaryRoot.render(React.createElement(OperationSourcePanel,{hit,files:mode==='ambiguous'?[file,file]:[file],onBack:()=>{}}));
   };
   window.renderSourceBoundary('ambiguous');return true;
 }""")
 host=page.locator('#source-boundary-probe');expect(host).to_contain_text('來源檔案未知或不唯一');assert host.get_by_label('結構操作 PHP 片段',exact=True).count()==0
 page.evaluate("window.renderSourceBoundary('missing')");expect(host).to_contain_text('來源檔案未知或不唯一')
 record('real readonly preview refuses ambiguous and missing files without basename guesses')
 page.evaluate("window.renderSourceBoundary('line-unknown')");expect(host).to_contain_text('來源行未知；以下僅顯示檔案開頭');expect(host.get_by_label('結構操作 PHP 片段',exact=True)).to_be_visible();assert host.locator('.highlighted').count()==0
 page.evaluate("window.sourceBoundaryRoot.unmount();document.querySelector('#source-boundary-probe').remove()")
 record('unknown source line shows file opening only with no fabricated highlighted line')
 assert not errors,errors
 browser.close()
Path('artifacts/r8-5-browser.json').write_text(json.dumps({'commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'passed':checks,'consoleErrors':errors},ensure_ascii=False,indent=2)+'\n')
