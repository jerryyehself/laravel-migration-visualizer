# Laravel Migration Visualizer — Milestone 13

React + TypeScript + Vite，npm workspaces monorepo。只做靜態 migration 分析，不執行 PHP 或連接資料庫。

## 開始使用

需要 Node.js 22.12+（目前以 22.13.1 驗證）與 npm。

```sh
npm ci
npm run dev
```

使用終端顯示的網址。預設為多檔專案工作台，預載三份亂序 fixture；按「分析專案」即可看排序、逐檔快照、diff 與診斷。也可匯入多份 UTF-8 PHP 或切換到單檔練習。

```sh
npm test
npm run typecheck
npm run build
```

`npm run build` 先建立可獨立使用的 core 套件，再建立網頁。開發時 Vite 直接讀 core 原始碼，不需要預先 build。

## 專案結構

```text
packages/migration-core/
  src/parser.ts       PHP → AST 的第三方 parser 邊界
  src/normalize.ts    AST → AtomicOperation 與 diagnostics
  src/types.ts        core 的公開資料契約
  src/schema.ts       純函式、不可變的 schema replay
  tests/fixtures/     PHP fixture 與人工定義的 golden JSON
apps/web/
  src/main.tsx        工作台模式切換
  src/components/     單檔／多檔輸入、結果與 schema 表格
  src/import-files.ts 瀏覽器 UTF-8 讀檔邊界；沒有排序／parser 規則
  vite.config.ts     core 開發別名與 parser 瀏覽器相容設定
docs/tutorial.zh-TW.md
```

## Core 使用

```ts
import { analyzeMigration, applyOperations, emptySchema } from '@lmv/migration-core';

const analysis = analyzeMigration(phpSource, '001_create_users.php');
if (!analysis.complete) {
  console.log(analysis.diagnostics);
} else {
  const schema = applyOperations(emptySchema(), analysis.operations);
  console.log(schema);
}
```

多份 migration 使用 `analyzeProject(files)`，由 core 排序與逐份套用；讀檔留在呼叫端。core 不使用 React、不呼叫 hooks。原有單檔函式仍可使用，schema JSON 需符合目前版本契約。

## Milestone 2：Project analysis

```ts
import { analyzeProject } from '@lmv/migration-core';

const project = analyzeProject([
  { filename: '2026_01_02_000000_update_users.php', source: updatePhp },
  { filename: '2026_01_01_000000_create_users.php', source: createPhp },
]);

// migrations 已按 migration basename 排序，與輸入順序無關。
for (const step of project.migrations) {
  console.log(step.filename, step.status, step.schemaBefore, step.schemaAfter, step.diff);
}
console.log(project.diagnostics);
if (project.complete) console.log(project.finalSchema);
else console.log(project.lastValidSchema); // 只代表成功前綴，不能當成最終狀態
```

- `orderMigrations(files)`：標準 ASCII `YYYY_MM_DD_HHMMSS_description.php` 排序，保留原路徑；重複名稱／不合格式會阻止整個專案 replay。這是本工具的輸入契約，比 Laravel 檔案探索限制更嚴格。檢查格式，不驗證日曆日期。
- `analyzeProject(files, { initialSchema? })`：預設由空 schema 開始；每檔提供獨立 snapshots，狀態為 applied / failed / blocked。
- `diffSchemas(before, after)`：結構比較，輸出 tableAdded / tableRemoved / columnAdded / columnRemoved / columnChanged；M4/M5 另加索引與外鍵變化。新建或移除表時包含整表，不重複列欄位；排序固定為 table、column 字典順序。
- 第一份失敗後，後續仍分析 PHP，但所有後續 snapshots / diff 為 null。失敗檔只保留可信的 schemaBefore；整個失敗檔不套用部分操作。
- `ProjectDiagnostic.phase` 區分 ordering / analysis / replay / dependency。Replay 錯誤保留出錯操作的來源位置及從 0 起算的 operationIndex。
- `complete` 只表示本工具支援範圍內的靜態分析與 replay 成功，不保證實際資料庫可執行或涵蓋整個專案的 PHP 語意。

