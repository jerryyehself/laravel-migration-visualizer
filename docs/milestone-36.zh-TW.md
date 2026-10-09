# Milestone 36：當前快照欄位搜尋（R3）

核准：PR #119／R3 修訂 2；前置 R1 PR #121／2dfbbc6。milestone 36、issue #122。R3.1 的互動契約見 docs/proposals/R3-schema-exploration.zh-TW.md。本批只交付 R3.1、R3.2、R3.4；R3.3 無 R1 需求證據而跳過，未新增 FK 導覽。

## 操作與限制

選一個已知 ERD 快照，在「搜尋目前快照欄位」輸入名稱，例如 reserved_at。不分大小寫、忽略兩端空白、按字面部分匹配；不按表名或型別搜尋。結果顯示 table.column，同名欄位仍是不同結果。空查詢提示輸入，不列全部欄位；無匹配明確提示。

點擊或用 Tab／Enter 選結果，會聚焦表、展開明細、標記完整欄位並轉移鍵盤焦點到欄位。再次點同一結果可重新展開。清除搜尋保留選取；聚焦其他表或重設位置清欄位選取。切換快照清搜尋與選取。

比較前後圖各自搜尋自己的 schema；共享表聚焦與畫面位置，不把另一側缺少的欄位／表補進來。未知快照不提供搜尋，已知空白可以輸入但無匹配。圖形、FK、core DTO 與匯出完整資料不因搜尋改變。

## 用後端概念理解 React

matchingColumns 是純 web query adapter，像查詢 service：輸入已算好的 SchemaState 與 query，回傳 table／column 身分；不重跑 PHP parser 或 replay，也不改 DTO。這不是 domain 新規則，因此不用擴充 core。

SchemaGraph 是讀取 schema props 的呈現元件，類似把 service DTO 交給 view。state 只保存欄位 query、選取與畫面操作 request；request 讓同一欄位的下一次操作重新開啟明細，並不表示 schema 版本。TableDetails 收到 selected／selectedColumn props 後只讀當前表，安全核對 own property。effect 在 React 更新 DOM 後捲動／聚焦選取欄位，不在 effect 裡計算 domain schema。

快照選單既有 key 讓切換時建立新的元件 state，避免把上次的選取沿用到不存在的欄位。before／after 各持自己的欄位 selection，共享的 GraphView 仍只管表聚焦、位置與縮放。

## 實際回歸與瀏覽器證據

原先保存的欄位搜尋／明細回歸在未實作時 5 failed／7 passed；實作後通過，另補已知空白 ERD 初始無選取的呈現回歸。新增加 7 tests，core 不變。

Chromium 使用 R1 固定的 Laravel.io／BookStack 原始資料：同名 id 的 table.column 結果、圖形未篩除、Enter 選 reserved_at、焦點移至完整欄位、關閉後再次選取展開、清 query 保留選取、無匹配、快照重設、比較兩側獨立、另一側缺表不補、未知無搜尋、已知空白區分全部通過。console 無 warnings/errors；詳見 docs/research/r3-browser.json；截圖 artifacts/r3-column-search.png。沒有下載、手機或大圖效能驗收，也沒宣稱兩個真實專案都 complete。

PR #123 head b0929fa 的 validate CI run 37897374107 success，已合併 9e4b804；issue #122／milestone 36 closed，提案完成批次已標 done。完整交付紀錄見 docs/github-milestones.md。
