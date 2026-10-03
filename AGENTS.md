# Laravel Migration Visualizer

以繁體中文溝通，持續用教學方式解釋設計；使用者熟悉後端，但沒有 React/Angular 經驗。

## 持續工作授權
- 使用者於 2026-10-03 授權自行規劃與開始後續 milestone、實作、測試、中文教學、建立 PR，檢查通過後合併並繼續；不逐次詢問。
- 新增外部權限／帳號、費用、正式部署或破壞性資料操作仍依實際風險與工具權限規則確認。功能範圍的明確排除仍有效。

## 架構與範圍
- npm workspaces：packages/migration-core 為純 TypeScript domain；apps/web 為 React + TypeScript + Vite。
- parser、排序、schema replay、diff 與 project diagnostics 都放 core，不放 React hooks。
- core 接收檔名與 PHP 字串，不讀檔、不執行 PHP、不連資料庫。
- Milestone 1～13 已完成並在 main；M5～M8 分別由 PR #11、#15、#19、#22 合併。Core 0.5.0。M9 的 web 結果搜尋／狀態篩選已由 PR #26 合併，core 不變。M10 資料夾匯入已由 PR #30 合併（47d5b0f）；M11 診斷定位已由 PR #34 合併（d9e7a99），交付狀態見 docs/github-milestones.md；M12 診斷編輯跳轉已由 PR #38 合併（8777354），狀態見交付紀錄；M13 副本還原已由 PR #42 合併（8d9d02f），狀態見交付紀錄；先讀 docs/CLOUD_HANDOFF.md、README.md 與 docs/milestone-13.zh-TW.md。
- 未經新需求，不擴增 timeline、ERD、down()、AI、SQL parser、runtime migration execution 或 semantic refactoring detection。
- SchemaDiff 是結構比較，不猜 rename。失敗後 schemaAfter/finalSchema 為 null；lastValidSchema 僅代表成功前綴。

## 開發與驗證
- Node.js 22.12+，npm。安裝使用 npm ci，保留 package-lock.json。
- npm test：目前 315 tests（263 core + 5 browser import + 6 export + 9 filters + 10 folder import + 8 diagnostic location + 6 source selection + 8 drafts）；原 Milestone 1 為 42 tests。
- npm run typecheck
- npm run build
- npm run demo:project
- npm run demo:tables
- npm run demo:helpers
- golden JSON 是預期規格，不可為通過測試而盲目覆寫。
- 只新增與變更行為相關的測試。報告實際執行的驗證與限制。

## GitHub 工作流程
- 新功能建立功能分支、對應 milestone/issues 與 PR，不直接推 main。
- M1～M3 是已完成補登紀錄；M4～M13 已合併，對應 issues 與 milestones 已關閉。
- 每張表的 indexes 與 foreignKeys 是必要欄位，primary metadata 從權威索引同步。外部 initialSchema 必須符合目前契約。

## 專案 skills
- 修改／審查核心或 UI 的分析契約時，讀取 [.agents/skills/migration-core-review/SKILL.md](.agents/skills/migration-core-review/SKILL.md)。
- milestone 驗收、GitHub 補登與 PR 交付時，讀取 [.agents/skills/milestone-delivery/SKILL.md](.agents/skills/milestone-delivery/SKILL.md)。
- repo 內的 skill 是版本化來源，可隨 clone 一起帶到雲端；全域安裝副本不是新的專案規格，更新後需同步。
