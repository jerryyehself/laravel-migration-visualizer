# Milestone 19：已聚焦資料表詳細檢視

ERD 聚焦表後，可展開該圖下方的明細，完整查看欄位、索引與外鍵；名稱不截短，欄位選用屬性逐項顯示。

## React 與可信快照

TableDetails component 的 props 為當前 schema 與 GraphView 的 focused 表名，不另外保存表資料，也不修改快照。比較模式共用選中表名，但每側 props 仍是各自 schema，所以前／後屬性不混在一起。

使用 Object.hasOwn 判斷表確實存在，避免 constructor／__proto__ 被當成物件原型。React 會跳脫名稱與註解，不將它們當 HTML。core 0.5.0、JSON 與 golden 契約不變。

## 呈現契約

- 未選中顯示聚焦提示；表在某側不存在時明確提示，不複製另一側或建立假表。
- 欄位名稱與型別完整列出，其餘已存在的屬性逐項顯示。default false／0／null 與未指定有區別；allowedValues 保留順序。
- 索引包含名稱、種類與有序欄位；外鍵包含名稱、本表欄位、引用表／有序欄位與 ON DELETE／ON UPDATE。未指定動作不假設 DB 行為。
- 折疊明細預設關閉；切換聚焦表以 key 重建折疊區。重設視野清除聚焦，明細回提示；切換快照重設。
- 名稱與值採自動換行，圖形布局、搜尋與既有 JSON 匯出不受明細影響。

## 驗證與限制

352／352 tests（新增 6 個 React 靜態呈現 tests）、typecheck、build 通過。測試直接檢查使用者會看到的內容，涵蓋未選中／缺表、特殊名稱、false／0／null／allowedValues、複合索引／外鍵順序與動作、長文字跳脫、不可變與已知空表。

瀏覽器確認新增 posts 的前快照沒有該表，後快照顯示 id／user_id、primary 索引及 set null／cascade 外鍵動作；另一範例 display_name 的前側 nullable=false、length=120，後側 nullable=true、length=200。Console 無 warn/error。

目前明細逐表展開，不做欄位搜尋、屬性編輯、SQL 生成或 runtime 驗證。屬性 key 沿用 core 名稱，值使用 JSON 表示以保留型別；缺省值不補成資料庫預設。長表與大量明細尚未壓力測試。

下一階段建議從真實 Laravel migration 專案檢查支援率，整理不支援語法與診斷，再依具體樣本補核心 API。

交付狀態見 [GitHub 紀錄](github-milestones.md)。
