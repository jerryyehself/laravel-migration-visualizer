# R8：結構與 migration 變化閱讀修正

- 狀態：in_progress（僅 R8.1）；milestone #43／issues #139～144 已建立，整批未完成
- 日期／修訂：2026-10-11（Asia/Taipei）／1
- 核准來源：使用者在 A-06 修訂 2 審查與優先序後明確要求「提出詳細修改步驟 建立milestone 跟issue 告訴實作session如何做修正」
- 核准範圍：A-06 已列的變更摘要、主流程收斂、同名物件相關步驟、連續查看；本文件具體化其必要 UI／驗收契約。不是整份 A-06 或全部早期候選功能核准
- 負責端：研究 session 保存規格與交接；雲端開發 session 實作、測試、GitHub 交付
- 實作起點：遠端 main `2b8030a7d19963980190ba860888f243883b6d7b`；開工必須重新核對，不是永久最新 SHA
- 依賴：[R7](R7-workspace-reading.zh-TW.md) done；[A-06 修訂 2](A-06-design-goal-audit.zh-TW.md) 的問題與來源
- 文件分支：`docs/r8-reading-corrections`
- GitHub milestone／issues／文件 PR／功能 PR：尚未建立，研究端正常 `gh api` 唯讀請求回傳 Forbidden，當前網路未允許 api.github.com。完整建立內容見 [工作項目包](R8-work-items/README.md)

## 問題、候選方案與取捨

現在已能逐份查看可信快照，但主摘要仍偏向 operation／change kind，整段相關步驟須自行串接。11 個範例、完整副本編輯器、匯出及重複表格也佔據主流程。

| 方案 | 取捨 | 本次選擇 |
|---|---|---|
| 只改文字／收合面板 | 範圍小，仍不能直接回答跨步、跨表與屬性變化 | 不足以單獨解決問題 |
| 用既有 DTO 組織閱讀，保留 A 工作區 | 解決具體任務，純 web 改動；必須嚴格區分語法／結構／未知及 literal 名稱 | 採用，拆為 R8.1～R8.6 |
| 完整 history identity／動畫／Semantic Zoom | 新增物件身分與互動責任，超出這次取捨與需求證據 | 維持排除／候選 |

本次不重選 A／B、不重問 R7 或 R1～R6 核准。R8 僅覆蓋下列新規格；A-04／A-05／A-06 的其他構想仍 draft。

## 修改後的主要畫面與流程

```text
Laravel Migration Visualizer：看結構、讀變更、追查來源
[匯入 PHP／資料夾] [範例 ▼] [分析] [管理輸入副本] [工具 ▼]
輸入 12 份 · 未修改／有修改；修改後分析需重做
分析完成／未完成 · 已套用數 · 首要問題與查看完整診斷

目前第 8／12 份 price_change · 靜態已套用
[初始] [最終] [前一份] [下一份] [套用前] [套用後] [比較]
┌────────────────┬───────────────────────────────┬────────────────────┐
│ migration 清單 │ 本次變更（在 ERD 前）           │ products.price     │
│ 檔名／狀態搜尋 │ products.price                 │ 結構明細           │
│ 原始順序       │ decimal(8,2) → decimal(10,2)   │ 相關變更           │
│                │ nullable false → true         │ PHP 來源           │
│                │ default 未指定 → 0            │ 返回保留查看位置   │
│                │ 表／欄位／索引／外鍵分組        │                    │
│                │ ERD 與側別明確的搜尋／工具       │                    │
└────────────────┴───────────────────────────────┴────────────────────┘
[進階分析：完整診斷、表格表示、原始 DTO、JSON 匯出]
```

畫面精確尺寸由開發端在此範圍內決定。三區資訊架構保留，窄畫面按同樣任務順序排列；前後圖上下或並排依實際可用寬度選擇，不能以縮成不可讀換取並排。比較模式的一份變更摘要只顯示一次，在兩圖之前。

