# A-04：現行介面盤點與顯示整理候選

- 狀態：draft
- 核對基準：2026-10-09（UTC），遠端 main `2fe510870c4d41d7c24459173d7e32f2f625968c`
- 修訂：1
- 負責端：研究與決策交接；實作由雲端開發 session 負責
- 依賴：[A-01 定位報告](A-01-positioning-report.zh-TW.md)、已交付 R3～R6
- 功能 issue／PR：未建立；不是 R7 核准或開工指令
- 文件分支：`docs/a02-discovery-evidence`；文件 PR 尚未建立

## 問題與核對方法

使用者提出「先優化專案顯示」，詢問介面是否有很多不適合一般使用者的 UI。本次唯讀核對最新 main、實際 components、CSS 與交付文件。工作分支的 `apps/web/src` 與該 main 無差異。

未啟動專案、執行測試／建置或操作線上工作台。README 的既有 `erd-preview.jpg` 僅作歷史局部畫面參考，不能當作本輪完整畫面驗證。本報告是程式結構與設計原則審查，未量測操作時間、錯誤率或真人需求強度。

## 現行能力與具體觀察

| 位置／原始碼 | 已交付介面 | 判斷與候選處理 |
|---|---|---|
| `apps/web/src/main.tsx:15` | 首頁直接顯示 `PHP → AtomicOperation → SchemaState → SchemaDiff` | 內部處理流程，適合移到技術說明；首頁改說使用者能完成的任務 |
| `components/ProjectWorkbench.tsx:149` | 匯入區同列 11 個範例按鈕，包括外鍵失敗、刪表失敗、helper 失敗 | 展示／相容性案例與主要匯入競爭；保留一個範例入口，案例名稱與選擇仍可取得 |
| `components/ProjectWorkbench.tsx:192` | 輸入檔案清單、可編輯檔名、PHP textarea、還原與移除，分析後仍在結果上方 | 編輯是有效功能，但閱讀專案不必一直展開；候選為分析後收合，定位編輯時自動展開 |
| `components/ProjectResults.tsx:94` | 摘要、JSON 匯出、ERD、全域診斷、逐檔閱讀、完整 schema 表格依序堆疊 | 功能已有，主要問題是主次與重複呈現；先突出 ERD／逐檔閱讀，完整 schema 表格改成可展開的替代檢視 |
| `components/ProjectResults.tsx:136` | 逐檔完整快照／diff／operations 已置於收合區；完整 ProjectAnalysis JSON 也收合 | 不能宣稱多檔模式所有 DTO 都直接攤開；候選是統一進階區入口與名稱，不先刪契約 |
| `components/TableDetails.tsx:31`、`ProjectResults.tsx:35` | 欄位屬性用 DTO key／JSON 值或整段 JSON 呈現 | 資料有用，呈現仍偏契約；改為「允許空值」「預設值」「長度」等可讀屬性，進階區保留原值 |
| `components/SchemaComparison.tsx:20` | 名稱為「ERD 變更明細」的內容實際含逐項 JSON | 入口名稱應說清楚，或把可讀差異與原始 JSON 分開 |
| `components/SingleWorkbench.tsx:15` | 「單檔練習」結果主要是 AtomicOperation JSON／SchemaState | 教學／技術用途較明顯；保留為次要入口，是否重做單檔畫面另列範圍 |
| `components/SchemaGraph.tsx:75` | 圖前有資料表與欄位兩組搜尋及聚焦清單；比較模式兩圖各自有控制 | 屬必要探索功能，不是除錯 UI；重新布局是較大批次，不能為簡化而混合兩側快照或搜尋結果 |

上述 `components/` 路徑均相對於 `apps/web/src/`。診斷、PHP 來源、索引、外鍵與欄位 metadata 是使用任務資料，不能因技術性就全部移除。

## 外部依據與限制

