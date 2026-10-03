# Laravel Migration Visualizer

以繁體中文溝通，持續用教學方式解釋設計；使用者熟悉後端，但沒有 React/Angular 經驗。

## 持續工作授權
- 使用者於 2026-10-03 授權自行規劃與開始後續 milestone、實作、測試、中文教學、建立 PR，檢查通過後合併並繼續；不逐次詢問。
- 新增外部權限／帳號、費用、正式部署或破壞性資料操作仍依實際風險與工具權限規則確認。功能範圍的明確排除仍有效。

## 架構與範圍
- npm workspaces：packages/migration-core 為純 TypeScript domain；apps/web 為 React + TypeScript + Vite。
- parser、排序、schema replay、diff 與 project diagnostics 都放 core，不放 React hooks。
- core 接收檔名與 PHP 字串，不讀檔、不執行 PHP、不連資料庫。
- Milestone 1～20 已完成並在 main；M5～M8 分別由 PR #11、#15、#19、#22 合併。Core 0.6.0。M9 的 web 結果搜尋／狀態篩選已由 PR #26 合併，core 不變。M10 資料夾匯入已由 PR #30 合併（47d5b0f）；M11 診斷定位已由 PR #34 合併（d9e7a99），交付狀態見 docs/github-milestones.md；M12 診斷編輯跳轉已由 PR #38 合併（8777354），狀態見交付紀錄；M13 副本還原已由 PR #42 合併（8d9d02f），狀態見交付紀錄；使用者已同意進入視覺化，M14 最終 schema ERD 已由 PR #46 合併（652292b），狀態見交付紀錄；先讀 docs/DECISIONS.zh-TW.md、docs/CLOUD_HANDOFF.md、README.md 與 docs/milestone-20.zh-TW.md。
- 未經新需求，不擴增 timeline、down()、AI、SQL parser、runtime migration execution 或 semantic refactoring detection。
- SchemaDiff 是結構比較，不猜 rename。失敗後 schemaAfter/finalSchema 為 null；lastValidSchema 僅代表成功前綴。

## 開發與驗證
- Node.js 22.12+，npm。安裝使用 npm ci，保留 package-lock.json。
- npm test：目前 362 tests（273 core + 5 browser import + 6 export + 9 filters + 10 folder import + 8 diagnostic location + 6 source selection + 8 drafts + 9 graph + 5 snapshots + 8 graph diff + 5 comparison layout + 4 focus + 6 table inspector）；原 Milestone 1 為 42 tests。
- npm run typecheck
- npm run build
- npm run demo:project
- npm run demo:tables
- npm run demo:helpers
- npm run demo:laravel
- golden JSON 是預期規格，不可為通過測試而盲目覆寫。
- 只新增與變更行為相關的測試。報告實際執行的驗證與限制。

## GitHub 工作流程
- 新功能建立功能分支、對應 milestone/issues 與 PR，不直接推 main。
- M1～M3 是已完成補登紀錄；M4～M20 已合併，對應 issues 與 milestones 已關閉。
- 每張表的 indexes 與 foreignKeys 是必要欄位，primary metadata 從權威索引同步。外部 initialSchema 必須符合目前契約。

## 專案 skills
- 修改／審查核心或 UI 的分析契約時，讀取 [.agents/skills/migration-core-review/SKILL.md](.agents/skills/migration-core-review/SKILL.md)。
- milestone 驗收、GitHub 補登與 PR 交付時，讀取 [.agents/skills/milestone-delivery/SKILL.md](.agents/skills/milestone-delivery/SKILL.md)。
- repo 內的 skill 是版本化來源，可隨 clone 一起帶到雲端；全域安裝副本不是新的專案規格，更新後需同步。

M15 快照選單已由 PR #50 合併（cf8f0b8）；交付狀態見 docs/github-milestones.md。未知快照不可補成成功前綴；切換會重設圖形。

M16 結構比較已由 PR #54 合併（25dc11c），狀態見交付紀錄。只標記真實 before／after 與 core diff，不混合 schema 或猜 rename。

M17 比較布局與互動同步已由 PR #58 合併（5054727），狀態見交付紀錄；只共用畫面 state，不混合 schema。

M18 資料表搜尋／聚焦已由 PR #62 合併（d6a170d），狀態見交付紀錄。搜尋不隱藏圖形；聚焦只更新畫面 view。

M19 聚焦表明細已由 PR #66 合併（8c7d6ad），狀態見交付紀錄；各側讀自己的快照，不補缺表／缺省屬性。

M20 加入固定 commit 的 Laravel 12 官方樣本、useCurrent metadata 與相容性基準；讀 docs/milestone-20.zh-TW.md，交付狀態見 docs/github-milestones.md。

M20 已由 PR #70 合併（5cea3b4），issues #68/#69 與 milestone 已關閉；功能 head 325238a 的 CI 通過，core 0.6.0、362 tests。