主要路徑是匯入→分析→選 migration／表→讀變更→看來源→返回。未分析時只顯示匯入摘要與必要操作，編輯器按「管理輸入副本」才展開。分析後預設收合輸入管理，結果直接成為主閱讀區；展開／收合本身不失效分析，真正改輸入才清除舊結果。

### 主流程與次入口契約

- 保留檔案／資料夾匯入、UTF-8、完整路徑、檔名排序及匯入取代語意；初次可保留既有三檔示範，清楚標示是示範，載入範例不自動執行分析。
- 11 個既有範例整合為單一「範例」入口，全部仍可選；標示示範／失敗案例，不刪 fixtures 或 parser 支援。
- 檔名／PHP、移除與還原保留在輸入管理；診斷「修改此檔」會展開正確輸入檔並聚焦行。磁碟原檔不變，副本失效規則延續。
- 首頁以使用任務說明；技術 DTO 管線放使用說明。靜態 up()、不執行 PHP／不連 DB 的界線持續可見。
- 單檔練習移到「工具」；保持既有空白 schema 與單檔能力，不新增單檔 ERD。工具切換須保留同頁記憶體中的多檔輸入與結果，返回不必重新匯入；重新整理仍清除，沒有持久化或背景分析。
- 初始／最終入口保留；分析後依既有契約預設 final，未完成時明確顯示 final 未知。選 migration 即看到本次變更摘要，從邊界第一次進入仍可預設 after，之後沿用側別。
- 上方保留完整／未完成、已套用數、首要診斷與可讀範圍。首要診斷依 DTO 的 ordering，否則第一份 failed 的 analysis／replay；不自行新增原因判定。全診斷可展開且可定位；blocked 與其他獨立診斷不可丟失。

## R8.2：跨表與屬性變更摘要

純 web adapter 讀 `MigrationSnapshot.diff` 的 `SchemaChange`，不呼叫 replay 或新增 core diff。

1. 依 owning table 分組，每組列欄位／索引／外鍵，保留 core 的每筆結構差異。表新增／移除列出表的已知內容，標為整表新增／移除的內容，不製造額外 core change records。
2. `columnChanged` 以其 before／after 比較欄位屬性；只列真的變動。顯示型別、nullable、unsigned、自增／主鍵、長度、precision／scale、允許值、default、useCurrent／useCurrentOnUpdate、comment。索引列種類及有序欄位；FK 列有序本表欄位、引用表／欄位與 actions。
3. optional 欄位用 own-property 判斷，未指定與 explicit null、false、0 分開。default(null) 顯示明確 NULL；缺省顯示未指定，不推論 DB 預設值。值比較保留陣列順序與原型特殊名稱安全。
4. 欄位／索引／FK 新增只讀 after，移除只讀 before；changed 可查看兩側。導航不能跳到不存在的側別；未知和不存在各有理由。
5. 同檔跨表 FK 顯示 owning table 與引用名稱，點名稱導航到該側真實存在的表。引用表沒有結構 diff 也可作關係上下文，但不能把它算成被修改的表；不新增多跳 FK／業務影響推論。
6. 語法操作另列「此檔識別的 PHP 操作」；renameColumn／renameTable 可標明 from→to，結構保持 removed／added；同檔 drop 後同名 add 的操作與淨結構差異分開。不能猜 change 與哪筆操作一對一。
7. 來源按鈕標為「查看涉及此名稱的 PHP 操作」或具體已識別操作，使用既有 R4 索引／source；來源未知／歧義禁用並說明。
8. diff=[] 明示已知且無結構差異；diff=null 明示無法確認，不顯示零變化。failed／blocked 的語法操作不得畫成生效的結構。

## R8.3：縱深閱讀，限定名稱查詢

右側「相關變更」輸入是 `{ table, column? }`，顯示完整名稱及「名稱相關步驟，不追蹤物件身分」。從表、欄位明細及搜尋結果進入；可直接輸入精確表／欄位名，讓已刪除或 final 未知的名稱也可查。查詢失配有提示；不存在當前快照不清掉查詢。

