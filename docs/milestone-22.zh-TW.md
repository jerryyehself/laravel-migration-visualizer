# Milestone 22：既有欄位 change()

Core 0.7.0 新增 `changeColumn` AtomicOperation：`{kind:'changeColumn',table,column,source}`。直接提供 changeColumn 的 caller 也不能附 autoIncrement=true 或 primary=true；primary 由索引同步。SchemaState 格式不變；外部使用者若對 operation 做 exhaustive switch，需增加此分支。變更不是新增欄位，也不是猜測 rename。

## Laravel 規則與分析器範圍

核對 [Laravel 12 modifying columns](https://laravel.com/framework/docs/12.x/migrations#modifying-columns) 與固定 framework commit `71cf667d43f9cd3f840b1733bb2b7bec65d72282` 的 [Blueprint::addImpliedCommands／addFluentIndexes](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Blueprint.php)。前者要求重新列出要保留的修飾，並說明 change 本身不改索引；後者把標記 change 的 ColumnDefinition 轉成 change command，索引修飾另建指令。

本次採用完整欄位定義替換，而不是把新屬性 merge 到舊物件：`string('name',50)->change()` 會得到非 nullable、length=50 的 string；先前 default/comment 沒有重列便移除。useCurrent、allowedValues、unsigned 等也依新定義保存或移除。欄位型別的缺省屬性沿用既有正規化規則，不模擬各 DB 的實際缺省值。

僅支援 Schema::table 的單一一般欄位：string/char、既有整數與 unsigned 整數、decimal/enum、timestamp/dateTime/time 與 Tz，以及既有 text/boolean/date/json/jsonb/uuid。change 必須零參數、且只出現一次；可放在已支援修飾的前後。原本的非 change 行為不變。

明確拒絕：Schema::create 內 change、helpers（含 timestamps/softDeletes/rememberToken）、id/increments/bigIncrements、foreignId/constrained、同鏈 index/unique/primary（即使 null/false）、其他未支援 API。索引可用分開的既有指令管理；未指定時保留原有名稱／欄位順序，不自動重建。

Replay 還會拒絕修改既有 autoIncrement=true 欄位，或任一外鍵的本地／被引用欄位（含 self-reference）。可以先顯式 dropForeign 再修改；不推測 DB 型別相容性、constraint 重建或 SET NULL 變更安全性。這些是分析器的保守限制，不代表 Laravel 或資料庫禁止這些用法，也不代表其他修改能實際執行成功。

## 分層與原子性

normalize 像後端的 command adapter：把 PHP AST 鏈轉成完整 column replacement command。Replay 像 domain service，先確認表／欄位存在、檢查限制，再在拷貝的 state 替換欄位；indexes 是 primary 的權威來源，替換後重新同步 column.primary。

第一份失敗 migration 保留 schemaBefore，schemaAfter/diff 為 null；後續仍解析，但所有快照／diff 為 null。中途加過的 partial 欄位不洩漏到 lastValidSchema。不存在的欄位不會被偷偷當成新增。

React component 是呈現畫面的單元；state 是操作時會改變的畫面資料；props 是父層傳入的結果與 callbacks。本次沒有新增 UI 規則：既有畫面直接呈現 core 的 changeColumn JSON、columnChanged diff 與前後快照。像後端回傳 DTO 一樣，前端不再自己判斷哪些修飾該保留。

## 驗證

新增 35 個測試；套用在 M21 baseline 的相同完整測試先為 23 failed／12 passed，實作後全通過。完整 408／408 tests、typecheck、build、demo:changes 通過；其他四個 demo 亦作交付驗證。

本地自寫 PHP fixture 與人工指定的 success／blocked golden 涵蓋三檔順序、完整快照、結構 diff、可信前綴與診斷 codes；不是上游官方樣本，也不是自動錄製分析器輸出。另測移除／重列修飾、型別變化、enum 拷貝隔離、索引與 derived primary 保留、特殊名稱 __proto__/constructor、未知表／欄位、外鍵／自增拒絕、直接公開 replay 輸入保護與 no-op diff。

執行 `npm run demo:changes`：從建置後公開 package 分析 create → change → reset 三檔，再檢查中途未知欄位導致 failed／blocked 的流程；CI 新增相同命令。未執行 PHP 或資料庫，也沒有瀏覽器驗收或修改 UI。

沒有新增 timeline、down()、AI、SQL parser、runtime migration execution 或 semantic refactoring detection；useCurrentOnUpdate 仍未支援。

[PR #79](https://github.com/jerryyehself/laravel-migration-visualizer/pull/79) 已合併 main（dbc9aa4）；issue #78 與 milestone 已關閉。功能 head 601946b 的 CI（408 tests、typecheck、build 與五個 demo）全數通過。
