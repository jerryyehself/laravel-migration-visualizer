# R8.6：開發端整合任務自測與交付準備

COORD-20261011-20 按既有人類核准派工，只接 issue #144／milestone #43 的整合準備。原核准來源為 R8 修訂1@5eec41476ef22b85d3165d3be3f681f1a20c8f9d 的使用者詳細修正指令與完整版協調流程；不是協調端代核准。規劃835cb1e544520ff7b69ea1c20f03bf0ccf8fe66b只唯讀參考，沒有合併進產品base。

- 固定輸入及本輪實際 verify／browser 基準：9010b873cd2bfbf5647406c41935a8dfa718a5f0，clean=true。
- 程式最後改動：ce16e471573cbf0762ad13293f715eefb61b28f7。本輪沒有發現需修改產品的缺陷，沒有新產品修正 SHA，也沒有空產品 commit。
- 新分支：feat/r8-6-integration-preparation；stacked base feat/r8-5-details-and-tools。main唯讀仍2b8030a7d19963980190ba860888f243883b6d7b，#145～149 fixed heads 沒有更動。
- 本輪只交自測／教學／證據／PR準備。#144 in_progress／ready for review但OPEN；整R8與milestone43保持OPEN／未done，尚未獨立驗收或合併。

## 實際整合任務

這份報告是開發端任務走查，不是獨立驗收或真人可用性研究。每項在真Chromium操作，將實際讀到的摘要、原index、語法／結構差異、來源、hash與閱讀上下文保存於[integration.json](acceptance/r8-6-evidence/integration.json)；不是只列腳本名稱。JSON裡的expected和observed分開，completedAt代表十項腳本完成，不代表整批R8完成。

| R8原矩陣 | 真實結果與可讀證據 |
|---|---|
| 主流程 | 11示範單入口；project三檔不用先改PHP即可分析／選nickname。管理收合不丟結果；工具往返原PHP bytes SHA256、檔名清單、step／table／view與返回焦點一致。 |
| 屬性變更 | commerce第7份products.price：decimal(8,2)→decimal(10,2)、nullable false→true、default未指定→0；advanced未開也能讀。來源返回保欄位／step／side／view／focus，保存完整summary文字與desktop-price.png。 |
| 橫向 | foreign-keys第3份同檔users.id→user_key、posts.user_id→author_id；舊posts_user_id_foreign移除，新posts_author_fk引用users.user_key，ordered欄位與actions在summary。Before引用id／After引用user_key導向正確側；語法renameColumn另列，沒有猜DB影響／身份。desktop-foreign-keys.png。 |
| 縱深 | users.nickname僅原index1、2（第2新增／第3移除），列狀態與PHP來源。預覽第三份不換原第二份閱讀；返回focus／view一致，跳第三份compare仍保已刪nickname及不存在提示。desktop-related.png。 |
| 同名重建 | display_name的明確renameColumn、後续dropColumn/addColumn與淨columnChanged各自可讀；不把同名或netdiff當穩定身份。保存相關列與當步netSummary。 |
| 整表增刪 | table-lifecycle的tableAdded／tableRemoved展開known內容，說明不是額外corechange；users.id查詢不接members drop，另明確查members.id。final已知空白仍是known schema graph，與R6未知final無圖分開。 |
| 未完成 | 上游固定PHP hashes全部MATCH：Laravel.io9份（2applied／1failed／6blocked）、BookStack103份（0／1／102）。failed Before可讀，After未知、blocked兩側未知、final未知無圖；prefix另標，final匯出禁用。記錄upstreamcommit、112個PHPhash核對總數、狀態計數及實際failed/blocked文字。 |
| 連續與搜尋 | 放大／ArrowRight移表後前後份保literal欄、query、位置與view；compare Before缺display_name／After可查，兩側共享view不補欄。全來源一份且第3份標未來來源，filter不改時點；query／zoom後完整DTO文字SHA256一致，進階表格Before／After標側。 |
| 可達與回歸 | 桌面與390px，Space／方向鍵／真pointer拖移，來源祖先收合返回仍展開並聚焦；把原來源按鈕隱藏後，invalidorigin通知可見且聚焦。narrow-reading.png，無水平溢出。來源歧義／未知行另由本輪重跑R8.5真DOMpreview回歸，沒有拿SSR代browser。 |
| 輸入失效 | filename、PHP、remove、restore、import五種真修改，各自重建前置閱讀／来源後確認舊workspace、source preview、advanced全部移除。只切工具／管理折疊／filter不使DTO失效由前述任務及前批回歸確認。 |

