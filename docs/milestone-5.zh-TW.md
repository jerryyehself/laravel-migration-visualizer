# Milestone 5：Foreign Key 分析

索引描述一張表如何組織欄位；外鍵描述兩組欄位之間的引用。例如 posts.user_id 引用 users.id。這階段建立可檢視的關係資料，還沒有畫 ERD 或執行資料庫 migration。

## 從 PHP 到可檢視的資料

```php
Schema::create('posts', function ($table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()
        ->nullOnDelete()->cascadeOnUpdate();
});
```

`foreignId` 是 unsigned bigInteger 欄位，不是主鍵，也不單獨建立外鍵。`constrained()` 才產生引用。core 把這條 chain 正規化成兩個操作：addColumn、addForeignKey。整條 chain 都確認支援後才加入 operations；不支援尾端 modifier 時，不留下半個欄位。

```json
{
  "kind": "addForeignKey",
  "table": "posts",
  "foreignKey": {
    "name": "posts_user_id_foreign",
    "columns": ["user_id"],
    "referencedTable": "users",
    "referencedColumns": ["id"],
    "onDelete": "set null",
    "onUpdate": "cascade"
  }
}
```

實際 operation 也包含 file、line、column 來源位置。欄位是陣列，因此能表達複合外鍵，配對順序有意義。

## Component、state、props 的分工

- Component 是畫面單位：ProjectResults 接收分析結果，SchemaView 畫欄位、索引與外鍵表格。
- State 是會改變的畫面資料：ProjectWorkbench 保存 PHP 清單、目前選取檔案與分析結果。輸入一改，舊結果就清除。
- Props 是父 component 傳給子 component 的資料與 callback，例如 result、selected、onSelect。

這些概念不負責外鍵規則。`analyzeProject(files)` 位於純 TypeScript core，先決定順序、產生 operations、replay 與 diff，再把結果交給 React。Node 範例與瀏覽器因此共用同一份判斷；UI 不需要知道 PHP AST。

## 支援的 API

- `foreign('user_id', optionalName)->references('id')->on('users')`；欄位參數也可用非空、不重複、未指定 key 的靜態字串陣列。references/on 各一次，順序可互換，兩邊欄位數量必須相同。
- `foreignId('name')`，以及 `foreignId('name')->constrained(table?, column?, indexName?)`。nullable、unsigned、default、comment 等既有 column modifiers 必須放在 constrained 前；constrained 後只接受外鍵 actions。需要索引時另寫 standalone index。
- constrained 的 column 省略／null 代表 id；name 省略／null 使用 table_columns_foreign 慣例。名稱沿用 ASCII 小寫與點／連字號替換規則，不加 connection prefix。
- 省略 table 時，目前只推導 user_id、post_id、account_id、team_id、role_id、product_id、order_id、comment_id，分別對應 users、posts、accounts、teams、roles、products、orders、comments，且引用欄位必須為 id。其他情況診斷並要求明確 table；沒有實作 Laravel 可設定的完整 inflector。
- `dropForeign('constraint_name')` 或 `dropForeign(['column', ...])`；陣列產生慣例名稱。自訂名稱或 rename 後的原外鍵，應使用原 constraint name。
- `onDelete`／`onUpdate` 接受 cascade、restrict、set null、no action。亦支援 cascadeOnDelete/Update、restrictOnDelete/Update、nullOnDelete/Update、noActionOnDelete/Update（無參數）。同一種 action 重複設定會診斷，不猜最後值。
- 未指定 action 時不補預設值，UI 顯示「未指定」。這不同於明確 no action。

語意依據：[Blueprint](https://github.com/laravel/framework/blob/12.x/src/Illuminate/Database/Schema/Blueprint.php)、[ForeignIdColumnDefinition](https://github.com/laravel/framework/blob/12.x/src/Illuminate/Database/Schema/ForeignIdColumnDefinition.php)、[ForeignKeyDefinition](https://github.com/laravel/framework/blob/12.x/src/Illuminate/Database/Schema/ForeignKeyDefinition.php)。本工具支援其中明確界定的子集。

## Replay 與快照

每張表的 foreignKeys 以 constraint name 為 key，與 indexes 分開。Replay 檢查名稱不重複、本表欄位與目標表／欄位存在、複合欄位數量一致；SET NULL 要求本表欄位 nullable。支援引用本表已存在的欄位。

renameColumn 同時更新本表 foreignKey.columns，以及所有表引用它的 referencedColumns，保留外鍵名稱。dropColumn 若仍被本表或其他表外鍵引用會失敗，須先 dropForeign；既有索引刪除保護仍適用。不會以 cascadeOnDelete 代替 DDL drop 保護：該 action 描述刪資料時的規則，不是刪欄位規則。

整份 migration 是一個不可變的套用單位。即使先 rename 了 users.id、又新增 posts.temp，後面 dropColumn 失敗時，兩張表的前面修改都撤回。失敗檔保留 schemaBefore，schemaAfter/diff 為 null；後續仍解析語法，但快照都未知。lastValidSchema 只是成功前綴。

SchemaDiff 新增 foreignKeyAdded、foreignKeyRemoved、foreignKeyChanged，按外鍵名稱排序，放在每表欄位／索引變化之後；比較名稱、雙邊欄位順序、目標表與 actions。新表帶完整外鍵，不重複列 foreignKeyAdded。改名不做語意推測。

## 契約與限制

Core 升至 0.3.0。外部手工 initialSchema 每張表必須提供 foreignKeys（沒有時為 {}），並保持有效一致。沒有 JSON runtime validator，也沒有自動升級舊格式。M4 的 0.2.0 只要求 indexes；M5 在此基礎上增加 foreignKeys。

操作按本工具既有規則 replay，不模擬完整 Blueprint command scheduling：外鍵宣告時本表與目標欄位必須已存在。跨檔目標須在成功前綴。合法但較晚才建立目標的 Laravel／DB 寫法可能被保守地診斷。

不檢查引用目標是否有唯一索引、欄位型別相容性、DB 自動建立的索引、constraint 全域名稱規則或方言特例；移除目標索引不代表驗證了真實 DB 的可行性。本模型不保證 DDL 能執行。foreignIdFor／model lookup、完整 pluralization、foreignUuid/Ulid、deferrable、dropConstrainedForeignId、change、動態參數與 named arguments 尚未支援。timeline、ERD、down、AI、SQL parser 和 runtime execution 持續延後。

## 驗證與操作

在多檔工作台按「載入外鍵範例」再分析：四份亂序 PHP 會依序建立 users、建立 posts 外鍵、改名／替換 actions、移除外鍵及欄位。「載入外鍵失敗範例」驗證第三檔回滾與第四檔 blocked。

186 tests（原 121 + 新增 65）涵蓋 API、actions、複合與 self reference、引用驗證、rename/drop、prototype-like 名稱、diff、不可變與四檔成功／失敗 goldens。舊 full-project goldens 只依新契約增加空 foreignKeys；沒有用 analyzer 重錄 golden。驗收命令：npm test、npm run typecheck、npm run build、npm run demo:project；另檢查建置後套件與瀏覽器結果。