執行亂序三檔範例並輸出完整 project JSON：

```sh
npm run demo:project
```

Milestone 2 的新增功能在 core API 與 Node 範例。Milestone 3 將它們接入 React 多檔工作台；Node 範例的讀檔放在 examples/，瀏覽器讀檔放在 apps/web，都不滲入 migration-core。

詳見 [Milestone 2 中文設計教學](docs/milestone-2.zh-TW.md)。

## Milestone 3：多檔工作台

- 一次選取多份 UTF-8 `.php`，取代目前清單；也可載入成功／中途失敗範例。
- 編輯檔名與 PHP、移除檔案；只改工作台副本，不修改原檔。修改輸入會清除舊結果。
- 結果顯示 core 排序、applied / failed / blocked、逐檔前後 schema、SchemaDiff、operations 與完整 project JSON。
- 失敗後明確區分未知快照與空白 schema；lastValidSchema 標示為成功前綴，不當成最終結果。
- 檔案在瀏覽器中讀取，沒有上傳服務；讀取／編碼失敗時整批不匯入。
- 原本單檔練習保留。重新整理或切換模式會重置輸入，沒有草稿持久化。
- 目前分析同步執行，大型專案效能尚未驗證，未使用 Web Worker。

詳見 [Milestone 3 中文教學](docs/milestone-3.zh-TW.md)。

## Milestone 4：索引分析

支援 index / unique / primary（單欄、複合、column chain）及 dropIndex / dropUnique / dropPrimary。SchemaState 每張表新增必要的 indexes，SchemaDiff 新增 indexAdded / indexRemoved / indexChanged。id()/increments() 的隱含主鍵納入相同模型，column.primary 由主鍵索引同步。

在 UI 按「載入索引範例」可檢視三份 migration 的索引生命週期。詳見 [Milestone 4 中文教學與限制](docs/milestone-4.zh-TW.md)；GitHub milestones / issues 見 [交付紀錄](docs/github-milestones.md)。

M4 的 Core 0.2.0：手動建立 initialSchema 的呼叫端需為每張表提供 indexes（沒有索引時為 {}）。仍要求有效且一致的 SchemaState，不自動升級外部 JSON。

## Milestone 5：外鍵分析

支援 foreign/references/on、foreignId/constrained、dropForeign 與 delete/update actions。逐檔快照記錄 foreignKeys；diff 新增 foreignKeyAdded/Removed/Changed。rename 更新跨表引用，dropColumn 要求先移除 inbound/outbound 外鍵；失敗仍整檔回滾。

在 UI 按「載入外鍵範例」或「載入外鍵失敗範例」可檢查四份 migration。詳見 [Milestone 5 中文教學與完整限制](docs/milestone-5.zh-TW.md)。省略 constrained table 僅支援列出的八種慣例，其他名稱需明確 table；不驗證真實 DB 的型別、唯一索引或完整 command scheduling。

Core 0.3.0：每張表現在需提供 indexes 與 foreignKeys（沒有時各為 {}）。外部 initialSchema 不會自動升級或進行 JSON runtime validation。

## Milestone 6：資料表生命週期

支援 Schema::rename、drop、dropIfExists。改名更新 table metadata 與所有外鍵目標，保留索引／外鍵名稱；刪表會移除本表完整狀態，但其他表仍引用時診斷。dropIfExists 只忽略缺表。Core 0.4.0 新增 renameTable/dropTable 操作，schema JSON 與 M5 相同。

UI 提供生命週期／刪表失敗範例。`npm run demo:tables` 驗證建置後公開套件，已納入 CI。詳見 [M6 中文教學](docs/milestone-6.zh-TW.md)。

## Milestone 7：欄位 helpers

Core 0.5.0 支援 enum（有序 allowedValues）、rememberToken、softDeletes/Tz、timestampTz/dateTimeTz/timeTz、timestampsTz，以及 dropRememberToken/dropSoftDeletes/Tz/dropTimestamps/Tz。Helpers 展開成既有 addColumn/dropColumn，保留整檔回滾與引用保護；enum diff 按陣列內容比較。

