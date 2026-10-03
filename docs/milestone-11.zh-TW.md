# Milestone 11：診斷原始碼定位

專案／逐檔診斷新增定位按鈕：用診斷的完整檔名尋找輸入副本，顯示唯讀原始碼片段，並選取 core 排序後的對應結果。Core 0.5.0 與 JSON 契約不變。

## Component、state、props

DiagnosticSource 是呈現原始碼的 component。ProjectWorkbench 用 props 把輸入 files 傳給 ProjectResults；結果 component 的 located state 只記住使用者點選的診斷。片段由 source 與診斷行號算出，不另存一份重複 state。

onLocate 是透過 props 傳給診斷清單的 callback。點選按鈕時回傳診斷，父 component 更新 located、清除結果搜尋／狀態篩選，並通知 onSelect 選取正確的 core result index。這是畫面互動；parser、replay 與信任邊界仍由 core 負責。

useEffect 在定位卡片更新後把鍵盤焦點移到卡片並捲動至該處。它只處理 DOM 呈現，不執行分析。React 用文字內容呈現 PHP，不把原始碼當成 HTML 執行。

## 定位契約與限制

- 完整相對路徑必須精確匹配；不以 basename 猜測同名檔案。缺少輸入或相同完整路徑有多份時停用按鈕並說明。
- analysis／replay 診斷有有效的一基行號時，高亮該行，顯示前後最多三行。支援 LF、CRLF 與 CR。
- ordering／dependency 是檔案層級問題，不把 core 的第一行占位當成有錯的 PHP。無效或超出來源的行號也不猜測，顯示檔案開頭最多七行。
- column 沿用 core 數值，不轉換或高亮字元範圍。沒有完整編輯器、語法著色、自動修正或跳到外部 IDE。
- 定位清除篩選，確保對應結果可見；不改變分析結果、全域診斷、未知快照或匯出內容。
- 只顯示工作台副本，不修改原始檔。修改輸入／重新匯入／載入範例後舊結果卸載，定位 state 重置。手動切換結果或篩選時，定位卡片仍保留上次點選診斷，標題明確標示來源。
- 單檔練習尚未提供此定位功能。没有 timeline、ERD、down()、AI、runtime execution 或 semantic refactoring detection。

## 驗證

301／301 tests 通過（新增 8 個定位測試），npm run typecheck、npm run build 通過。測試涵蓋完整路徑、歧義／缺少來源、輸入順序與 core index 不同、排序診斷、上下文範圍、CRLF／EOF、無效行號與來源文字不可變。

內建瀏覽器實測：只看已套用後點選 unsupported 診斷，篩選恢復全部並選取第 2 份結果，第 6 行 fullText 高亮；blocked 顯示檔案開頭而不標示錯誤行。修改輸入清除定位，相同完整路徑的重複輸入停用按鈕。最終 Schema 仍未知且下載停用。M11 預覽 5192 無 warn/error；同一 tab 留有舊 5191 預覽斷線的歷史 Vite 訊息，與新頁面無關。

交付狀態見 [GitHub 紀錄](github-milestones.md)。
