# R5：單次變更閱讀流程

- 狀態：done（修訂 2；PR #130 已合併）
- 日期／修訂：2026-10-09／2
- 負責端：雲端開發 session 執行；本研究 session 僅研究、決策文件與交接，不做程式實作
- 依賴：R1、R4
- 相關 issue：#129／milestone 39
- 文件 PR：[初始保存 #117](https://github.com/jerryyehself/laravel-migration-visualizer/pull/117)、[R1.1 核准補登 #118](https://github.com/jerryyehself/laravel-migration-visualizer/pull/118) 已合併；全路線核准由 docs/approve-research-roadmap 分支交付
- 功能 PR：#130／merge 28c1d59d365673a07f558fe42f30fbaf673f6d4e

## 要解決的問題
既有 operations／diff／雙圖比較可用，但閱讀流程需整合，避免使用者在多塊結果間自行拼湊。

## 候選方案與取捨
A：整合單次 migration 的既有資料與來源。B：任意兩版本比較。C：增加部署安全警示。A 最接近現有 DTO；B 需額外比較規格；C 要新分析責任。

## 選定方向（已核准）
採 A；目前只承諾理解變更，不判定部署安全。

## 範圍與可派小任務
1. 盤點現有結果 UI，定義單次 migration 閱讀入口。
2. 整合 operations、結構 diff、診斷與真實 before／after，避免混合 schema。
3. 受影響物件連到各側明細與原始碼；rename operation 與 removed+added diff 分開呈現。
4. 明列 failed 有 before、after／diff null；blocked snapshots 未知；無變更不同於未知。

## 排除項目
CI／CLI、部署安全、任意兩版本比較、semantic refactoring、down()。
既有 core 不做 IO／不執行 PHP／不連 DB、結構 diff 不猜 rename、lastValidSchema 不補 finalSchema 的契約延續。

## 驗收條件
使用者能回答做了什麼、前後差異、證據來源；失败／blocked 不顯示為無變更；各側使用自己的快照；完成相關 contract 與互動驗收。

## 研究依據
[定位比對報告 A-01](A-01-positioning-report.zh-TW.md)：A-01：Atlas／Guard 的安全分析與本提案分工不同；dbdiagram 版本歷史亦不等於 replay。

## 逐次派工步驟與每次邊界

下表的「一次」是一個有交付物的工作批次，不是固定時間或模型回合。本提案修訂 2 已整份核准，可依序執行必要步驟，不必每步重新詢問。規格步驟須先具體化並記錄契約，才能進入對應實作；超出排除／可信度邊界的需求仍須另立提案。

| 批次 | 前置條件 | 本次只做的範圍 | 交付物與驗證 | 停止點／本次不做 |
|---|---|---|---|---|
| R5.1 閱讀流程規格 | R1／R4 結果可讀 | 盤點現有逐檔結果／比較，指定 applied、failed、blocked 各自入口與展示順序；定義受影響清單與兩側明細跳轉 | 一份有限互動規格、三狀態案例與既有核准記錄 | 不重做比較引擎；任意兩快照比較與安全警示排除 |
| R5.2 單次變更摘要 | 流程規格已記錄且符合核准路線 | 只整合當前 migration 的 operations、diff、diagnostics 與受影響物件列表；rename 操作證據和 removed+added diff 分開 | 成功／無變更／failed／blocked adapter 與呈現驗證 | operations 不等於已生效；未知不可轉成空 diff |
| R5.3 明細與來源連結 | 摘要完成且 R4 可用 | 只把摘要項目連到 before／after 各自表明細與 PHP；沿用真實雙圖與既有同步 view | 新增／刪除／變更／rename／缺表的導航驗收 | 不合併兩側 schema，不建立新的 schema 推算 |
| R5.4 任務回歸與交付 | 前述核准步驟完成 | 驗收指定單次變更任務與副本重分析；完成相關 checks、手冊與功能 PR | 使用者能指出操作、差異及來源；CI／merge 證據與限制 | 部署安全、CI reporter、CLI 不隨本批加入 |

每次開始前記錄批次 ID、核准修訂、輸入版本、預計檔案／範圍；結束時記錄實際變更、驗證、issue／PR／commit、未完成項目與下一批前置條件。遇到新需求先列 draft；同一已核准範圍內的必要修正不需要重複取得批准。
逐批記錄 approved／in_progress／done；批准路線不代表所有批次已實作或已完成。

## 使用者確認紀錄

- 2026-10-09：使用者於本研究 session 明確表示「全部核准」，核准 R1～R6 修訂 2 與各自逐次派工表；取代先前只記錄 R1.1 核准的狀態。
- 使用者同時指正執行端稱呼；後續稱「雲端開發 session」。本研究 session 只研究、決策與文件交接，不做程式實作。
- 核准涵蓋已寫明的小任務、依賴、排除與驗收；必要規格具體化及按 R1 證據選定的有限 API／互動批次，可由雲端開發 session 在此邊界內記錄並依序執行，不需每步重問。
- 條件式步驟保留條件：R2 先取得 R1 證據並定義具名 API 契約；R3 FK 批次先確認需求證據。沒有證據可縮小／跳過並記錄理由。
- 超出路線排除項目或改變可信快照／公開契約承諾的新增需求，仍另列 draft，不因全部核准而自動納入。
- 使用者已授權確定決策文件檢查後合併 main。

## 開工前／當時進度紀錄（歷史）

以下保存 2026-10-09 開工前或尚未交付時的紀錄，當前狀態為文件開頭的 done，實際 merge 見交付段落。

當時本提案修訂 2 的全部批次均 approved；雲端開發 session 應依序核對前置條件，開工時記錄 in_progress，取得實際驗收／交付證據後標 done。
本次只更新核准文件，未啟動任何批次、未修改程式、未建立功能 issue／PR。狀態轉換依 [提案流程](README.md)。

## R5.1 本次閱讀契約（2026-10-09）

核准 PR #119；R1 已合併，R4 來源契約與六項瀏覽器任務可讀，已由 #128 合併 47b8e0a。本地分支 feat/r5-migration-reading，在 R4 已保存 commit 上續作；當時 stacked 本地實作已分開 PR #130 交付，merge 證據見下段。

逐檔閱讀順序：狀態／before-after 已知性 → 診斷 → 已識別語法 operations 與 PHP 來源 → 真實結構 diff → 涉及物件的 before/after 明細跳轉。rename operation 明列 from→to，diff 仍原樣 removed+added，不做語意合併。完整 raw 快照／DTO 保留在展開面板。

純 web adapter 讀當前 MigrationSnapshot，不 parse/replay；operations 是語法證據，failed/blocked 不稱生效。diff=null 顯示未知，[] 顯示已知無結構變化。涉及物件由 operations 明列的 names 及 diff 結構項合併 literal query，不合併物件 identity；同名刪除重建只代表同名字串。分別以 schemaBefore/schemaAfter own-property 查可導航性，區分快照未知與物件不存在。索引／FK 結構項導向所屬表完整明細，不新建穩定 constraint identity。

物件明細按鈕只導向現有 before-N/after-N 快照並初始化該表／欄位聚焦；新增項目不能補畫 before，移除項目不能補畫 after。此明確跳轉重設該圖 view；一般快照選單仍清選取。沿用 R4 source→原處返回及修改失效，不另建編輯器／任意兩版本比較／部署安全規則。

R5.2／R5.3 本地摘要及導航完成；九項新增 tests，八項 Chromium 任務／console 無 warnings/errors。R5.4 統一驗證、PR 最新 head CI 與合併已完成；狀態 done，證據見下段。

交付：PR #130 head 5db1590b39f014d1beafed6cae575366e37df87a／validate run 37902435289 success，issue #129／milestone 39 closed。660 tests／15 verify 步驟／12 demos；八項 R5、六項 R4、十一項 R3 Chromium 任務通過，console 無 warning/error。
