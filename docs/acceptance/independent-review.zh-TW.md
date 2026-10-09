# Laravel Migration Visualizer：R1～R6 修訂 2 獨立驗收

日期：2026-10-09（Asia/Taipei）。驗收端僅執行檢查與新增本報告／證據；未修改產品程式、既有測試、fixtures、golden、依賴宣告或 lockfile。

## 結論

**核心與兩種標準使用任務通過；返回焦點的邊界案例失敗，交回實作端修正後需定點複驗。** 本輪重新執行 `npm run verify`，660 tests、typecheck、build、12 demos／15 步均通過；另有 15 項真實 Chromium 互動檢查通過、1 項額外焦點案例失敗。Console 有 favicon 404，不能宣稱零 errors。另有兩項文件一致性問題。

未發現 finalSchema 被成功前綴替代、未知快照被補畫、rename 被推測為物件身分或第三方 PHP 被改寫。此結論只涵蓋下列實測，不宣稱完整 Laravel／資料庫相容或所有瀏覽器可用。

## 實際基準、環境與保護

| 項目 | 本輪觀察 |
|---|---|
| Checkout | `/workspace/laravel-migration-visualizer`；原分支 `work` |
| 指定交付基準／實際驗收 commit | `2fe510870c4d41d7c24459173d7e32f2f625968c` |
| Remote | `origin=https://github.com/jerryyehself/laravel-migration-visualizer.git` |
| 遠端 main | `git ls-remote origin refs/heads/main` 回傳同一完整 SHA；本地 `origin/main` 的祖先檢查通過。未發現交付後差異；未 pull、reset 或覆寫 checkout。 |
| 既有工作 | 開始時 `git status --short --branch` 為 `## work`，無未提交／未追蹤工作；無需搬移使用者變更。 |
| 文件分支 | `docs/independent-review-r1-r6`，由實際驗收 commit 建立，未直接 push main、未合併。 |
| Runtime | Linux 6.18.44 x86_64；Node v24.19.0、npm 11.9.0；產品／web 1.0.0、core 0.15.0 |
| 瀏覽器 | 預裝 Python Playwright 操作 `/usr/bin/chromium`，Chromium 151.0.7922.173、headless、1440×1000、zh-TW；未安裝／改動專案依賴。 |
| Server | 前一輪本 session 啟動的 Vite 7.3.6，port 5202、`--strictPort --force`。本輪 core／BookStack 畫面一致，沒有因舊程式而重啟或掩蓋首次產品失敗。 |
| 範圍 | R1～R6 修訂 2 實際已交付範圍；R3.3 FK 鄰居導覽依既有證據跳過，不算已實作。 |

已核對 AGENTS、DECISIONS、CLOUD_HANDOFF、提案入口與六份提案、R6 整合紀錄、使用手冊；按需使用 migration-handoff、migration-ui-review、migration-core-review 技能。既有 `docs/research/r*-browser.json` 與 CI 記錄只作契約／歷史參考，沒有充當本輪實測結果。

## 獨立 CLI 與來源驗證

在 repo 根目錄重新執行：

```sh
npm run verify
node scripts/research-baseline.mjs artifacts/independent-review/inputs
```

`verify` 本輪於 2026-10-09 17:17:35（Asia/Taipei）開始，原命令 exit code 0；38 個測試檔、660 tests 通過，沒有 failed 或 skipped tests。報告包含此次 HEAD、clean=true 及全部 15 commands 的 exitCode=0：[verification.json](evidence/verification.json)。12 個 demos 為 project、tables、helpers、changes、laravel、index-rename、current-update、drop-columns、drop-constrained-id、morphs、acceptance、nullable-timestamps。

以 R1 manifest 中的固定 repository／commit／path 從 GitHub raw 重新取得 118 檔，使用 TLS 正常驗證，逐一驗證既有 SHA-256 後才使用；未修改原始 bytes 或預期 hash。包括 112 migrations、composer.json／lock 與授權檔；**未取得或解析 SQL dump，未執行 PHP／Composer／DB**。取檔使用本輪外部 helper，因既有 `gh api` 路徑被拒絕；沒有修改 repo 取檔腳本或憑證。

