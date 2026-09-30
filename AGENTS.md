# Laravel Migration Visualizer

以繁體中文溝通，持續用教學方式解釋設計；使用者熟悉後端，但沒有 React/Angular 經驗。

## 架構與範圍
- npm workspaces：packages/migration-core 為純 TypeScript domain；apps/web 為 React + TypeScript + Vite。
- parser、排序、schema replay、diff 與 project diagnostics 都放 core，不放 React hooks。
- core 接收檔名與 PHP 字串，不讀檔、不執行 PHP、不連資料庫。
- Milestone 1 和 2 已完成；Milestone 3 已加入多檔 React 工作台；Milestone 4 索引分析走功能分支與 PR。先讀 docs/CLOUD_HANDOFF.md、README.md 與 docs/milestone-4.zh-TW.md。
- 未經新需求，不擴增 timeline、ERD、down()、AI、SQL parser、runtime migration execution 或 semantic refactoring detection。
- SchemaDiff 是結構比較，不猜 rename。失敗後 schemaAfter/finalSchema 為 null；lastValidSchema 僅代表成功前綴。

## 開發與驗證
- Node.js 22.12+，npm。安裝使用 npm ci，保留 package-lock.json。
- npm test：目前 121 tests（116 core + 5 browser import）；原 Milestone 1 為 42 tests。
- npm run typecheck
- npm run build
- npm run demo:project
- golden JSON 是預期規格，不可為通過測試而盲目覆寫。
- 只新增與變更行為相關的測試。報告實際執行的驗證與限制。

## GitHub 工作流程
- 新功能建立功能分支、對應 milestone/issues 與 PR，不直接推 main。
- M1～M3 是已完成補登紀錄；M4 issues 隨 PR 合併關閉。
- 每張表的 indexes 是必要欄位，primary metadata 從權威索引同步。外部 initialSchema 必須符合目前契約。

## 專案 skills
- 修改／審查核心或 UI 的分析契約時，讀取 [.agents/skills/migration-core-review/SKILL.md](.agents/skills/migration-core-review/SKILL.md)。
- milestone 驗收、GitHub 補登與 PR 交付時，讀取 [.agents/skills/milestone-delivery/SKILL.md](.agents/skills/milestone-delivery/SKILL.md)。
- repo 內的 skill 是版本化來源，可隨 clone 一起帶到雲端；全域安裝副本不是新的專案規格，更新後需同步。
