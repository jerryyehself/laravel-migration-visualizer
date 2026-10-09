# R2：高影響相容性補強

- 狀態：done（修訂 2；單項 nullableTimestamps）
- 日期／修訂：2026-10-09／2
- 負責端：雲端開發 session 執行；本研究 session 僅研究、決策文件與交接，不做程式實作
- 依賴：R1 完成，且具體 API／參數／拒絕範圍於核准路線內具體化並記錄
- 相關 issue：#125；milestone 37
- 文件 PR：[初始保存 #117](https://github.com/jerryyehself/laravel-migration-visualizer/pull/117)、[R1.1 核准補登 #118](https://github.com/jerryyehself/laravel-migration-visualizer/pull/118) 已合併；全路線核准由 docs/approve-research-roadmap 分支交付
- 功能 PR：無

## 要解決的問題
單個不支援語法可能阻斷專案，不能用 broad API 清單代替樣本痛點。

## 候選方案與取捨
A：補有限靜態子集合。B：只改善診斷。C：略過未知語法繼續 replay，可用圖增多但破壞可信度。

## 選定方向（已核准）
依 R1 選 A 或 B；拒絕 C。本批依 R1 BookStack 證據選 nullableTimestamps，具體契約見下方 R2.1；其他 API 未包含在本批。

## 範圍與可派小任務
1. 將選定 API／參數、官方固定來源與樣本影響補入本提案修訂。
2. 定義支援／拒絕規則與 DTO 是否變更，契約定稿後才開始。
3. 補 core 行為、獨立推導 golden／相關回歸、built-package demo 與相容矩陣。
4. 重跑 R1 樣本比較差異，保留失敗證據。

## 排除項目
完整 PHP／Laravel／DB 方言；猜測動態語意；放寬原子 replay／unknown；超出 R1 證據與靜態子集合方向的 API。
既有 core 不做 IO／不執行 PHP／不連 DB、結構 diff 不猜 rename、lastValidSchema 不補 finalSchema 的契約延續。

## 驗收條件
核准 API 規格完整；成功／拒絕／回滾與不可變行為通過必要驗證；樣本改善可重現，沒有默默忽略語法。

## 研究依據
[定位比對報告 A-01](A-01-positioning-report.zh-TW.md)：A-01：相近靜態 ERD 工具存在，可靠性不能為可畫圖而犧牲。

## 逐次派工步驟與每次邊界

下表的「一次」是一個有交付物的工作批次，不是固定時間或模型回合。本提案修訂 2 已整份核准，可依序執行必要步驟，不必每步重新詢問。規格步驟須先具體化並記錄契約，才能進入對應實作；超出排除／可信度邊界的需求仍須另立提案。

| 批次 | 前置條件 | 本次只做的範圍 | 交付物與驗證 | 停止點／本次不做 |
|---|---|---|---|---|
| R2.1 契約定稿 | R1 結果可讀；R1～R6 已核准；此批先完成規格 | 每批只選一個具名 API/helper 或一個具名診斷問題；列全部支援參數、拒絕規則、固定官方來源、DTO 版本影響與樣本效益 | 本提案修訂中的明確契約與驗收案例；核對具體契約未超出已核准路線 | 僅實作 R1 證據支持、符合已核准靜態子集合方向且有完整契約的 API；此步不以 R2 標題視為 broad API 授權 |
| R2.2 單項 core 補強 | 該批具體契約已記錄且符合核准路線 | 只改本批 parser／normalize／replay 所需路徑及相關測試；先建立失敗／成功／原子回滾案例；如需 DTO variant，先記錄版本與相容性影響；超出既有可信度契約另提案 | 可審查 diff、相關測試結果及 golden 推導；core 不做 IO | 第二 API 另開具體批次契約；runtime 語意或超出路線的契約擴張另列 draft |
| R2.3 樣本回歸與交付 | 單項實作完成 | 重跑受影響 R1 樣本、必要 core checks／built-package demo，更新相容矩陣與該批紀錄；走功能 PR | 實際前後結果、tests／typecheck／build／相關 demo、最新 HEAD CI 與 merge 證據 | 通過且交付才完成本批；下一 API 要有自己的具體契約與範圍，不為使樣本 complete 繼續擴增 |

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
本次 R2.1 契約已記錄，R2.2／R2.3 單項實作與樣本驗證進行中，issue #125／milestone 37；教學 milestone-37.zh-TW.md。狀態轉換依 [提案流程](README.md)。

## R2.1 單項契約（2026-10-09）

R1 BookStack 首檔 :22 呼叫 nullableTimestamps；:26 DB 寫入另拒絕。固定 Laravel v12.69.3 source commit 58ea544a2a80dc03c168e13a5dc9a1d176a88717，Blueprint.php SHA-256 78cf6274c8cb061f545cc7738366411fe2966654d6ed651cef4e79ed7cd9fb90；:1288 helper 直接委派 timestamps(:1272)。

支援零參數或單一靜態非負整數 precision；沿用 timestamps 的省略 precision=0 分析器政策，展開 created_at／updated_at 兩個 nullable timestamp addColumn，共用來源。這不是 DB default precision 的推定。拒絕明確 null、字串／bool／小數／負值／動態、額外參數、所有修飾鏈含 index／useCurrent／default／change。Laravel 可接受 null，但本工具靜態子集合依既有 timestamps 契約拒絕；不放寬既有 helper 或加入 nullableTimestampsTz。

core 0.15.0 支援行為新增，SchemaState／AtomicOperation JSON 形狀不變。原子 replay、索引／外鍵、unknown 契約不變；真實 BookStack 仍被 DB 寫入拒絕，不能宣稱 complete。只改 normalize helper 判斷、guard、相關回歸／golden／demo、版本 metadata 及中文契約。

交付：PR #126 merge cbfdf61347c33ff25a44e88be49a6ce7f15aeb26；head 61f4bfce2b1230b24ed97389a1573c9bcaafd32f／validate run 37898773657 success。issue #125／milestone 37 closed。驗證 639 tests／15 步／12 demos；只新增 nullableTimestamps 子集合，真實樣本仍不完整。