| 固定樣本 | PHP 數／版本 | 本輪 applied／failed／blocked | 首個阻斷與可信結果 |
|---|---|---|---|
| Laravel.io `d056c6493dd7bf905e471f2ad6fe716c35642ae4` | 9；Laravel lock v11.55.0 | 2／1／6 | 第三檔 `2024_09_27_095949_add_hero_image_additional_columns_to_articles.php:15` 的 dynamic after(callback) 拒絕。before 保留 job_batches／jobs，after／diff=null；最後可信前綴僅兩表，finalSchema=null。 |
| BookStack `ff661b59f6f605bf768fe850c0d0a8a2dc09d203` | 103；Laravel lock v12.69.3 | 0／1／102 | 第一檔 `2014_10_12_000000_create_users_table.php:22` nullableTimestamps 已識別為 created_at／updated_at，兩者 nullable timestamp、precision=0、共用來源第 22 行。唯一首檔分析診斷為第 26 行 DB write，UNSUPPORTED_STATEMENT；before 是已知空白，after／diff／finalSchema=null。 |

既有 research-baseline 的每份來源 hash 與 failed／blocked null assertions 均完成。瀏覽器匯入完整 9／103 份原始 PHP，並另外讀取畫面提供的 ProjectAnalysis JSON，核對狀態數、首個 failed 的 before 與全部後續 null；不是只核對摘要文字。CLI 保留 `database/migrations/` 路徑，檔案匯入顯示 basename，兩者來源與排序對應。

來源證據：[118 份校驗記錄](evidence/source-hashes.json)、[本輪樣本摘要](evidence/sample-summary.json)。上游來源與 MIT 通知沿用 [R1 manifest](../research/r1-samples.json)、[Laravel.io license](../research/licenses/laravelio/LICENSE.md)、[BookStack license](../research/licenses/bookstack/LICENSE)；截圖中的 PHP 只作這些固定樣本的驗收證據。

## 真實瀏覽器實測

使用 Playwright 的實際檔案匯入、click、Enter、輸入、select 與 DOM 焦點檢查；有完整 Chromium 程序及渲染，沒有以靜態 React 呈現測試替代互動。以下 ID 對應 [本輪 browser-results.json](evidence/browser-results.json)。

