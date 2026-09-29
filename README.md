# Laravel Migration Visualizer — Milestone 2

React + TypeScript + Vite，npm workspaces monorepo。只做靜態 migration 分析，不執行 PHP 或連接資料庫。

## 開始使用

需要 Node.js 22.12+（目前以 22.13.1 驗證）與 npm。

```sh
npm ci
npm run dev
```

使用終端顯示的網址。網頁預載 fixture，按「分析 Migration」即可看 AtomicOperation 與 SchemaState。

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
  src/main.tsx        輸入與結果元件；沒有 parser/schema 規則
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

多份 migration 使用 `analyzeProject(files)`，由 core 排序與逐份套用；讀檔留在呼叫端。core 不使用 React、不呼叫 hooks。單檔 API 仍維持 Milestone 1 契約。

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
- `diffSchemas(before, after)`：結構比較，輸出 tableAdded / tableRemoved / columnAdded / columnRemoved / columnChanged。新建或移除表時包含整表，不重複列欄位；排序固定為 table、column 字典順序。
- 第一份失敗後，後續仍分析 PHP，但所有後續 snapshots / diff 為 null。失敗檔只保留可信的 schemaBefore；整個失敗檔不套用部分操作。
- `ProjectDiagnostic.phase` 區分 ordering / analysis / replay / dependency。Replay 錯誤保留出錯操作的來源位置及從 0 起算的 operationIndex。
- `complete` 只表示本工具支援範圍內的靜態分析與 replay 成功，不保證實際資料庫可執行或涵蓋整個專案的 PHP 語意。

執行亂序三檔範例並輸出完整 project JSON：

```sh
npm run demo:project
```

本 milestone 的新增功能在 core API 與 Node 範例；React 工作台仍為單檔，尚未加入多檔匯入畫面。Node 範例的讀檔放在 examples/，不滲入 migration-core。

詳見 [Milestone 2 中文設計教學](docs/milestone-2.zh-TW.md)。

## 支援範圍

只分析一個繼承 Migration 的匿名／具名類別的 `up()`。支援 namespace、一般／群組 use alias，以及完整 facade 名稱；無 import 的短名 Schema / Migration 視為 Laravel 慣例。`down()` 與 helper methods 不分析。

- `Schema::create('table', closure)`、`Schema::table('table', closure)`。
- `id`、`increments`、`bigIncrements`。
- `string` / `char`（可選 length）、`text` / `mediumText` / `longText`。
- `integer` / `bigInteger` / `mediumInteger` / `smallInteger` / `tinyInteger` 與各自 unsigned 版本；此 milestone 僅接受欄位名稱參數。
- `boolean`、`date`、`json`、`jsonb`、`uuid`。
- `decimal`（precision、scale）、`timestamp` / `dateTime` / `time`（precision）。
- `timestamps` 展開為兩個 nullable timestamp 欄位。
- modifiers：`nullable(bool)`、`unsigned(bool)`、`default(scalar)`、`comment(string)`。
- `dropColumn('name')`（單一字串）、`renameColumn('from', 'to')`。

AtomicOperation 為 `createTable` / `addColumn` / `dropColumn` / `renameColumn` discriminated union，含來源位置（行號從 1 起、column 從 0 起）。所有輸出可序列化成 JSON。`id` 的 primary 屬性是欄位 metadata，目前沒有完整 index / constraint model。

## 限制與錯誤契約

這是明確界定的 Laravel API 子集，不是 PHP interpreter，也不保證實際資料庫 DDL 可成功。動態名稱、變數計算、分支、迴圈、helper call、巨集、SQL、connection、`change()`、foreign keys、index / unique / primary 鏈式操作等回報 diagnostics。未支援的整條 Blueprint chain 不產生部分欄位操作；其他已支援的 statement 仍可保留，`complete` 會是 false。

`complete` 代表已識別的 up() 靜態語句都在支援範圍內，不代表 schema replay 一定有效。重複 table / column、不存在的 table / column 與 rename 衝突會在 `applyOperations` 拋錯。Replay 會複製輸入，不會修改原 state；失敗不會回傳半成品。

單檔 UI 從空白 schema 開始，所以單獨貼上 `Schema::table` 時可能顯示「Unknown table」，核心仍支援傳入先前狀態。沒有 timeline、ERD、AI、runtime migration execution、SQL parser。

字串與十進位基本數字只做靜態值轉換（其他進位回報診斷）；超過 JavaScript 安全整數範圍的數值不接受。PHP 的完整語意、跨檔名稱解析、自訂 base migration 類別和資料庫方言不在此階段範圍。

## 驗證與依賴

Unit tests 覆蓋 API、literal、動態語法診斷與 schema invariants；golden tests 比對兩份 fixture 的完整 JSON（含來源位置），再驗證順序 replay。修改 golden 前應先確認規格變更，不能只為讓測試通過而重錄。

使用 glayzzle 的 npm 套件 `php-parser`，版本由 package-lock.json 固定。3.7 瀏覽器 bundle 的數字 lexer 讀取 `process.arch`，Vite 以精確 define 設為 x64；沒有加入全域 process polyfill。Core 用標準 JavaScript number 表達數值。

參考：[php-parser](https://github.com/glayzzle/php-parser)、[Laravel migrations](https://laravel.com/framework/docs/12.x/migrations)、[Vite](https://vite.dev/guide/)。

教學從 [component / props / state](docs/tutorial.zh-TW.md) 開始。
