# Milestone 3：多檔專案工作台

這一階段把 Milestone 2 的分析能力接到 React。你可以匯入多份 PHP、編輯工作台副本，查看排序後的逐檔結果、schemaBefore / schemaAfter、SchemaDiff 與專案診斷。沒有新增 Laravel API 或改變 core 的分析規則。

## 從 component、state、props 開始

Component 是一個回傳畫面的小函式。`ProjectWorkbench` 負責輸入與操作，`ProjectResults` 負責顯示分析結果，`SchemaView` 把 schema 畫成表格。這種拆分像後端把接收請求、處理業務與回傳結果分開：每個元件有明確的責任。

State 是 React 替元件記住的資料。例如 `files` 記住目前輸入，`selectedInput` 記住正在編輯哪一份，`result` 記住最近一次按下分析得到的結果。呼叫 setter 後，React 依新的資料重新計算畫面。State 不是資料庫，重新整理網頁或切換模式會清除這些資料。

Props 是上層傳給下層的參數。`ProjectResults` 收到 `result`、`selected` 和 `onSelect`：前兩個是資料，第三個是通知上層「使用者選了另一份結果」的函式。子元件不修改分析結果，也不重新執行 schema replay。

```text
瀏覽器檔案選擇器
  → import-files.ts：讀 UTF-8 → { filename, source }[]
  → ProjectWorkbench：保存輸入、按下分析
  → migration-core.analyzeProject：排序 → PHP AST → operations → snapshots / diff
  → ProjectResults：以 props 接收結果
  → 診斷、資料表、JSON
```

讀檔是 UI 應用的環境能力，所以放在 `apps/web/src/import-files.ts`；排序與 schema 規則是 domain 能力，所以繼續放在 `packages/migration-core`。未來換成 CLI 或另一套前端，也能呼叫相同 core API。

## 怎麼使用

1. 執行 `npm run dev`，開啟終端顯示的網址，預設是多檔專案。
2. 按「載入成功範例」或一次選取多份 `.php` 檔案。匯入會取代整個輸入清單。
3. 左側顯示輸入順序。可以選取檔案，編輯檔名／PHP；只改工作台中的副本，不寫回磁碟。
4. 按「分析專案」。結果清單顯示 core 的排序；點選各份結果查看前後快照與差異。
5. 失敗範例的第二份使用不支援的 `unique()`，第三份被阻擋。可以用它觀察可信前綴和未知狀態。
6. 「單檔練習」保留原本的單檔輸入。切換模式會重置離開的工作台。

原始碼只在瀏覽器記憶體中讀取；本工作台沒有檔案上傳服務。匯入要求 UTF-8；任一檔讀取或編碼失敗，整批不匯入，保留原輸入並清除舊結果。檔名格式和重複名稱由 core 診斷，UI 不偷偷改名、排序或去除重複檔案。

## 為什麼不能把未知狀態畫成空表

成功建立第一張表之前，schema 是 `{ tables: {} }`：我們知道目前沒有資料表。某份 migration 失敗之後，`schemaAfter` 是 `null`：我們不知道正確的結果。把 null 畫成空表，會讓人誤以為所有表都被刪掉。

因此畫面分別顯示「已知的空白 schema」與「沒有可信的快照」。失敗檔可以顯示可信的 schemaBefore，後續被阻擋的檔案則沒有 before、after 或 diff。畫面仍可列出已識別的 operations，但不能把它們當成已套用。

`lastValidSchema` 顯示為「最後可信 Schema（僅成功前綴）」。只有 `complete` 為 true 才顯示「專案最終 Schema」。core 的 rename operation 可能存在，但結構 diff 只顯示欄位移除與新增，不推測 semantic rename。

## 輸入變更與非同步讀取

分析結果對應某次提交的輸入。修改檔名、原始碼、移除檔案、載入範例或匯入新檔，都會清除先前的結果，需要重新按分析。切換正在查看的檔案不改輸入，因此不清除結果。

讀檔是非同步工作：瀏覽器等待檔案內容時，輸入區會暫時停用，避免較早的讀取結果蓋掉新的編輯。成功後一次換掉清單；失敗不回傳半批檔案。匯入後重置 file input，讓同一組檔案可以再次選取。

## 驗證與目前限制

- 原本 71 個 core tests 保留；新增 5 個匯入測試，涵蓋中文 UTF-8、重複名稱保留、非 PHP、讀檔失敗、無效 UTF-8 與空輸入。
- 型別檢查和正式建置通過。
- 瀏覽器手動驗證三檔成功、rename 結構差異、中途失敗／後續阻擋、無效檔名、編輯清除結果及實際多檔匯入。
- 仍從空白 schema 開始，不讀取資料庫。core 支援範圍與診斷契約見 README。
- 不保存草稿、不寫回 PHP、不匯入資料夾／ZIP、不下載結果。
- 分析目前同步執行；大量或非常大的檔案可能讓介面暫時停頓，尚未使用 Web Worker，也未測量大型專案效能。
- 不包含 timeline、ERD、down()、AI、runtime execution、SQL parser 或 semantic refactoring detection。

下一階段可優先補真實專案 fixtures 與 parser 支援缺口，再依大型專案的實測決定是否引入 Web Worker。避免在分析契約還不足時先增加圖形展示。
