# R8.3：同名表／欄位相關 migration 步驟

COORD-20261011-11 是協調端按既有使用者核准派工，只接 issue #141／R8.3。人類核准來源仍為 R8 修訂1@5eec41476ef22b85d3165d3be3f681f1a20c8f9d 保存的使用者詳細修正指令，協調派工沒有新增或代核准需求。milestone #43 保持 open，R8.4～6 未開工。

指定輸入產品／文件 head：3e8ee581eee16a80940c7490b491001dc2bd25eb（R8.2 產品444fc9c99f7acf99f2824730ee32c0ca3e56b08d）。新分支 feat/r8-3-related-changes 從此建立，stacked base feat/r8-2-change-summary；#145 f9b42c8c220841d40978db48969feaba8c52dc43、#146 3e8ee581eee16a80940c7490b491001dc2bd25eb 固定驗收 head 未改。規劃交接 docs/r8-reading-corrections@8c326339ff5b7656b7e73a3842029a6dfbc24eae 僅唯讀參考，不混進產品 base。

R7/IR COORD-03、R8.1 COORD-06、R8.2 COORD-10 獨立驗收仍 pending／offline；協調直接核對與開發自測都不能當成獨立通過。本批停止於 ready-for-review PR，不合併 main、不啟動 automerge。

## 查詢契約

`relatedChanges(result,{table,column?})` 是純 web adapter。表／欄位精確、大小寫敏感，不 trim／模糊查找，不追物件身分；按完整 result.migrations 原始 index 投影相關列，不改完整清單、排序、schema 或匯出。users.nickname 只列第二份新增／第三份移除，初次 users 建表沒有 nickname 不列。

欄位 diff 精確匹配名稱；整表新增／移除檢查其已知欄位內容，不製造 column diff。index／FK 用 DTO 明確有序欄位匹配，引用表／欄位標為關係上下文，與 owning table 自身變更區分。整表 payload 的 FK 引用同樣可作上下文。無精確欄位資訊的 create／drop／rename 及索引／外鍵移除語法，只有相關證據、已知存在或未知區段的必要表級上下文才列，不斷言欄位已變；已知無關索引移除不列。

語法有操作、net diff=[]、diff=null 各自不同。failed／blocked 相關語法仍列但明示未套用；Before/After 為該 literal 在各側的存在／不存在／快照未知，不以 lastValidSchema 補值。沒有精確名稱證據不代表未知區段沒有變化。零檔、排序未開始、查不到、最終已刪除與最終未知有不同提示。

rename 只展示明確 operation 的 from→to。原查詢不自動切名；點「查詢改名新名稱／新表」才建立另一 literal 查詢。display_name rename 與後續同名 drop/add 的 net columnChanged 各自可讀，users→members 不把後续 members 步驟串成 users 的穩定身分。

## 導航與 React 分層

右側可直接輸入精確名稱，即使名稱已刪除或 final 未知。圖形／欄位搜尋結果選取後，由明細的「查看此名稱相關步驟」進入。RelatedChanges component 是 rendering unit（畫面單元）；props 收 DTO、查詢與 callback。ProjectResults 父層 state 保存 literal 查詢與閱讀 step／side，類似 controller 保存請求條件；adapter 像 presentation mapper，不重跑 service／parser／replay。

提交新查詢聚焦／捲到相關結果。已知 before／after／diff 才能「查看此步比較」；failed 可看已知 Before，blocked 可到該步診斷／語法，不跳過未知。這些跳步保留 literal query 和選取欄位；移除後顯示 name 與不存在提示。一般 R7 順序／切側行為不在這次改成整包連續 state 保留。

「查看相關 PHP」只預覽既有 source，不換原閱讀步驟、側別或查詢；返回恢復原按鈕焦點。未知位置停用，來源檔不唯一沿用拒絕定位。没有推測每筆 diff 與 PHP 一對一因果。R8.4 GraphView／pan／zoom／layout／集中搜尋尚未實作，R8.5 面板整理也未展開；長清單仍沿既有頁面捲動。

## 回歸與修正證據

最終產品 commit：763f71d5089e45781e34ba30e55028916b065a15。clean checkout npm run verify：698 tests（540 core／158 web）、typecheck、build、12 built-package demos，15 commands 全 exit0。新增14個 web adapter／SSR行為回歸。core、公開JSON、golden、依賴及workflow無修改。

首輪新增 adapter 回歸因 module 尚未存在失敗，再實作。首次排序案例預期 ordering，實際 core 仍留下 migrations；adapter 改以 ordering diagnostic 明確區分未開始，沒有改 core。首次 TypeScript 指出 optional column 在 callback 的 narrowing，僅於已確認 column 的分支保留型別。截圖檢視發現長明細頁查詢入口不一定將結果帶進視窗，補查詢結果 ref 焦點／捲動，並加入 browser focus assertion；因此將產品固定到上述最終 SHA，重新完成 verify 與必要回歸。

真實 Chromium R8.3 12組，R8.2 12組、R8.1 14組、R7 16組、IR9項，共63項／組。包含 nickname 精確清單、原始index、來源Enter／返回焦點、移除欄位比較、rename新查詢／重建、整表內容／刪除、table rename literal、FK關係上下文、failed before／blocked診斷／未知界線、無證據、390px鍵盤及無橫向溢出；console warning/error/pageerror 為空。特殊名稱、跨表同名、排序／零檔與 noop 邊界另由 adapter／SSR 驗證，不將靜態呈現稱為互動 browser 證據。

桌面／390px 截圖已實際檢視。可攜報告、失敗原始 transcript 與截圖在 docs/acceptance/r8-3-evidence，manifest 對10份檔案列 SHA256，均核對一致；verify／新增 browser 及前兩批 browser report 標產品 SHA。原有各批證據未改。

## 停止點

#141 in_progress／ready for review，仍 OPEN；整批 R8 未 done、milestone #43 OPEN，等待協調端回收／新固定 head 獨立複驗及前批依賴整合。本輪 main 核對仍 2b8030a7d19963980190ba860888f243883b6d7b。R8.2 教學僅在本新分支將「COORD08明確核准」改為協調按既有使用者核准派工，沒有漂移 #146 固定 head。

沒有 stable identity、History DTO、自動追 rename、任意時點比較、timeline／動畫、PHP／DB runtime、下載落盤、部署或 release；沒有擴充相鄰 draft。
