# COORD-20261011-31：R8.1 短批 D／還原副本失效

2026-10-11（Asia/Taipei）。**唯一還原失效檢查組通過，R8.1整版仍待驗。** 固定產品 `f9b42c8c220841d40978db48969feaba8c52dc43`，沿28隔離checkout，檢查前後Git status空；既有03及A／B／C報告保留。沿原R8修訂1／issue139與COORD31單組派工，只核對固定R8.1還原失效條款，不混新版或報告SHA。

## 本輪獨立expected／actual

新Chromium頁面載入訂單12檔，展開管理，對當前副本 `2026_10_04_000012_rename_index.php` 加一行 `// COORD31 analyzable browser copy`；分析此修改狀態成功為12/12 applied、零診斷，作還原失效前置。重新展開管理，按「還原此檔至載入版本」，不做還原後分析或其他操作。

預期：原PHP恢復、已分析的舊結果與workspace失效、清單保留、磁碟來源不變。實際：textarea與原PHP完全相同，原SHA-256 `7b0e782f13cfffcd603856e554a8fdb1eaa5abd58c488ad62bf93dbe603bc82e`，檔名不變；結果／project-results／reading-workspace／舊摘要DOM數皆0，畫面為未修改及「尚無有效結果，請分析專案」，還原按鈕停用。12檔清單完全保留，十二份磁碟PHP hashes前後吻合。未發現本組缺陷。

[expected/actual及hash](browser.json)、[獨立runner](browser.py)、[原始log](browser.log)、[還原前已分析副本](before-restore-analyzed-copy.png)、[還原後失效](after-restore-invalidated.png)。Python Playwright1.62.0／Chromium154.0.8037.57，1440×1000、zh-TW、headless，實際 `python artifacts/coord31-r81-d/browser.py` exit0；console warning/error、pageerror、HTTP>=400皆空。必要分析只是建立本組有效結果前置，不宣稱完整重新分析矩陣已驗。

沿合法5205固定版服務，當輪服務可讀指定checkout package且與磁碟吻合，fresh navigation200。未重裝、build、setup、fullverify或重啟；無權限拒絕，未換CloudBrowser surface／CDP或改權限，歷史Work拒絕仍保留。依既讀runtime技能核對網路snapshot及runtime status，connected/current但policy state unknown，不據此宣稱全面網路readiness。[環境及命令](environment.json)。

## 剩餘、保存與停止點

已有A訂單主流程、B未編輯單檔往返、C一次真編輯失效、D本次還原失效；不能把四組pass當整版done。仍待驗：移除／重新匯入及完整失效矩陣、完整重新分析矩陣；其他10例；folder／UTF-8／完整路徑；單檔修改返回；診斷導航／修改定位；390px／鍵盤／焦點；R7／IR回歸；固定大樣本及完整verify／其他必要CLI。R8.2～6未開始。

報告分支 `docs/independent-r81-d-coord31` 從main基準 `2b8030a7d19963980190ba860888f243883b6d7b` 建立，只新增本證據目錄；[manifest](manifest.json)列全部本輪證據hash，不含自身。沒有產品／tests／golden／依賴／workflow修改，沒有merge／automerge／結案／deploy／release／環境發布；下載落盤暫緩。程序／ignored artifacts不假定跨session共享，證據可由Git取回。

無get_usage_limits；100%與reset1791750426只是協調重置後派前資料，本輪後額度未量測，不把舊窗79%至0視為負消耗。保存push後停，等待本地回收，不自行下一組／購買／重置券／模型變更。PR API原錯誤 `Post "https://api.github.com/graphql": Forbidden` 不重試／不改憑證，報告PR未建立／CI未驗；產品PR145與CI為協調前置資料，沒有充當本組結果。最終reportSHA／push核對由最終回覆提供。
