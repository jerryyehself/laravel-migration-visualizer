# Milestone 23：更新時的 current timestamp 意圖

Core 0.8.0 新增可選 `Column.useCurrentOnUpdate?: boolean`。零參數 `useCurrentOnUpdate()` 正規化為 `true`，表示更新時使用資料庫 current timestamp 的意圖。它與 `useCurrent` 的預設值意圖分開，不寫入 scalar `default`、不讀取時鐘、不執行 PHP／SQL。AtomicOperation variants 與 SchemaState 容器格式沿用 M22；舊 schema 沒有這個選用欄位時仍符合契約，並不代表資料庫缺省值為 false。

## 固定來源與判斷依據

延續 M20／M21 的 Laravel framework commit `71cf667d43f9cd3f840b1733bb2b7bec65d72282`，以 HTTPS 取得並核對：

- [ColumnDefinition.php](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/ColumnDefinition.php#L35)：記載零參數 useCurrentOnUpdate，並標示 MySQL。
- [MySqlGrammar::typeDateTime](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Grammars/MySqlGrammar.php#L991) 與 [typeTimestamp](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Grammars/MySqlGrammar.php#L1045)：useCurrent 設定 default Expression；useCurrentOnUpdate 另外設定 onUpdate Expression。Tz 方法委派給對應非 Tz 方法。
- [compileChange](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Grammars/MySqlGrammar.php#L396) 使用 getType 與 addModifiers；[modifyDefault／modifyOnUpdate](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Grammars/MySqlGrammar.php#L1329) 分開處理兩種意圖。這支持新增獨立 metadata，以及在 M22 的完整 replacement 定義保留／移除它。

核對檔案 SHA-256：MySqlGrammar.php 為 `1869f1075d11d2e8381eb775f20d1e144ca62d17d36d5e635a970f5e0cee791c`；ColumnDefinition.php 為 `25c0bb4038a5a1dcefbafd40c2446081d9e3bc73e077e83e1a99b9204669a7a0`。本階段 PHP scenarios 是自行撰寫的測試，不是官方 migrations 複本；沒有匯入上游原始碼。M20 的三份官方樣本仍是獨立相容性基準。

這些來源只能支持保存 API 意圖，不能證明所有 DB grammar、版本、時間區域或實際更新行為相同。precision 沿用既有靜態規則；不在這裡添加 MySQL 特定精度上限或模擬 SQL 字串。

## 支援與拒絕規則

| 寫法 | 分析器結果 |
|---|---|
| timestamp／timestampTz／dateTime／dateTimeTz + 零參數 useCurrentOnUpdate | 支援，獨立 `useCurrentOnUpdate:true` |
| 與 useCurrent 組合，任意順序 | 支援，保存兩個旗標，不產生 scalar default |
| 與既有 scalar default 組合，任意順序 | 支援，保留 default（包括 null／0／false）與 update 旗標；不驗證 DB 是否接受該 scalar |
| useCurrent + default，包括插入 useCurrentOnUpdate 的方法鏈 | 仍拒絕，任意順序；保留 M20／M21 的保守 default 衝突規則 |
| useCurrentOnUpdate(false／true／null／其他參數／動態值) | 拒絕；只接受零參數，不把 false 解讀為移除 |
| time／timeTz／date／string／整數／foreignId 等非上述時間型別 | 拒絕整條方法鏈，不產生部分欄位或索引 |
| 重複零參數 useCurrentOnUpdate | 同既有 useCurrent，冪等保存 true |
| softDeletes／softDeletesTz 單欄 helper + 零參數 useCurrentOnUpdate | 支援產生的 timestamp／timestampTz 欄位，沿用其 nullable 與 precision；不新增 helper API |
| timestamps／timestampsTz 雙欄 helper + chained modifier | 仍拒絕，沒有改變既有 helper 規則 |
| Schema::table 的一般欄位 + change，旗標放 change 前或後 | 支援完整替換；省略 useCurrentOnUpdate 就移除，不沿用舊旗標 |
| Schema::create + change；helper／自增／foreignId + change；同鏈索引／多次／帶參數 change | 仍拒絕，維持 M22 限制 |
| replay 修改自增或外鍵參與欄位 | 仍拒絕；不能因新的時間旗標而繞過 M22 檢查 |

以上拒絕是本分析器的保守範圍，不宣稱 Laravel 禁止該語法。直接公開 replay／外部 initialSchema 仍以 caller 提供符合契約的資料為前提，沒有新增外部 JSON runtime validation。

## 從 command 到 DTO

normalize 像後端 command adapter：檢查 AST 方法鏈的型別與參數，將意圖放進 Column。Replay 像 domain service，依 addColumn／changeColumn 建立新 schema；existing structuredClone 已能保留新 boolean。Diff 比較欄位自身結構，新增或移除旗標會得到 columnChanged，不猜 rename。Index 仍是 primary 的權威來源。

React component 是呈現畫面的單元；state 是輸入副本、選取與視圖等會改變的資料；props 是父層提供的分析 DTO 與 callback。既有欄位明細從 Object.entries(column) 呈現選用屬性，JSON 匯出與前後快照同樣直接使用 core 結果，不要在 hook 裡自行補 SQL 或計算時間。本階段沒有修改 React UI 或宣稱已通過瀏覽器互動驗收。

## 測試與範例

新增 38 個行為測試：在 M22 baseline 上為 22 failed／16 passed，再加入正規化支援。拒絕案例原本就通過；新增成功與跨檔案例確實在實作前失敗。M20／M21 原本對零參數 OnUpdate 的拒絕回歸改為拒絕帶 false 參數，避免保留過期限制。

`tests/fixtures/current-on-update/` 的 success／blocked golden 由 PHP 與明列規格獨立推導，沒有錄製 analyzer 輸出。三檔流程 create → 加入 update 旗標與 zoned 欄位 → 移除旗標，比較完整 before／after／diff、索引保留與排序。失敗檔先產生合法 partial operation，再遇到 default/useCurrent 衝突；整檔不套用，lastValidSchema 僅保留第一檔，後續快照保持 null。阻擋診斷沿用現有 `SCHEMA_BLOCKED` 契約。

另驗證 operations、replay input、snapshots、finalSchema、diff payload 的拷貝隔離，default 與 update 意圖分離、change replacement，以及既有 M22 拒絕規則。`npm run demo:current-update` 使用建置後公開 package 驗證相同成功／阻擋流程，已加入 CI。

雲端 M22 接手基準 `27594f9d5456429579222631cca5943f02c97d2a` 已實際跑過 408 tests、typecheck、build 與五個 demo（Node 24.19.0／npm 11.9.0），不沿用本機驗證證據。M23 雲端完整 446／446 tests、typecheck、build 與六個 demo 均通過。GitHub 交付狀態見交付紀錄；尚未合併時不得寫成已交付。

沒有加入 timeline、down()、AI、SQL parser、runtime migration execution 或 semantic refactoring detection。
