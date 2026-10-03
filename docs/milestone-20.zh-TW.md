# Milestone 20：Laravel 官方 migration 相容性基準

新增可重現的官方樣本，並修正樣本揭露的 useCurrent 缺口。Core 升至 0.6.0；只新增可選 Column.useCurrent 屬性，既有索引／外鍵契約不變。

## 樣本與證據

採用 [Laravel 12 專案骨架 migrations](https://github.com/laravel/laravel/tree/e90c74ca717e9082d7463a2db50814fe565a3e44/database/migrations) 的三份檔案。固定 commit e90c74ca717e9082d7463a2db50814fe565a3e44，PHP 不做修改；provenance.json 記錄每份來源及 SHA-256，測試確認 bytes。骨架 README 宣告 MIT；附 framework 的 MIT LICENSE.md，授權來源與 framework commit 71cf667d43f9cd3f840b1733bb2b7bec65d72282 明列於 provenance，不宣稱 LICENSE 是骨架 repo 原檔。

修正前前兩份成功，第三份 failed_at 的 useCurrent() 產生 UNSUPPORTED_BLUEPRINT。appliedCount=2，最後可信 schema 為 5 表，finalSchema=null，第三份 jobs／job_batches／failed_jobs 不洩漏成可信結果。

修正後三份皆成功且無診斷，逐份快照為 3、5、8 表。inventory.golden.json 是人工由上游 PHP 定義的表／有序欄位／索引數／外鍵數清單，不由分析器自動錄製。sessions.user_id 使用 foreignId()->nullable()->index()，沒有 constrained()，所以沒有外鍵；8 表整體 0 個外鍵是預期結果。

## 為何不是 default 字串

[Laravel ColumnDefinition](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/ColumnDefinition.php) 記載 useCurrent，MySQL grammar 的 [typeTimestamp](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Grammars/MySqlGrammar.php) 會把它轉成資料庫 Expression。靜態分析只保留意圖 `{useCurrent:true}`，不計算時間，也不把 expression 誤寫為 scalar `default:"CURRENT_TIMESTAMP"`。

本階段支援 timestamp／timestampTz 的零參數 useCurrent()。dateTime／dateTimeTz、useCurrent(false)、useCurrentOnUpdate() 仍不支援。default() 與 useCurrent() 的混用不論順序都診斷為不支援；這是保守的分析範圍，不是宣稱 Laravel 禁止混用。未建模 DB grammar 的優先序、SQL、精度方言與 runtime 行為。

## core 與 React 分層

normalize.ts 把 AST chain 轉成 AtomicOperation，schema replay 原有深拷貝保留屬性，SchemaDiff 按結構比較新增屬性。這相當於後端 domain service；核心只收字串，沒有讀檔或 React 依賴。

ProjectWorkbench 是 component：一個呈現輸入與結果的畫面單元。它的 state 保存使用者載入的檔案與分析結果；sample button 只取代輸入，按分析才呼叫 core。Graph／TableDetails 的 props 是上層傳入的 schema，明細沿用已存在的屬性顯示 useCurrent=true，不另外解讀 PHP 或補 default。

測試與 examples 可以讀 fixture，但 IO 留在 caller。新增 npm run demo:laravel 透過建置後公開套件分析亂序檔案，確認排序、3／5／8 快照、8 表、0 外鍵和 failed_at 屬性。CI 加入同一命令。

## 驗證與限制

362／362 tests（新增 10 個）通過；typecheck、build、demo:project、demo:tables、demo:helpers、demo:laravel 通過。新增回歸在修正前為 4 failed／6 passed，修正後全數通過；涵蓋來源 hash、golden inventory、型別、衝突／參數拒絕、不可變與 diff。

只證明這三份固定官方樣本的 up() 相容。不是任意真實專案、完整 Blueprint 或資料庫執行相容性的保證。fixture 雖含 down()，分析器仍只讀 up()。未加入 timeline、AI、SQL parser、runtime execution 或 semantic rename。

下一階段可擴充有明確來源的多階段 migration corpus，優先檢查常見 change()／時間欄位修飾缺口；仍先加入失敗回歸，再依具體案例設計契約。

瀏覽器確認官方樣本 3／3 已套用、0 診斷、ERD 8 表／0 外鍵；failed_jobs 明細顯示 failed_at 的 useCurrent=true，未補 default。Console 無 warn／error。
