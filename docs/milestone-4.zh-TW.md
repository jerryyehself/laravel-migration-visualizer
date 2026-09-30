# Milestone 4：索引分析與 GitHub 工作流程

這一階段支援 index / unique / primary，以及對應的移除 API。分析仍是靜態模型，不執行 Laravel 或 SQL，也不驗證資料庫是否有重複資料。

## 為什麼索引要獨立建模

欄位屬於一張表，索引也屬於一張表。`unique(['tenant_id', 'email'])` 的意思是這兩個值的組合不能重複，並不是 tenant_id 和 email 各自不能重複。索引需要保存名稱、種類和有順序的欄位陣列，因此不能用每個欄位的 unique 布林值取代。

```ts
interface SchemaIndex {
  name: string;
  type: 'index' | 'unique' | 'primary';
  columns: string[];
}
// SchemaState.tables[table].indexes: Record<string, SchemaIndex>
```

新增兩種 AtomicOperation：`addIndex` 帶完整定義；`dropIndex` 帶名稱與 indexType，`name: null` 只用於無參數的 dropPrimary。操作仍包含來源位置。React component 不解讀 PHP、不決定預設名稱，它只接收 core 回傳的 props，把索引畫成表格。

## 支援的 Laravel 子集

```php
$table->string('email')->unique();
$table->string('reference')->index('reference_lookup');
$table->uuid('key')->primary();
$table->index('email');
$table->unique(['tenant_id', 'email'], 'tenant_email_unique');
$table->primary(['tenant_id', 'key']);
$table->dropIndex('reference_lookup');
$table->dropUnique(['tenant_id', 'email']);
$table->dropPrimary();
```

Standalone index/unique/primary 接受靜態字串或非空、未指定 key 的字串陣列；第二個參數可省略或用 null 代表預設名稱。Fluent modifier 接受無參數、true、null 或明確非空名稱。每個欄位最多一個 fluent index modifier，多個 modifier 不猜 Laravel 的選擇優先順序，而是診斷；auto-increment 欄位再次 chained primary 也會診斷。

預設名稱是 table、欄位順序、種類，以底線串接，ASCII 大寫轉小寫，`-` 和 `.` 換成底線。依據 [Laravel 12.x Blueprint 原始碼](https://github.com/laravel/framework/blob/12.x/src/Illuminate/Database/Schema/Blueprint.php)；沒有 connection 資訊，因此不加 prefix_indexes，也不套資料庫的大小寫／名稱長度規則。

Drop 的字串代表索引名稱；陣列代表依指定欄位產生慣例名稱。自訂索引名稱要使用字串移除。無參數／null 的 dropPrimary 由 schema 尋找唯一主鍵，並不把它當成普通索引名稱。

Fluent 索引操作延後到 closure 的末尾，保留宣告所在 statement 的來源位置，對應 Blueprint 收集 fluent commands 的設計。Standalone 指令保留來源順序：本工具要求它引用的欄位已存在；先宣告索引、稍後才宣告欄位的合法 Laravel 寫法目前會被保守地診斷，不模擬完整 Blueprint command scheduling。

## id() 與 primary 如何一致

原本 id()/increments()/bigIncrements() 的 addColumn 已含 `primary: true`。現在 replay 會為它建立一個 `{ type: 'primary' }` 索引。這保留既有單檔 operations 契約，也把隱含主鍵纳入表層模型。

索引是 schema 中主鍵的權威來源，欄位的 primary 是相容顯示標記。新增、移除主鍵和 rename 會同步標記：dropPrimary 後 id.primary 被移除；複合主鍵的成員欄位都標為 true，但應讀 indexes 才知道它們共同組成一個主鍵。每張表最多一個主鍵。

`autoIncrement` 和 `nullable` 不因移除／新增主鍵自動改寫；本模型不模擬 MySQL 或其他資料庫的附加要求。例如把 auto-increment id 的主鍵移除，模型能描述結構變化，但不保證真實 DB 接受。

## Replay 與 diff 的規則

- 新索引的每個欄位都必須存在，欄位不可重複，名稱不可重複。
- Drop 必須找到正確種類的索引。dropIndex 不會默默移除 unique 或 primary。
- Rename 更新索引引用的欄位，保留索引名稱；之後用新欄位名稱組出的預設名稱，可能找不到旧索引，應用原名称或 dropPrimary()。
- Drop column 若仍被索引引用，要求先移除索引。這是本工具的保守一致性政策，沒有猜資料庫是否自動清除索引。
- 任一 replay 操作失敗，整份 migration 不套用；後續 schemaBefore/schemaAfter/diff 仍為 null。
- SchemaDiff 新增 indexAdded / indexRemoved / indexChanged。先比較欄位，再按索引名稱排序。種類或有順序的欄位陣列不同，就是 indexChanged；不推測索引重新命名。
- 新建表的 tableAdded payload 已含全部索引，不再重複列 indexAdded。

## 公開 JSON 的版本變更

migration-core 版本升為 0.2.0。每張表現在必須有 `indexes`，即使沒有索引也要提供 `{}`。自己建立 initialSchema 的呼叫端應依此更新；沒有自動升級或驗證外部 schema 的機制。

舊的 full-project golden 明確補上索引，原 operations／位置不變。原失敗 fixture 用 unique()，現在 unique 已支援，所以改成 fullText()；該整條 chain 仍被拒絕，可信前綴行為保持一致。M1 單檔 analysis golden 不需更改。

## React 畫面與教學

點「載入索引範例」後分析三份 migration：第一份建立 id 主鍵、email unique、tenant_lookup 複合索引；第二份移除 email unique、rename email 為 contact 並建立新的複合 unique；第三份移除 id 主鍵、改成 tenant_id/contact 複合主鍵。

Schema Before、After 和最終 schema 都顯示索引名稱、種類、欄位順序。Diff 清單顯示變更種類和索引名稱，JSON 保留完整 before/after。State 仍只記住輸入與選取位置；props 仍只傳資料與點選 callback，不把 domain 規則搬入 hooks。

## 測試與限制

目前 116 tests 通過（原 76 + 新增 40）。新增測試涵蓋字串／複合／fluent index、預設名稱、移除 API、動態與無效陣列、整條 chain 拒絕、隱含主鍵、主鍵替換、名稱／欄位／種類衝突、索引引用 rename、回滾、prototype-like 名稱、diff 與兩組三檔 golden。

新增 index golden 以獨立預期資料檢查索引快照、主鍵標記、diff 和失敗邊界；既有 project golden 繼續比對完整 operations／來源與所有 schema。不要從 analyzer 輸出盲目重錄預期。

型別檢查、正式 build、建置後 demo:project 與索引案例通過；瀏覽器已驗證索引快照、主鍵替換與 diff。PR 增加 GitHub Actions，使用 Node 22 執行 npm ci、tests、typecheck、build 和 demo:project。大型專案性能仍未測量。fullText、spatial/vector indexes、索引 algorithm、expression、connection prefixes、foreign key、change()、down()、SQL/runtime、timeline、ERD 和 AI 不在此階段範圍。

## GitHub 工作流程

Milestone 是一組可驗收的目標，Issue 是其中的一項工作，PR 是實際程式變更的審查入口。M1～M3 已經直接進 main，所以以已完成的 milestone/issue 補登 commit 與驗證，不重寫歷史。M4 起使用功能分支、issues 與 PR，合併後 GitHub 才依 PR 的 closing keywords 關閉對應 issues。

里程碑和 issue links 見 [GitHub 里程碑紀錄](github-milestones.md)。
