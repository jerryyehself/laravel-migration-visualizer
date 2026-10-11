# 第一版使用手冊

Laravel Migration Visualizer 1.0.0 是瀏覽器中的靜態分析工作台。它讀取 migration 的 up()，用支援的 Schema／Blueprint 操作推導 schema 與變化，不執行 PHP、資料庫或 SQL。目前 main 的 core 版本為 0.15.0（10/4 的 v1.0.0 release 為 0.14.0）；完整支援邊界見 source/docs/compatibility.zh-TW.md（repo 內為 docs/compatibility.zh-TW.md）。

## 安裝與開啟

需要 Node.js 22.12+ 與 npm；安裝依賴需 npm registry。從 repo 根目錄執行；若使用交付包，先進入 source/。

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5202 --strictPort
```

開啟終端顯示的 http://127.0.0.1:5202/。若 port 已被使用，選其他 port，不要關掉未知服務。驗證用 `npm run verify`；建置預覽用 `npm run build` 後執行 `npm run preview -- --host 127.0.0.1 --port 5202 --strictPort`。不要直接以 file:// 開啟 dist/index.html；預覽伺服器須持續運作。

## 第一次分析

1. 從「範例」入口選「載入訂單系統範例（12 檔）」再按「分析專案」。應為 12/12 份已套用、零診斷、最終 ERD 五表三外鍵。
2. 分析自己的專案時選取 UTF-8 .php 檔，或支援資料夾選取的瀏覽器中選 database/migrations。匯入會取代清單，資料夾包含子目錄，非 PHP 會列為略過。沒有檔案上傳到伺服器。
3. 檔名為 YYYY_MM_DD_HHMMSS_description.php。Core 依 basename 字串排序，來源相對路徑保留；格式錯誤或重複名稱會阻止 replay，匯入順序不影響分析順序。不是日期有效性檢查。
4. 從結果清單選檔，看 Schema Before／After、AtomicOperation 與 SchemaDiff。搜尋和狀態篩選只影響逐檔列表，完整 JSON 不會被篩掉。
5. 閱讀工作區保留最終／初始入口；選 migration 後，用前一份／下一份及套用前／後／比較閱讀。單擊表或 Enter／Space 選取固定明細；方向鍵移動表，按鈕縮放，拖曳空白平移。比較兩圖同步畫面位置，各自保有真實 schema。

## 遇到診斷

「專案分析未完成」表示 finalSchema 未知。最後可信 Schema 只是成功前綴，不能冒充最終結果；首個失敗檔有 before，沒有 after/diff，後續也不猜快照。最終 Schema 下載停用，完整分析 JSON 仍可保存診斷與前綴。

按「定位原始碼」看來源行，再按「到輸入區修改此檔」。修改只改瀏覽器副本，立即使舊分析／匯出失效；重新分析後才有新結果。按「還原此檔至載入版本」恢復當次載入的 source／檔名，再重新分析。工具不修改磁碟 migration，也不自動保存修改後 PHP。

## 匯出與限制

- 完整分析 JSON 包含排序、操作、快照、diff、診斷；最終 Schema JSON 只有可信的最終結構。兩者都不包含 PHP 原始碼或 ERD 位置。下載位置與提示取決於瀏覽器。
- 範例與固定 commit 的 Laravel 12 官方樣本通過，不代表任意 Laravel 專案、版本或資料庫方言皆相容。未知 API／動態 PHP 應查看診斷，不要刪掉診斷就當成功。
- 重新整理或切換工作台會失去目前輸入／結果；沒有持久化或雲端同步。先保存需要的 JSON，PHP 修改需自行保存。
- 完整快照會隨專案成長消耗記憶體。250／1000 檔 core correctness 已驗證，並非大型 browser 效能保證；先以小批次評估。
- timeline、down()、ERD 圖檔匯出、AI、SQL parser、runtime execution 與 semantic refactoring detection 不在第一版。結構 diff 將 rename 表示為移除／新增；多型 helper 不推測外鍵。

## 驗證交付包

交付包有 source/、web/、README.zh-TW.md、verification.json 與 manifest.json。manifest 記錄 commit、產品／core 版本、逐檔 SHA-256；旁邊 .sha256 可在相同資料夾用 `shasum -a 256 -c *.sha256` 檢查 archive。產品版本不表示完整 Laravel runtime 相容。

從 source/ 執行 npm ci 與 npm run verify 可重建。release:bundle 另需 Git checkout，不能在沒有 .git 的 source archive 直接執行；要重新產包請 clone repo 並 checkout manifest 中的 commit。建置包含時間與環境資訊，保證來源可追溯，沒有宣稱跨平台 archive 雜湊恆等。

## 欄位查找（R3）

選已知 ERD 快照後，在「搜尋目前快照欄位」輸入部分欄位名，不分大小寫。點 table.column 結果或用 Tab／Enter 選取，會聚焦表並展開該欄位明細。清查詢保留目前選取；換步驟／側別會清欄位查詢與欄位選取，保留明確選中的表名；沒有該表顯示不存在，未知側不補資料。未知快照無查找入口；比較兩側各查自己的資料，不補另一側缺表／欄位。搜尋只改畫面，不改 schema／匯出。教學與驗證限制見 milestone-36.zh-TW.md。

## 結構來源往返（R4）

在已選資料表／欄位明細的操作來源清單點「查看 PHP 來源」，固定明細區的唯讀面板顯示 core 來源行；即使來源在另一份 migration，也不改目前閱讀步驟／側別／表名。按「返回原結構選取」回到原來源按鈕及快照；換步驟／側別、選其他物件、重設或修改副本會清舊來源。未生效的 failed／blocked 與靜態 applied 有不同標示；同名重建不被合併成物件身分。

## 單次變更閱讀（R5）

選擇逐檔分析結果，先看狀態與快照已知性，再讀診斷、操作及 PHP、結構 diff、涉及物件。Before／After 明細按鈕只開各側存在的表／欄位；「此側不存在」不同於「快照未知」。rename 操作顯示 from→to，結構差異仍是移除與新增。

明細跳轉會重設該圖位置；來源返回保留原快照與選取。完整快照、diff、operations 保留在展開區。副本修改後舊結果立即失效。教學：[R5](r5-migration-reading.zh-TW.md)。

兩個真實專案的完整導覽任務、已知成功前綴與未支援範圍，見 [R6 驗收](r6-integration-acceptance.zh-TW.md)。

## 同一工作區順序閱讀（R7）

左側是 core 排序的清單，中間是目前步驟的圖與摘要，右側是表明細／來源；窄畫面依序排列。篩選只縮短清單，不改目前時點；前後份仍走完整順序，包括失敗／阻擋，端點停用。選中的表名是精確字串，rename 後不會自動追到新名。查看另一檔 PHP 來源仍保留圖與時點，返回會展開來源按鈕所在明細並恢復焦點。詳見 [M42 教學](milestone-42.zh-TW.md)。

## R8.1 待審查分支的入口

本分支將 11 個範例收在單一入口，載入不自動分析。「管理輸入副本」展開編輯／還原／移除；分析後自動收合並聚焦閱讀結果。只展開管理不清分析，真正修改才失效。「工具」單檔往返保留多檔副本與結果，重新整理仍清除。所有診斷與 JSON 匯出仍可從完整診斷／分析工具找到；尚未合併 main，完整狀態見 r8-1-main-flow.zh-TW.md。

## R8.4待審查分支的連續閱讀

工作區集中表／欄位搜尋；比較明確指定Before或After，保留文字並只查該側。前後份／切側保literal欄位與pan/zoom/位置，缺物件和unknown各有提示。可按「定位目前物件」或「重設ERD位置」，新分析清舊上下文。此能力仍在stacked PR等待獨立驗收，未合併發布；完整範圍／證據見[r8-4-reading-context.zh-TW.md](r8-4-reading-context.zh-TW.md)。

## R8.5 待審查分支的明細與進階入口

R8.5只交待審查stacked分支，未合併main、獨立驗收pending。右側結構明細／相關變更／PHP來源可直接鍵盤到達；全分析來源只列一次，後續來源不表示目前已套用。表格／完整DTO／全診斷與兩JSON入口集中進階，歷史頁不預設攤另一份final／prefix；未知final仍禁用最終下載，成功前綴另標。主摘要與未完成狀態保持可見。中文屬性區分NULL／false／0／未指定。詳細限制與實證見[r8-5-details-and-tools.zh-TW.md](r8-5-details-and-tools.zh-TW.md)。

## R8整合任務走查（待審查分支，尚未合併）

從範例選commerce第7份，在主摘要直接讀price的decimal(8,2)→decimal(10,2)、nullable false→true與default未指定→0；不用開原始JSON。foreign-keys第3份看users/posts改名與舊新FK，引用導航標Before／After。project例查精確users.nickname會列第2新增、第3移除，跳步仍保已刪名字；display_name的rename語法與後續同名drop/add淨差異分開。表名變了要明確查新literal，不自動追身份。

來源預覽返回保閱讀/query/view/focus；PHP只讀，真改副本須重分析。compare選搜尋側別，各側只讀ownschema。完整來源只列一次并標後續時點，進階集中DTO/表格/全診斷/JSON入口。未知final不能用成功prefix替代；Laravel.io與BookStack固定樣本仍未完成，沒有改善相容性。

上述是本分支實際任務自測，不是獨立驗收或真人試用。R8.6只準備交付，R8全批未done、PR未合併；核准来源、固定SHAs、十項observed紀錄、desktop390截圖與外部門檻見[r8-6-integration-preparation.zh-TW.md](r8-6-integration-preparation.zh-TW.md)。沒有做下載互動或落盤。