| ID | 驗收項目與實際步驟 | 結果 |
|---|---|---|
| L01 | Laravel.io 完整匯入；最終圖未知、最終匯出控制項停用；完整 DTO 為 2／1／6，final=null，lastValid 兩表。 | 通過 |
| L02 | 選 after-1 → 搜尋 jobs → 表明細 → 搜尋 `  RESERVED_AT  ` → Enter 選 jobs.reserved_at；nullable integer、unsigned 與無 FK 正確；焦點到選取欄位，兩張表仍在圖中。 | 通過 |
| L03 | 清搜尋保留欄位選取；同一欄位重複選取重新聚焦；無匹配時圖形仍完整。 | 通過 |
| L04 | **完整結構任務**：jobs.reserved_at 明細 → 來源 → 第二份 create_jobs 摘要 → 返回；PHP highlight 第 19 行為原始 unsignedInteger 語句，來源面板取得焦點；來源導航清結果篩選，選對 migration；返回保持 after-1／jobs／reserved_at，焦點回原來源按鈕。 | 通過 |
| L05 | **完整單次變更任務**：第二份 create_jobs 的 9 operations → 第 19 行 PHP → 返回操作按鈕 → 真實 tableAdded diff → After 欄位明細。Before 不存在 jobs.reserved_at 且按鈕停用；After 明細正常。 | 通過 |
| L06 | 摘要的表明細跳轉聚焦 inspector；手動切 before-1 清搜尋、欄位及表選取，不保留不存在物件。 | 通過 |
| L07 | 首個 failed Before 已知／After 未知、未知 diff 明文，不稱無變更；before-2 圖有两表，after-2 不畫圖；有語法操作的 blocked 第八檔兩側未知，全部物件按鈕停用，PHP 來源標未套用。 | 通過 |
| L08 | 狀態 blocked 篩選剩 6 檔，完整快照不變；檔名無匹配不保留舊摘要；清篩選恢復真實 migration。 | 通過 |
| L09 | 來源面板開啟後只改瀏覽器內 PHP 副本；整個分析、摘要、來源與匯出控制項立即消失，磁碟原始样本未改。 | 通過 |
| B01 | BookStack 完整 103 檔；helper 兩筆 timestamp 語法可讀、來源第 22 行；DB write 第 26 行仍拒絕；before-0 是已知空白，after／final 未知，不畫 users、不提供未知圖欄位搜尋；下一檔 blocked 兩側明細停用。 | 通過（可信度及變更閱讀）；users.email 結構探索因沒有可信 after 而不可完成，屬已知限制。 |
| S01 | 內建成功第二檔：renameColumn users.name→display_name 操作與 columnRemoved／columnAdded 分開；旧欄位只有 Before、新欄位只有 After。PHP 第 6 行往返保留舊欄位及焦點；真實比較圖兩側搜尋各自資料，不複製另一側。 | 通過 |
| S02 | 快照切換、重新聚焦表清舊來源及欄位選取。 | 通過 |
| S03 | 內建失敗樣本再次確認 failed 前綴及後續 blocked snapshots／diff=null，final 不冒充 lastValid。 | 通過 |
| S04 | 內建生命週期的 users→members 表 rename，明列 tableRemoved／tableAdded；旧表只有 Before、新表只有 After；移除 articles 只能回 Before。 | 通過 |
| S05 | 額外使用**記憶體驗收輸入** `Schema::dropIfExists('not_present')`：已套用、known empty before／after／final、diff.changes=[]，比較顯示零變更；與兩個樣本的未知 null 分開。未新增或修改產品 fixture。 | 通過 |
| E01 | 從欄位明細開 PHP 來源，先收合原表明細，再返回；焦點及選取可見性，見下方缺陷 IR-01。 | **失敗；兩個全新 Chromium 程序一致重現** |
| C01 | Browser console／pageerror：15 項任務有 1 筆資源 error；獨立 fresh page 核對為 favicon.ico HTTP 404。未捕捉到 JS pageerror 或 warning。 | **失敗（零 console errors 條件）**；低嚴重程度 IR-02。 |

BookStack 的兩種目標受到相容性界線影響：可以完成語法操作→來源→未知 diff／停用側別的變更閱讀，不能完成「已生效 users.email 結構探索」或真實 Before／After users 明細。沒有把另一成功樣本冒充 BookStack 任務成功。

代表畫面：[Laravel.io 第 19 行來源](evidence/laravelio-source.png)、[BookStack helper 語法未套用](evidence/bookstack-syntax.png)、[rename 後側自己的明細](evidence/rename-after-details.png)。本工作區另有 `artifacts/independent-review/browser-trace.zip`，未當成 clone 後一定存在的證據；上列 JSON／截圖隨文件分支保存。

## 首次結果與複測說明

首次自製 browser harness 有 6 項檢查未完成、9 項通過，詳見 [首次原始紀錄](evidence/browser-first-run.json)。原因是 helper 用 inner_text 讀取收合 JSON 得到空字串（影響 L01、B01、S03、S05）、錯用 `.step-details` 而實際為 `.step-detail`（L04），以及選第 4 檔 blocked 時沒有已識別操作卻等待 PHP 按鈕（L07）。修正**外部驗收 helper**：讀 DOM textContent、修正定位、改查有 7 operations 的第 8 檔；不改產品、assertion 或 expected data。第二輪完整 15 項互動檢查通過。

