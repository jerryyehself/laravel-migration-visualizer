# Milestone 25：靜態多欄位刪除

## 問題與結果

之前 `$table->dropColumn('a')` 可以分析，但常見的 `$table->dropColumn(['b', 'a'])` 被拒絕。Core 0.10.0 現在接受一個非空、名稱不重複的靜態字串陣列，也接受 PHP `array('b', 'a')`。既有單字串行為保留，AtomicOperation 與 SchemaState 型別不變。

## 從 PHP 到 JSON

```php
Schema::table('users', function ($table) {
    $table->dropColumn(['b', 'a']);
});
```

Normalizer 先驗證整個參數，才按順序產生兩個既有 `dropColumn` operation（column 分別是 b、a），兩者帶相同 PHP statement 的 source。空陣列、重複名稱、空字串、非字串、變數、帶鍵或展開陣列、額外參數與 chained modifier 會產生 UNSUPPORTED_BLUEPRINT，該 statement 不輸出部分 operations。其他已支援 statements 的結果仍可用來定位，但 incomplete migration 不套用。

不新增 bulk replay：`applyOperations` 原有的複製與整檔原子套用會保護可信 schema。先刪 a 再遇到 missing 時，不留下已刪 a 的快照；index、unique、primary 或 outgoing／incoming foreign key 保護也照常生效。先明確移除相關約束才能刪欄位。不模擬資料庫隱式刪除索引或 cascade。

成功 migration 的 before／after 與 diff 都有獨立資料。Diff 按名稱排序，因此 input operations 的 b、a 可能呈現為 a、b 的 columnRemoved；這兩個順序服務不同需求。第一份失敗保留 schemaBefore，schemaAfter／diff 為 null；後續繼續解析但快照為 null，finalSchema 為 null，lastValidSchema 僅表示成功前綴。

## React 分層教學

Core 像後端的 domain service：把 PHP 解讀成操作並計算結果。React 的 component 是畫面的呈現單位；props 是父層提供的分析結果與 callback；state 是會改變的畫面資料，例如選中的快照或表格。刪除是否有效的規則只放 core，component 根據 props 顯示快照／診斷。這次沿用既有 operations 和 diff，UI 不需要新增 bulk deletion 判斷。

## 來源與範圍

- [Laravel 12 官方 dropping columns 文件](https://laravel.com/docs/12.x/migrations#dropping-columns) 示範陣列。
- [固定 framework commit 的 Blueprint::dropColumn](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Blueprint.php#L421) 接受陣列，亦支援 func_get_args。
- 本階段只接受一個參數；variadic 字串形式仍拒絕。空／重複陣列的拒絕是本分析器的保守政策，不宣稱 Laravel 同樣拒絕。
- Fixtures 是本專案自行撰寫的場景；golden 從預期狀態獨立建立，沒有錄製 analyzer output。沒有執行 PHP／SQL／資料庫，不能據此宣稱所有 driver 相容。

## 驗證

25 個新回歸在加入 fixtures 後、修改 normalizer 前為 13 failed／12 passed；實作後全數通過。完整 501／501 tests（412 core、89 web）、typecheck、build，以及 project／tables／helpers／laravel／changes／current-update／index-rename／drop-columns 八個建置後 demo 通過。新 demo 明確驗證成功與失敗時的可信狀態。沒有 UI 修改，未新增瀏覽器互動驗收。

主要變更：normalize.ts、drop-columns.test.ts、四份 PHP fixtures、兩份人工 golden、examples/drop-columns.mjs、版本／CI／文件。GitHub 實際交付狀態見 [交付紀錄](github-milestones.md)。
