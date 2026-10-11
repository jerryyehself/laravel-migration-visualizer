# [R8.5] 整理表明細、操作來源與進階分析入口

## 問題與結果

全專案操作來源先於欄位且 compare 重複兩次，工作區後又展開 final／prefix 全表。讓結構明細先可讀，來源獨立且只列一次，DTO／匯出／替代表格進次入口。

核准／完整契約：R8 修訂 1 的 R8.5 節；approved，尚未開工。

## 依賴與前置條件

- R8.2～R8.4 的摘要、literal 查詢、view／來源返回 state 通過相關回歸。
- 讀 TableDetails、OperationSources、source-return 的 collapsed／invalid target 契約。
- 下載互動／落盤仍暫緩；序列化契約與 final 禁用需保留。

## 修改步驟／交付物

1. 右側明確分結構明細、相關變更、PHP 來源；各側明細各讀自己的 schema。
2. 欄位／索引／FK 優先，屬性中文用途標籤、optional 值可信；不先攤全歷史來源。
3. 完整分析操作來源只列一次，標全分析順序，包含之後步驟不是當前時點已發生；比較兩側不複製同一清單。
4. 原始碼唯讀，返回復原 step／side／物件／query／view／focus；祖先 details 自動展開，失效目標有提示。
5. JSON 下載、完整 DTO、全部診斷與 schema 表格集中進階入口；保留可達替代表示、完整時點標籤與 unknown final 禁用。
6. 不在主工作區底部預設展開另一份 final／prefix 全表格；不刪原有匯出／序列化能力。

預計 WorkspaceDetails、TableDetails、OperationSources、ProjectResults、ProjectExports、style 與必要 web 回歸。

## 驗收條件

- 主明細先能看欄位／索引／FK，全專案來源清單 compare 只列一次。
- before／after／final／prefix 時點標籤明確；未來來源不被標為當時已套用。
- advanced DTO／表格／兩種 JSON 匯出仍可達，序列化不受查詢／layout 改變；final unknown 禁用。
- 來源歧義、未知行、收合祖先、失效返回目標均有正確結果，鍵盤能返回原位置。
- 原有副本失效、各側缺表與 explicit 值回歸，無新增下載落盤驗收。

## 排除與停止點

不增加 PHP／ERD 匯出、下載落盤、持久化、core／公開 JSON、新依賴／workflow。必要回歸通過後交給 R8.6 整合，不能以收合藏掉主摘要或未完成狀態。

## 實際追蹤

GitHub [#143](https://github.com/jerryyehself/laravel-migration-visualizer/issues/143)；milestone [#43](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/43)。依賴：#140、#141、#142。approved，尚未開工。
