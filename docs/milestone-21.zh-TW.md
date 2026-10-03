# Milestone 21：dateTime 的 current default 意圖

支援 `dateTime('at')->useCurrent()` 與 `dateTimeTz('at', 6)->useCurrent()`。沿用 core 0.6.0 的 Column.useCurrent，輸出 `{type:'dateTimeTz', precision:6, nullable:false, useCurrent:true}`；不新增 JSON 欄位，也不產生 scalar default 或實際時間。

## 來源與範圍

核對 M20 固定的 Laravel framework commit `71cf667d43f9cd3f840b1733bb2b7bec65d72282`：[MySqlGrammar.php](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Grammars/MySqlGrammar.php)。typeDateTime 在 useCurrent 為真時設定 Expression；typeDateTimeTz 委派給 typeDateTime。這支持我們保存該修飾意圖，不代表各資料庫真的儲存時區，或所有 SQL grammar 都一致。

零參數 useCurrent 現在只接受 timestamp、timestampTz、dateTime、dateTimeTz。time、timeTz、date、string 仍不接受；帶參數、與 default 混用（任意順序）、useCurrentOnUpdate 仍診斷為不支援。這是分析器的保守範圍，不能理解成 Laravel 本身禁止這些語法。沒有 change() 或 DB runtime 支援。

## 從 PHP 到畫面

normalize.ts 像後端 domain service：讀 AST 的方法鏈，檢查參數與允許的型別，產生 addColumn AtomicOperation。Replay 把 operation 套用到新 schema；Project analyzer 留下每份 migration 前後快照；SchemaDiff 比較欄位結構。既有深拷貝與 diff 已能保留 useCurrent，所以本次不必在這些層新增另一套規則。

React component 是畫面單元；state 保存會隨操作改變的畫面資料；props 是上層傳進來的結果與 callback。UI 從 core 結果呈現 useCurrent，不能自行把它換成當前時間。這就像後端已算好 DTO，前端負責展示。

## 測試契約

新增 11 個測試。修正前 3 failed／8 passed，修正後全通過。涵蓋 precision、nullable、comment 方法鏈、沒有 useCurrent 的欄位、四種仍不接受的型別，以及 default 衝突／帶參數／OnUpdate 導致的跨檔失敗。

跨檔 golden 是人工指定的完整 before／after schema 和結構 diff，沒有錄製分析器輸出。第一份 create dateTime，第二份 table 新增 dateTimeTz；輸入倒序驗證排序，修改第二份快照驗證第一份與 finalSchema 不受影響。失敗流程保留可信成功前綴，後續 snapshots/diff 為 null。examples/column-helpers.mjs 另透過建置後公開套件驗證兩檔結果。

373／373 tests、typecheck、build 與 demo:project／demo:tables／demo:helpers／demo:laravel 全數通過。未修改 React UI，沒有 timeline、ERD 新能力、down()、AI、SQL parser、runtime execution 或 semantic refactoring detection。
