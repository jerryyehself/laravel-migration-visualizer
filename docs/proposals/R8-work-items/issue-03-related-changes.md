# [R8.3] 列出同名表與欄位的相關 migration 變化

## 問題與結果

讀者要逐份切換並記住新增／移除。建立 literal 表／欄位查詢的相關步驟視圖，顯示各步結構差異、語法、狀態及來源；不把名稱串成物件身分。

核准／完整契約：R8 修訂 1 的 R8.3 節；approved，in_progress／ready for review（既有使用者核准，COORD-11有界派工；獨立驗收pending）。

## 依賴與前置條件

- R8.2 可讀摘要／屬性／各側導航已完成相關檢查。
- R4 名稱來源與 operationObjects 契約；R7 同工作區上下文。
- 識別 tableAdded／Removed 可能只含整表快照，不能只搜尋 column change 而漏掉初次建表／刪表。

## 修改步驟／交付物

1. 純 web adapter 收 ProjectAnalysis 與 `{table,column?}`，按原始 migration index 列相關步驟，不改 replay／匯出。
2. 表／欄位精確匹配；整表增刪查其已知內容；索引／FK 的有序欄位與 referenced 名稱標為關係上下文。完整規則依 R8。
3. 相關列區分真實 diff、已識別操作、status、before／after availability。noop 與語法有操作分開；failed／blocked 明示未套用，未知不算無變化。
4. 操作只有表級資訊時列上下文，不宣稱該欄位已變。明確 rename from→to 可讀，使用者點新名稱才另查，不自動追名。
5. 提供明細／搜尋入口及精確名稱輸入，讓刪除名稱與 final 未知時仍可查。
6. 可查看已知步驟比較、failed before 或 blocked 診斷；來源預覽不換原閱讀步驟，返回保留查詢／側別／物件。

預計 operation-sources、WorkspaceDetails、ProjectResults、新 web adapter／component 與必要回歸。

## 驗收條件

- users.nickname 直接列第二份新增、第三份移除／來源／狀態，不列不相關檔；選第三份仍保留欄位名及不存在提示。
- 初次 createTable／dropTable 中的欄位生命段可查；不製造 core column diff records。
- display_name rename 與後續 drop/add 分開，同名重建沒有 identity／自動接續；表 rename 查原／新 literal 名稱各自正確。
- failed／blocked 的相關語法可讀但未套用；未知區段的「無證據」不能說成沒有變更。
- 同名欄位跨表、特殊名稱、零檔、排序未開始、查不到及 deleted 名稱都有可信提示。
- 清單查詢不改完整順序／schema／exports；跳步與看來源結果可回到同一上下文。

## 排除與停止點

不新增 core History DTO、穩定 ID、跨 rename 自動追蹤、任意時點比較、時間軸／動畫、PHP／DB runtime。已知相關步驟與未知提示驗證完成再進 R8.4，不以功能名「歷程」擴大責任。

## 實際追蹤

GitHub [#141](https://github.com/jerryyehself/laravel-migration-visualizer/issues/141)；milestone [#43](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/43)。依賴：#140。approved，in_progress／ready for review（既有使用者核准，COORD-11有界派工；獨立驗收pending）。

## COORD-20261011-11：R8.3 交付停點

協調端按既有使用者核准（R8修訂1@5eec414）只派 #141／R8.3。輸入3e8ee581eee16a80940c7490b491001dc2bd25eb，產品763f71d5089e45781e34ba30e55028916b065a15；698 tests、12 demos、15 verify步驟、12+12+14+16+9 browser自測通過。R8.1 #145／R8.2 #146 固定 head 不改，三批独立驗收均 pending。R8.3 in_progress／ready for review，milestone #43 open，R8.4～6未開工，不合併 main、不automerge。教學 docs/r8-3-related-changes.zh-TW.md，可攜證據 docs/acceptance/r8-3-evidence/manifest.json。規劃8c326339ff5b7656b7e73a3842029a6dfbc24eae只參考，不混產品base。

可審查 stacked PR：[R8.3 #147](https://github.com/jerryyehself/laravel-migration-visualizer/pull/147)，base feat/r8-2-change-summary，head feat/r8-3-related-changes。current head／CI以GitHub紀錄為準；獨立驗收pending，沒有合併依賴或啟動automerge。
