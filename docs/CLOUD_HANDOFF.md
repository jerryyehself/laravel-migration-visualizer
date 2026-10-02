# Codex Cloud 交接

## 現況
- Milestone 1 baseline commit：6959b46（42 tests）。
- Milestone 2：檔名排序、batch analyzer、schemaBefore/schemaAfter、SchemaDiff、project diagnostics、跨 migration golden tests（71 tests）。
- Milestone 3：React 多檔匯入工作台、逐檔快照／diff／診斷與輸入副本編輯；core 契約不變。新增 5 個匯入測試，合計 76 tests。
- Milestone 3 已以 7fba001 推送 main。Milestone 4 已合併 PR #7，merge commit c778163（121 tests）。Milestone 5～8 已合併 PR #11/#15/#19/#22，最新功能合併 commit fa3862e；main 已包含全部功能（274 tests）。
- 本機對話不會自動成為 Cloud 對話；以本文件、AGENTS.md、Git history 與教學文件延續。

## Cloud 環境設定
1. 連接此 GitHub repo，選 main。
2. 選擇提供 Node.js 22.12+ 的環境，建議 Node 22；.nvmrc 是版本提示，不假設 Cloud 自動讀取。
3. Setup script：bash scripts/cloud-setup.sh
4. 不需要 API key、資料庫、PHP、Composer 或專案 secrets。
5. 安裝階段需能存取 npm registry；安裝完成後目前測試／建置不需要網路。
6. 若 Cloud 使用環境快取，可將 maintenance script 同樣設為 bash scripts/cloud-setup.sh，以確保依照目前 lockfile 安裝。

## 第一個雲端任務：驗證交接
請讀取 AGENTS.md、README.md、docs/milestone-2.zh-TW.md 及本文件。先確認 Git 狀態與目前 commit，再執行 npm test、npm run typecheck、npm run build、npm run demo:project。包含 Milestone 9 時預期 283 tests 通過；Milestone 8 為 274 tests；Milestone 7 為 268 tests；Milestone 6 為 224 tests；Milestone 5 為 186 tests；Milestone 4 為 121 tests；僅 Milestone 3 為 76 tests（Milestone 2 交接 commit 75087de 為 71 tests），三份範例依序成功，最終 users 欄位為 id、display_name。以繁體中文回報雲端驗證結果與任何環境差異；若失敗先修復環境或相容性問題。雲端驗證任務只驗證交接，不擴大功能；Milestone 3 已在本機另行實作。

## 必須保留的契約
- core 與 React UI 分離，core 不做 IO。
- 名稱不合法／重複會阻止全專案 replay。
- 第一個失敗 step 有可信 schemaBefore，但 schemaAfter/diff 為 null；後續仍分析語法，但 snapshots/diff 全為 null。
- lastValidSchema 不等於 finalSchema。
- 結構 diff 不做 semantic rename/refactoring inference。
- 自訂 base class、完整 Laravel API、DB 方言與 PHP runtime 語意仍不涵蓋；完整限制見 README。

## 後續範圍
M1～M8 已交付；後續維持 core/UI 分層、測試、中文教學與 PR 流程。timeline、ERD、down()、AI、semantic refactoring detection 仍不在目前範圍。

## 原始碼閱讀順序
src/types.ts → src/project-types.ts → src/ordering.ts → src/project.ts → src/diff.ts → tests/project.test.ts（皆位於 packages/migration-core）。教學請看 docs/tutorial.zh-TW.md 與 docs/milestone-2.zh-TW.md。

官方環境文件：https://learn.chatgpt.com/docs/environments/cloud-environment

## Milestone 4 交接
- 索引 schema / operations / diff、隱含主鍵、React 索引顯示與 golden tests；讀 docs/milestone-4.zh-TW.md。
- M4 每張表要有 indexes；M5 另需 foreignKeys。外部 initialSchema 需同步更新。
- GitHub 工作紀錄見 docs/github-milestones.md；M4 使用 PR，不直接推 main。

## Milestone 5 交接
- 外鍵模型／operations／diff、引用驗證、rename/drop 保護、React 外鍵表格與四檔 goldens；讀 docs/milestone-5.zh-TW.md。
- Core 0.3.0，foreignKeys 是必要欄位；table inference 是明確列出的八種慣例，其他請指定 table。
- 不推測 DB 隱含索引、型別相容性或完整 Blueprint scheduling；無 PHP/runtime 執行。

## Milestone 6 交接
- M6 開發時接在 M5 分支上；現已經 PR #15 合併 main（40bb301）。
- Core 0.4.0：rename/drop/dropIfExists、引用更新與刪表保護；schema 與 M5 相同，讀 docs/milestone-6.zh-TW.md。
- 額外執行 npm run demo:tables 驗證建置後公開套件四檔成功／失敗流程。

## Milestone 7 交接
- M7 開發時接在 M6 分支上；現已經 PR #19 合併 main（cf8f222）。
- Core 0.5.0：enum 有序 allowedValues、rememberToken、softDeletes/Tz、時區時間欄位與移除 helpers；讀 docs/milestone-7.zh-TW.md。
- Column.allowedValues 為可選欄位；diff 按內容／順序比較。Helpers 沿用整檔回滾、索引／外鍵保護。
- 另執行 npm run demo:helpers；268 tests，包含 44 個 M7 測試。所有讀檔仍在 caller，核心不做 IO。

## Milestone 8 交接
- M8 開發時接在 M7 上；現已經 PR #22 合併 main（fa3862e）。只改 web caller，core 仍為 0.5.0。
- 下載完整 ProjectAnalysis／成功的 finalSchema，未知快照不填入猜測資料；274 tests。
- 讀 docs/milestone-8.zh-TW.md；瀏覽器入口狀態與 JSON 契約已驗證；使用者於 2026-10-02 實測確認下載成功。PR #22 已合併；自動化落盤驗證仍未涵蓋。

## Milestone 9 交接
- 結果搜尋與狀態篩選位於 web caller；保留 core 順序／原 index，無匹配不顯示不相關詳情。
- 完整 ProjectAnalysis、全域診斷、可信 schema 與 JSON 匯出不受篩選影響；core 仍為 0.5.0。
- 283 tests；讀 docs/milestone-9.zh-TW.md，了解衍生清單與選取 fallback。沒有分頁／大型清單效能保證。
