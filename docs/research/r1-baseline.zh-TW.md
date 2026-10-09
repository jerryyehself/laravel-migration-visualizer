# R1：真實專案基準與下一批範圍

2026-10-09；核准 R1～R6 修訂 2 的依據：PR #119／main `bdd64bc4695cba875d75bcf811cb1969aa166b69`。雲端開發執行，milestone 35／issue #120。產品 1.0.0、core 0.14.0；本批不改 core 或 UI。

## R1.1：來源與輸入界線

| 樣本 | 固定 commit | composer 要求／lock 實際版本 | 輸入與缺口 |
|---|---|---|---|
| [Laravel.io](https://github.com/laravelio/laravel.io/tree/d056c6493dd7bf905e471f2ad6fe716c35642ae4) | d056c6493dd7bf905e471f2ad6fe716c35642ae4 | ^11.5／v11.55.0 | database/migrations 下 9 PHP；database/schema/mysql-schema.sql 存在，未解析。PHP 集合不足以重建 dump 中的既有表。 |
| [BookStack](https://github.com/BookStackApp/BookStack/tree/ff661b59f6f605bf768fe850c0d0a8a2dc09d203) | ff661b59f6f605bf768fe850c0d0a8a2dc09d203 | ^v12.26.4／v12.69.3 | database/migrations 下 103 PHP；該固定 tree 無 database/schema 檔案，不推定無其他安裝或 runtime 條件。 |

兩個完整 Git tree 均未截斷。MIT 原文核對於固定 commit 的 LICENSE.md／LICENSE，通知保存在 licenses/；允許研究與在保留通知下散布。這批只保存 metadata／雜湊／分析結果，不收錄 PHP 或 schema SQL。不把 GitHub license 標籤當成唯一授權證據。

[r1-samples.json](r1-samples.json) 固定路徑、commit、版本、原始檔 SHA-256。118 檔包含 112 個 migrations、兩個 composer.json、兩個 composer.lock 及兩份 license。源碼暫存與 browser 截圖在 ignored artifacts/；不提交第三方完整 source 或登入資訊。

## R1.2：雲端實測

| 樣本 | applied／failed／blocked | 首個阻斷 | 最後可信前綴 |
|---|---|---|---|
| Laravel.io | 2／1／6 | 2024_09_27_095949_add_hero_image_additional_columns_to_articles.php:15，after 接受 callback，靜態 scalar 驗證拒絕 | job_batches、jobs；finalSchema=null |
| BookStack | 0／1／102 | 2014_10_12_000000_create_users_table.php:22 nullableTimestamps 被通用欄位規則拒絕；:26 DB::table(...)->insert 資料寫入仍不支援 | 已知空白初始 schema；finalSchema=null |

使用 empty initialSchema、原始未修改 PHP、core 排序。不忽略失敗、不匯入 SQL、不执行 PHP／DB。每個 blocked 檔仍有語法分析，但不表示已套用。完整逐檔診斷、operations、前綴 diff 見 [r1-baseline.json](r1-baseline.json)。首個 failed 保留 before；after/diff=null；後續 before/after/diff 全未知，由腳本 assertion 核對。

單次 core 觀察：Laravel.io 49ms、BookStack 263ms，Node v24.19.0／Linux；這是當次結果，不是性能承諾。重取全部固定 sources 的 SHA-256 通過，再跑分析的結果與保存證據一致（忽略時間觀察欄位）。

重現需要 Node>=22.12、npm ci、已登入且能讀公開 repos 的 gh；不需 PHP／Composer／DB：

```sh
npm run build -w @lmv/migration-core
node scripts/fetch-research-samples.mjs artifacts/research-inputs
node scripts/research-baseline.mjs artifacts/research-inputs > artifacts/r1-reproduced.json
```

取檔 CLI 做 IO 與來源校驗；分析 CLI 像 controller 將檔名／字串交給 domain service，core 本身仍不讀檔。SHA 不符即失敗，不拿改寫過的樣本當基準。UI 匯入單檔集合顯示 basename；CLI 保留 database/migrations 路徑，兩者檔名排序結果一致。

## R1.3：使用任務與實際結果

以 Chromium headless／CDP 在本次 Vite 5202 實際匯入全部原始 PHP，未測下載；console warning/error 均為零。機器紀錄見 [r1-browser.json](r1-browser.json)。

| 任務 | 來源推導的預期答案 | 瀏覽器實際結果／限制 |
|---|---|---|
| Laravel.io 查找 jobs.reserved_at 與直接 FK | 第二檔 after 的 reserved_at 是 unsigned integer、nullable；jobs 沒有明確 FK | 選第二檔 after→搜尋 jobs→聚焦→展開明細，找到欄位與「沒有外鍵」。只能先知道表名，沒有全欄位查找入口。 |
| Laravel.io 解釋第二檔變更 | createTable、7 addColumn、1 addIndex，共 9 operations；before 只有 job_batches，after 加 jobs；diff 1 tableAdded | 選第二檔結構比較，顯示真實兩側及 1 結構變化；PHP 第 19 行是 reserved_at 來源。操作與 PHP 從保存源碼／core source 核對；這次沒有驗證從欄位直接跳 PHP，現有 UI 無統一入口。 |
| BookStack 查找 users.email／直接關係 | PHP :18 字串 name、:19 email unique；但整檔含不支援語句，不能說 users 已生效，也不能由命名猜 FK | 最終未知；第一檔 before 可看已知空白，after 未知，不補畫 users。此任務因分析阻斷不可完成，未替換成另一個成功樣本。 |
| BookStack 解釋首檔變更 | 可讀語法操作與兩個拒絕，但無可信 after／diff | 摘要 0/103、before 空白／after 未知符合契約。不能把無可用 diff 說成無變更；來源行號由保存診斷核對。 |

截圖：artifacts/r1-laravelio-details.png、artifacts/r1-bookstack-unknown.png（本次工作區證據，不保證隨 clone 搬移）。切回 Laravel.io final 後 ERD 消失、明確顯示未知。未測手機、下載、完整瀏覽器矩陣或大圖性能。

## 下一批的有限建議

參考 A-01 的兩個目標，以可信結果先於可畫圖：

1. R2 先定稿單項 nullableTimestamps 靜態 helper 契約，核對固定 Laravel 12 Blueprint；保留 DB::table insert 拒絕。即使 helper 成功，BookStack 此檔仍 failed；不得宣稱完整樣本改善為 complete。callback after／column after 與 dump 輸入不順手加入。
2. R3.1／R3.2 只補当前已知快照的欄位名稱搜尋、帶表名結果、選取欄位明細。trim／大小寫不敏感 literal substring，空查詢提示、無匹配、未知不可搜索，切換快照重設；不改 schema 或 exports。
3. R3.3 本批可用前綴沒有 FK，BookStack 無可用 after，不足以證明直接鄰居任務需求；條件未滿足，先不實作，記錄原因後可用新證據再評估。
4. R4/R5 的來源往返需各自契約；目前的行號證據支持整合入口方向，但不能當成已實作。R2～R6 仍 approved 且未交付。

R1 三批實作／研究證據已完成；提案 done、issue 關閉與 milestone 關閉須待此交付 PR 最新 HEAD CI 通過並合併。R3 測試草稿保存於 feat/r3-column-search commit 205bb79，未混入本批。

## 本次驗證

雲端 npm run verify 全部 14 步通過：612 tests、typecheck、build、11 built-package demos；固定來源下載／SHA、分析重現、改動來源拒絕亦通過。瀏覽器兩樣本驗收與限制如上。新 CLI 未納入離線 verify，避免 CI 依賴外部第三方網路；按上述明確命令另外執行。