- [GOV.UK Design System — Details](https://github.com/alphagov/govuk-design-system/blob/737898813f1832fbda610edd85afe228f594390b/src/components/details/index.md)：適合收合只有部分使用者需要的細節；明確要求不要隱藏多數使用者需要的資訊。本次據此把原始 JSON／進階案例與分析狀態分層，不能據此斷言任何特定 LMV 按鈕無人需要。
- [18F — Heuristic evaluation](https://github.com/18F/guides/blob/debc24b34f23686194d9fe42e391859d569bd39a/content/methods/discover/heuristic-evaluation.md)：建議顯示系統狀態、使用使用者熟悉的語言而非系統導向詞彙。本輪是單人、未操作頁面的初步盤點，不宣稱已完成文件建議的多人評估。

本環境沒有可呼叫的瀏覽搜尋／研究模型切換工具；使用現有模型唯讀取得官方原文，沒有宣稱切換模型或完成全面文獻搜尋。以上是設計指引，不是 LMV 採用或成效研究。

## 候選方案與取捨

| 方案 | 優點 | 成本／風險 |
|---|---|---|
| 只改文字、範例入口與進階資訊分層 | 範圍小，沿用 DTO 與已有功能，易審查 | 長頁面與來源往返仍可能繁瑣 |
| 上述整理加分析後收合輸入／完整表格 | 可讓分析結果更突出，減少重複展開 | 要驗證定位編輯會展開輸入、鍵盤焦點及結果失效行為 |
| 重做成固定工作區／側欄／分頁布局 | 有機會整合圖、檔案與明細 | 選取、焦點、捲動與比較布局影響較大；需具體畫面方案及新增驗收，先不綁進第一批 |

## 建議方向、範圍與排除

建議先討論第二方案作為有邊界的第一批：首頁任務文案、單一範例入口、技術資訊進階區、可讀屬性，以及分析後可展開的輸入區與完整 schema 表格。尚未核准。

像後端 service 回傳 DTO 後，由 view formatter 決定欄位標籤與文字；不改 service 的分析結論。此類比不表示新增 Laravel app service 或解析 model。新增顯示標籤不得把缺省值補成資料庫預設，不得把 false、0、null 轉成同一種空值。

本批不新增核心相容性、略過失敗、未知 final 的推測、migration 生成、動畫、持久化、Git／DB 分支、CI 整合或背景排程。不刪既有來源定位／副本修正／還原／搜尋／比較／匯出能力。JSON 匯出契約與暫緩下載互動／落盤驗收維持。

## 批次、驗收與停止點

| 批次 | 前置條件 | 範圍與交付物 | 驗證 | 停止點 |
|---|---|---|---|---|
| A-04.1 本輪盤點 | 使用者本次提問、最新 main 可讀 | 現行入口清單、設計依據、候選取捨；本文件與索引 | main SHA、source diff、文件 diff／路徑檢查 | 保存 draft；不執行專案或實作 |
| 待核准第一批（開發端） | 使用者確認具體方案、範圍與修訂 | 上述顯示整理及明確的畫面前後證據 | 原有分析／來源／搜尋流程可完成；定位編輯能展開輸入並聚焦；failed／blocked／未知 final 警示可見；屬性 false／0／null／未指定仍可分辨；必要 web tests／typecheck／build 與瀏覽器驗收由開發端執行 | 不延伸全新工作區、核心契約或部署；不重啟已暫緩的下載驗收 |

失敗原因及未知狀態不能藏在技術 JSON 裡；已知空 schema 與未知 schema 必須維持不同呈現。診斷可有摘要，但使用者仍須能讀到原因及定位來源。rename 的明確操作與結構 diff 的移除／新增仍分開。

## 使用者確認紀錄

使用者本次表示先優化專案顯示並要求核對現行 UI；這是方向與盤點授權，尚未確認本文件的具體方案。維持 draft，不建立開發 issue，也不把已完成 R1～R6 改回待開工。

## 交付與部署影響

本輪只保存文件；沒有程式實作、專案執行或測試。文件分支包含 A-02／A-03，未在 main；文件 PR 尚未建立，先前 GitHub API Forbidden 不代表已建立 PR。

現行 Pages workflow 對 main push 沒有 docs 排除，文件合併會觸發部署。既有文件合併授權不擴張本 session 的部署範圍，本次先保存分支，不合併 main。
