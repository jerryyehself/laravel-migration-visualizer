# COORD-20261011-33：R8.1 短批 E／移除副本失效

2026-10-11（Asia/Taipei）。**唯一移除失效檢查組通過；R8.1整版仍待驗。** 固定產品 `f9b42c8c220841d40978db48969feaba8c52dc43`，沿28隔離checkout，檢查前後Git status空。既有03及A～D報告保留，D報告 `aa3f212eaf99bffa19b1502cc7624c81414e5f19` 僅為已完成依賴，不代本組實測。

授權為原R8修訂1／issue139及COORD33單組派工，只读固定R8.1移除失效條款。協調提供文件snapshot `02fe846838f387a3db80fedc8a20599132151d03`／COORD32作dated背景，本批未混入產品或額外同步文件；PR145／CI成功也僅為協調前置資訊，不充當當輪互動證據。

## 本輪expected／actual

新Chromium載入訂單12檔並分析為12/12 applied、零診斷作前置；展開副本管理，按 `2026_10_04_000012_rename_index.php` 的「移除此檔」。只移除瀏覽器副本，未刪磁碟資料，未重新分析。

預期：精確移除該檔，其他11份輸入保留，舊結果／工作區失效，磁碟不變。實際：清單由12成11，等於原清單只減去指定檔；逐一唯讀選取核對剩餘11份PHP的SHA-256全部與移除前相同。舊專案閱讀結果、reading-workspace、project-results與摘要DOM数皆0，畫面為11份／未修改與「尚無有效結果，請分析專案」。十二份磁碟PHP hashes前後全部相同，沒有本組產品缺陷。選取清單只是讀取內容，不延伸為修改／診斷／重新分析測試。

[expected/actual與hash](browser.json)、[獨立runner](browser.py)、[原始log](browser.log)、[移除前](before-remove.png)、[移除後失效](after-remove-invalidated.png)。Python Playwright1.62.0／Chromium154.0.8037.57，1440×1000、zh-TW、headless；實際 `python artifacts/coord33-r81-e/browser.py` exit0，console warning/error、pageerror、HTTP>=400皆空。只計一組任務。

沿COORD29固定checkout的合法5205服務，當輪/@fs指定checkout package與磁碟一致、fresh navigation200。沒有重裝、build、setup、fullverify、長調查或重啟；未遇當輪權限拒絕，不換CloudBrowser／CDP或更改權限，歷史Work拒絕不宣稱解除。依既讀runtime技能核對policy snapshot及status，connected/current但policy state unknown，不據此外推網路全部可用。[環境／命令](environment.json)。

## 待驗與保存停點

A訂單主流程、B未編輯單檔往返、C單次真編輯失效、D還原失效、E本組移除失效已分開保存，不能合稱R8.1整版pass。仍待驗：重新匯入及完整失效矩陣、完整重新分析矩陣；其餘10例；folder／UTF-8／完整路徑；診斷／修改定位；單檔修改返回；390px／鍵盤／焦點細節；R7／IR回歸；固定大樣本及完整verify／其他必要CLI。R8.2～6未開始。

報告分支 `docs/independent-r81-e-coord33` 從main基準 `2b8030a7d19963980190ba860888f243883b6d7b` 建立，只新增本目錄。[manifest](manifest.json)列本輪證據hash、不含自身；報告SHA及push核對由最終回覆提供，不假定ignored artifacts或程序跨session共享。

不改產品／tests／golden／JSON／依賴／workflow，不merge／automerge／結案／環境發布／deploy／release；下載互動落盤持續暫緩。無get_usage_limits，92%／reset1791750426只是協調派前資料，本端無本輪後讀數，COORD32的dated數字不當即時額度。完成本組保存push後停，等待本地回收，不自行下一組／購買／重置券／模型變更。

已知PR API `Post "https://api.github.com/graphql": Forbidden` 不重試／不改憑證；本批報告PR未建立／CI未驗，保存不等於完整交付結案。
