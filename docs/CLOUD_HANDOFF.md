# Codex Cloud 交接

## 現況（2026-10-04 核對）
- M1～M26 已合併 main；M26 功能合併為 1f86cc3／PR #91。Core 0.11.0，本地 526／526 tests、typecheck、build 與九個 demo 通過，PR 最新 head 7b35e25 的 CI 通過。2026-10-04 已接回本地，雲端停止開發。
- 已有多檔匯入、排序／分析／逐檔快照／結構 diff、索引／外鍵、診斷定位、JSON 匯出，以及 ERD 快照／比較／同步互動／聚焦／明細。
- M1 baseline 為 6959b46（42 tests）；各階段實際 commits、PR、驗證與限制見 [GitHub 交付紀錄](github-milestones.md)，下方各節為歷史紀錄。
- M21 已實作 dateTime／dateTimeTz 的零參數 useCurrent()，新增跨檔 golden、失敗／不可變回歸與中文教學；373／373 tests、typecheck、build 與四個 demo 通過。已由 PR #76 合併 main（f8925e1），issue #75 與 milestone 已關閉；最新功能 head 5c72f84 的 CI 通過。完整狀態見交付紀錄，接手先核對最新 main。
- M22 已實作保守的 change() 子集合、changeColumn operation 與跨檔 golden；core 0.7.0、408 tests。已由 PR #79 合併（dbc9aa4），issue #78 與 milestone 已關閉，功能 head 601946b 的 CI 通過；接手先核對最新 main。
- M23 已支援 useCurrentOnUpdate() 意圖 metadata，已由 PR #82 合併。先讀 docs/milestone-23.zh-TW.md 與交付紀錄；沒有 DB runtime，M22 保守拒絕規則不變。
- 本機完整對話不會自動成為 Cloud 對話；先讀 [決策索引](DECISIONS.zh-TW.md)、AGENTS.md 與本文件，再以 repo／GitHub 紀錄延續。雲端已接手，實際基準驗證見下方雲端接手紀錄。

## Cloud 環境設定
1. 連接此 GitHub repo，選 main。
2. 選擇提供 Node.js 22.12+ 的環境，建議 Node 22；.nvmrc 是版本提示，不假設 Cloud 自動讀取。
3. 環境安裝可使用 repo 的 bash scripts/cloud-setup.sh；實際欄位與操作依當前 Cloud UI。
4. 不需要 API key、資料庫、PHP、Composer 或專案 secrets。
5. 安裝階段需能存取 npm registry；安裝完成後目前測試／建置不需要網路。
6. 重用環境前確認 lockfile 對應的依賴已安裝；必要時重跑 bash scripts/cloud-setup.sh，不假設雲端會自動更新所有本機工具。

## 第一個雲端任務：驗證交接
請讀 AGENTS.md、docs/DECISIONS.zh-TW.md、README.md、docs/milestone-20.zh-TW.md 及本文件。確認 Git 狀態與目前 commit，以 main 的最新已合併內容為基準；本機空的 M21 分支不必搬移。

執行 npm test、npm run typecheck、npm run build，以及 npm run demo:project、npm run demo:tables、npm run demo:helpers、npm run demo:laravel、npm run demo:changes。M20 基準為 362 tests，M21 實作後為 373 tests，M22 為 408 tests；回報實際結果與環境差異，不把本機通過當成雲端通過。demo:project 最終 users 欄位為 id、display_name；demo:laravel 為三份已套用、8 表、0 外鍵。

驗證成功後依持續工作授權規劃下一階段；先寫會失敗的回歸，再修改 core，保留 PR／最新 head CI 流程。若雲端無法推送或合併，交付可審查的結果並明確回報限制，不宣稱已合併。

## 歷史對話備份
[對話備份索引](conversations/README.md) 可查原始措辭與背景。先讀決策索引，再按需查歷史；備份不是現行規格，原始 ChatGPT 內容僅部分可取得。

## 必須保留的契約
- core 與 React UI 分離，core 不做 IO。
- 名稱不合法／重複會阻止全專案 replay。
- 第一個失敗 step 有可信 schemaBefore，但 schemaAfter/diff 為 null；後續仍分析語法，但 snapshots/diff 全為 null。
- lastValidSchema 不等於 finalSchema。
- 結構 diff 不做 semantic rename/refactoring inference。
- 自訂 base class、完整 Laravel API、DB 方言與 PHP runtime 語意仍不涵蓋；完整限制見 README。

## 後續範圍
M1～M24 已交付；後續維持 core/UI 分層、測試、中文教學與 PR 流程。M14 已獲授權進入 ERD；timeline、down()、AI、semantic refactoring detection 仍不在目前範圍。

