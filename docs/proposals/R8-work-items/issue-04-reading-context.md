# [R8.4] 保留連續閱讀上下文並整合側別搜尋

## 問題與結果

步驟切換會 remount 圖、重設 query／view 並清欄位。把 reading、literal 選取、側別搜尋與 GraphView 存於工作區，順序閱讀能持續觀察同名目標。

核准／契約：R8 修訂 1 的 R8.4 節；approved，in_progress／ready for review（COORD-14按原人類核准派工；獨立驗收pending）。此批明確更新 R7 允許換步驟重設 view 的限制，沒有要求永久布局／持久化。

## 依賴與前置條件

- R8.3 名稱查詢／跳步行為完成相關檢查。
- 核對 SchemaSnapshots key、SchemaGraph local state、SchemaComparison shared view；父層單一 reading state 不與另一份 DTO 選取混淆。
- 幾何 layout 不得聯集 schema 欄位／FK；unknown 不參與偽造資料。

## 修改步驟／交付物

1. 將選取 `{table,column?}`、搜尋文字／側別、GraphView／來源返回上下文提升到工作區；正常導航不依賴 remount 清 state。
2. 前／下一份完整順序，包含 failed／blocked；篩選外提示、初始／最終入口保持。
3. 一次分析內按 literal 名稱保存幾何座標／手動位置、pan／zoom；已知快照可共用名稱與最大高度 layout，但各圖只讀自己 schema。
4. 換 step／side 保留欄位；缺物件／未知提示，不自動換名。提供明確「定位目前物件」，重設針對當前結構合理定位。
5. 表／欄位搜尋在工作區集中，compare 指定 before／after 並標側；查詢保留、結果重算，unknown 禁用並說明；不聯集 schema 或隱藏表線。
6. 比較縮放／平移工具只需一套；改輸入／新分析清舊 state，來源返回維持 view。

預計 ProjectResults、SchemaSnapshots、SchemaGraph、SchemaComparison、comparison-layout 與必要 web 回歸。

## 驗收條件

- 放大／移表／選欄位後前下一份，物件名、query、pan／zoom 保持；同名表位置不因切步驟無故重排。
- 缺欄／缺表與 unknown 分開，切回已知仍保留 query；不會以另一側補值。
- rename 後原 literal 目標不存在，不默默接新名；同名重建位置只代表畫面定位。
- 比較各側搜尋、缺欄、零結果、shared view 正確；並排／上下布局名稱可讀，窄屏可操作。
- 輸入修改／新分析清來源與舊 view；只讀來源／篩選／開管理不改 DTO。
- 單擊、拖移、Enter／Space、方向鍵及來源返回焦點回歸，console 結果可查。

## 排除與停止點

不持久化／URL state、不自動播放、不 semantic rename、不新增 core model／布局演算法研究。完成相關回歸後再進 R8.5；不能為保留位置而混合各側資料。

## 實際追蹤

GitHub [#142](https://github.com/jerryyehself/laravel-migration-visualizer/issues/142)；milestone [#43](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/43)。依賴：#141。approved，in_progress／ready for review（COORD-14按原人類核准派工；獨立驗收pending）。

## COORD-20261011-14：R8.4交付停點

協調端按原人類核准（R8修訂1@5eec414）只派#142／R8.4。輸入8ed11ea960c7e0a046b72e3c78011c4cb744896b，產品c32b52260b6057b2b0f49d223e1c9f68b397f7c8；706tests／12demos／15verifycommands、14+12+12+14+16+9browser自測通過。R8.4父層保literal/query/view與集中側別搜尋，更新R7切步重設view舊限制；core/JSON不改。#145～147固定heads不改、R8.1～4独立驗收pending，#142 ready for review但OPEN／milestone43 OPEN，R8.5～6未開始。規劃8ea8ece98073542eaafc4b6d19f5e7ce639f074c只参考不混base。教學docs/r8-4-reading-context.zh-TW.md，證據docs/acceptance/r8-4-evidence/manifest.json。

可審查stacked PR：[R8.4 #148](https://github.com/jerryyehself/laravel-migration-visualizer/pull/148)，base feat/r8-3-related-changes，head feat/r8-4-reading-context。current head／CI以GitHub紀錄為準；獨立驗收pending、未合併、沒有automerge。
