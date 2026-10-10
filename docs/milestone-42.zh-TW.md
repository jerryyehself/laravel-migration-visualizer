# M42／R7：同一工作區閱讀 migration

2026-10-10，issue #135／milestone 42。核准來源是研究 session 的方案 A，以及雲端使用者「好」確認先修獨立驗收缺陷、再交付 R7。輸入 main d159cbe1dbcba347858eab266109abbfdb094d20；R3～R6 與 IR 修正已合併。功能 PR／latest-head CI／merge 尚待交付，不宣稱已发布或 release。

## 操作與可信度

工作區同時有 migration 清單、ERD／本檔摘要與固定表明細。選檔統一目前閱讀步驟，前一份／下一份依完整 core 排序，包含 failed／blocked，端點停用。套用前／後／比較是側別選擇；初始／最終保留獨立入口。篩選不改閱讀時點；目前檔不在清單會明示。

單擊圖表、Enter／Space 或既有搜尋都選取同一明細區。拖曳移動位置，方向鍵仍可移表；拖曳不選另一表。5 個畫面像素的閾值區分點擊與移動，避免手部小幅抖動被當拖曳。

換步驟保留表名，清欄位選取；名字只是 literal query。rename users→members 後，原 users 在 after 顯示不存在，before 仍讀自己的 users，不追物件身分。未知快照另顯示未知；已知空白不等於未知。比較兩侧各讀自己的 schema，沿用共同 view state，不合成資料。

右側 PHP 是唯讀來源預覽，即使來自另一份檔也不切步驟／側別／表／圖。返回展開原 native details 並恢復焦點；來源目標失效會聚焦提示。修改瀏覽器副本即清舊分析，重新分析前沒有工作區。

## 用後端分層理解 React

core 像 domain service，ProjectAnalysis 是既有回應 DTO。workspace-reading.ts 像 DTO 選取 adapter：依 index／side 找 before、after、diff，不重跑 PHP／replay。ProjectResults component 像畫面 controller，state 保存「目前看哪份、哪一側、哪個表名」；props 把 DTO 與選取 callback 傳给子 component。

WorkspaceDetails 是固定呈現區，從各側 schema 取表，不補缺失資料。SchemaGraph 擁有縮放／位置等 view state，將選表事件透過 callback 交回父 component；這相當於 view 回報意圖，不修改 domain DTO。SchemaSnapshots 的舊獨立選單仍可供既有 component 使用，工作區用 showSelector=false、hideDetails 避免重複主要入口和明細。沒有 core 或公開 JSON 變更。

實際新增 workspace-reading、WorkspaceDetails 及兩份 web 測試；調整 ProjectResults、SchemaSnapshots、SchemaComparison、SchemaGraph、TableDetails、style.css 和瀏覽器 regression。MigrationReading／OperationSources 沿用原 DTO 與來源契約，不為符合預計清單而修改。

## 實際驗證

web 新增 10 個契約回歸：完整順序、不跳 failed／blocked、各側快照、未知 final、已知空白／無 diff、零檔／非法位置／排序未開始，以及固定明細未選表、精確名稱不存在、比較自己的資料、特殊名稱逃逸。前端共 130 tests 通過；全套 npm run verify 15 步通過：670 tests（540 core／130 web）、typecheck、build、12 demos。

啟動 Vite 後，環境既有 Python Playwright／Chromium 執行：

```
python3 scripts/verify-workspace.py
python3 scripts/verify-source-return.py
```

R7 的 16 項實際 browser 任務通過：預設 final 與入口、第二／第三檔 users 欄位變化、比較的移除欄位只在 before、篩選與原始順序、另一檔来源預覽、收合返回、Enter／Space／方向鍵、初始與 final、不同表拖曳不改選取、rename 缺表、診斷定位、failed／blocked／unknown、欄位搜尋、390px 無水平溢出／來源返回、修改副本失效、兩個固定真實專案。console warning/error 為空。來源返回獨立九項 DOM／互動回歸也通過。

真實樣本採 R1 已固定的原始 PHP：Laravel.io 9 檔仍 2 applied／1 failed／6 blocked，after(callback) 不支援；BookStack 103 檔仍 0／1／102，nullableTimestamps 語法可識別但 DB write 不支援。兩者 final 圖都未知；失敗的 before 仍可讀、後續 blocked 不補畫。此次不增加相容性或跳過失敗。

輸出 artifacts/r7-browser.json、r7-workspace.png、r7-workspace-narrow.png、source-return-browser.json；artifacts 是本機驗收輸出，不進 Git。兩次開發中 browser 失敗均在拖曳 harness：指定改名前不存在的 articles，再以 off-canvas 座標拖曳；改為真實 posts 並先重設 view 後通過，未因此改 core／golden。

## 限制與停止點

未執行真人可用性、下載互動／落盤、大型 browser 效能、PHP／DB runtime 或新部署／release。快照切換可重設布局，不保證永久位置；來源返回在既有 view 仍可恢復。A-04／A-05 等相鄰 draft 未實作，不增加 history DTO、timeline、任意時點比較、持久化或 URL state。
