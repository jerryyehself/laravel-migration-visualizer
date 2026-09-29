# Codex Cloud 交接

## 現況
- Milestone 1 baseline commit：6959b46（42 tests）。
- Milestone 2：檔名排序、batch analyzer、schemaBefore/schemaAfter、SchemaDiff、project diagnostics、跨 migration golden tests（71 tests）。
- React 仍是單檔工作台；多檔功能目前透過 core API 和 examples/project-analysis.mjs 使用。
- 本機對話不會自動成為 Cloud 對話；以本文件、AGENTS.md、Git history 與教學文件延續。

## Cloud 環境設定
1. 連接此 GitHub repo，選 main。
2. 選擇提供 Node.js 22.12+ 的環境，建議 Node 22；.nvmrc 是版本提示，不假設 Cloud 自動讀取。
3. Setup script：bash scripts/cloud-setup.sh
4. 不需要 API key、資料庫、PHP、Composer 或專案 secrets。
5. 安裝階段需能存取 npm registry；安裝完成後目前測試／建置不需要網路。
6. 若 Cloud 使用環境快取，可將 maintenance script 同樣設為 bash scripts/cloud-setup.sh，以確保依照目前 lockfile 安裝。

## 第一個雲端任務：驗證交接
請讀取 AGENTS.md、README.md、docs/milestone-2.zh-TW.md 及本文件。先確認 Git 狀態與目前 commit，再執行 npm test、npm run typecheck、npm run build、npm run demo:project。預期 71 tests 通過，三份範例依序成功，最終 users 欄位為 id、display_name。以繁體中文回報雲端驗證結果與任何環境差異；若失敗先修復環境或相容性問題。這次只驗證交接，不自行開始 Milestone 3 或擴大功能。

## 必須保留的契約
- core 與 React UI 分離，core 不做 IO。
- 名稱不合法／重複會阻止全專案 replay。
- 第一個失敗 step 有可信 schemaBefore，但 schemaAfter/diff 為 null；後續仍分析語法，但 snapshots/diff 全為 null。
- lastValidSchema 不等於 finalSchema。
- 結構 diff 不做 semantic rename/refactoring inference。
- 自訂 base class、完整 Laravel API、DB 方言與 PHP runtime 語意仍不涵蓋；完整限制見 README。

## 尚未授權的新階段
多檔匯入 UI、逐檔結果檢視可作下一個 milestone 的候選；需先由使用者決定。timeline、ERD、down()、AI、semantic refactoring detection 仍不在目前範圍。

## 原始碼閱讀順序
src/types.ts → src/project-types.ts → src/ordering.ts → src/project.ts → src/diff.ts → tests/project.test.ts（皆位於 packages/migration-core）。教學請看 docs/tutorial.zh-TW.md 與 docs/milestone-2.zh-TW.md。

官方環境文件：https://learn.chatgpt.com/docs/environments/cloud-environment