UI 提供欄位 helper 成功／失敗範例；`npm run demo:helpers` 驗證建置後公開套件並納入 CI。詳見 [M7 中文教學與 API 參數](docs/milestone-7.zh-TW.md)。Column 新增可選 allowedValues，現有 schema 仍有效；enum 僅接受非空且不重複的靜態字串陣列（值可為空字串），不支援 PHP enum case。時間 precision 省略為 0，明確 null 不支援；不模擬 runtime 預設或 DB 方言。timestamps/Tz 不接受 chained modifiers，移除 helpers 不接受 modifiers。

## Milestone 8：JSON 匯出

多檔工作台提供「下載完整分析 JSON」與「下載最終 Schema JSON」。完整分析保留逐檔操作、快照、diff 與診斷，成功或失敗均可匯出；最終 schema 只在全部成功時開放。直接輸出公開 ProjectAnalysis／SchemaState，不包含 PHP 原始碼。修改輸入會清除舊結果與下載入口，core 仍為 0.5.0。

詳見 [M8 中文教學與驗證紀錄](docs/milestone-8.zh-TW.md)。JSON 契約與按鈕狀態已驗證；使用者於 2026-10-02 實測確認下載成功。內建預覽的自動化落盤驗證仍未涵蓋。

## Milestone 9：結果搜尋與篩選

多檔結果可按檔名／路徑搜尋，並選全部／已套用／失敗／已阻擋。保留 core 原本的順序與編號，顯示匹配數量及無結果提示；清除篩選可恢復完整清單。篩選只影響逐檔檢視，不修改全域診斷、可信快照或完整 JSON 匯出，也不重新分析。

詳見 [M9 中文教學與選取規則](docs/milestone-9.zh-TW.md)。Core 仍為 0.5.0；搜尋不涵蓋 PHP／operation 內容，沒有分頁或虛擬清單。

## 支援範圍

只分析一個繼承 Migration 的匿名／具名類別的 `up()`。支援 namespace、一般／群組 use alias，以及完整 facade 名稱；無 import 的短名 Schema / Migration 視為 Laravel 慣例。`down()` 與 helper methods 不分析。

- `Schema::create('table', closure)`、`Schema::table('table', closure)`，以及 `Schema::rename('from', 'to')`、`Schema::drop('table')`、`Schema::dropIfExists('table')`。
- `id`、`increments`、`bigIncrements`。
- `string` / `char`（可選 length）、`text` / `mediumText` / `longText`。
- `integer` / `bigInteger` / `mediumInteger` / `smallInteger` / `tinyInteger` 與各自 unsigned 版本；此 milestone 僅接受欄位名稱參數。
- `boolean`、`date`、`json`、`jsonb`、`uuid`。
- `decimal`（precision、scale）、`timestamp` / `dateTime` / `time`（precision）。
- `timestamps` 展開為兩個 nullable timestamp 欄位。
- modifiers：`nullable(bool)`、`unsigned(bool)`、`default(scalar)`、`comment(string)`。
- `dropColumn('name')`（單一字串）、`renameColumn('from', 'to')`。

AtomicOperation 為 `createTable` / `renameTable` / `dropTable` / `addColumn` / `dropColumn` / `renameColumn` / `addIndex` / `dropIndex` / `addForeignKey` / `dropForeignKey` discriminated union，含來源位置（行號從 1 起、column 從 0 起）。所有輸出可序列化成 JSON。`id` 的 primary 屬性是欄位 metadata，replay 會將其轉成隱含 primary 索引；外鍵以獨立 ForeignKey model 記錄。

- 索引 API 接受靜態欄位字串／非空且不重複的字串陣列、可選自訂名稱；drop 接受索引名稱或預設名稱的欄位陣列。dropPrimary 可省略參數。
- 每欄最多一個 fluent index modifier，延後到 closure 尾端；standalone index 要求引用的欄位已存在。名稱不加 connection prefix，不模擬 DB 方言。
- Fluent `->unique()`／`->index(true)` 會建立預設索引；`->unique(null)`／`->index(null)`／`->primary(null)` 不建立該 fluent 索引。Standalone 第二個參數的 null 則代表預設名稱。
- 索引名稱與欄位引用必須存在且一致，每張表最多一個主鍵。rename 更新索引欄位但保留索引名稱；dropColumn 要求先移除引用的索引。

