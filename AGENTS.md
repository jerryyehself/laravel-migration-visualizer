# Laravel Migration Visualizer

以繁體中文溝通，持續用教學方式解釋設計；使用者熟悉後端，但沒有 React/Angular 經驗。

## 持續工作授權
- 使用者於 2026-10-03 授權自行規劃與開始後續 milestone、實作、測試、中文教學、建立 PR，檢查通過後合併並繼續；不逐次詢問。
- 新增外部權限／帳號、費用、正式部署或破壞性資料操作仍依實際風險與工具權限規則確認。功能範圍的明確排除仍有效。

## 架構與範圍
- npm workspaces：packages/migration-core 為純 TypeScript domain；apps/web 為 React + TypeScript + Vite。
- parser、排序、schema replay、diff 與 project diagnostics 都放 core，不放 React hooks。
- core 接收檔名與 PHP 字串，不讀檔、不執行 PHP、不連資料庫。
- Milestone 1～29 已完成並在 main；M5～M8 分別由 PR #11、#15、#19、#22 合併。Core 0.14.0。M9 的 web 結果搜尋／狀態篩選已由 PR #26 合併，core 不變。M10 資料夾匯入已由 PR #30 合併（47d5b0f）；M11 診斷定位已由 PR #34 合併（d9e7a99），交付狀態見 docs/github-milestones.md；M12 診斷編輯跳轉已由 PR #38 合併（8777354），狀態見交付紀錄；M13 副本還原已由 PR #42 合併（8d9d02f），狀態見交付紀錄；使用者已同意進入視覺化，M14 最終 schema ERD 已由 PR #46 合併（652292b），狀態見交付紀錄；先讀 docs/DECISIONS.zh-TW.md、docs/CLOUD_HANDOFF.md、README.md 與 docs/milestone-20.zh-TW.md。
- 未經新需求，不擴增 timeline、down()、AI、SQL parser、runtime migration execution 或 semantic refactoring detection。
- SchemaDiff 是結構比較，不猜 rename。失敗後 schemaAfter/finalSchema 為 null；lastValidSchema 僅代表成功前綴。

## 開發與驗證
- Node.js 22.12+，npm。安裝使用 npm ci，保留 package-lock.json。
- npm test：目前 591 tests（502 core + 5 browser import + 6 export + 9 filters + 10 folder import + 8 diagnostic location + 6 source selection + 8 drafts + 9 graph + 5 snapshots + 8 graph diff + 5 comparison layout + 4 focus + 6 table inspector）；原 Milestone 1 為 42 tests。
- npm run typecheck
- npm run build
- npm run demo:project
- npm run demo:tables
- npm run demo:helpers
- npm run demo:laravel
- npm run demo:changes
- npm run demo:current-update
- npm run demo:index-rename
- npm run demo:drop-columns
- npm run demo:drop-constrained-id
- npm run demo:morphs
- golden JSON 是預期規格，不可為通過測試而盲目覆寫。
- 只新增與變更行為相關的測試。報告實際執行的驗證與限制。

## GitHub 工作流程
- 新功能建立功能分支、對應 milestone/issues 與 PR，不直接推 main。
- M1～M3 是已完成補登紀錄；M4～M29 已合併，對應 issues 與 milestones 已關閉。
- 每張表的 indexes 與 foreignKeys 是必要欄位，primary metadata 從權威索引同步。外部 initialSchema 必須符合目前契約。

## 專案 skills
- 修改／審查核心或 UI 的分析契約時，讀取 [.agents/skills/migration-core-review/SKILL.md](.agents/skills/migration-core-review/SKILL.md)。
- milestone 驗收、GitHub 補登與 PR 交付時，讀取 [.agents/skills/milestone-delivery/SKILL.md](.agents/skills/milestone-delivery/SKILL.md)。
- React／ERD 互動、快照呈現與瀏覽器驗收時，讀取 [.agents/skills/migration-ui-review/SKILL.md](.agents/skills/migration-ui-review/SKILL.md)。
- 本機／雲端交接、決策核對或接手驗證時，讀取 [.agents/skills/migration-handoff/SKILL.md](.agents/skills/migration-handoff/SKILL.md)。
- repo 內的 skill 是版本化來源，可隨 clone 一起帶到雲端；全域安裝副本不是新的專案規格，更新後需同步。

M15 快照選單已由 PR #50 合併（cf8f0b8）；交付狀態見 docs/github-milestones.md。未知快照不可補成成功前綴；切換會重設圖形。

M16 結構比較已由 PR #54 合併（25dc11c），狀態見交付紀錄。只標記真實 before／after 與 core diff，不混合 schema 或猜 rename。