## 驗證基準與第一次失敗

本輪在固定輸入9010b873cd2bfbf5647406c41935a8dfa718a5f0的clean checkout執行npm run verify：713 tests（540core／173web）、typecheck、build及12built-package demos，15命令全exit0。[verification.json](acceptance/r8-6-evidence/verification.json)保存實際commit、Node24.19.0、時間與clean=true。測試數未增加；沒有鏡像測試湊量。

真Chromium重新執行十項整合矩陣，另重跑90項／組前批必要回歸：R8.5 13、R8.4 14、R8.3 12、R8.2 12、R8.1 14、R7 16、IR source-return 9。console warning/error/pageerror全空；十項與90組可能覆蓋相同操作，不宣稱100個彼此獨立案例。前批回歸補充optional NULL/false/0/未指定、有序陣列、unknown search復原、未知來源位置／歧義、nested/detached/hidden origin、原樣本、診斷編輯／UTF8／folder／11範例等既有邊界。沒有沿用上一輪report當本輪執行證據。

首輪十項整合走到第十項還原時，腳本使用「還原此檔副本」的不存在locator而timeout；畫面實際按鈕是「還原此檔至載入版本」。保存原始[first-browser-failure.txt](acceptance/r8-6-evidence/first-browser-failure.txt)及[first-run-integration.json](acceptance/r8-6-evidence/first-run-integration.json)的九項部分結果，未把該次當十項通過。只改runner locator，沒有產品修正或放寬失效斷言，再全跑十項通過。沒有額外捏造產品缺陷。

可重現腳本：[scripts/verify-r8-integration.py](../scripts/verify-r8-integration.py)。從repo根執行，需已有Chromium／Python Playwright、Vite `--host 127.0.0.1 --port 5202 --strictPort --force`與原R1固定輸入（artifacts/research-inputs；上游provenance在docs/research/r1-samples.json）。輸入不存在或hash不符會失敗，不改checksum。報告自身讀實際HEAD/clean狀態；手冊證據的基準是上述固定輸入，不是之後文件head。

## 後端類比與保留契約

core如domain service，ProjectAnalysis仍是回應DTO；ProjectResults是持有閱讀狀態的controller，component是rendering unit，props傳各側DTO與callback，state只保存literal／query／view／來源返回。本輪runner像透過實際畫面執行端到端service使用任務：讀summary並驗證互動前後context，不在browser重播migration或建立identity。

failed快照不是空schema，lastValidSchema只是成功前綴；tablelifecycle的known-empty另有明確UI。來源是literal名稱的語法證據，不能當change的一對一因果；shared幾何只是presentation定位，不聯集columns/FK/schema。比對程式最後SHA到本輪文件head，產品程式／core／parser／replay／公開JSON／golden／依賴／workflow均不變。本輪只新增runner、整合文件及可攜證據。

## 依賴交付與外部閘門

[dependency-status.json](acceptance/r8-6-evidence/dependency-status.json)保存本輪直接GitHub唯讀查證時間、各PR產品／證據／文件head／base／current-head CI。下面current-head CI已直接核對對應SHA；不能據此說獨立驗收通過。

