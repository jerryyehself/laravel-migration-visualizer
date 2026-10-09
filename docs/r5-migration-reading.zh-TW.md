# R5：單次 migration 閱讀與各側明細

R5 修訂 2，issue #129／milestone 39；基底為已合併 R4 #128。只整合既有 DTO，不改 core 0.15.0 或 JSON 形狀。

## 閱讀順序

選分析結果 migration，依序看狀態與 Before／After 已知性、診斷、PHP operations 及来源、真實結構差異、涉及物件與各側明細。完整快照、diff 與 operations JSON 保留於展開面板。

operations 表示識別語法；applied 表示靜態 replay 成功，沒有執行資料庫。failed 保留可信 before，after／diff 未知；blocked 兩側未知。已知 diff=[] 明列沒有結構變化，diff=null 明列無法比較。renameColumn 的 from→to 是操作證據，下方 columnRemoved／columnAdded 原樣保留。

新增欄位只可到存在的 after，刪除欄位只可到存在的 before；表／欄位改名依 literal name 分別跳轉，不建立跨檔物件 identity。索引／外鍵涉及連到所屬表完整明細。不可導航按鈕分別顯示「快照未知」或「此側不存在」。

## 與後端 service／DTO 的類比

migrationReading 像純查詢 service：接 MigrationSnapshot DTO，整理顯示 labels、來源 DTO、物件清單與 own-property 可導航性，不 parse PHP 或 replay。MigrationReading component 像 view，props 是資料與 callback；diagnostics slot 沿用既有診斷 view，不另建規則。

ProjectResults state 保存 snapshotId 及 focusTarget，像 controller 保存畫面選取。物件 callback 指定 before-N／after-N；SchemaSnapshots 消費該側真實 schema，SchemaGraph 初始化表聚焦與欄位明細，沒有混合兩側資料。明確跳轉重設該圖 view；一般選單切換清選取。來源 callback 沿用 R4 唯讀面板與返回焦點，副本修改沿用 result=null 整體失效。

## 驗收

六項 adapter tests：noop／failed／blocked、欄位 rename、表 rename、整檔失敗語法、prototype 名稱、輸入不變與原索引。三項呈現 tests：狀態已知性、rename／側別缺失、React escaping／來源未知。tests 使用 source import，fresh checkout 不需事先 dist。

Chromium 八項任務：真實 Laravel.io jobs.reserved_at 新增僅 after 可用；摘要 PHP 定位第 19 行及返回焦點／欄位；表明細導航與選單重設；明確 rename 及 removed+added；舊欄位 before、新欄位 after；failed before 可用、after 未知；blocked 兩側未知不可導航；副本修改清摘要。console 無 warnings/errors；research/r5-browser.json。截圖 artifacts/r5-reading-summary.png、r5-migration-reading.png。雲端 npm run verify：660 tests、typecheck、build、12 demos／15 步全部通過；本批 PR 最新 head CI 仍需另核對。

R4 六項瀏覽器回歸另行確認來源原有流程。沒有測下載、全部手機／瀏覽器或 DB runtime；不新增 timeline、任意版本比較或部署安全判斷。
