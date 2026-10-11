# R8.4：連續閱讀、側別搜尋與共享視野

COORD-20261011-14 是協調端按既有人類核准派工，只接 issue #142／R8.4，milestone #43 open。核准來源：R8修訂1@5eec41476ef22b85d3165d3be3f681f1a20c8f9d 的使用者詳細修正指令；協調没有新增／代核准需求。指定輸入／base：8ed11ea960c7e0a046b72e3c78011c4cb744896b（R8.3產品763f71d5089e45781e34ba30e55028916b065a15）。規劃交接8ea8ece98073542eaafc4b6d19f5e7ce639f074c只唯讀參考，沒有混進產品base。

新分支feat/r8-4-reading-context，stacked base feat/r8-3-related-changes。#145 f9b42c8c220841d40978db48969feaba8c52dc43、#146 3e8ee581eee16a80940c7490b491001dc2bd25eb、#147 8ed11ea960c7e0a046b72e3c78011c4cb744896b 都保持固定驗收head，未合併。R7/IR及R8.1～3（含COORD-13）獨立驗收仍pending／offline；自測／協調直接核對不能代獨立通過。本批只到ready-for-review PR，不合併main、不automerge、不開始R8.5～6。

## 閱讀上下文在父層

ProjectResults 保存 reading step／side、literal `{table,column?}`、R8.3精確名稱查詢、表／欄位搜尋文字、比較搜尋側別及GraphView。正常切步／側不再清column或依key remount清view；即使Graph與Comparison因不同表示而換component，受控view仍在父層。缺表／缺欄保留原完整名稱，null快照另顯示未知；不降級成其他物件，不沿rename換名。

完整前／下一份仍含failed／blocked；篩選只投影列表，不改時點或原順序。初始／final入口保留，邊界沒有目前migration時前／下一份禁用，要先明確選步。來源預覽不改step／side／literal／query／view，關閉恢復既有來源祖先details與焦點，invalidorigin仍有可見聚焦通知。展開管理或讀來源不修改DTO。

輸入真改、移除／還原、重新匯入仍使result失效。React會將同事件setResult(null)與新result批次處理，所以新分析另增generation，僅在新分析替換整個ProjectResults、清舊reading／source／search／selection／view。這是分析生命週期的清除，不是正常導航的remount捷徑。

## 幾何與各側資料

analysisLayout 收所有已知initial／final／每步Before／After，geometryLayout只取名稱與最大視覺高度配置座標。没有union columns、FK或SchemaState；每張SchemaGraph只讀自己的snapshot，unknown不補圖。Map按literal名稱保存手動位置；同名drop/recreate保位是畫面定位，不是穩定身分。特殊名稱不走prototype碰撞。

pan／zoom／manual positions跨步保留。初次view与「重設ERD」只量當前實際可見nodes的位置及真實高度，忽略未出現表的空位；重設恢復當前表預設幾何，缺席表的手動位置仍可留到本次分析結束。已離視野顯示提示與「定位目前物件」；明確定位／搜尋結果可置中已知目標，不自動置中缺表／缺欄／unknown。重設與定位不造schema。

## 集中側別搜尋

工作區只有一組表／欄位搜尋和縮放／重設工具。比較選Before或After並在heading／結果標側，文字保留、結果由該側自己的schema重算。缺匹配、已知空白、未知禁用搜尋各有提示，舊結果不留可點入口；搜尋不隱藏表／線。兩張比較圖共用GraphView及一組工具，columns／FK／diff各側獨立。

failed比較可明確查已知Before，但整個comparison仍因不完整不畫推測圖；unknown After禁用搜尋，不借Before資料。已知Before明細可讀，若要畫可信單側，可由「套用前」明確切換。沒有自動跳過unknown或擅自切側。

## 後端類比

core是domain service，ProjectAnalysis仍是既有回應DTO。ProjectResults像controller，持有同一次查詢／閱讀的view state；geometry是presentation mapper。SchemaGraph／SchemaComparison component是rendering unit，props接收自己的schema和共享view／callback。onViewChange更新畫面資料，沒有重新replay migration或修改domain DTO。analysis generation類似新請求的識別，不能當資料表身分。

R8.4明確更新R7允許換步重設view／清欄位的舊限制；相關UI-review技能文字同步本新分支契約。R8.5全分析來源去重及進階／明細面板整理未做，既有次入口和來源清單仍保留。

## 實測與失敗修正

固定產品c32b52260b6057b2b0f49d223e1c9f68b397f7c8，clean checkout npm run verify：706tests（540core／166web）、typecheck、build及12built-package demos；15commands全exit0。新增8個web幾何／側別呈現回歸，涵蓋同名重建不混欄位、不可變DTO、current-only reset／缺席位置、offscreen、special names、unknown與known-empty／missing分界。

真Chromium：R8.4 14組、R8.3 12組、R8.2 12組、R8.1 14組、R7 16組、IR9項，共77項／組，console warning/error/pageerror空白。包含放大／方向鍵移表後前後份保持、真空白畫布拖曳pan、缺欄與rename缺表、compare own-side／單套工具、來源collapsed return與invalidorigin回歸、初始／final／篩選完整順序、unknown／failed／blocked往返、explicit reset／offscreen locate、新分析generation清舊state、390px／keyboard／輸入真改失效。

首輪新增reading-view回歸先因module不存在失敗，再實作。首輪browser在final邊界誤按停用的「前一份」而timeout；修為先驗證停用，再明確選migration，沒有放寬產品端點。原R7 compare搜尋locator由第二張圖改到集中側別selector，再驗own-side缺欄；其餘回歸契約保持，沒有盲改golden。固定產品後完整驗證及所有必要browser重新執行。

可攜證據docs/acceptance/r8-4-evidence/manifest.json對11份report／截圖／首次失敗原始transcript列SHA256，均MATCH。verify與R8 browser report標本產品SHA；桌面与390px截圖已實際檢視。沒有把SSR當互動browser；core／JSON／golden／依賴／workflow全部無差異。

## 停止點與限制

#142 in_progress／ready for review但OPEN，R8整批未done、milestone43 OPEN；等待協調端回收、本新固定head獨立複驗及前批依賴整合。main核對仍2b8030a7d19963980190ba860888f243883b6d7b。共享幾何不是新布局研究；沒有持久化／URL state／播放／stable identity／自動rename／任意時點比較／新core模型／runtime／下載落盤／部署／release。
