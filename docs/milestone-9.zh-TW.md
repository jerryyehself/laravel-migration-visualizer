# Milestone 9：搜尋與篩選逐檔結果

專案有很多 migration 時，檔名搜尋與狀態篩選能縮小逐檔檢視清單。這階段只改 React／web；core 仍為 0.5.0，schema、replay、diff、diagnostics 與匯出契約不變。

## Component、state、props 與衍生資料

ProjectResults 是結果 component，也就是畫面單位。父 component 用 props 傳入完整 result、selected 與 onSelect callback；query 和 status 則是 ProjectResults 的 state，保存使用者目前的搜尋字串與篩選條件。

visible 清單可以從 result + query + status 算出，所以不再存一份 state。這叫衍生資料：只保存真正的輸入，再算出顯示結果，避免原清單與篩選清單不同步。

filter-results.ts 只投影已有快照，沒有解析 PHP、排序或 replay。排序由 core 決定，web 保留原有順序與 index。這與後端查詢結果傳給 view，再在 view 選擇顯示哪些項目的分工相近。

## 操作規則

- 在「搜尋 migration 檔名」輸入完整檔名或部分路徑，做字串包含比對；忽略大小寫、移除搜尋字串前後空白。
- 狀態可選全部／已套用／失敗／已阻擋，並與檔名搜尋一起使用。
- 清單顯示「顯示 N / M 份」。原先的第 3 份即使是唯一匹配，編號仍為 3，點選 callback 也使用 core 原本的 index。
- 已選取項目仍符合條件時保留；被隱藏時暫時顯示第一個匹配項目；無匹配時移除逐檔詳情，顯示調整條件提示。
- 暫時改顯示第一個匹配不會覆寫父層的上次選取；清除篩選會恢復上次手動選取。若在篩選清單手動點選另一份，則記住新的選取。
- 修改 migration 輸入會清除結果、卸載結果 component，篩選 state 也重置。只修改篩選不必重新分析。

## 顯示範圍與分析可信度

篩選只影響逐檔清單與逐檔詳情。專案 summary、全域 diagnostics、finalSchema／lastValidSchema，以及完整 JSON 與下載入口，始終使用完整 result。

例如專案套用第 1 份後，第 2 份失敗，第 3 份被阻擋。只看「已套用」時不代表專案成功：summary 仍是 1/3、最終 Schema 未知，最終 Schema 下載仍停用。只看「已阻擋」時，第 3 份的前後快照與 diff 仍是 null，不會因篩選而產生猜測結果。

## 檔案與限制

主要修改 apps/web/src/components/ProjectResults.tsx、apps/web/src/filter-results.ts、style.css；測試在 apps/web/tests/filter-results.test.ts。未修改 packages/migration-core 或 golden JSON。

搜尋僅針對檔名與路徑，不搜尋 PHP／operation／table／診斷內容；沒有 regex 或模糊搜尋、排序切換、分頁或虛擬清單。每次輸入都同步投影清單，大型專案效能尚未做壓力測試。沒有 timeline、ERD、down()、AI、SQL/runtime execution 或 semantic refactoring detection。

## 驗證

283／283 tests（263 core、5 import、6 export、9 result filters）通過；npm run typecheck、npm run build 通過。

新增測試覆蓋 core 順序與原 index、路徑搜尋、大小寫／空白、三種狀態、組合條件無匹配、選取保留／fallback、空清單、不可變結果與完整匯出。

瀏覽器確認狀態與檔名搜尋、原編號／對應詳情、清除篩選、無匹配提示、blocked 未知快照，以及修改輸入會移除舊篩選。顯示 1/3 時，完整 JSON 仍有三份、兩筆診斷與 null finalSchema；console 無 warn/error。

GitHub 交付見 [紀錄](github-milestones.md)。