按完整 `result.migrations` 順序投影相關列，每列保存 migration 原始 index／filename／status、before／after 已知性、相關結構差異、涉及的操作及 source。只過濾這份視圖，不改完整 migration 清單、順序導航或匯出。

- 表查詢：選 owning table 的結構差異及語法的明確涉及名稱；FK 的明確引用可另列「關係上下文」，與該表自身修改分開。
- 欄位查詢：`column*` 精確匹配；整表新增／移除時查其 after／before 是否含此欄位；index／FK 只依 DTO 中明確有序欄位及 referenced 名稱查詢，標示是索引／關係上下文。
- 無精確欄位資訊的整表 create／drop／rename 語法可列「表級操作上下文」，不能斷言該欄位被修改。沿用 `operationObjects` 的已知查詢能力，不在 React 解析 PHP。
- 不相關步驟不列；相關列可列 noop 並明示沒有淨結構差異，因為有語法操作不等於有結構變化。
- failed／blocked 若有相關語法仍列，標為未套用且 diff 未知；「沒有相關證據」不等於未來沒有變化，尤其未知區段要保留專案失敗界線。
- 改名只依明確 operation 顯示 from→to。原查詢不自動切名稱；使用者點新名稱才啟動另一 literal 查詢。同名重建仍只表示名稱再度出現，不能串成穩定身分。
- 「查看此步比較」只在 before／after／diff 皆已知時進比較；failed 可「查看套用前」，blocked 可「查看此步診斷／語法」。選列保留查詢名稱，側別依按鈕明示，不偷偷跳過未知步驟。
- 「查看 PHP」只預覽來源，不暗中換目前閱讀步驟；返回恢復表／欄位、步驟、側別、查詢、view 與焦點。
- 已知零檔、排序未開始、first failed before 空白、特殊名稱、跨表同名欄位都有獨立空／未知提示。沒有 core History DTO 或公開 JSON 變更。

## R8.4：連續查看與搜尋狀態

由工作區父層保存閱讀 step／side、literal 表／欄位、搜尋文字／搜尋側別、GraphView 與來源返回上下文。不要依重新 mount 子圖作為正常導航的 state 清除機制。

- 前／下一份依完整 core 順序，包含 failed／blocked；端點禁用。列表篩選不改當前 step，篩選外提示延續。
- 換步驟／側別保留整個 `{table,column?}`；物件不存在顯示不存在，快照 null 顯示未知；不降級為其他表／欄位、不追 rename。
- 同一次分析使用一致的名稱→畫面座標。可取所有已知快照的名稱與最大視覺高度建立純幾何 layout；只共用座標／view，不把不同 schema 的欄位／FK 合成資料。不按未知快照補表。
- 依 literal 名稱保留手動位置，缺表座標可保留至本次分析結束。這是視覺定位，不宣稱同名重建是同物件。初次與「重設 ERD」針對當前可見結構合理定位，避免把未出現表的空位當作實際內容。
- 順序閱讀保持 pan／zoom／位置；目前目標已離開視野則提供明確「定位目前物件」，不自動把未知／缺表置中。使用者點搜尋結果時可明確定位該側已知表。
- 搜尋控制放工作區工具區，保留表／欄位搜尋。比較時明確選擇搜尋 before 或 after；結果標示側別、完整表／欄位名。只查該側，不聯集 schema，不隱藏 ERD 表與線。兩圖共用縮放／平移控制，資料各自獨立。
- 搜尋無匹配、已知空白、未知側不可查有可見提示；換側保留文字、重算結果，舊結果不可導航。
- 新分析結果、真實輸入修改、重新匯入清掉舊閱讀／來源／view。只展開管理或讀來源不清掉結果；同頁記憶體以外不保存。

## R8.5：表明細、來源與進階分析

右側以「結構明細／相關變更／PHP 來源」清楚分區，可用區域內頁籤或同等可發現入口；主變更摘要與專案未知狀態不藏在這些次入口。

