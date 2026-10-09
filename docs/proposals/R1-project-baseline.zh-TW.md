# R1：真實專案與使用任務基準

- 狀態：done（修訂 2；PR #121 已合併）
- 日期／修訂：2026-10-09／2
- 負責端：雲端開發 session 執行；本研究 session 僅研究、決策文件與交接，不做程式實作
- 依賴：無
- 相關 issue：[#120](https://github.com/jerryyehself/laravel-migration-visualizer/issues/120)；[milestone 35](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/35)
- 文件 PR：[初始保存 #117](https://github.com/jerryyehself/laravel-migration-visualizer/pull/117)、[R1.1 核准補登 #118](https://github.com/jerryyehself/laravel-migration-visualizer/pull/118) 已合併；全路線核准由 docs/approve-research-roadmap 分支交付
- 交付 PR：[#121](https://github.com/jerryyehself/laravel-migration-visualizer/pull/121)，已合併

## 要解決的問題
缺乏任意真實 Laravel 專案的相容性證據；現有官方三檔及十二檔 corpus 不足以決定下一步。

## 候選方案與取捨
A：直接新增 API，快但可能補錯痛點。B：先固定真實樣本與使用任務，多一些研究成本但可衡量價值。C：只用現有範例，易重現但代表性有限。

## 選定方向（已核准）
採 B；先產出阻礙與任務基準，不立即補功能。

## 範圍與可派小任務
1. 選至少兩個可合法研究、固定 commit 的 Laravel 專案樣本，記錄來源、授權、Laravel 版本與使用限制；未授權不得公開私人 PHP。
2. 用現有分析入口記錄 complete／failed／blocked、首個阻斷與後續未知；不修改樣本以假裝相容。
3. 建立兩種任務：找到指定表／欄位與直接關係；說明指定 migration 的 operations、前後差異與來源。
4. 區分 parser／API 支援、replay 政策、匯入與 UI 摩擦；按任務影響排序，提出 R2 具體子範圍。

## 排除項目
新增 API、UI、測试下載、DB runtime、全面 Laravel 相容承諾。
既有 core 不做 IO／不執行 PHP／不連 DB、結構 diff 不猜 rename、lastValidSchema 不補 finalSchema 的契約延續。

## 驗收條件
固定樣本與來源可重現；每種任務有步驟、預期答案、實際結果與阻礙；完成缺口排序，明列未知與樣本侷限。

## 研究依據
[定位比對報告 A-01](A-01-positioning-report.zh-TW.md)：A-01：ERD 已有相近產品，先驗證真實專案與可信結果是否提供價值。

## 逐次派工步驟與每次邊界

下表的「一次」是一個有交付物的工作批次，不是固定時間或模型回合。本提案修訂 2 已整份核准，可依序執行必要步驟，不必每步重新詢問。規格步驟須先具體化並記錄契約，才能進入對應實作；超出排除／可信度邊界的需求仍須另立提案。

| 批次 | 前置條件 | 本次只做的範圍 | 交付物與驗證 | 停止點／本次不做 |
|---|---|---|---|---|
| R1.1 樣本選定 | R1 修訂 2 全部步驟已核准；尚未分析或收錄 PHP | 只選至少兩個公開／獲授權專案，固定 commit、Laravel 版本、授權與 migration 路徑；檢查 migration squashing／schema dump 等輸入缺口 | 樣本清單及是否可保存／公開的結論；核對來源與授權 | 不補 API、不修改樣本；來源不足的樣本標記缺資料並停止使用 |
| R1.2 分析基準 | 樣本選定完成 | 只用現行 core／web 分析固定 migrations，記錄排序、首個失敗、診斷、applied／failed／blocked 及耗時觀察；不把耗時稱為性能保證 | 每個樣本的可重現執行方式、結果摘要、失敗原因；區分實測／未測 | 不繞過失敗、不補 finalSchema；沒有完整輸入不得宣稱專案重建成功 |
| R1.3 任務與優先序 | 分析基準完成 | 每個可用樣本選一個表／欄位探索任務與一個單次變更任務，寫預期答案、操作步驟與實際阻礙；整理 R2／R3 的有限建議 | 任務表、阻礙排序與依據、相容性／UI 分類；引用 A-01；核對答案來源 | 只交研究結果，不順便修功能；完成後交付 R1 結果，下一階段先記錄 R2 API 或 R3 互動契約 |

每次開始前記錄批次 ID、核准修訂、輸入版本、預計檔案／範圍；結束時記錄實際變更、驗證、issue／PR／commit、未完成項目與下一批前置條件。遇到新需求先列 draft；同一已核准範圍內的必要修正不需要重複取得批准。
逐批記錄 approved／in_progress／done；批准路線不代表所有批次已實作或已完成。

## 使用者確認紀錄

- 2026-10-09：使用者於本研究 session 明確表示「全部核准」，核准 R1～R6 修訂 2 與各自逐次派工表；取代先前只記錄 R1.1 核准的狀態。
- 使用者同時指正執行端稱呼；後續稱「雲端開發 session」。本研究 session 只研究、決策與文件交接，不做程式實作。
- 核准涵蓋已寫明的小任務、依賴、排除與驗收；必要規格具體化及按 R1 證據選定的有限 API／互動批次，可由雲端開發 session 在此邊界內記錄並依序執行，不需每步重問。
- 條件式步驟保留條件：R2 先取得 R1 證據並定義具名 API 契約；R3 FK 批次先確認需求證據。沒有證據可縮小／跳過並記錄理由。
- 超出路線排除項目或改變可信快照／公開契約承諾的新增需求，仍另列 draft，不因全部核准而自動納入。
- 使用者已授權確定決策文件檢查後合併 main。

## 批次狀態與交付紀錄

| 批次 | 執行證據 | 交付狀態 |
|---|---|---|
| R1.1 | 兩個固定公開專案、118 檔來源雜湊、Laravel 版本及 MIT 原文核對 | done：PR #121 已合併 |
| R1.2 | 112 PHP 原樣分析，2/1/6 與 0/1/102；重取來源再現相同結果 | done：PR #121 已合併 |
| R1.3 | Chromium 結構／變更任務、未知快照／切換驗收；R2/R3 有限建議 | done：PR #121 已合併 |

2026-10-09 雲端執行；輸入 main bdd64bc。來源、實測、任務、可重現方式與限制見 [R1 基準報告](../research/r1-baseline.zh-TW.md)。milestone 35、issue #120；最新 HEAD CI／merge 已核對，詳見下列交付紀錄。沒有修改 core／UI；R2～R6 維持 approved，未算入本批交付。

交付：PR #121，head 7b0a987 的 validate CI run 37896480621 success；merge 2dfbbc64b4effa14bb4c2b2c62888866c587f5e7。issue #120／milestone 35 closed。