M17 比較布局與互動同步已由 PR #58 合併（5054727），狀態見交付紀錄；只共用畫面 state，不混合 schema。

M18 資料表搜尋／聚焦已由 PR #62 合併（d6a170d），狀態見交付紀錄。搜尋不隱藏圖形；聚焦只更新畫面 view。

M19 聚焦表明細已由 PR #66 合併（8c7d6ad），狀態見交付紀錄；各側讀自己的快照，不補缺表／缺省屬性。

M20 加入固定 commit 的 Laravel 12 官方樣本、useCurrent metadata 與相容性基準；讀 docs/milestone-20.zh-TW.md，交付狀態見 docs/github-milestones.md。

M20 已由 PR #70 合併（5cea3b4），issues #68/#69 與 milestone 已關閉；功能 head 325238a 的 CI 通過，core 0.6.0、362 tests。

M21 擴充 dateTime/dateTimeTz 的零參數 useCurrent metadata；讀 docs/milestone-21.zh-TW.md。373 tests，core JSON 契約沿用 0.6.0；交付狀態見 docs/github-milestones.md。

M21 已由 PR #76 合併（f8925e1），issue #75 與 milestone 已關閉；最新功能 head 5c72f84 的 CI 通過。

M22 新增 changeColumn 公開 operation，core 0.7.0；SchemaState 不變。讀 docs/milestone-22.zh-TW.md 與交付紀錄，勿將保守的 change 子集合宣稱為完整 Laravel／DB 相容。

M22 已由 PR #79 合併（dbc9aa4），issue #78 與 milestone 已關閉；功能 head 601946b 的 CI 通過 tests、typecheck、build 與五個 demo。

M23 新增 Column.useCurrentOnUpdate?: boolean：四種 timestamp/dateTime 型別的零參數更新時間意圖，可與 useCurrent 或 scalar default 組合，但 useCurrent/default 衝突仍拒絕。change 完整替換與 M22 所有拒絕規則不變。讀 docs/milestone-23.zh-TW.md；實際 GitHub 交付狀態見 docs/github-milestones.md，M23 已由 PR #82 合併（4563f01），issue #81／milestone 23 已關閉；最新 head 6fc61fa 的 CI 通過。

M24 新增一般 index／unique renameIndex operation；core 0.9.0、SchemaState 不變。primary 更名保守拒絕；diff 仍是 removed+added。讀 docs/milestone-24.zh-TW.md 與交付紀錄。

M24 已由 PR #85 合併（7580dca），issue #84 與 milestone 已關閉；功能 head 337890e 的 CI 通過 tests、typecheck、build 與七個 demo。2026-10-04 已接回本地，雲端停止開發。

M25 已實作靜態 dropColumn 陣列，core 0.10.0；沿用既有 operations／SchemaState。501 tests、八個 demo 通過；讀 docs/milestone-25.zh-TW.md，實際交付狀態見交付紀錄。variadic 字串、空／重複／動態陣列仍拒絕。

M25 已由 PR #88 合併（abab843），issue #87／milestone 25 已關閉；功能 head 48ff342 的 CI 通過 tests、typecheck、build 與八個 demo。

M26 已實作 dropConstrainedForeignId，core 0.11.0，526 tests／九個 demo 通過；讀 docs/milestone-26.zh-TW.md 與交付紀錄。只依慣例刪外鍵後刪欄位；不搜尋 custom name，其他引用保護與整檔回滾不變。

M26 已由 PR #91 合併（1f86cc3），issue #90／milestone 26 已關閉；功能 head 7b35e25 的 CI 通過 tests、typecheck、build 與九個 demo。

M27 已實作 numericMorphs／nullableNumericMorphs，core 0.12.0；548 tests／十個 demo。先讀 docs/milestone-27.zh-TW.md；多型 helpers 不推測 foreign key，通用 morphs 與 after 仍不支援。交付狀態見 github-milestones.md。

M27 已由 PR #94 合併（1b8cd53），issue #93／milestone 27 已關閉；功能 head 4c2f682 的 CI 通過 tests、typecheck、build 與十個 demo。M28 已實作 UUID morph helpers，core 0.13.0、563 tests；讀 docs/milestone-28.zh-TW.md。

M28 已由 PR #96 合併（39160f2），issue #95／milestone 28 已關閉；最新功能 head 07cd086 的 CI 通過 tests、typecheck、build 與十個 demo。M29 已實作 dropMorphs，core 0.14.0、591 tests；讀 docs/milestone-29.zh-TW.md。

M29 已由 PR #98 合併（1aa3f83），issue #97／milestone 29 已關閉；最新功能 head 1a3db83 的 CI 通過 tests、typecheck、build 與十個 demo。三階段共新增 65 tests，core 0.14.0／591 tests。
