# Milestone 10：匯入 migrations 資料夾

這階段讓多檔工作台一次讀取選定資料夾與子資料夾中的 PHP，保留相對路徑並列出略過的非 PHP 檔案。Core 仍為 0.5.0，公開 JSON 契約不變。

## Component、state、props 與 IO 分層

Component 是畫面單位。ProjectWorkbench 負責輸入：files state 保存目前 PHP 副本，reading 表示讀取中，folderImport 只保存成功匯入的數量與略過路徑。state 改變時 React 重新呈現畫面，不需手動改 HTML。分析後，父 component 用 props 把完整結果傳給 ProjectResults 顯示。

讀取本機檔案屬於 web 的 IO 邊界，放在 import-files.ts。readMigrationFolder 把瀏覽器 File 轉成 core 接受的 filename/source 字串；analyzeProject 再負責排序、解析、schema replay 與 diff。這類似後端 controller 讀取 request 後交給 domain service；React hooks 只管理畫面狀態，沒有 parser 或 schema 規則。

瀏覽器提供 webkitdirectory 選取資料夾，以及 webkitRelativePath 相對路徑。路徑通常包含選取的根目錄名稱，例如 migrations/nested/2026_07_02_000000_update_users.php，不是本機絕對路徑。參考 [File and Directory Entries API](https://wicg.github.io/entries-api/#dom-htmlinputelement-webkitdirectory)。

## 匯入規則

- 選取 migrations 資料夾，成功後取代目前清單，重置選取與分析結果；不修改磁碟上的檔案，也不上傳伺服器。
- 只讀取小寫 .php；非 PHP（包含 .PHP）不讀取內容，列入略過清單。原本的 PHP 多檔匯入仍嚴格拒絕非 PHP。
- 保留瀏覽器提供的子資料夾路徑；未提供相對路徑時使用 basename。保留輸入順序，分析順序交由 core 決定。
- 不自動刪除格式錯誤或重複名稱的 PHP。不同子資料夾同名 migration 仍由 core 診斷，阻止整個專案 replay。
- 任何 PHP 無法讀取或 UTF-8 解碼失敗，整批拒絕，不取代原清單；沒有 .php 也保留原清單。開始讀取時會清除舊分析結果，需要重新分析。
- 取消選取不改變輸入；讀取中停用輸入控制。修改內容或載入範例會清除匯入摘要。
- 瀏覽器不支援 webkitdirectory 時，停用資料夾選取並提示改用 PHP 多檔匯入。

## 檔案與限制

修改 ProjectWorkbench.tsx、import-files.ts、main.tsx；新增 folder-import.test.ts 與含子資料夾的 PHP／文字 fixture。未修改 migration-core 或 golden JSON。

所有選定的 .php 都會進入分析，沒有自動辨識 Laravel 專案根目錄、忽略 vendor 或辨識哪些 PHP 是 migration；請選 migrations 資料夾。沒有 zip、拖曳、檔案監看、增量匯入、進度百分比或檔案大小限制。大量檔案會同時讀取並保存於記憶體，尚未做壓力測試。資料夾選取能力依瀏覽器而異，本次實測為 Codex 內建瀏覽器。

沒有 timeline、ERD、down()、AI、SQL/runtime execution 或 semantic refactoring detection。

## 驗證

293／293 tests（263 core、5 import、6 export、9 filters、10 folder import）通過；npm run typecheck、npm run build 通過。

新增測試涵蓋巢狀路徑、非 PHP 不讀取、重複 basename、core 排序與 operation source 路徑、整批 IO／UTF-8 失敗、無 PHP、路徑 fallback 與原匯入模式回歸。

實際瀏覽器透過資料夾 chooser 選取 fixture：匯入 2 份 PHP、略過 migrations/README.txt，巢狀路徑完整；分析結果 2/2 已套用、0 診斷，最終 users 包含 remember_token。Console 無 warn/error。IO 失敗與 UTF-8 拒絕由單元測試驗證，尚未在瀏覽器實測這兩種錯誤。

[PR #30](https://github.com/jerryyehself/laravel-migration-visualizer/pull/30) 已合併 main（47d5b0f）；對應 issues／milestone 已關閉。GitHub 狀態見 [交付紀錄](github-milestones.md)。
