"""R8.6 development integration matrix, actual Chromium and observed UI evidence.
No download interaction. Run from repo root with existing Vite/Chromium.
"""
import json,os,subprocess,hashlib,datetime
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
clean=not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
out=Path('artifacts/r8-6');out.mkdir(parents=True,exist_ok=True)
report={'batch':'COORD-20261011-20 / R8.6 development self-check only','commit':commit,'clean':clean,'lastProductChange':'ce16e471573cbf0762ad13293f715eefb61b28f7','startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'tasks':[],'consoleErrors':[],'independentAcceptance':'pending'}
def save(): (out/'integration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
def record(id,expected,observed,screenshots=[]):
 report['tasks'].append({'id':id,'expected':expected,'observed':observed,'screenshots':screenshots});save();print(id,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1100})
 page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type in ['error','warning'] else None)
 page.on('pageerror',lambda e:report['consoleErrors'].append(str(e)))
 page.goto(os.environ.get('LMV_TEST_URL','http://127.0.0.1:5202'))
 def manage():
  if not page.locator('.input-management').evaluate('(e)=>e.open'):page.locator('.input-management > summary').click()
 def example(i,step=0):
  if not page.locator('.sample-menu').evaluate('(e)=>e.open'):page.locator('.sample-menu > summary').click()
  page.locator('#project-example').select_option(str(i));page.get_by_role('button',name='分析專案',exact=True).click();page.locator('.reading-workspace .migration-list button').nth(step).click()
 def control(s):return page.locator('.workspace-controls').get_by_role('button',name=s,exact=True)
 def header():return page.locator('.workspace-controls').inner_text()
 def summary():return page.get_by_label('跨表屬性變更摘要',exact=True)
 def related():return page.get_by_label('名稱相關步驟',exact=True)
 def rows():return related().locator('ol > li')
 def lookup(table,column=''):
  related().get_by_label('精確資料表名稱',exact=True).fill(table);related().get_by_label('精確欄位名稱（留空查整表）',exact=True).fill(column);related().get_by_role('button',name='查詢名稱相關步驟',exact=True).click()
 def sources():
  d=page.locator('.workspace-sources')
  if not d.evaluate('(e)=>e.open'):d.locator('> summary').click()
  return d
 def advanced():
  control('進階分析').click();return page.locator('.advanced-analysis')
 def column(name):page.get_by_label('搜尋目前快照欄位',exact=True).fill(name);page.get_by_role('button',name=f'查看欄位 users.{name}',exact=True).click()
 def view():return page.locator('.erd-canvas > g').evaluate_all('(es)=>es.map(e=>e.getAttribute("transform"))')
 def shot(name,target):target.evaluate('(e)=>e.scrollIntoView({block:"start"})');page.screenshot(path=str(out/name));return name
 # 1. Main flow and tool round trip, using real mounted multi-file copies.
 assert not page.locator('#project-source').is_visible();assert page.locator('#project-example option').count()==12
 example(1,1);column('nickname');manage();bytes0=page.locator('#project-source').input_value();names0=page.get_by_label('待分析檔案（輸入順序）',exact=True).inner_text();page.locator('.input-management > summary').click();h=header();v=view()
 tool=page.locator('nav[aria-label="工作台工具"] summary');tool.focus();tool.press('Enter');page.get_by_role('button',name='單檔練習',exact=True).click();assert not page.locator('.reading-workspace').is_visible();page.get_by_role('button',name='返回多檔閱讀',exact=True).press('Enter');expect(tool).to_be_focused();assert header()==h and view()==v;manage();assert bytes0==page.locator('#project-source').input_value() and names0==page.get_by_label('待分析檔案（輸入順序）',exact=True).inner_text();page.locator('.input-management > summary').click()
 record('主流程','11示範單入口／不用先編PHP；工具返回保多檔副本與結果',{'exampleOptions':11,'files':3,'reading':h,'sourceBytesSHA256':hashlib.sha256(bytes0.encode()).hexdigest(),'inputNames':names0,'toolReturnFocus':True,'readingAndViewPreserved':True})
 # 2. Price: read visible summary before any full JSON entry.
 example(2,6);s=summary();text=s.inner_text()
 for token in ['decimal(8,2)','decimal(10,2)','Before false','After true','Before 未指定','After 0']:assert token in text
 assert not page.locator('.advanced-analysis').evaluate('(e)=>e.open')
 s.get_by_role('button',name='After · price · 查看明細',exact=True).click();page.get_by_role('button',name='放大 ERD',exact=True).click();h=header();v=view();s.get_by_role('button',name='查看涉及此名稱的 PHP 操作',exact=True).first.click();origin=sources().get_by_role('button',name='查看 PHP 來源',exact=False).last;origin.click();page.get_by_role('button',name='返回原結構選取',exact=True).click();expect(origin).to_be_focused();assert header()==h and view()==v
 record('屬性變更','price 8,2→10,2／nullable false→true／default未指定→0，來源返回保欄位與view',{'summary':text,'advancedWasClosed':True,'returnedReading':h,'returnedView':v,'sourceFocusRestored':True},[shot('desktop-price.png',summary())])
 # 3. Own-side horizontal FK navigation.
 example(5,2);s=summary();text=s.inner_text();ops=page.locator('.migration-reading ol').inner_text()
 for token in ['所屬表 · users','所屬表 · posts','posts_user_id_foreign','posts_author_fk','user_key','author_id']:assert token in text
 assert 'renameColumn' in ops
 old=s.locator('article').filter(has=page.locator('h5',has_text='posts_user_id_foreign'));new=s.locator('article').filter(has=page.locator('h5',has_text='posts_author_fk'))
 old.get_by_role('button',name='Before · 引用欄位 users.id · 查看明細',exact=True).click();expect(page.locator('.workspace-controls')).to_contain_text('套用前');expect(page.locator('.workspace-details')).to_contain_text('目前欄位名稱：id')
 new.get_by_role('button',name='After · 引用欄位 users.user_key · 查看明細',exact=True).click();expect(page.locator('.workspace-controls')).to_contain_text('套用後');expect(page.locator('.workspace-details')).to_contain_text('目前欄位名稱：user_key')
 record('橫向','同檔users/posts名稱操作、舊新FK與ordered關係欄位，各側可信導航',{'summary':text,'syntaxOperations':ops,'beforeReference':'users.id','afterReference':'users.user_key','noIdentityInference':True},[shot('desktop-foreign-keys.png',summary())])
 # 4. Exact nickname longitudinal steps plus returned source context.
 example(1,1);column('nickname');page.get_by_role('button',name='查看此名稱相關步驟 users.nickname',exact=True).click();assert rows().count()==2;indices=rows().evaluate_all('(es)=>es.map(e=>Number(e.dataset.migrationIndex))');assert indices==[1,2]
 expect(rows().nth(0)).to_contain_text('columnAdded');expect(rows().nth(1)).to_contain_text('columnRemoved');text=related().inner_text();h=header();v=view();origin=rows().nth(1).get_by_role('button',name='查看相關 PHP',exact=False).first;origin.press('Enter');page.get_by_role('button',name='返回原結構選取',exact=True).click();expect(origin).to_be_focused();assert h==header() and v==view();rows().nth(1).get_by_role('button',name='查看此步比較',exact=True).click();expect(page.locator('.workspace-details')).to_contain_text('目前欄位名稱：nickname');expect(page.locator('.workspace-details')).to_contain_text('此側沒有欄位 nickname')
 record('縱深','nickname只列第二新增／第三移除；跳步保持已刪literal和來源focus',{'coreIndices':indices,'relatedRows':text,'removedNameRetained':True,'sourceReturnedToOriginalStep':h},[shot('desktop-related.png',related())])
 # 5. Explicit syntax rename and same-name rebuild remain separate from net diff.
 lookup('users','display_name');text=related().inner_text();expect(rows().nth(0)).to_contain_text('renameColumn');expect(rows().nth(1)).to_contain_text('dropColumn');expect(rows().nth(1)).to_contain_text('addColumn');expect(rows().nth(1)).to_contain_text('columnChanged');control('套用後').click();expect(summary()).to_contain_text('columnChanged')
 record('同名重建','display_name明確rename、後續drop/add和淨columnChanged分開，不串identity',{'relatedRows':text,'netSummary':summary().inner_text(),'literal':'users.display_name'})
 # 6. Whole-table content and known-empty final, exact rename literals.
 example(7,0);summary().get_by_text('整表新增的已知內容',exact=True).first.click();add=summary().inner_text();assert 'tableAdded' in add and '並非額外的 core 差異' in add
 lookup('users','id');oldLiteral=related().inner_text();assert 'renameTable' in oldLiteral and 'drop_members.php' not in oldLiteral
 lookup('members','id');newLiteral=related().inner_text();assert 'tableRemoved' in newLiteral
 page.locator('.reading-workspace .migration-list button').nth(3).click();summary().get_by_text('整表移除的已知內容',exact=True).click();remove=summary().inner_text();assert 'tableRemoved' in remove;control('最終結構').click();expect(page.locator('.workspace-center')).to_contain_text('沒有資料表');assert page.locator('.schema-graph').count()==1
 record('整表增刪','known整表內容不是额外corechange；users/members literal不自動接續；空final有別unknown',{'addedKnownContents':add,'removedBeforeContents':remove,'usersQuery':oldLiteral,'membersQuery':newLiteral,'finalKnownEmpty':True})
 # 7. Fixed R6 PHP bytes and failure prefix boundaries, not compatibility expansion.
 inventory=json.loads(Path('docs/research/r1-samples.json').read_text());baselines=json.loads(Path('docs/research/r6-sample-results.json').read_text())['samples'];observed=[]
 for sample,count,applied,blocked in [('laravelio',9,2,6),('bookstack',103,0,102)]:
  baseline=next(item for item in baselines if item['id']==sample);inv=next(item for item in inventory if item['repo']==baseline['repo']);phpfiles=[item for item in inv['files'] if item['path'].endswith('.php')];assert len(phpfiles)==count
  paths=[]
  for file in phpfiles:
   path=Path('artifacts/research-inputs')/sample/file['path'];assert hashlib.sha256(path.read_bytes()).hexdigest()==file['sha256'];paths.append(str(path.resolve()))
  manage();page.locator('#migration-files').set_input_files(paths);page.get_by_role('button',name='分析專案',exact=True).click();assert page.locator('.schema-graph').count()==0;expect(page.get_by_role('heading',name='專案分析未完成',exact=True)).to_be_visible()
  badges=page.locator('.reading-workspace .migration-list .badge').all_text_contents();counts={'applied':badges.count('已套用'),'failed':badges.count('失敗'),'blocked':badges.count('已阻擋')};assert counts=={'applied':applied,'failed':1,'blocked':blocked}
  page.locator('.reading-workspace .migration-list button').nth(applied).click();failAfter=page.locator('.workspace-details').inner_text();assert '此側快照未知' in failAfter;control('套用前').click();before=page.locator('.workspace-center').inner_text();assert page.locator('.schema-graph').count()==1;control('下一份 migration').click();expect(page.locator('.migration-reading')).to_contain_text('Before 未知 · After 未知');blockedText=page.locator('.migration-reading').inner_text()
  d=advanced();d.get_by_text('分析工具：JSON 匯出',exact=True).click();expect(d.get_by_role('button',name='下載最終 Schema JSON',exact=True)).to_be_disabled();expect(d).to_contain_text('最後可信 Schema · 僅成功前綴，非最終')
  observed.append({'id':sample,'repo':inv['repo'],'upstreamCommit':inv['commit'],'phpHashesMatched':len(paths),'counts':counts,'finalUnknown':True,'failedAfter':failAfter[:1800],'failedBefore':before[:1800],'blockedSyntax':blockedText[:1800],'finalExportDisabled':True})
 record('未完成','Laravel.io2/1/6／BookStack0/1/102；failed before已知、after/blocked/final未知，禁止prefix替代',{'samples':observed})
 # 8. Continuous literal/query/geometry plus comparison own-side search and future sources.
 example(1,1);column('display_name');page.get_by_role('button',name='放大 ERD',exact=True).click();node=page.get_by_role('button',name='選取或移動資料表 users',exact=True);node.focus();node.press('ArrowRight');position=node.get_attribute('transform');v=view();control('下一份 migration').click();assert view()==v and node.get_attribute('transform')==position;expect(page.get_by_label('搜尋目前快照欄位',exact=True)).to_have_value('display_name');control('前一份 migration').click();assert view()==v
 control('前後比較').click();page.get_by_label('比較搜尋側別',exact=True).select_option('before');assert page.get_by_role('button',name='查看欄位 users.display_name',exact=True).count()==0;page.get_by_label('比較搜尋側別',exact=True).select_option('after');page.get_by_role('button',name='查看欄位 users.display_name',exact=True).click();assert len(view())==2 and view()[0]==view()[1];expect(page.get_by_label('套用前資料表明細',exact=True)).to_contain_text('此側沒有欄位 display_name')
 assert page.locator('.operation-source-list').count()==1;sourceText=sources().inner_text();assert '第 3 份 · 靜態已套用 · 目前時點之後的來源' in sourceText
 h=header();page.locator('#result-query').fill('create_users');assert h in header();expect(page.locator('.workspace-controls')).to_contain_text('目前閱讀步驟不在篩選清單');page.locator('#result-query').fill('')
 d=advanced();d.get_by_text('完整 ProjectAnalysis JSON',exact=True).click();dto=d.locator('details').filter(has=page.locator('summary',has_text='完整 ProjectAnalysis JSON')).last.locator('pre').inner_text();page.get_by_label('搜尋 ERD 資料表',exact=True).fill('no-match');page.get_by_role('button',name='縮小 ERD',exact=True).click();assert dto==d.locator('details').filter(has=page.locator('summary',has_text='完整 ProjectAnalysis JSON')).last.locator('pre').inner_text();d.get_by_text('完整快照、diff 與 operations',exact=True).click();expect(d).to_contain_text('Schema Before（套用前）');expect(d).to_contain_text('Schema After（套用後）')
 record('連續與搜尋','欄/query/view/手動位置跨步保留；compare各側重算、單一來源未来時點、filter不改時點；進階DTO不受query/view改變',{'literal':'users.display_name','manualTransform':position,'sharedView':view(),'completeSource':sourceText,'dtoSHA256':hashlib.sha256(dto.encode()).hexdigest(),'dtoBytesInvariant':True,'ownBeforeColumnAbsent':True})
 # 9. Real input gestures / keyboard / 390px / source return collapsed and invalid.
 page.set_viewport_size({'width':390,'height':844});example(1,1);column('display_name');node=page.get_by_role('button',name='選取或移動資料表 users',exact=True);node.focus();node.press('Space');node.press('ArrowDown');box=node.bounding_box();position=node.get_attribute('transform');page.mouse.move(box['x']+25,box['y']+15);page.mouse.down();page.mouse.move(box['x']+50,box['y']+40,steps=5);page.mouse.up();assert node.get_attribute('transform')!=position
 source=sources();origin=source.get_by_role('button',name='查看 PHP 來源',exact=False).first.element_handle();h=header();v=view();origin.click();source.evaluate('(e)=>e.open=false');page.get_by_role('button',name='返回原結構選取',exact=True).press('Enter');assert origin.is_visible() and origin.evaluate('(e)=>e===document.activeElement') and h==header() and v==view()
 origin.click();origin.evaluate('(e)=>e.style.display="none"');page.get_by_role('button',name='返回原結構選取',exact=True).click();notice=page.get_by_role('status').filter(has_text='原結構選取已失效');expect(notice).to_be_focused();origin.evaluate('(e)=>e.style.display=""');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 image=shot('narrow-reading.png',page.locator('.workspace-details'));record('可達與回歸','點擊/拖曳/Space/方向鍵、390px、collapsed祖先返回與invalid origin聚焦提示、無console錯誤',{'width':390,'noHorizontalOverflow':True,'dragMovedTable':True,'collapsedReturnedFocus':True,'invalidOriginNotice':notice.inner_text(),'contextPreserved':h},[image])
 # 10. Every true input change invalidates analysis; fold/tools/filter do not.
 changes=[]
 for mode in ['filename','php','remove','restore','import']:
  example(1,1);column('nickname');origin=sources().get_by_role('button',name='查看 PHP 來源',exact=False).first;origin.click();manage()
  if mode=='filename':page.locator('#migration-filename').fill('invalid.php')
  elif mode=='php':page.locator('#project-source').fill(page.locator('#project-source').input_value()+'\n// actual edit')
  elif mode=='remove':page.get_by_role('button',name='移除此檔',exact=True).click()
  elif mode=='restore':
   page.locator('#project-source').fill(page.locator('#project-source').input_value()+'\n// changed');page.get_by_role('button',name='分析專案',exact=True).click();manage();page.get_by_role('button',name='還原此檔至載入版本',exact=True).click()
  else:page.locator('#migration-files').set_input_files([{'name':'2026_10_11_000001_new.php','mimeType':'text/x-php','buffer':b'<?php return new class extends Migration {function up(){}};'}])
  assert page.locator('.reading-workspace').count()==0 and page.get_by_label('結構操作原始碼',exact=True).count()==0 and page.locator('.advanced-analysis').count()==0;changes.append(mode)
 record('輸入失效','改檔名/PHP/移除/還原/新匯入清舊結果和來源；僅tools/fold/filter保DTO',{'invalidatedBy':changes,'analysisAndSourceAndAdvancedRemoved':True})
 assert not report['consoleErrors'],report['consoleErrors'];report['completedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();save();browser.close()
