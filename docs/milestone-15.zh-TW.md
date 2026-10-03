# Milestone 15：Schema 快照視覺化

ERD 現在可選專案初始、專案最終，以及每份 migration 套用前／後的 schema。順序來自 core，不受輸入順序、逐檔搜尋或狀態篩選影響；預設仍查看最終狀態。

## 設計與 React 教學

schema-snapshots.ts 是 web 的選項投影，只讀 ProjectAnalysis 的既有 initialSchema、finalSchema、schemaBefore、schemaAfter。它不解析 PHP、不執行 migration，也不計算新的 schema。Core 0.5.0、JSON 與 golden 契約完全不變。

SchemaSnapshots component 負責選單與可信／未知顯示，props 是父 component 提供的分析結果；state 只保存選中的選項 ID。SchemaGraph 接收 schema 與標題 props，繼續負責圖形。

每個快照都有獨立 key。React 在 key 改變時卸載舊圖並建立新圖，因此位置、拖移與縮放會重設，不把另一份 schema 的配置帶過去。這不是重新分析，也不修改 core 的快照；就像後端從已算好的結果中選擇一筆給 view。

## 可信狀態

- 已知空 schema 顯示沒有資料表，與 null（未知）分開。
- 第一份失敗檔的 schemaBefore 可查看；schemaAfter 未知不繪圖。
- 失敗之後的前／後快照均未知，不拿 lastValidSchema 補畫。
- 排序失敗時依 core 的 null 快照顯示未知；initialSchema 仍是已知的起點。
- 未完成專案的最終快照未知，但可手動選擇成功前綴中的快照，標題明確保留檔名與前／後階段。
- JSON 匯出仍匯出完整原始分析結果，與圖形選擇及搜尋無關。

## 驗證與限制

329／329 tests；新增 5 個 snapshot tests，涵蓋亂序輸入、零檔案空 schema、第一份失敗與後續未知、排序失敗、外部 initialSchema 與不修改結果。npm run typecheck、npm run build 通過。

瀏覽器確認四份外鍵範例：第三份套用後為 2 表／1 外鍵，最終為 2 表／0 外鍵；初始為已知空白。放大後切換快照回到初始縮放；失敗檔前圖可見、後圖與後續前圖無畫布。搜尋無結果仍保留全部快照選項；console 無 warn/error。

本階段是單張圖的快照選單，沒有 timeline、雙圖並排、變更色彩、配置持久化或 PHP runtime。大量 migration 會產生長選單，尚未做效能壓力測試；M14 的連線重疊與簡單布局限制仍有效。下一階段建議 M16 將既有結構 diff 接入視覺化，且不推測語意 rename。

交付狀態見 [GitHub 紀錄](github-milestones.md)。

[PR #50](https://github.com/jerryyehself/laravel-migration-visualizer/pull/50) 已合併 main（cf8f0b8）；功能 head 1a3e16b 的 CI 通過 tests、typecheck、build 與三個 demo。Issues #48/#49 與 milestone 已關閉。