IR-01 的第一次取證 helper 在收合後以 role locator 重新找隱藏來源按鈕逾時；改在收合前保留實際 ElementHandle，再測 visibility／focus，產品現象仍失敗，且兩次全新 browser 重現值完全相同。這些腳本定位失敗與下列產品缺陷分開記錄。favicon error 首次與複測均保留；沒有重啟 server 後便刪除首次結果，也沒有觀察到 CLI／UI 版本不一致。

## 缺陷與交回實作端的修正清單

嚴重程度：P1 為可信資料／主要流程阻断，P2 為可繞過的功能或可及性錯誤，P3 為低影響資源／文件問題。本輪沒有確認 P1。下列為本輪新發現，不代表已追溯是哪一個 commit 首次引入。

### IR-01 — P2：收合來源所在明細後，返回失去鍵盤焦點且無提示

重現：

1. 載入成功範例，分析專案，選第二檔 after-1。
2. 搜尋 display_name，以 Enter 選 users.display_name。
3. 在「操作來源 users.display_name」開啟 PHP 來源。
4. 收合「查看 users 的欄位、索引與外鍵」，原來源按鈕仍在 DOM 但隱藏。
5. 按「返回原結構選取」。

預期：保持 after-1、users.display_name，重新展開返回目標並恢復來源按鈕焦點；若目標已不可返回，應明示失效並將焦點放到可用入口。

實際：after-1 與內部選取仍在，但明細／來源按鈕保持隱藏；來源面板已移除，焦點變為 BODY，沒有失效提示。鍵盤使用者失去返回位置。未收合的標準往返通過，故不是所有來源返回都失敗。

證據：[首次](evidence/collapsed-source-return-first.json)、[第二次獨立重現](evidence/collapsed-source-return.json)、[返回後畫面](evidence/collapsed-source-return.png)。兩次均 originConnected=true、originVisible=false、originFocused=false、selectedColumnVisible=false、sourcePanelRemaining=0、returnNotice=0、focus.tag=BODY。

診斷位置：`apps/web/src/components/ProjectResults.tsx:72–75` 的 returnSource 只檢查 `isConnected`，不足以證明目標可見或可聚焦。**實作端修正**：處理收合 ancestor／失效 DOM 的返回，驗證 focus 實際恢復；可重開原明細或提供明確失效提示及可用焦點。定點複測原標準來源往返、此收合案例及快照／副本失效，勿為此改 core 或 golden。

### IR-02 — P3：favicon 缺失造成 console resource error

重現：全新 Chromium 開啟開發首頁，檢查 console；直接對 favicon.ico 發出 HTTP GET。

預期：頁面需要的 icon 請求不造成 error，驗收可明確區分真正應用例外。

實際：console `Failed to load resource: the server responded with a status of 404 (Not Found)`；location 為 `http://127.0.0.1:5202/favicon.ico`，HTTP=404，頁面 icon link 數=0。功能任務沒有因此失敗，未發現 JS pageerror。

證據：[console-diagnosis.json](evidence/console-diagnosis.json)、[互動 console 原始記錄](evidence/browser-results.json)。入口 `apps/web/index.html:2` 未宣告 icon。**實作端修正**：提供適當 favicon 或明確 icon 宣告，複測 fresh-page console；本驗收未檢查正式部署的 favicon，不推定部署環境也相同。

### IR-03 — P3：現行使用手冊仍標示過期 core 版本

重現：閱讀 `docs/user-guide.zh-TW.md:3`，與交付 commit 的 `packages/migration-core/package.json` 比較。

預期：現行 R1～R6 使用手冊的 core 版本為 0.15.0，或清楚把 0.14.0 標示為 v1.0.0 歷史交付。

實際：開頭直接寫「Core 版本 0.14.0」，與實際 core 0.15.0 及後續 R2 helper 說明不一致。

