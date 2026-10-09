# A-01：產品定位與相近工具比對

- 狀態：draft（研究結論待產品決策確認；本報告不是開發需求）
- 日期／修訂：2026-10-09／1
- 方法：搜尋並閱讀官方 README／文件；未安裝實測、未做性能或完整解析相容性比較。
- LMV 基準：main 60eb253185cbeb662a660345d76274f7857082c4；產品／web 1.0.0、core 0.14.0。
- 相關 issue／功能 PR：無。文件 PR：docs/research-proposals 分支的保存 PR。

## 要解決的問題

確認「新人接手、migration review、教學」是否導向不同開發路線，以及互動 ERD 是否足以構成產品差異。這是三種使用任務，同一位使用者可切換，不必拆成三個產品。

| 任務 | 核心問題 | 開發影響 |
|---|---|---|
| 接手專案 | 有哪些表、怎麼連、結構從哪裡來？ | 相容性、搜尋、關係導覽、來源追查 |
| 變更理解 | 本次 migration 改了什麼、前後差在哪？ | operations／diff／來源串接與明確未知狀態 |
| 教學 | Blueprint 如何變成結構、為何被拒絕？ | 小範例、診斷解釋、快速修改比較 |

## 官方來源核對

下列能力是官方文件的描述，不是本研究的實測保證。未記載之能力不推定不存在；網站／README 可能更新，后續採用前應重查相關部分。

| 工具 | 已核實描述與來源 | 對 LMV 的分析 |
|---|---|---|
| erdFlow Laravel | [README](https://github.com/erdFlow/erdflow/blob/main/packages/laravel/README.md)：解析 migrations 表／欄位，以 models 補關係；本地 server、互動 ERD、watch 更新。 | 無 DB、local-first、ERD 已有相近產品；差異需落在逐步變更與可信度。其 replay 失敗契約本次未核實。 |
| Laravel ERD VS Code | [README](https://github.com/jaggerjack61/LaravelERD)：靜態 pattern-based 解析 migrations／models、搜尋聚焦、布局保存、來源跳轉與新增 migration；動態程式可能漏偵測。 | IDE 工作流降低使用摩擦；LMV 要驗證獨立瀏覽器入口的價值。未核實其 unknown snapshot 契約。 |
| Laravel Truss | [README](https://github.com/albertoarena/laravel-truss)：讀 live DB 結構，ERD、結構 diff、聚焦、匯出與結構檢查。 | 若要回答「DB 實際長什麼樣」，introspection 直接；LMV 適合尚未建立環境、歷史與未執行變更，需標示推導來源。 |
| Beyond Code ER Diagram Generator | [README](https://github.com/beyondcode/laravel-er-diagram-generator)：依 model 關係，透過 Artisan／Graphviz 產圖。 | Eloquent relation 與 DB foreign key 是不同證據，若未來整合，DTO 不可混淆。 |
| Laravel Migration Guard | [README](https://github.com/malikad778/Laravel-migration-guard)：PHP AST 分析 up() 危險操作模式；Console／JSON／GitHub Annotation reporter。 | 安全規則 service 與 schema replay 有不同責任，不能把 complete 當部署安全。未實測其規則精確度。 |
| Atlas migration lint | [官方文件](https://atlasgo.io/versioned/lint)：本地／PR CI 檢查破壞性、相容性與鎖表等，使用 dev database 模擬；文件標示目前 lint 為 Pro。 | 部署安全需要額外環境與證據，範圍遠超目前 LMV DTO；本報告不建議直接承諾此能力。 |
| dbdiagram | [介紹](https://docs.dbdiagram.io/)與[Version History](https://docs.dbdiagram.io/version-history/)：DBML ERD、導覽協作；圖表版本可預覽還原。 | 圖表編輯歷史不同於 migration replay；LMV 應凸顯每步與 PHP 的來源關聯。 |

## 候選方案與取捨

1. 通用原始碼 ERD：易理解，但已有相近產品，容易追逐布局／編輯功能。
2. Migration 歷史理解工作台：延續 core operations、可信快照與 diff，仍需真實專案可用性證據。
3. 部署安全工具：價值明確，但需 DB 方言、環境與部署資訊、規則和誤報管理。
4. 教學專用：可用小樣本快速驗收，但會偏向課程，未解決真實專案阻礙。

## 選定方向（研究建議）

同時支援「看懂專案結構」與「看懂單次 migration 變更」，由同一分析 service、不同查詢視圖支援。教學支援這兩種任務。使用者已同意雙目標；具體 R1～R6 工作仍未核准。

候選差異：從 migration 原始碼理解結構如何演化，並交代每步可信／未知與來源。這是定位假設，不是已證實市場優勢。結構與變更雙向導覽是候選功能。

## 範圍、排除與驗收

範圍：作為 R1～R6 決策參考；每次提案核准前記錄引用報告與取捨。不要求全面對標競品。
排除：性能排名、完整功能不存在的斷言、部署安全承諾、models／AI／SQL／timeline 的自動納入。
驗收：有官方來源、研究日期、方法限制與推論；開發提案可說明如何參考此報告。

## 使用者確認與交付紀錄

2026-10-09 使用者要求搜尋相近產品／套件、形成報告並在後續決策參考；同意雙目標。報告分析與候選功能未逐項核准。
本次只保存文件，未安裝競品、未實作、未建立功能 issue／PR。
