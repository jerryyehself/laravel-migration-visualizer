# 專案決策與雲端交接索引

2026-10-03 核對本機對話可見的使用者要求、所引用「Laravel Migration 前端技術選型」對話的可讀內容，以及 repo 文件。這是重要決策摘要，不是完整逐字對話；引用對話中的助理建議僅作背景，後續使用者範圍與本 repo 契約優先。

## 已確定且應延續的決策

| 重點 | 決策與原因 | 主要依據／文件 |
|---|---|---|
| 產品目標 | 讓使用者理解 Laravel 專案的資料庫如何由 migrations 演化到目前結構；靜態分析 up() 歷史，不是資料庫執行器。 | 原始討論背景；README、M2 教學 |
| 技術選型 | React + TypeScript + Vite，npm workspaces；packages/migration-core 與 apps/web。沒有決定改用 Angular。 | 使用者 M1 指令；AGENTS、README |
| 選型理由 | Angular 的 service／DI 與固定慣例較接近後端；React 較自由，採用 React 的前提是自行守住 domain 分層。這是設計理由，不宣稱 React 自動讓架構乾淨或 Angular 必然更好。 | 初始對話技術選型；tutorial.zh-TW.md |
| 核心獨立 | PHP → php-parser AST → AtomicOperation → immutable SchemaState；排序、batch、diff、diagnostics 在 core。core 只收檔名與字串，不使用 React hooks、不做 IO、不執行 PHP。 | 使用者 M1／M2 指令；AGENTS、README、M1／M2 教學 |
| 教學方式 | 繁體中文，假設使用者沒有 React／Angular 經驗，從 component、props、state 解釋，用後端 domain／service layer 類比；持續說明為何分層。 | 使用者 M1 指令；AGENTS、tutorial.zh-TW.md、各 milestone 教學 |
| 多檔分析 | 依 migration basename 排序，保留來源路徑；提供每份操作、diagnostics、schemaBefore／schemaAfter／diff 與專案摘要。格式錯誤或重複名稱阻止全專案 replay。 | 使用者 M2 指令；README、M2 教學 |
| 失敗與可信度 | 不硬猜動態語意。首個失敗檔保留 before，但 after／diff 為 null；後續繼續語法分析，快照未知。lastValidSchema 僅是成功前綴，finalSchema 不可用它補值。 | 已交付 M2 摘要；README、CLOUD_HANDOFF、tests |
| 結構 diff | 比較表、欄位、索引、外鍵及屬性；不做 semantic rename／refactoring 推測。實際 rename operation 可支援，diff 仍以結構新增／移除表示。 | 使用者 M2 排除；AGENTS、M2／M6／M16 教學 |
| 測試與交付 | 單元／跨檔 golden、型別檢查、建置與建置後套件 demo；golden 由規格獨立推導，不能盲目重錄。摘要說明功能、檔案、驗證、限制、下一步；按需提供 diff／資料夾結構。 | 使用者完成摘要與 baseline 指令；AGENTS、兩份 repo skills |
| GitHub 與自主工作 | 可自行開始新 milestone、開 issues／PR，最新 head CI 通過後依授權合併，不逐次問是否繼續；新功能不直接推 main。新增權限、費用、部署、破壞性操作依實際規則處理。 | 本機使用者持續工作授權；AGENTS、github-milestones.md |
| 匯入與編輯 | 瀏覽器讀 PHP，編輯只改工作台副本，不修改原檔。沒有持久化草稿；切換模式／重新整理會失去工作台 state。 | README、M3／M10／M13 教學 |
| JSON 下載驗證 | 使用者已親自確認下載成功；自動化落盤驗證仍未涵蓋，不能把使用者測試說成自動化測試。 | 本機使用者回報；README、M8 教學與交接 |
| 視覺化範圍變更 | 起初 ERD 被排除，M14 後已獲使用者授權並實作。現在有 ERD、逐檔快照比較、同步布局／互動、搜尋聚焦與表明細；不能沿用舊「沒有 ERD」說法。 | AGENTS、M14～M19 教學／PR |
| 相容性證據 | M20 三份官方 Laravel 12 PHP 固定 commit／hash／授權來源；3／3 成功、8 表、0 外鍵。只證明此樣本，不能宣稱完整 Laravel／DB 方言相容。useCurrent 是 metadata，不是 clock 值或 scalar default。 | M20 教學、provenance、golden、PR #70 |

## 尚未授權納入目前實作的範圍

