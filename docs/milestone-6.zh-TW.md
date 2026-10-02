# Milestone 6：資料表生命週期

支援 Schema::rename、drop、dropIfExists，補齊多份 migration 的建立／演進／移除流程。仍是純 TypeScript 記憶體分析，不執行 PHP 或資料庫 DDL。

## API 與資料契約

```php
Schema::rename('users', 'members');
Schema::drop('posts');
Schema::dropIfExists('legacy');
```

rename 產生 `{kind:'renameTable', table:'users', to:'members', source}`。drop 與 dropIfExists 都產生 dropTable，ifExists 分別是 false／true。source 保留檔案與行／column。

只接受位置參數的靜態非空字串；不接受變數、計算、named arguments 或多餘參數。無效 Schema 語句不留下半個 operation。沿用 facade alias 與 up() 範圍，down() 的 drop 不分析。Laravel 介面參考 [Schema Builder](https://github.com/laravel/framework/blob/12.x/src/Illuminate/Database/Schema/Builder.php)；本工具的 replay 是抽象模型，沒有模擬 DB 方言。

Core 0.4.0 新增兩個 AtomicOperation union 成員，exhaustive switch 的 caller 需更新。SchemaState 形狀與 M5 相同：每張表仍需 name、columns、indexes、foreignKeys；沒有自動格式升級或 JSON runtime validator。

## 改名、引用與結構 diff

users 改名為 members 時，core 移動 tables map 的 key、更新 table.name，再更新所有外鍵 referencedTable，包括 self reference。保留原索引／外鍵名稱，例如 users_id_primary、posts_user_id_foreign，欄位與索引跟著原表移動。

來源表必須存在，目標名稱必須未被占用；改成自己的原名稱也會診斷。改名後 dropForeign(['user_id']) 可能產生不存在的新名稱，要使用原 constraint name。後續 foreignId('user_id')->constrained() 仍按慣例指向 users，不追溯 rename 歷史；應明確 constrained('members')。

SchemaDiff 把表改名描述為 tableRemoved／tableAdded；其他表的外鍵目標改變是 foreignKeyChanged。整表變化帶完整 payload，不重複列欄位／索引。沒有 tableRenamed 或 semantic inference。

## 刪除與可信界線

刪表一起移除該表欄位、索引、outgoing/self 外鍵。其他仍存在的表若引用它，要求先 dropForeign 或先刪引用表。cascadeOnDelete 是刪資料列的規則，不解除刪表保護。

```php
// posts 引用 users：先刪子表，再刪父表。
Schema::drop('posts');
Schema::drop('users');
```

dropIfExists 只讓缺表成為成功的 no-op；表存在但被引用時仍失敗。若同檔先 articles → entries，再刪被引用的 members 失敗，整份回滾，最後可信 schema 仍叫 articles。失敗後 schemaAfter/diff 與後續快照為 null。成功刪掉最後一張表的 finalSchema 則是 `{tables:{}}`，是已知空白，與未知 null 不同。

## React 的分工

Component 是畫面單位；ProjectResults 接收 result props，畫前後快照和 diff。State 保存輸入副本、選取檔案與結果，改輸入後清除舊結果。表格變成 members 是 core 資料改變的結果，UI 不替換名稱或掃描外鍵來判斷安全性。Node 與 React 因此共用同一規則。

工作台新增生命週期／刪表失敗範例。成功四檔：建立 users/posts → 改成 members/articles → 刪 articles、忽略缺表 legacy → 刪 members。失敗第三檔觸發 incoming 保護，第四檔 blocked。

## 限制與驗收

名稱沿用精確字串，不模擬 DB 大小寫、schema-qualified 名稱解析、rename 自動調整 constraint name、資料／permissions 搬移或 DDL transaction。Self 外鍵隨 owning table 刪除是本模型規則，不保證所有 DB 接受；循環引用需明確 dropForeign。

未加入 hasTable／條件執行、connection、dropAllTables、foreign key checks 開關、Schema::dropColumns、Blueprint table rename/drop、timeline、ERD、down、AI 或 runtime execution。

224 tests（M5 的 186 + 新增 38）涵蓋來源位置／無效語法、缺表／碰撞、外鍵引用、特殊名稱、不可變、drop/recreate、net diff 與四檔成功／失敗 goldens。新預期結果由規格獨立建立，既有 goldens 不重錄。

驗收：npm test、npm run typecheck、npm run build、npm run demo:project。另補 `npm run demo:tables`：IO 在 examples，使用建置後公開套件，assert 成功空 schema 與失敗可信前綴，輸出完整 JSON；已納入 CI。

M6 開發時以 M5 功能分支為 base；M5 合併後改以 main 為 base，核對差異與該 head CI。PR #15 已合併 main（40bb301），issues／milestone 已關閉。