證據：指定 commit 的兩份版本化檔案；本輪 [樣本摘要](evidence/sample-summary.json) 也記錄 coreVersion=0.15.0。**實作端／文件端修正**：只校正現行手冊或標明歷史版本，不重寫歷史驗收紀錄。

### IR-04 — P3：提案中當前狀態與未標歷史的舊狀態互相矛盾

重現：閱讀各提案開頭 done 及交付證據，再讀「批次狀態與交付紀錄」。

預期：舊 approved／進行中／尚待交付文字有明確歷史時間與標示，不被當成當前派工狀態。

實際：R2:60–61 仍寫全部 approved、R2.2／R2.3 進行中；R4:61–62 寫尚待 GitHub／PR／CI／merge；R5:61–62、R6:60–61 寫未啟動任何批次、未建立 issue／PR。與同文件 done／已 merge 及提案入口矛盾。這不改變本輪按最新交付證據驗收的基準，但會干擾後續接手。

證據：指定 commit 的 `docs/proposals/R2-compatibility.zh-TW.md`、`R4-source-navigation.zh-TW.md`、`R5-change-reading.zh-TW.md`、`R6-acceptance.zh-TW.md` 對應行與 [提案入口](../proposals/README.md)。**文件端修正**：將旧狀態移入／標為歷史，保留核准與交付記錄，統一當前 done；不把文件修正當新功能核准。

## 已知限制與未驗收

| 項目 | 判定 |
|---|---|
| Laravel.io dynamic after(callback)、dump 中既有 schema 未輸入 | 已知相容性／輸入限制；首個失敗是正確拒絕，未列新缺陷。 |
| BookStack DB write 未執行，users／兩筆 timestamps 只是未套用語法 | 已知限制；兩個完整專案 final 未知是正確結果，未列新缺陷。 |
| 直接 FK 鄰居導覽 R3.3、跨 rename identity、任意版本比較 | 未交付／不在範圍；未驗收，不提出擴增要求。 |
| 下載互動／落盤 | **未驗收**，使用者持續暫緩；只查 unknown-final 按鈕停用／修改後控制項卸載，未觸發下載。 |
| 全手機／瀏覽器矩陣、非 headless 桌面、完整鍵盤巡覽及所有縮放／拖移組合 | **未驗收**；本輪有指定 Enter 與返回焦點、真實比較兩側搜尋，不能外推全站可及性。 |
| 大型 UI 性能、DB runtime／SQL dump、完整 Laravel 語意、安全部署、持久化 | **未驗收／範圍外**，没有以测试数推定支持。 |
| 正式網站／release 附件／新版發布／排程 | **未驗收**；本輪沒有部署、發布、下載驗收或建立排程。 |

## 文件交付與後續

本報告及有限 JSON／截圖證據只在獨立 `docs/independent-review-r1-r6` 分支保存；第三方完整 source、本輪自製 helper、完整 log／trace 留在 ignored artifacts 或 /tmp，未加入產品測試／fixture。證據的 SHA-256 清單見 [evidence-sha256.json](evidence/evidence-sha256.json)。

Git read 可用，但 `gh api repos/jerryyehself/laravel-migration-visualizer --jq '.permissions'` 在一般與核准的 sandbox 外執行均回傳 `Forbidden`；文件分支已成功推送至 origin；實際執行 `gh pr create --base main --head docs/independent-review-r1-r6`，GitHub GraphQL POST 也回傳 `Forbidden`，所以文件 PR 未建立。不能把 Git 可讀／可推等同 API／PR 可寫。驗收端保留文件 commit／patch；不自行合併或修改網路設定／要求新憑證。

交回實作端的優先順序：先修 IR-01 並複驗收合／正常來源返回與失效；再處理 IR-02 的 fresh-page console；文件端校正 IR-03／IR-04。其餘已知相容性界線不應為讓樣本 complete 而放寬。修正完成後以新的實際 commit 定點複验，保留本輪失敗證據；本報告不授權驗收端實作。
