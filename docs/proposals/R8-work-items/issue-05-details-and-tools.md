# [R8.5] 整理表明細、操作來源與進階分析入口

## 問題與結果

全專案操作來源先於欄位且 compare 重複兩次，工作區後又展開 final／prefix 全表。讓結構明細先可讀，來源獨立且只列一次，DTO／匯出／替代表格進次入口。

核准／完整契約：R8 修訂 1 的 R8.5 節；in_progress／ready for review；獨立驗收 pending，未合併。

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

GitHub [#143](https://github.com/jerryyehself/laravel-migration-visualizer/issues/143)；milestone [#43](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/43)。依賴：#140、#141、#142。in_progress／ready for review；獨立驗收 pending，未合併。

## COORD-20261011-17：R8.5 交付停點

協調端按原人類核准（R8修訂1@5eec41476ef22b85d3165d3be3f681f1a20c8f9d）只派 #143／R8.5。固定輸入2dd3a9a348df5225f4cbf157d3c76ff5ef539622，產品ce16e471573cbf0762ad13293f715eefb61b28f7；713 tests（540core／173web）、15 verify命令／12demos與13+14+12+12+14+16+9＝90項／組browser自測通過。明細中文屬性優先、單一完整分析來源與未來時點標示、集中進階DTO／表格／診斷與兩JSON入口；core／公開JSON／golden／依賴／workflow無差異。#145～148固定驗收heads不改，COORD16及各批獨立驗收pending／offline阻礙沒有解除，不能用自測或協調核對當驗收。#143 in_progress／ready for review但OPEN，整R8與milestone43 OPEN，R8.6未開始。不合併、不automerge、不部署／release／下載落盤。規劃d2e3aaa2f761752842cdb4856afc2af0e47ba435只參考不混產品base。教學docs/r8-5-details-and-tools.zh-TW.md，12份可攜證據SHA256見docs/acceptance/r8-5-evidence/manifest.json。

可審查 stacked PR：[R8.5 #149](https://github.com/jerryyehself/laravel-migration-visualizer/pull/149)，base feat/r8-4-reading-context，head feat/r8-5-details-and-tools；證據／教學commit 59f6de87c65df65f65820dc6979fb43d9d99e780。current head CI以GitHub當前紀錄為準；独立驗收pending，不合併／automerge。