## 限制與錯誤契約

這是明確界定的 Laravel API 子集，不是 PHP interpreter，也不保證實際資料庫 DDL 可成功。動態名稱、變數計算、分支、迴圈、helper call、巨集、SQL、connection、`change()`、未支援的外鍵 API、fullText、spatial/vector indexes、index algorithm 等回報 diagnostics。未支援的整條 Blueprint chain 不產生部分欄位操作；其他已支援的 statement 仍可保留，`complete` 會是 false。

`complete` 代表已識別的 up() 靜態語句都在支援範圍內，不代表 schema replay 一定有效。重複 table / column、不存在的 table / column 、rename 衝突與無效索引引用會在 `applyOperations` 拋錯。Replay 會複製輸入，不會修改原 state；失敗不會回傳半成品。

單檔 UI 從空白 schema 開始，所以單獨貼上 `Schema::table` 時可能顯示「Unknown table」，核心仍支援傳入先前狀態。沒有 timeline、ERD、AI、runtime migration execution、SQL parser。

字串與十進位基本數字只做靜態值轉換（其他進位回報診斷）；超過 JavaScript 安全整數範圍的數值不接受。PHP 的完整語意、跨檔名稱解析、自訂 base migration 類別和資料庫方言不在此階段範圍。

## 驗證與依賴

Unit tests 覆蓋 API、literal、動態語法診斷與 schema invariants；golden tests 比對兩份 fixture 的完整 JSON（含來源位置），再驗證順序 replay。修改 golden 前應先確認規格變更，不能只為讓測試通過而重錄。

使用 glayzzle 的 npm 套件 `php-parser`，版本由 package-lock.json 固定。3.7 瀏覽器 bundle 的數字 lexer 讀取 `process.arch`，Vite 以精確 define 設為 x64；沒有加入全域 process polyfill。Core 用標準 JavaScript number 表達數值。

參考：[php-parser](https://github.com/glayzzle/php-parser)、[Laravel migrations](https://laravel.com/framework/docs/12.x/migrations)、[Vite](https://vite.dev/guide/)。

教學從 [component / props / state](docs/tutorial.zh-TW.md) 開始。

## Milestone 10：資料夾匯入

多檔工作台可選取 migrations 資料夾，讀取子資料夾中的小寫 .php、保留相對路徑，並列出略過的非 PHP。任何 PHP 讀取／UTF-8 失敗或無 PHP 時保留原清單；重複名稱與排序仍由 core 處理。瀏覽器不支援時可用原有多檔選取。沒有自動辨識專案根目錄或忽略 vendor，請選 migrations 資料夾。

293 tests、型別檢查與建置通過；實際資料夾選取與分析已驗證。Core 0.5.0 不變。教學與限制見 [M10 中文教學](docs/milestone-10.zh-TW.md)。

## Milestone 11：診斷定位

多檔診斷可點選定位至唯讀 PHP 片段，保留 core 行號並顯示前後三行，同時清除結果篩選並選取對應結果。完整路徑歧義時停用；檔名／前序失敗診斷不高亮占位行號。Core 0.5.0 與匯出契約不變；301 tests。教學見 [M11](docs/milestone-11.zh-TW.md)。

## Milestone 12：診斷編輯跳轉

定位卡片可跳回對應檔案的輸入副本，聚焦並選取錯誤整行。修改後清除舊結果，重新分析才更新 schema；檔案層級診斷只開啟檔案而不猜錯誤行。307 tests，core 0.5.0 不變。教學見 [M12](docs/milestone-12.zh-TW.md)。

## Milestone 13：修改標記與還原

多檔工作台顯示已修改數量與標記，可將目前檔案的檔名／PHP 還原至匯入或載入時的版本。還原清除舊結果，需重新分析；不寫回磁碟。刪除其他檔案不重設剩餘副本的原值。315 tests；core 0.5.0 不變。教學與限制見 [M13](docs/milestone-13.zh-TW.md)。
