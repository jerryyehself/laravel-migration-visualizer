# Milestone 27：明確的 numeric morph helpers

## 能力與契約

Core 0.12.0 支援 `numericMorphs('taggable', indexName?)` 與 `nullableNumericMorphs`。依序展開 taggable_type（string、length 255）、taggable_id（unsigned bigInteger）、複合 index（type、id 順序）。nullable 版本兩欄均可空；不新增 foreignKey，也不猜多型關聯的目標表。AtomicOperation 與 SchemaState 型別不變。

第二參數省略／null 使用慣例名稱，非空字串使用自訂名稱。只接受一至二個靜態參數，不支援第三個 after、方法鏈／change、空字串或動態名稱。`morphs`／`nullableMorphs` 依賴 Schema runtime 設定，仍拒絕。string length 255 沿用分析器固定基準，不模擬 runtime defaultStringLength 或 connection prefix。

[固定 Laravel 12 Blueprint 原始碼](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Blueprint.php#L1578) 確認欄位型別與 index 順序；nullableNumericMorphs 在 L1597。Fixtures 是本專案撰寫，不是官方 PHP 的副本。不執行 PHP／SQL，不保證 DB 方言相容。

## 教學：helper 展開與 React 分層

一個 helper 可以產生多個 domain commands。Normalizer 先驗證完整 statement 才輸出；replay 複製 schema，再依序套用兩欄與 index。第二欄或 index 衝突會讓整檔失敗，lastValidSchema 不包含部分欄位。第一失敗的 after／diff 為 null，後續快照為 null，finalSchema 為 null。

Component 是呈現畫面的單位；props 是父層傳入的分析結果／callback；state 是畫面選取資料。React 用 core 的快照呈現兩欄與索引，hooks 不推導 schema。多型 target 不確定時不能畫成猜測的 foreign-key edge。Diff 是結構變化，不是 helper 或執行順序。

## 驗證

22 個新回歸：實作前 9 failed／13 passed，實作後全數通過。涵蓋 nullable、命名、來源、拒絕、第二欄／index 衝突、特殊名稱、快照／diff 隔離、跨檔 success／blocked golden。Golden 從預期狀態獨立建立，未錄製 analyzer output。

本地完整 548 tests（459 core + 89 web）、typecheck、build 與十個 demo 通過；demo:morphs 驗證建置後套件。無 UI 改動，未新增瀏覽器驗收。主要檔案為 normalize.ts、numeric-morphs.test.ts、fixtures/numeric-morphs、examples/morphs.mjs 與 CI／版本／文件。實際 CI／合併狀態見 [交付紀錄](github-milestones.md)。
