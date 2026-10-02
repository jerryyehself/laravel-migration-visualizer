# Milestone 8：分析結果匯出

多檔工作台現在可以把分析結果保存成 JSON。這一階段只改 web caller，migration-core 仍是 0.5.0，公開 schema、operations、replay 與 diff 規則不變。

## 用 component、state、props 理解下載

ProjectExports 是一個 component，也就是專門呈現下載入口的畫面單位。它透過 props 接收父 component 的 result，不自己解析 PHP，也不產生快照。它的 state 只保存啟動下載時的錯誤訊息。

prepareProjectExport 把既有結果轉成 JSON 字串，downloadJson 才處理 Blob、下載連結與 object URL。這些瀏覽器 IO 都在 apps/web/src/export-results.ts；core 完全不需要知道「下載」是什麼。這就像後端 service 回傳資料，controller 再決定要用 JSON response 或檔案輸出。

## 兩種下載與可信度

| 入口 | 檔名 | 內容與條件 |
|---|---|---|
| 下載完整分析 JSON | migration-project-analysis.json | 完整 ProjectAnalysis，成功與失敗均可下載 |
| 下載最終 Schema JSON | migration-final-schema.json | 只輸出 finalSchema；必須 complete 且 finalSchema 非 null |

完整報告保留 core 排序、每檔狀態、operations、來源位置、前後快照、diff、diagnostics、initialSchema、finalSchema 與 lastValidSchema。內容直接使用現有公開 JSON 契約，UTF-8、兩格縮排、尾端換行，不新增時間戳或包裝格式。不含 PHP 原始碼；欄位名稱、comments、default 等分析資料仍會存在。

失敗報告不會把 null 變成空物件，也不會拿 lastValidSchema 填進 finalSchema。最後可信 schema 只代表成功前綴，不能當成最終結果。除了 UI 停用按鈕，序列化函式本身也拒絕失敗分析的最終 schema 匯出。

修改輸入後，原本結果會被清除，下載入口也跟著移除；重新分析後才能匯出新的結果。切換選取檔案只影響檢視，不影響完整專案報告。

## 下載流程與限制

JSON 字串在瀏覽器轉成 Blob，建立暫時 object URL、觸發 download link，移除連結並稍後釋放 URL。沒有上傳 API，也不將內容送到伺服器。下載儲存位置與同名檔案處理由瀏覽器決定。

- 只支援多檔工作台結果；單檔練習沒有新增匯出入口。
- 沒有 PHP 專案壓縮包、JSON 再匯入、草稿持久化或跨版本轉換。Schema JSON 仍需符合 core 0.5.0 契約。
- 可以捕捉同步建立／觸發下載錯誤，但不能確認使用者是否接受儲存、瀏覽器是否封鎖或檔案最終是否落盤。因此 UI 不宣稱「已儲存成功」。
- 大型結果會同步序列化並建立 Blob，尚未做效能／記憶體壓力測試。

## 驗證

274／274 tests 通過（263 core、5 browser import、6 export contract）。新增測試覆蓋完整成功報告與最終 schema、失敗／blocked 快照、排序失敗、已知空 schema、中文與 enum 值／順序、prototype-like 名稱，以及序列化不修改原結果。npm run typecheck、npm run build 通過。

瀏覽器已確認：成功時兩個入口可用；載入新的輸入而尚未分析時沒有入口；失敗時完整分析可用、最終 schema 停用，保留未知狀態說明；console 無 warn/error。

**使用者實測驗收（2026-10-02）**：使用者回報「我自己測下載有成功」，補上實際下載成功的人工驗證。JSON 內容契約另由上述序列化測試驗證。內建預覽未回傳 download 事件，因此本次實際下載成功的證據來自使用者回報；自動化落盤驗證仍未涵蓋。PR #22 已轉為可審查，尚未合併。

未擴增 timeline、ERD、down()、AI、SQL／runtime execution 或 semantic refactoring detection。GitHub 交付見 [紀錄](github-milestones.md)。