- 結構明細先列當前側／兩側的欄位、索引與 FK，再讓使用者開操作來源。欄位屬性以中文用途標籤顯示，可保留 PHP／原欄位名稱輔助核對，explicit 值規則同 R8.2。
- 全分析來源清單只呈現一次，獨立標示為完整分析順序，包含後續步驟不等於當前時點已發生；比較兩側不各複製同一份全歷史清單。
- 操作原始碼預覽只讀，不替代結構 DTO；關閉後依既有 `restoreSourceFocus` 展開來源祖先 details 並恢復焦點，失效目標有提示。
- JSON 匯出、完整 DTO、完整 schema 表格與全診斷集中於可發現的進階入口；保留表格替代表示與鍵盤可達性。下載契約不變、final 未知仍禁用；不宣稱新增 PHP 或 ERD 匯出。
- 目前正在讀某份歷史步驟時，不在工作區下方預設攤另一份 final／prefix 全表格。進階表格須標明時點，final／lastValid 與當下側別分清。

## 修改批次、檔案、前置條件與停止點

先按 [工作項目包](R8-work-items/README.md) 核對／建立一個 milestone 與六張 issues。R8.* 是規格批次 ID，GitHub number 待 API 實際回傳，不指定一定是 M43。

| 批次／狀態 | 前置條件 | 詳細修改與交付物 | 預計 web 邊界 | 驗證／停止點 |
|---|---|---|---|---|
| R8.1 in_progress | 最新 main／R7 done；本文件及工作項目可取得 | 依草圖調整入口／結果順序、收合輸入管理、11 範例整合、工具入口及同頁返回；診斷編輯能展開正確檔 | main、ProjectWorkbench、ProjectResults、ProjectExports、style | 匯入與副本失效／還原、工具返回、鍵盤／窄屏；不刪既有功能、不改分析器 |
| R8.2 approved | R8.1 工作區容納摘要；確認 SchemaChange 既有欄位 | 純 DTO 顯示 adapter、每表分組、屬性前→後、index／FK 與來源導航；摘要在 ERD 前 | migration-reading、MigrationReading、WorkspaceDetails；可新增 web 純 adapter | commerce 價格、跨表 FK、false／0／null／缺省、rename 與 drop/add、failed；不改 core／JSON |
| R8.3 approved | R8.2 摘要與相關物件導航可用 | literal 名稱相關步驟視圖、刪除名稱查詢、實際差異與語法上下文、跳步與來源 | operation-sources、WorkspaceDetails、ProjectResults；可新增 web 相關變更 adapter／component | nickname 新增移除、tableAdded/Removed 含欄位、同名重建、failed／blocked、特殊名稱；不做 history identity |
| R8.4 approved | R8.3 查詢／導航邊界已明確 | 將閱讀／查詢／GraphView 提升到適當父層，保留欄位與視野，搜尋側別與共享工具；未知側不補畫 | SchemaSnapshots、SchemaGraph、SchemaComparison、comparison-layout、ProjectResults | step／side／filter、未知／缺欄、幾何布局不混資料、來源返回；不持久化／自動播放 |
| R8.5 approved | R8.2～4 state／查詢／來源能一致返回 | 明細優先、全歷史來源只列一次、進階分析與表格／JSON 重整，移除主流程重複展示 | TableDetails、OperationSources、WorkspaceDetails、ProjectResults、ProjectExports | current vs future 來源、兩側明細、collapsed return、未知 final 禁用、可達表格；不測下載落盤 |
| R8.6 approved | 前五批必要回歸完成；latest head 可驗證 | 任務驗收、截圖、問題修正、手冊／里程碑與提案狀態、功能 PR／CI／merge 證據 | 必要 web 測試、開發端驗收工具與交付文件 | repo 要求 verify／browser、下面任務矩陣；完成前不標 done，不新增 release／部署設定 |

預計檔案是邊界，不要求為符合表而修改全部檔案。必要回歸由開發端寫在 web，服務已回傳 DTO，畫面只做查詢／格式化；不得在 React 自行 parse／replay 或變更 core、golden、公開 JSON、依賴、workflow。

