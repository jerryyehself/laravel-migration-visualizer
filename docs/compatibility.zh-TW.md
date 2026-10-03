# 第一版相容性矩陣

目標是可驗證的靜態分析子集合，不是完整 Laravel 或資料庫 interpreter。基準為固定 Laravel 12 framework commit `71cf667d43f9cd3f840b1733bb2b7bec65d72282`；[Blueprint 原始碼](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Blueprint.php)。完整參數政策見 README「支援範圍」及各 milestone 教學。

| 類別 | 第一版支援 | 主要限制／證據 |
|---|---|---|
| PHP 入口 | 一個匿名／具名 Migration 的 up、namespace/use alias | 不執行 PHP；down/helper methods 不分析；core.test |
| Schema lifecycle | create/table/rename/drop/dropIfExists | 靜態名稱／closure；table-lifecycle.test |
| Columns | integer 家族、string/char/text、boolean/date/json/uuid、decimal、時間／enum | 明確參數子集合；core/column-helpers.test |
| Modifiers | nullable/unsigned/default/comment/current time metadata | default 靜態 scalar；current 不求值；current-on-update.test |
| Helpers | timestamps、softDeletes、rememberToken 與對應 drop | helpers 展開既有 commands；column-helpers.test |
| Indexes | index/unique/primary、drop、一般 index/unique rename | 不支援 primary rename、fullText、spatial、algorithm；indexes/rename-index.test |
| Foreign keys | foreign/references/on、foreignId/constrained、actions、dropForeign、dropConstrainedForeignId | 不推測 custom constraint；外部 initialSchema 必須符合契約；foreign-keys.test |
| Polymorphic | numeric/nullableNumericMorphs、uuid/nullableUuidMorphs、dropMorphs | 不支援 runtime morphs、ULID、after，不猜 target/FK；三個 morph tests |
| change | 保守欄位定義完整替換 | 不改自增／FK 參與欄位，不支援 helper/foreignId/change 同鏈 index；change-column.test |
| Project | 檔名排序、batch、before/after、structural diff、diagnostics | 失敗的 after/final null，可信前綴另列；project.test |
| UI | 多檔／資料夾匯入、診斷定位、編輯副本、JSON、ERD 快照／比較／明細 | 副本只在瀏覽器記憶體；不執行 migration；web tests |

## 拒絕的語法

動態值、variables、control flow、helper calls、macros、connection、raw SQL、未支援 API／方法鏈產生 diagnostics；不把缺少分析能力的內容默認成成功。部分已支援 statements 可保留 operations 用於定位，但 incomplete migration 不 replay。

`tests/fixtures/compatibility/cases.json` 是獨立撰寫的正／負 contract probes：列出 PHP statement 與預期 operations，不由 analyzer 錄製。它示範上述類別的邊界，不宣稱逐一覆蓋所有 Laravel methods；其他細節由各既有回歸／golden 覆蓋。

## 不保證的事項

DB driver DDL、implicit indexes、connection prefix/defaultStringLength、runtime configuration、外部 JSON runtime validation，以及任意 PHP。整檔原子 replay 是可信分析規則，不代表資料庫 transaction 保證。Timeline/down/AI/SQL parser/runtime execution/semantic refactoring detection 不在第一版驗收範圍。
