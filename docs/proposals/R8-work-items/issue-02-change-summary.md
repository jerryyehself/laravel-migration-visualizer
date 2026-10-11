# [R8.2] 呈現跨表與屬性前後變更摘要

## 問題與結果

主要摘要只有 change kind／物件名，讀者要另外對照屬性。以既有 SchemaChange DTO 顯示每表分組、屬性前→後及明確 FK 上下文；摘要置於 ERD 之前。

核准／契約：R8 修訂 1，2026-10-11 使用者的修正指令；approved，尚未開工。

## 依賴與前置條件

- R8.1 主工作區／資訊層級可用。
- 讀 packages/migration-core/src/project-types.ts、types.ts、diff.ts；只核對 DTO，不修改核心。
- 讀 migration-ui-review skill，確認 own-property／unknown／各側契約。

## 修改步驟／交付物

1. 在 web 建純摘要 adapter；從 step.diff 分組 owning table，再列欄位／索引／FK；保留整表新增移除，不製造新的 core diff。
2. Changed 的 before／after 只列實際變動屬性；optional 值以 own-property 分辨未指定、null、false、0。索引與 FK 保留有序欄位／引用／actions。
3. 使用中文用途標籤與必要 PHP 名稱；完整值不用開原始 JSON 才能理解。
4. Added 導向 after、removed 導向 before、changed 可查看各側；不存在／未知導航有原因。
5. 明確 FK 的 owning／referenced 表與欄位可讀；引用上下文不算修改表，不推測業務或 DB 影響。
6. 語法操作、明確 rename 與淨結構 diff 分開；來源使用既有 R4 名稱操作清單，不猜一對一來源映射。

預計 migration-reading、MigrationReading、WorkspaceDetails 與必要 web adapter／測試。

## 驗收條件

- commerce price 顯示 decimal(8,2)→decimal(10,2)、nullable false→true、default 未指定→0；無需原始 JSON。
- false、0、explicit null 與缺省不被合併；allowedValues／複合索引／複合 FK 順序保持。
- foreign-keys 第三份 users／posts 改名操作及舊／新 FK 均可讀、可到正確側別。
- rename 保留 removed／added 結構，drop 後同名 add 與 net changed 分開；沒有推測穩定身分。
- diff=[]、diff=null、failed／blocked 狀態不同；所有來源／物件跳轉保留可信側別。
- DTO 不變；必要 adapter／互動回歸通過，保存 source／browser 證據與限制。

## 排除與停止點

不改 parser／replay／SchemaDiff／JSON／golden，不新增 DB 安全判定、自動 rename、任意時點 diff。摘要與必要回歸完成後再開始 R8.3；資料缺口回報，不能以猜值補足。

## 實際追蹤

GitHub [#140](https://github.com/jerryyehself/laravel-migration-visualizer/issues/140)；milestone [#43](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/43)。依賴：#139。approved，尚未開工。