每批開工更新 in_progress 並寫輸入 SHA／實際檔案／核准來源；結束寫執行檢查、限制、commit／issue／PR。可按可審查範圍拆功能 PR，不能 parallel 修改共用 state 造成不同步。milestone 在全部必要批次 merge 並驗收之前保持 open。

## 具體整合驗收

| 任務 | 必須讀出的內容／完成的操作 |
|---|---|
| 主流程 | 匯入或選示範→分析；不用先編輯 PHP 即可看到結構／變更入口。輸入管理收合，示範／匯出／工具仍可發現；回單檔工具不丟多檔副本／結果 |
| 屬性變更 | commerce price 8,2→10,2、nullable false→true、default 未指定→0；不用開原始 JSON 即可回答，來源返回保留欄位／step／side／view |
| 橫向 | foreign-keys 第三份 users.id→user_key、posts.user_id→author_id、舊 FK 移除／新 FK 指向 users.user_key。語法 rename 與實際結構差異分開，不推測部署影響 |
| 縱深 | 查 users.nickname，直接列第二份新增、第三份移除及來源／狀態，跳該步不需遍歷其他檔；移除後保持欄位名稱與不存在提示 |
| 同名重建 | display_name 的明確 rename、後續 drop/add 與淨 diff 分別展示，不把結構 changed 或同名字串當作穩定身分 |
| 整表增刪 | table-lifecycle 的名稱查詢及其欄位隨整表增刪：只讀各側自己的表；deleted／renamed 不默默換名；整表內容不是額外 core diff records |
| 未完成 | R6 固定 Laravel.io 仍 2/1/6，BookStack 仍 0/1/102。failed before 可讀／after未知，blocked語法未套用、final未知；本批不改善相容性或跳檔 |
| 連續與搜尋 | 放大／移表／選欄位後前下一份，state 保持；未知側提示、切回已知不丟 query。比較搜尋指定側別，各側 own schema，不拿另一側補表／欄 |
| 可達與回歸 | 單擊／拖移／Enter／Space／焦點、來源祖先 details 收合返回、來源歧義、空／無匹配、390px 代表窄屏、桌面截圖，console warning/error 紀錄 |
| 輸入失效 | 改檔名／PHP／移除／還原／匯入新檔清掉舊分析與來源；只切工具、折疊管理、讀來源或篩選不改分析 DTO |

開發端執行 repo 要求的 `npm run verify`，記錄實際 tests／typecheck／build／demos，670 是歷史基準不是必須湊的數字。UI 用實際 browser 任務與截圖，保留首輪失敗與修正紀錄；不以 source rendering test 假裝互動驗收。未執行真人試用時只宣稱任務走查／browser 回歸，不寫「已證明直觀」或虛構改善比例。

## 排除與交付邊界

完整 object identity、跨 rename 自動追蹤、Timeline／動畫／Semantic Zoom、新 parser／API／相容性、跳過失敗、DB／PHP／SQL runtime、AI／migration 生成、Git／DB 分支、持久化／URL state、帳號／費用、排程、下載互動／落盤、新依賴、workflow／新部署／release 都不在本批。

main push 會觸發既有 Pages，開發端合併前依其 session 的既有授權核對；本研究端只保存文件分支，不修改 workflow 或執行部署。文件保存／合併不代表功能已交付，R7 done 不回退。

## 確認、issue／PR 與實作交接

使用者本次直接要求建立工作項目並交代修正，核准上述已有建議的修正方向與必要具體化；狀態 approved。這不是研究端寫程式的授權；也不核准排除項目。

研究端交付本文件、六張 issue 全文、milestone 全文與 [接手入口](R8-work-items/README.md)、提案索引／決策／CLOUD_HANDOFF。只做文件與連結／差異檢查。GitHub API Forbidden，真實工作項目未建立，無編號可報；由具備 API 權限的實作 session 先查重再建立並回填實際 URLs，無需重問這次建立／修正授權。

COORD-20261011-04 只派 R8.1，R8.2～6 不開工；milestone #43 保持 open，停止於分支／PR，不合併 main。研究端 API 限制是歷史，開發端本輪查重與建立成功，真實 URLs／依賴見工作項目包。