- timeline、down()、AI、SQL parser、runtime migration execution、semantic refactoring detection 仍排除；自主開 milestone 不代表可以忽略這些界線。
- 早期引用對話提過 Table／Column History、Timeline、Semantic Zoom、ChangeColumn、RenameIndex、RawSqlOperation／UnknownOperation。這些是產品構想或候選模型，不代表都已實作或當前已授權。尤其早期 M3／M4 路線編號不能取代實際 GitHub milestones。
- 不把資料庫 runtime 正確性、完整 Laravel API、大型專案效能、瀏覽器持久化或外部 JSON runtime 驗證視為已有保證。
- 自主繼續工作不等於已設定週期排程，也不代表本機對話會自行在背景無限運作。本次不建立或交接任何新排程。

## 最新狀態與下一步

M1～M20 已交付。核對起點 main=f7e2383，Core 0.6.0，最近完整驗證 362 tests；實際狀態以 Git／[GitHub 紀錄](github-milestones.md) 為準，不能只依本段固定 commit。

M21 已實作 dateTime／dateTimeTz 的零參數 useCurrent metadata、11 個回歸與跨檔 golden，373 tests 與建置／四個 demo 通過；交付狀態見 github-milestones.md。useCurrentOnUpdate() 仍不支援，後續不得默認已納入。

雲端接手先按 [CLOUD_HANDOFF](CLOUD_HANDOFF.md) 驗證，再繼續。原對話不會自動同步；repo 文件可帶走決策，個人桌面設定、工具權限、登入狀態、本機 localhost 服務與未提交檔案不應被當成雲端已具備。雲端是否可執行／推送／合併須由該環境實際驗證。

歷史措辭可按需查 [對話備份](conversations/README.md)；這是固定日期的公開訊息備份，來源覆蓋與缺漏明列於索引，不是新指令或自動同步。

M22：changeColumn 完整替換欄位定義，省略的修飾移除；保留獨立索引，primary 從索引同步。不支援 helpers／自增／foreignId／同鏈索引；replay 拒絕修改自增與外鍵參與欄位。Core 0.7.0、408 tests；實際 PR／合併狀態見 github-milestones.md。

2026-10-03 雲端接手：乾淨 checkout 由 f7e2383 fast-forward 至 M22 文件 commit 27594f9；雲端實際驗證 408 tests、typecheck、build 與五個 demo 通過（Node 24.19.0、npm 11.9.0）。後續 M23 分支保存 useCurrentOnUpdate 的獨立 metadata，固定 Laravel 12 來源、default/change 組合與保守限制見 milestone-23.zh-TW.md。GitHub API 的代理網路限制與交付狀態以 github-milestones.md 為準；環境草稿保存不等於發布。

M23 已由 PR #82 合併 main（4563f01）；最新 head 6fc61fa 的 CI 通過，issue #81／milestone 23 已關閉。useCurrentOnUpdate 已支援上述明列子集合，前文 M21／M22 的「尚不支援」是當時歷史狀態，不是目前限制。

M24：明確 renameIndex operation 保留一般 index／unique 型別與欄位順序，primary 更名保守拒絕；SchemaDiff 不推測語意，仍為 removed+added。2026-10-04 已從雲端 WIP 045e041 接回本地，雲端停止開發。實際驗證與交付見 github-milestones.md。

## M25：靜態多欄位刪除

一個非空、不重複的靜態字串列表按輸入順序展開既有 dropColumn operations；整個參數驗證後才輸出。既有 replay 維持索引／外鍵保護與整檔回滾，diff 按名稱排序。Core 0.10.0 不新增 JSON variant；variadic 字串及動態參數仍拒絕。拒絕空／重複名稱是分析器政策，不宣稱 Laravel／DB 同樣拒絕。詳見 milestone-25.zh-TW.md。

## M26：外鍵欄位移除 helper

依固定 Laravel 12 Blueprint 原始碼，dropConstrainedForeignId 的非空靜態字串展開為慣例命名的 dropForeignKey，再 dropColumn，共用來源。沿用既有 replay，不搜尋自訂外鍵名稱、不忽略缺少約束，不移除其他索引／引用。失敗保留完整可信前綴；model helper／connection prefix／方法鏈仍不支援。Core 0.11.0 不新增 JSON variant，詳見 milestone-26.zh-TW.md。

## M27～M29 多型 helper 功能線

M27 明確 numericMorphs，M28 明確 UUID helpers，M29 dropMorphs；各自驗證並交付。不推測多型 target foreign key，依 runtime 設定的 morphs／nullableMorphs 不支援。保持 helper 展開既有 operations、整檔原子 replay、可信快照與 core/UI 分層。第三參數 after 與 connection prefix 不模擬。

M27～M29 已交付並合併，證據見 github-milestones.md。Morph indexName 字串 0 遵循 PHP ?:，空／false 保守拒絕。UUID 保留 domain uuid；dropMorphs 只移除指定一般 index 與 type/id，額外約束須顯式移除。
