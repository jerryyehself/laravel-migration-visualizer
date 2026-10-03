# Milestone 13：編輯副本還原

多檔輸入清單顯示已修改標記與數量；目前檔案可還原至載入時的檔名與 PHP。Core 仍為 0.5.0。

## State 與衍生資料

每份 MigrationDraft 同時保存 current 與 original。original 在首次預載、載入範例或成功匯入時建立，不隨編輯改變；current 是真正交給 analyzeProject 的輸入。

ProjectWorkbench 以一份 drafts state 管理這兩者，files 與 modifiedCount 都由 drafts 推導，不另存重複的狀態。這類似後端表單的原值與修改值，但不寫資料庫。React 只管理工作台副本，parser／schema 邏輯仍在 core。

不能用檔名做原值的查找 key，因為檔名本身可被修改或重複。因此 baseline 隨每份 draft 一起保存；刪除別份 migration 只是移除那份 draft，不會重設剩餘檔案的原值。createDrafts 為 current／original 各自複製輸入物件，避免共用可變容器。

## 操作規則

- 原始碼或檔名與載入版本不同即標示已修改；手動改回相同內容則清除標記。比較原始字串，不分析語意。
- 還原只恢復目前檔案的檔名與 PHP；其他修改保持不變。未修改時按鈕停用。
- 還原、修改與移除都清除舊分析／定位／匯入摘要，必須重新分析，避免展示不符合輸入的 schema。
- 成功匯入或載入範例會建立新的 baseline；失敗匯入保持目前 drafts 不變。
- 刪除檔案不會把剩餘修改當成新的載入版本。新的選取 index 限制在有效範圍；移除最後一份後顯示空清單。
- 還原會捨棄目前此檔副本的修改，按鈕旁清楚說明。磁碟原始檔不受影響。

## 限制

沒有多步 undo/redo、還原被移除檔案、整個專案一次還原、寫回磁碟或重新載入磁碟最新版本。載入版本只存在記憶體；重新整理或切換工作台模式會重置。原始 CRLF／CR 字串保留在 baseline；textarea 編輯可能正規化換行，字串差異仍算修改。

未擴增 timeline、ERD、down()、AI、SQL/runtime execution 或 semantic refactoring detection。

## 驗證

315／315 tests（新增 8 個 draft tests）、typecheck、build 通過。測試涵蓋原值隔離、檔名／PHP 修改與手動回復、單檔還原保留其他修改、刪除後原值配對、重複檔名、新 baseline、空／無效 index，以及還原後 core 分析結果恢復。

瀏覽器確認：改名與不合法 PHP 後分析失敗；還原恢復兩個欄位，清除舊結果並停用按鈕，重新分析成功。另一份移除後，剩餘改名副本仍還原到正確原值。載入範例重置，已修改數量與標記正確；console 無 warn/error。

GitHub 交付見 [紀錄](github-milestones.md)。
