# 第一版使用手冊

Laravel Migration Visualizer 1.0.0 是瀏覽器中的靜態分析工作台。它讀取 migration 的 up()，用支援的 Schema／Blueprint 操作推導 schema 與變化，不執行 PHP、資料庫或 SQL。Core 版本 0.14.0；完整支援邊界見 source/docs/compatibility.zh-TW.md（repo 內為 docs/compatibility.zh-TW.md）。

## 安裝與開啟

需要 Node.js 22.12+ 與 npm；安裝依賴需 npm registry。從 repo 根目錄執行；若使用交付包，先進入 source/。

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5202 --strictPort
```

開啟終端顯示的 http://127.0.0.1:5202/。若 port 已被使用，選其他 port，不要關掉未知服務。驗證用 `npm run verify`；建置預覽用 `npm run build` 後執行 `npm run preview -- --host 127.0.0.1 --port 5202 --strictPort`。不要直接以 file:// 開啟 dist/index.html；預覽伺服器須持續運作。

## 第一次分析

1. 在多檔專案模式按「載入訂單系統範例（12 檔）」再按「分析專案」。應為 12/12 份已套用、零診斷、最終 ERD 五表三外鍵。
2. 分析自己的專案時選取 UTF-8 .php 檔，或支援資料夾選取的瀏覽器中選 database/migrations。匯入會取代清單，資料夾包含子目錄，非 PHP 會列為略過。沒有檔案上傳到伺服器。
3. 檔名為 YYYY_MM_DD_HHMMSS_description.php。Core 依 basename 字串排序，來源相對路徑保留；格式錯誤或重複名稱會阻止 replay，匯入順序不影響分析順序。不是日期有效性檢查。
4. 從結果清單選檔，看 Schema Before／After、AtomicOperation 與 SchemaDiff。搜尋和狀態篩選只影響逐檔列表，完整 JSON 不會被篩掉。
5. 選 ERD 最終、初始或逐檔前／後／比較快照。聚焦表可看欄位、索引與外鍵；方向鍵移動表，按鈕縮放，拖曳空白平移。比較兩圖同步畫面位置，各自保有真實 schema。

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

選已知 ERD 快照後，在「搜尋目前快照欄位」輸入部分欄位名，不分大小寫。點 table.column 結果或用 Tab／Enter 選取，會聚焦表並展開該欄位明細。清查詢保留目前選取；切换快照會清查詢與選取。未知快照無查找入口；比較兩側各查自己的資料，不補另一側缺表／欄位。搜尋只改畫面，不改 schema／匯出。教學與驗證限制見 milestone-36.zh-TW.md。

## 結構來源往返（R4）

在已選資料表／欄位明細的操作來源清單點「查看 PHP 來源」，逐檔結果會選對應 migration，唯讀面板顯示 core 來源行。按「返回原結構選取」回到原來源按鈕及快照；換快照、聚焦其他表、重設或修改副本會清舊來源。未生效的 failed／blocked 與靜態 applied 有不同標示；同名重建不被合併成物件身分。

## 單次變更閱讀（R5）

選擇逐檔分析結果，先看狀態與快照已知性，再讀診斷、操作及 PHP、結構 diff、涉及物件。Before／After 明細按鈕只開各側存在的表／欄位；「此側不存在」不同於「快照未知」。rename 操作顯示 from→to，結構差異仍是移除與新增。

明細跳轉會重設該圖位置；來源返回保留原快照與選取。完整快照、diff、operations 保留在展開區。副本修改後舊結果立即失效。教學：[R5](r5-migration-reading.zh-TW.md)。
