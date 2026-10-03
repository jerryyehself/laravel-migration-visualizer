# Milestone 16：ERD 結構變更視覺化

快照選單為每份 migration 增加「結構比較」。比較上下呈現真實的 schemaBefore 與 schemaAfter，標示新增、移除、變更；只讀 core 已計算的 SchemaDiff，不重新 replay 或 diff。

## 設計與 React 教學

graph-diff.ts 在 web 將既有 diff 投影為表／欄位／外鍵標記 Map。名稱以 JSON tuple 作為複合鍵，避免特殊名稱或分隔符碰撞。這只是 UI 呈現規則，沒有新增 domain 判斷；migration-core 0.5.0、JSON 與 golden 契約不變。

SchemaComparison 是顯示單元（component），props 是父層傳入的 MigrationSnapshot。它把兩份 schema、同一個 diff 及 before／after 傳給 SchemaGraph。各圖的 state 仍只管理位置與縮放；不修改快照或 diff。

移除項目只在前圖標紅與 −，新增項目只在後圖標綠與 ＋，修改在兩圖標橙與 ～。因此每張圖仍是實際快照，不混成一張從未存在的 schema。比較選項切換以 key 重建兩圖，重設各自布局。

## 呈現契約

- 表、欄位、外鍵變更沿用 core change kind；表的「含變更」表示其欄位、索引或外鍵有變更，不宣稱表本身屬性改變。
- 整表新增／移除時，卡片、欄位及本表的外鍵沿用整表標記，不製造額外 column diff records。
- 表／欄位 rename 沿用結構 diff 的移除與新增，不推測語意關聯。
- 索引不畫成節點；表卡片標示含變更，明細保留 index change 及完整 JSON before／after。
- 外鍵線新增、移除、變更使用不同顏色，移除線另有虛線；tooltip 和明細提供完整名稱與狀態。不存在引用表的限制沿用 M14。
- before、after 或 diff 為 null 時不比較、不繪製猜測圖；已知空白及零變化有明確提示。
- 單一快照視圖仍不標色；JSON 匯出不包含視覺標記，不受選項或篩選影響。

## 驗證與限制

337／337 tests（新增 8 個 graph-diff tests），typecheck 與 build 通過。涵蓋兩側新增／移除、整表變更、欄位屬性、外鍵新增／修改／移除、索引變更、特殊名稱／不可變、空 diff、未知比較與真實 rename。

瀏覽器確認 nickname 移除與 display_name 屬性變更、外鍵紅色移除線、整表綠色新增、未知比較無畫布，以及兩圖縮放獨立。Console 無 warn/error。

兩圖上下排列，位置與縮放未同步；長表需要捲動／縮放，長名稱由 tooltip／JSON 補充。沒有 timeline、自動最佳布局、圖形匯出、語意 rename、runtime 執行。大量資料尚未壓力測試。

下一階段建議改善比較閱讀：同步兩圖縮放／平移、穩定共同表的位置，並提供聚焦變更項目的控制；維持既有分析契約。

交付狀態見 [GitHub 紀錄](github-milestones.md)。

[PR #54](https://github.com/jerryyehself/laravel-migration-visualizer/pull/54) 已合併 main（25dc11c）。功能 head 1a9ec51 的 CI 通過 tests、typecheck、build 與三個 demo；issues #52/#53 與 milestone 已關閉。
