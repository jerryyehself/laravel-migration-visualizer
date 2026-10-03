# Milestone 17：比較 ERD 對齊與同步

前／後比較圖使用共同位置與畫面 state，避免新增或移除資料表後，共同表在兩張圖跳到不同地方。拖移資料表、方向鍵、空白平移、縮放與重設全部同步。

## Core／UI 與 React 教學

comparison-layout.ts 只合併兩側的表名與卡片高度，計算位置網格；不合併欄位、外鍵或 schema。每列採兩側最大高度避免初始重疊；缺少的表留下空位，不繪製假表。Core 0.5.0、JSON 與 golden 契約不變。

將 state 提升至父 component（KnownComparison）：它持有一份 GraphView（zoom、pan、positions）。兩個 SchemaGraph 經由 props 讀同一份 view，透過 callback 更新父 state；這是兩個畫面一起變動的原因。SchemaGraph 單獨使用時仍保有本地 state。

Map 保存表名與座標，特殊名稱安全；更新時建立新 Map。共同位置是呈現資料，不修改 core 的快照。圖形 bounds 使用共同布局，重設兩圖回到相同的適當縮放與座標。

## 驗證與限制

342／342 tests（新增 5 個 layout tests）、typecheck、build 通過。測試涵蓋新增／移除保留位置、兩側最大高度、空白與特殊表名、排序／不可變、重設新 state。

瀏覽器以新增 posts 的比較確認 users 在前後皆為 (540,30)，前圖放大兩圖皆 120%；後圖方向鍵與真實指標拖移 users，兩圖座標一致。空白平移 transform 一致；重設後共同回到 100%、pan (20,20) 與初始位置。單圖縮放正常，未知比較無畫布，console 無 warn/error。

目前比較仍上下排列，沒有開關取消同步；不同快照切換會重設，不保存布局。位置只在同一次比較中對齊，不承諾跨所有 migration 位置固定。保留空位可能增加空白，大量表／外鍵未壓力測試，網格不做自動最佳化。沒有 timeline、圖形匯出或 runtime 執行。

下一階段建議加入資料表搜尋與聚焦，讓大型圖更容易定位；維持純 web 呈現及既有未知快照契約。

交付狀態見 [GitHub 紀錄](github-milestones.md)。
