# Milestone 26：外鍵欄位移除 helper

## 問題與結果

`foreignId('user_id')->constrained()` 已可分析，但它常見的移除 helper 尚未支援。Core 0.11.0 加入獨立 `dropConstrainedForeignId('user_id')`，接受一個非空靜態字串；AtomicOperation 與 SchemaState 型別不變。

```php
Schema::table('posts', function ($table) {
    $table->dropConstrainedForeignId('user_id');
});
```

以上依序展開為 `dropForeignKey`（name: posts_user_id_foreign），再 `dropColumn`（column: user_id）；兩個 operation 都指向同一 PHP statement。名稱推導沿用既有 indexName：table + column + foreign，小寫並把句點／連字號換成底線。不使用 column type 尋找外鍵，也不搜尋自訂 constraint name。

## 來源與限制

核對 [Laravel 12 固定 commit 的 Blueprint::dropConstrainedForeignId](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Blueprint.php#L512)：先呼叫 dropForeign([$column])，再 dropColumn($column)。[dropForeign](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Blueprint.php#L501) 與 [createIndexName](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Blueprint.php#L1776) 確認慣例推導。這次僅閱讀官方來源；PHP fixtures 是本專案自行撰寫的場景。

- 慣例名稱不存在會得到 replay diagnostic，不偷偷略過。自訂外鍵需明確 `dropForeign('custom'); dropColumn('user_id');`。
- 其他 index／unique／primary、其他 outgoing 或 incoming foreign key 的保護不變。不自動移除約束或模擬 DB 隱式索引。
- 零／多參數、空字串、null、boolean、number、array、變數、chained modifier／change 均拒絕，該 statement 不產生部分 operations。
- `dropConstrainedForeignIdFor` 需要 model 資訊，仍不支援；connection prefix_indexes 與 DB 命名細節也未模擬。
- 不執行 PHP／SQL，不宣稱所有 Laravel／DB migrations 都相容。Core 整檔原子 replay 是分析可信度規則，不代表所有資料庫 DDL 都有交易保證。

## 可信快照

Normalizer 驗證參數後輸出 commands；replay 複製輸入 schema 再套用。若外鍵成功移除，但欄位仍受到索引保護，整份 migration 失敗；lastValidSchema 裡外鍵與欄位都保留。即使 helper 成功、同檔稍後另一個 command 失敗，也不洩漏 helper 的部分結果。

第一份失敗保留 schemaBefore，schemaAfter／diff 為 null；後續檔案仍解析，但快照為 null。finalSchema 為 null，lastValidSchema 只代表成功前綴。成功 diff 直接呈現 columnRemoved 與 foreignKeyRemoved；operations 的外鍵優先順序與 diff 的分組排序不同，不應把 diff 當執行指令。

## React 分層教學

Component 是渲染畫面的單位；props 是父層傳進來的分析結果與 callback；state 是畫面會改變的資料，例如目前選哪張表。Core 像後端 service，決定外鍵是否存在、移除是否有效、快照是否可信。React 從 props 顯示 core 計算好的結果，state 僅控制選擇與互動。因此這個 helper 的規則放在 normalizer，沿用 replay；不把外鍵查找或刪除判斷塞進 hooks。ERD 可從既有快照看見關聯與欄位移除，這次沒有新增 UI 流程。

## 測試與驗證

25 個新測試在 fixtures 補齊、修改 core 前是 13 failed／12 passed；實作後全部通過。涵蓋命名慣例、來源定位、拒絕參數與方法鏈、自訂名稱／缺少外鍵、三種索引保護、其他雙向外鍵引用、explicit dropIndex、特殊識別字、輸入與快照／diff 隔離，以及跨四檔成功／中途失敗 golden。

Goldens 從預期欄位與外鍵狀態獨立撰寫，未錄製 analyzer output。Built-package demo 額外驗證移除順序與同檔後續失敗時的可信前綴。

本地：526／526 tests（437 core + 89 web）、typecheck、build、project／tables／helpers／laravel／changes／current-update／index-rename／drop-columns／drop-constrained-id 九個 demo 通過。沒有 UI 改動，未新增瀏覽器互動驗收。

主要檔案：normalize.ts、drop-constrained-id.test.ts、五份 PHP fixtures、兩份人工 golden、examples/drop-constrained-id.mjs、版本／CI／中文教學。實際 GitHub 交付見 [交付紀錄](github-milestones.md)。
