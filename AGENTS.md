# Laravel Migration Visualizer

以繁體中文溝通，持續用教學方式解釋設計；使用者熟悉後端，但沒有 React/Angular 經驗。

## 架構與範圍
- npm workspaces：packages/migration-core 為純 TypeScript domain；apps/web 為 React + TypeScript + Vite。
- parser、排序、schema replay、diff 與 project diagnostics 都放 core，不放 React hooks。
- core 接收檔名與 PHP 字串，不讀檔、不執行 PHP、不連資料庫。
- Milestone 1 和 2 已完成。先讀 docs/CLOUD_HANDOFF.md、README.md 與 docs/milestone-2.zh-TW.md。
- 未經新需求，不擴增 timeline、ERD、down()、AI、SQL parser、runtime migration execution 或 semantic refactoring detection。
- SchemaDiff 是結構比較，不猜 rename。失敗後 schemaAfter/finalSchema 為 null；lastValidSchema 僅代表成功前綴。

## 開發與驗證
- Node.js 22.12+，npm。安裝使用 npm ci，保留 package-lock.json。
- npm test：交接基準 71 tests；原 Milestone 1 為 42 tests。
- npm run typecheck
- npm run build
- npm run demo:project
- golden JSON 是預期規格，不可為通過測試而盲目覆寫。
- 只新增與變更行為相關的測試。報告實際執行的驗證與限制。
