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
