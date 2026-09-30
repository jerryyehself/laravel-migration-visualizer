# Milestone 2：把單檔分析組成專案分析

Milestone 1 baseline：`6959b46`，42 個測試通過。Milestone 2 在這個基礎上增加專案分析，不改變單檔 API 的使用方式。

## 一、這次多了一個協調層

`analyzeMigration` 像處理一張工單的 service；`analyzeProject` 負責把一整批工單按順序處理。它不重寫 parser，而是組合既有功能。

```text
MigrationFile[]（檔名 + PHP 文字）
  → orderMigrations：驗證名稱與排序
  → analyzeMigration：逐份解析，產生 operations
  → applyOperations：將成功檔案套用到上一份 schema
  → diffSchemas：比较前後結構
  → ProjectAnalysis：快照、差異、診斷、最終結果
```

輸入是資料，不是硬碟路徑指令。即使 filename 是 `database/migrations/...`，core 也不會自行讀檔。Node 範例可以用 fs 讀檔，未來 React 可以用 File API，兩邊都把字串交給相同的 core。

React 的 component、props、state 概念仍然相同：component 顯示結果，props 傳入 ProjectAnalysis，state 可以記住選取的檔案。排序、失敗規則與快照不應寫進 hook。這次保留原單檔 UI，先把可測試的核心契約完成。

## 二、為什麼先定義檔名規則

不能相信檔案選取順序；使用者可能先選第二份，再選第一份。因此 `orderMigrations` 依 basename 去除 `.php` 後的名稱排序，資料夾不參與主要順序。同一 timestamp 的檔案依描述部分繼續排序。

