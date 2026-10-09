# R4：結構與 migration 來源串接

- 狀態：approved（修訂 2 全部步驟；尚未開始執行）
- 日期／修訂：2026-10-09／2
- 負責端：雲端開發 session 執行；本研究 session 僅研究、決策文件與交接，不做程式實作
- 依賴：R1、R3；來源查詢契約於核准路線內具體化並記錄
- 相關 issue：未建立
- 文件 PR：[初始保存 #117](https://github.com/jerryyehself/laravel-migration-visualizer/pull/117)、[R1.1 核准補登 #118](https://github.com/jerryyehself/laravel-migration-visualizer/pull/118) 已合併；全路線核准由 docs/approve-research-roadmap 分支交付
- 功能 PR：無

## 要解決的問題
從結構到來源與逐次變更目前缺少統一入口；同名或已刪物件容易被誤當成同一身分。

## 候選方案與取捨
A：查詢直接涉及名稱的 operations／SourceLocation。B：跨 rename 維持物件身分。C：推測 semantic lineage。A 證據明確；B 要新契約；C 違反既有排除。

## 選定方向（已核准）
先 A；明確 rename 可顯示 operation 的前後名稱，但不等於全歷史身分追蹤。

## 範圍與可派小任務
1. 定義 directly involved 的 operation 集合，區分 applied／failed／blocked 的語法操作與可信 schema 效果。
2. 設計純查詢 service 與來源 DTO，決定是否公開 core export；不得由 hooks 推斷歷史。
3. 從表／欄位明細列出有證據的相關 migration、operation 與 PHP 位置。
4. 保留原快照／選取以支援返回；明列刪除、重建同名及 rename 案例。

## 排除項目
Semantic rename inference、穩定物件 identity、timeline、DB／models 關係猜測。
既有 core 不做 IO／不執行 PHP／不連 DB、結構 diff 不猜 rename、lastValidSchema 不補 finalSchema 的契約延續。

## 驗收條件
來源可追溯到 migration 與 operation；同名刪除重建不合併成身分；failed／blocked 不被標示為已生效；未知來源不補值；雙向跳轉可驗收。

## 研究依據
[定位比對報告 A-01](A-01-positioning-report.zh-TW.md)：A-01：逐步可信來源是差異假設，必須用任務驗收，而非宣稱獨有。

## 逐次派工步驟與每次邊界

下表的「一次」是一個有交付物的工作批次，不是固定時間或模型回合。本提案修訂 2 已整份核准，可依序執行必要步驟，不必每步重新詢問。規格步驟須先具體化並記錄契約，才能進入對應實作；超出排除／可信度邊界的需求仍須另立提案。

| 批次 | 前置條件 | 本次只做的範圍 | 交付物與驗證 | 停止點／本次不做 |
|---|---|---|---|---|
| R4.1 來源語意契約 | R1／R3 結果可讀 | 逐一列 directly involved 的 operation，明列 FK 來源／目標、table rename、column rename、刪除重建、failed／blocked；定義 DTO 欄位、排序與公開 export 決策 | 來源查詢規格與人工預期案例；記錄該批契約與驗收 | 不創建穩定物件 identity，不把名稱匹配叫 lineage |
| R4.2 純查詢 service | 來源契約已記錄且符合核准路線 | 只從既有 ProjectAnalysis／operations／SourceLocation 建來源查詢；區分語法涉及與可信已套用效果，依規格安排 core 或純 web adapter | service／DTO diff、涉及／未涉及與同名重建／rename／失敗回歸；若公開 export 則 built-package 驗證 | 不重跑 parser／replay，不改 SchemaDiff；不延伸為全歷史追蹤 |
| R4.3 結構→來源入口 | 查詢 service 完成 | 只在表／欄位明細顯示來源列表並跳到 migration／PHP；保留來源的 snapshot 與物件選取返回目標 | 相關 UI 驗收，來源定位與不在該側的物件明確顯示 | 不改磁碟 PHP，不增加另一套編輯器或資料持久化 |
| R4.4 返回與交付 | 來源入口完成 | 只完成來源→原結構返回、快照切換／副本修改時選取失效處理；驗收指定雙向任務 | 兩端導航、失效與未知案例；必要 checks、最新 HEAD CI／merge | 來源不足時明列未知；跨 rename identity 另立提案 |

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

本提案修訂 2 的全部批次均 approved；雲端開發 session 應依序核對前置條件，開工時記錄 in_progress，取得實際驗收／交付證據後標 done。
本次只更新核准文件，未啟動任何批次、未修改程式、未建立功能 issue／PR。狀態轉換依 [提案流程](README.md)。