## 原始碼閱讀順序
src/types.ts → src/project-types.ts → src/ordering.ts → src/project.ts → src/diff.ts → tests/project.test.ts（皆位於 packages/migration-core）。教學請看 docs/tutorial.zh-TW.md 與 docs/milestone-2.zh-TW.md。

官方環境文件：https://learn.chatgpt.com/docs/environments/cloud-environments

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
- PR #26 已合併 main（2931a2f），對應 issues／milestone 已關閉。
- 結果搜尋與狀態篩選位於 web caller；保留 core 順序／原 index，無匹配不顯示不相關詳情。
- 完整 ProjectAnalysis、全域診斷、可信 schema 與 JSON 匯出不受篩選影響；core 仍為 0.5.0。
- 283 tests；讀 docs/milestone-9.zh-TW.md，了解衍生清單與選取 fallback。沒有分頁／大型清單效能保證。

## Milestone 10 交接
- 資料夾匯入位於 web IO 邊界，包含子資料夾中的小寫 .php、相對路徑與非 PHP 略過清單。Core 0.5.0 不變。
- 整批 PHP 讀取成功才取代輸入；格式錯誤／重複名稱仍交由 core 診斷。293 tests；讀 docs/milestone-10.zh-TW.md。
- PR #30 已合併 main（47d5b0f），對應 issues／milestone 已關閉。最新狀態見 docs/github-milestones.md。

## Milestone 11 與工作授權
- web 診斷定位至完整路徑的唯讀 PHP 片段；清除篩選並選取 core 原 index。重複完整路徑不猜測，檔案層級診斷不高亮占位行。
- 301 tests；core 0.5.0 不變，讀 docs/milestone-11.zh-TW.md；交付狀態見 docs/github-milestones.md。
- 使用者授權自主開始後續 milestone、實作、驗證、教學、建立與合併通過檢查的 PR，再繼續；不用逐階段詢問。既有排除範圍與新增權限／費用／正式部署／破壞性操作的確認規則仍有效。

M11 已合併 PR #34（d9e7a99），對應 issues／milestone 已關閉。

## Milestone 12 交接
- 診斷卡片 callback 跳回輸入副本，等 DOM 更新後聚焦並選取整行。檔案層級診斷游標放開頭；修改後需重新分析。
- 307 tests，core 0.5.0 不變；讀 docs/milestone-12.zh-TW.md，交付狀態見 github-milestones.md。

M12 已合併 PR #38（8777354），對應 issues／milestone 已關閉。

## Milestone 13 交接
- web drafts 同時保存載入原值與目前副本，標示已修改與支援單檔還原。刪除只移除對應 draft，不重設剩餘 baseline。
- 315 tests，core 0.5.0 不變；讀 docs/milestone-13.zh-TW.md，交付狀態見 github-milestones.md。

M13 已合併 PR #42（8d9d02f），對應 issues／milestone 已關閉。

## Milestone 14 交接
- 使用者同意開始視覺化，ERD 只使用成功的 finalSchema。SVG 圖形與座標在 web；core 0.5.0 不變。
- 324 tests，實際拖移／平移／縮放／重設與失敗未知狀態已驗證。讀 docs/milestone-14.zh-TW.md；交付狀態見 github-milestones.md。

M14 已合併 PR #46（652292b），issues #44/#45 與 milestone 已關閉；最新功能 head CI 通過 tests、typecheck、build 與三個 demo。

## Milestone 15 交接
快照選單在 web 選取 core 既有初始／最終／逐檔前後 schema，不重新 replay。未知快照不繪圖；切換重設布局，與搜尋獨立。329 tests；讀 docs/milestone-15.zh-TW.md，狀態見 github-milestones.md。

M15 已合併 PR #50（cf8f0b8），issues #48/#49 與 milestone 已關閉；最新功能 head CI 通過 tests、typecheck、build 與三個 demo。

## Milestone 16 交接
ERD 比較在 web 標記 core 的結構 diff。前後兩圖各自是真實 schema，未知快照／diff 不比較，未推測 rename。337 tests；讀 docs/milestone-16.zh-TW.md，狀態見 github-milestones.md。

M16 已合併 PR #54（25dc11c），issues #52/#53 與 milestone 已關閉；功能 head 1a9ec51 的 CI 通過 tests、typecheck、build 與三個 demo。

## Milestone 17 交接
比較圖共用表名／高度布局與 GraphView，不混合 schema；互動同步，單圖仍本地 state。342 tests；讀 docs/milestone-17.zh-TW.md，狀態見 github-milestones.md。

M17 已合併 PR #58（5054727），issues #56/#57 與 milestone 已關閉；功能 head c04f3ff 的 CI 通過 tests、typecheck、build 與三個 demo。

