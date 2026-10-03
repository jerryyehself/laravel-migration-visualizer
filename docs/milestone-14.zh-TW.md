# Milestone 14：最終 Schema ERD

第一版圖形視覺化直接把成功分析的 finalSchema 轉為資料表卡片、欄位與外鍵箭頭。這是使用者同意進入視覺化後的新範圍；原本暫緩 ERD 的限制在本階段解除，其他排除仍有效。

## Core 與 UI 的分層

schema-graph.ts 是 web 的呈現投影：SchemaState → 節點／連線／初始位置，沒有 parser、schema replay 或關聯推論。既有 migration-core 0.5.0、schema JSON 與 golden 契約完全不變。

SchemaGraph 是 React component，props 只有已知 schema。pan、zoom、positions 是畫面 state，拖移只更新它們，不修改 schema。positions 用 Map 保存移動過的表名，避免特殊名稱如 __proto__ 被當成物件原型。初始位置與欄位列則是可重算的資料。

useRef 保存 SVG 元素與目前拖移的起點；它們不是資料庫狀態。指標座標先轉成 SVG 座標，再扣除缩放，確保改變縮放後拖移距離仍正確。鍵盤方向鍵也可移動聚焦中的資料表。使用原生 SVG，未增加依賴套件。

## 圖形契約

- 只有 complete 且 finalSchema 非 null 才繪圖；失敗時顯示未知提示，不拿 lastValidSchema 假裝最終圖。已知空 schema 則明確顯示沒有資料表。
- 表名排序後以兩欄網格排列；下一列依該列最高卡片開始，避免長表初始重疊。欄位順序沿用 schema。
- 欄位顯示名稱、型別、PK、FK 與 nullable 的 ?。PK 沿用 core 欄位 metadata；FK 只來自明確 foreignKeys。
- 每個外鍵 constraint 一條箭頭，從本表指向 referencedTable。不因 user_id 之類名稱猜測外鍵，不推論一對多／一對一或資料庫隱含索引。
- 複合外鍵明細保留欄位順序；自我引用畫回到同一張表。缺少引用表時不建立假表，顯示未繪製數量。
- 縮放範圍 15%～250%；拖移卡片、拖移空白平移、方向鍵移動與重設位置。重設會清除手動配置並回復初始縮放。
- 圖形不受逐檔搜尋／狀態篩選影響；修改輸入後舊結果卸載，圖形 state 重置。既有 JSON 匯出仍是原始 core 結果，沒有座標資料。

## 限制

目前只看最終 schema；歷史快照切換與變更色彩為後續階段。沒有 timeline、圖形匯出、圖形設定持久化、關聯基數或資料庫執行。

連線連接表卡片邊緣，不逐一連到欄位列；多個外鍵連到同一張表可能重疊。完整名稱與複合欄位可由 tooltip／外鍵連線明細與既有 schema 表格查看；卡片長文字會截短。大量表／外鍵尚未壓力測試，兩欄布局不是自動最佳化。縮放使用按鈕，沒有滑鼠滾輪或雙指縮放。

## 驗證

324／324 tests（新增 9 個 graph tests）、typecheck、build 通過。測試涵蓋空 schema、表排序／網格、不推論外鍵、複合欄位順序、自我引用與缺少目標、特殊名稱／不可變、縮放界限、移動後路徑與真實 core replay 投影。

內建瀏覽器確認：完整四檔外鍵範例最後刪除外鍵，圖為 2 表／0 關係；保留前三檔後為 2 表／1 關係，posts.author_id 指向 users.user_key。實際指標拖移、方向鍵移動、空白平移、縮放與重設成功；失敗流程沒有 ERD 畫布，顯示最終 schema 未知。Console 無 warn/error。

交付狀態見 [GitHub 紀錄](github-milestones.md)。