| 批次／PR | 程式最後改動 | 證據commit | 固定文件head | current-head CI |
|---|---|---|---|---|
| [R8.1 #145](https://github.com/jerryyehself/laravel-migration-visualizer/pull/145) OPEN／未合併 | d849b4e8a0ea79e65b8d459a975476b57fe75538 | 560166f04ee7c3c0b5520f10c41c05574375f5ec | f9b42c8c220841d40978db48969feaba8c52dc43 | [38112821394](https://github.com/jerryyehself/laravel-migration-visualizer/actions/runs/38112821394) success |
| [R8.2 #146](https://github.com/jerryyehself/laravel-migration-visualizer/pull/146) OPEN／未合併 | 444fc9c99f7acf99f2824730ee32c0ca3e56b08d | 591cfe89e21dcf650e71b1b5f97902af8bbe78fe | 3e8ee581eee16a80940c7490b491001dc2bd25eb | [38113844022](https://github.com/jerryyehself/laravel-migration-visualizer/actions/runs/38113844022) success |
| [R8.3 #147](https://github.com/jerryyehself/laravel-migration-visualizer/pull/147) OPEN／未合併 | 763f71d5089e45781e34ba30e55028916b065a15 | 1c78a1ac703c11b805daf1971f90d7ae28f7d0ca | 8ed11ea960c7e0a046b72e3c78011c4cb744896b | [38114646468](https://github.com/jerryyehself/laravel-migration-visualizer/actions/runs/38114646468) success |
| [R8.4 #148](https://github.com/jerryyehself/laravel-migration-visualizer/pull/148) OPEN／未合併 | c32b52260b6057b2b0f49d223e1c9f68b397f7c8 | 7a35251bef5b00b3ffdf82b10b17570f60adf0b4 | 2dd3a9a348df5225f4cbf157d3c76ff5ef539622 | [38115514765](https://github.com/jerryyehself/laravel-migration-visualizer/actions/runs/38115514765) success |
| [R8.5 #149](https://github.com/jerryyehself/laravel-migration-visualizer/pull/149) OPEN／未合併 | ce16e471573cbf0762ad13293f715eefb61b28f7 | 59f6de87c65df65f65820dc6979fb43d9d99e780 | 9010b873cd2bfbf5647406c41935a8dfa718a5f0 | [38116547615](https://github.com/jerryyehself/laravel-migration-visualizer/actions/runs/38116547615) success |

獨立驗收隊列COORD03／06／10／13／16／19與未來本R8.6仍pending；offline是協調派工回報的驗收環境阻礙，本開發端沒有代驗收端执行或宣告恢复。CI、開發端自測與協調直接核對不替代獨立報告／必要複驗。全部PR／issues／milestone保持未完成，沒有改舊fixed heads。

剩餘門檻是協調回收各固定版本獨立報告、必要缺陷修正／複驗、依授權安排依賴整合與全部必要merge、再核對交付證據；完整R8.6 done由後續派工決定。本輪不越過合併門檻，不autoMerge、不部署／release，不做下載互動或落盤、真人試用或大型效能保證，不新增相容性／identity／持久化／動畫／runtime或其他draft。

[manifest.json](acceptance/r8-6-evidence/manifest.json)列16份JSON／真browser截圖／首次失敗原文的SHA256；截圖已實際檢視。文件／PR head與本輪CI於真正建立後補登，僅文件head變更不當新產品SHA。

可審查stacked PR：[R8.6整合準備 #150](https://github.com/jerryyehself/laravel-migration-visualizer/pull/150)，base feat/r8-5-details-and-tools，head feat/r8-6-integration-preparation；runner／教學／證據commit ff1d8a5b973a4df8c58b3931ff7d229e53a57202。最後產品改動ce16e471573cbf0762ad13293f715eefb61b28f7、本輪實際verify9010b873cd2bfbf5647406c41935a8dfa718a5f0與後續文件head分開。current headCI按GitHub當前結果補登；獨立驗收pending，不合併／automerge／標done。