## Milestone 18 交接
ERD 搜尋僅改聚焦清單，聚焦只更新 shared／local GraphView，不改 schema。346 tests；讀 docs/milestone-18.zh-TW.md，狀態見 github-milestones.md。

M18 已合併 PR #62（d6a170d），issues #60/#61 與 milestone 已關閉；功能 head a313dbc 的 CI 通過 tests、typecheck、build 與三個 demo。

## Milestone 19 交接
TableDetails 讀取當前 schema 與 focused，完整呈現欄位／索引／外鍵，缺表或缺省不補猜測值。352 tests；讀 docs/milestone-19.zh-TW.md，狀態見 github-milestones.md。

M19 已合併 PR #66（8c7d6ad），issues #64/#65 與 milestone 已關閉；功能 head a53c2b2 的 CI 通過 tests、typecheck、build 與三個 demo。

## Milestone 20 交接
Core 0.6.0 的 Column.useCurrent 是可選 boolean，與 scalar default 不同。三份 Laravel 12 官方 PHP 保留原始 bytes／commit／SHA-256／授權來源；分析結果 3／3、8 表、0 外鍵。另跑 npm run demo:laravel（CI 已加入），362 tests；讀 docs/milestone-20.zh-TW.md。外部 schema 仍須符合完整既有契約；不執行 PHP 或 DB。

M20 已合併 PR #70（5cea3b4），issues #68/#69 與 milestone 已關閉；功能 head 325238a 的 CI 通過 tests、typecheck、build 與四個 demo。

## 可攜專案 skills

repo 的 .agents/skills/ 包含 migration-core-review、milestone-delivery、migration-ui-review、migration-handoff。接手交接流程讀 migration-handoff；修改 React／ERD 時讀 migration-ui-review；核心 review 已補入固定來源／hash／授權與相容性樣本流程。這些是可讀的工作指引，不會自動建立子代理、排程、轉移對話或擴大權限。雲端是否自動發現技能仍須在該環境確認；AGENTS.md 已提供明確使用入口。

## 雲端接手與 M23 交付（2026-10-03）

接手前 checkout=f7e2383、無未提交變更；origin/main 已 fast-forward 到 27594f9d5456429579222631cca5943f02c97d2a。雲端 Node 24.19.0／npm 11.9.0 重新執行 npm ci，408 tests、typecheck、build、demo:project／tables／helpers／laravel／changes 全通過。這是雲端實測，不沿用本機 CI 證據。

M23 已合併（PR #82／4563f01），原功能分支 feat/m23-current-on-update：core 0.8.0、新增 38 個回歸、跨檔 golden、built-package demo:current-update 與中文教學。接手分支時另執行 npm run demo:current-update；雲端已實測 446／446 tests、typecheck、build 與六個 demo 通過；新任務仍須以實際 runner 結果為準。檢查最新 Git 狀態與交付紀錄，PR 最新 head 6fc61fa 的 CI 已通過，issue #81／milestone 23 已結案。

環境 start_skill 已由 M20 更新為讀取當前 milestone、現行 AGENTS 的全部 demo。GitHub 原生 Git 讀取與 M23 分支推送均可用（功能 commit 5cde61e 已以遠端 SHA 確認）；API 先前受代理限制，api.github.com 已加入草稿；後續已在沙箱外成功建立 PR、查 CI 並合併。唯讀沙箱內的 socket 限制仍需工具核准，不再將先前 403 視為現行 API 阻擋。草稿保存不等於 runtime 套用、發布或 CI 通過；發布仍由使用者操作。沒有瀏覽器工具，本次不宣稱互動驗收。

## 2026-10-04 接回本地

M23 已同步本地 main=a8d7b5a，446 tests、typecheck、build 與六個 demo 已在本地重新通過。M24 雲端 WIP 045e041 保存了測試與 fixtures，已取回 feat/m24-rename-index，雲端已停止開發。原 M22 本地版本保留於 baseline/local-m22。M24 的實際 PR／合併與驗證基準見 github-milestones.md 與 milestone-24.zh-TW.md，不把 WIP 當成功交付。

M24 已由 PR #85 合併（7580dca），issue #84 與 milestone 已關閉；接手時以最新 Git／交付紀錄為準。

## M25 本地開發

已實作靜態 dropColumn 陣列，core 0.10.0，501 tests 與八個 demo 通過。讀 milestone-25.zh-TW.md；已由 PR #88 合併（abab843），issue #87／milestone 25 已關閉；完整證據見 github-milestones.md。雲端維持停止開發，勿同時新增功能。

## M26 本地開發

已實作 dropConstrainedForeignId，core 0.11.0，526 tests 與九個 demo 通過。讀 milestone-26.zh-TW.md；已由 PR #91 合併（1f86cc3），issue #90／milestone 26 已關閉；完整證據見 github-milestones.md。雲端維持停止開發。