Laravel 的 Migrator 也以 migration 名稱作為排序依據。參考 [Laravel 12.x Migrator 原始碼的 getMigrationFiles / getMigrationName](https://github.com/laravel/framework/blob/12.x/src/Illuminate/Database/Migrations/Migrator.php)。本工具限定標準 ASCII 名稱，因此使用不受系統語系影響的字典順序。

本工具接受 `YYYY_MM_DD_HHMMSS_description.php`，包括 Laravel 常見的 0001 年前綴。這是格式驗證，不是日曆驗證；不轉成 Date，不受時區影響。Milestone 1 的 `001_create_users.php` 是單檔測試名稱，仍可用單檔 API，但不符合新的 project filename 契約。

兩個不同資料夾若有相同 migration 名稱，就有身分衝突。我們會保留兩份輸入並報錯，不默默覆蓋其中一份。只要有命名錯誤，整批不 replay，避免在不明確的輸入集合上產生結果。這比 Laravel 的檔案探索更嚴格，是本工具刻意選擇的策略。

## 三、snapshot 就是當時的資料副本

每一個成功 step 都有：

- schemaBefore：套用這份 migration 之前的資料表結構。
- schemaAfter：全部操作成功後的結構。
- diff：兩個結構之間的淨變化。

如果三份檔案依序建立 users、新增 nickname、刪除 nickname，第二份的 schemaAfter 仍必須保有 nickname，不能因為第三份刪掉它就跟著改變。因此各份快照、摘要與 diff payload 都使用獨立副本。

「不可變」在這裡表示 API 不修改呼叫端資料，以及結果物件之間沒有共用 schema 引用；不是 runtime Object.freeze。呼叫端仍可修改某份輸出，但不會改到另一份快照。

代價是記憶體需求約隨「migration 數量 × schema 大小」增加。這個 milestone 優先讓契約清楚；大型專案的增量快照、壓縮或 worker 屬於後续效能工作，尚未實作。

## 四、操作紀錄與 diff 是不同資料

AtomicOperation 說明「做了什麼」；SchemaDiff 說明「最後差在哪裡」。新增 temp 再刪掉 temp，有兩個操作，但前後結構相同，diff 是空的。

`renameColumn('name', 'display_name')` 是原始碼明確宣告的操作，因此 operations 仍保留 renameColumn。SchemaDiff 只看結果，會列出 name 被移除、display_name 被新增。它不猜兩個名稱是否代表同一個概念。

同名欄位的型別、nullable、length、default 等 metadata 變化會產生 columnChanged，附 before / after。欄位先刪再用不同定義重建，也能由結構比较得到 changed；不需要支援 `change()` 才能測試這個能力。沒有 semantic refactoring detection，也不能由 diff 推斷資料是否流失。

新表與刪除的表以整表 payload 表示，不再重複列每個欄位。比較結果按表名、欄位名排序，不會因物件 key 的插入順序不同而製造差異。本階段尚未實作 index、foreign key 模型；index 在 Milestone 4 加入。

## 五、失敗之後不能假裝知道後面的 schema

| 情況 | status | schemaBefore | schemaAfter / diff |
|---|---|---|---|
| 分析與套用成功 | applied | 已知副本 | 已知結果 |
| 第一份分析或套用失敗 | failed | 最後可信狀態 | null |
| 前面失敗，這份無法推算 | blocked | null | null |
| 專案檔名有錯誤 | 全部 blocked | null | null |

空物件與 null 意義不同：`{ tables: {} }` 表示確知目前沒有表；null 表示不知道。即使失敗檔產生了一部分有效 operations，也不套用整份檔案，確保 lastValidSchema 不會含半套結果。

例如一份檔案先新增 bio，再刪除不存在的 missing，整份 replay 失敗，bio 不會寫入最後可信狀態。這是分析器的資料一致性策略，不宣稱真實資料庫的 DDL 交易一定具有相同行為。

後續仍呼叫 parser，因為不同檔案的語法錯誤可以獨立蒐集；但不再 replay，避免連鎖產生誤導的 Unknown table 訊息。即使後續檔案看似與失敗資料表無關，也採保守的全域阻擋策略。

`finalSchema` 只有整批成功才有值。失敗時可讀取 `lastValidSchema` 及 `appliedCount`，確認可信的成功前綴。空專案是成功的零步分析；可選 initialSchema 由呼叫者提供，必須符合公開 SchemaState 型別及一致的 name/key 結構，目前沒有額外 runtime schema validator。

## 六、診斷分層

- ordering：檔名格式或身分衝突。
- analysis：PHP 解析或 API 不支援，沿用單檔診斷。
- replay：語法能理解，但狀態不允許，例如新增重複欄位。
- dependency：前序失敗，這份的 schema 無法可靠推算。

每份 migration 有自己的 diagnostics，project 也彙整一份清單。來源保留原檔名、行號及 column。Replay 使用 SchemaReplayError 帶回 operationIndex 和來源；仍是 Error 子類別，保留原 Milestone 1 拋錯訊息與行為。未預期的程式錯誤不會被吞掉並偽裝成使用者 migration 問題。

## 七、如何驗證這一階段

先執行 `npm test`，再看 `tests/fixtures/project/`：

- success.golden.json：三份故意以亂序傳入的 migration，核對排序、全部 operations、每份快照、diff 和 finalSchema。
- blocked.golden.json：中間遇到不支援的 API（原為 unique，Milestone 4 起改成 fullText），核對成功前綴、部分 operations 未套用、後續 null 快照與診斷。
- project.test.ts：另外涵蓋排序、不變性、初始 schema、重複名稱、replay 回滾、後續語法錯誤，以及純結構比較。

Golden 檔案按 fixture 的預期行為獨立建立；不要用 analyzer 的輸出自動覆寫來掩蓋回歸。執行 `npm run demo:project` 可透過建置後的 package export 跑同一套三檔分析，輸出可讀的完整 JSON。

本階段未加入 timeline、ERD、down()、AI、semantic refactoring detection、SQL parser 或 runtime migration execution。仍繼承 Milestone 1 的 PHP/API 子集限制；complete 不等於驗證整個 Laravel runtime。
