# COORD-20261011-34：R8.1 短批 F／重新匯入失效

2026-10-11（Asia/Taipei）。**唯一重新匯入失效檢查組通過，R8.1整版仍待驗。** 固定產品 `f9b42c8c220841d40978db48969feaba8c52dc43`，沿28隔離checkout，檢查前後Git status空。原03及A～E報告均保留，E報告 `037730f8a21aca60ea9bdb3d4995d2ab96f65186` 為依賴，未代本組實測。沿COORD34／原R8修訂1 issue139核准，文件snapshot02fe846／COORD32只為dated背景。

## 唯一流程與expected／actual

先按固定R8.1／issue01「取代清單」及既有匯入入口核對契約，並讀程式 replaceFiles(await readMigrationFiles(chosen))，沒有自行假定append。新Chromium載入訂單12檔，分析為12/12 applied、零診斷作前置；透過既有「匯入 PHP 檔案（取代目前清單）」入口**一次**選取兩份原commerce fixtures：`2026_10_04_000001_create_users.php`、`2026_10_04_000002_create_products.php`。檔案均可嚴格解碼為UTF-8。

預期：輸入替換為選取兩檔及其原內容，舊結果／workspace失效，需重新分析。實際：輸入為「匯入輸入 · 2份 · 未修改」，清單精確為兩個選取basename，沒有附加原12檔。唯讀選取兩份副本，檔名與textarea文字逐一與原始UTF-8 bytes解碼內容相同，browser和disk SHA-256一致。舊專案閱讀結果、reading-workspace、project-results及摘要DOM數皆0，畫面要求「尚無有效結果，請分析專案」。來源磁碟bytes未變，未發現本組缺陷。**匯入後未分析。**

[expected/actual與來源hash](browser.json)、[獨立runner](browser.py)、[原始log](browser.log)、[匯入前](before-reimport.png)、[匯入後失效](after-reimport-invalidated.png)。Python Playwright1.62.0／Chromium154.0.8037.57，1440×1000、zh-TW、headless，實際 `python artifacts/coord34-r81-f/browser.py` exit0；console warning/error、pageerror、HTTP>=400皆空。正常UTF-8兩小檔只是本組必要前置，不宣稱完整UTF-8／invalidUTF8／完整路徑／folder驗收。

沿固定checkout的合法5205服務，當輪/@fs指定package與磁碟一致、fresh navigation200。未重裝、build、setup、fullverify、全runner、長調查或重啟；未遇當輪存取拒絕，不換CloudBrowser／CDP或改權限，歷史Work block不宣稱解除。依既讀runtime技能核對網路snapshot及status，connected/current但policy state unknown，不據此外推網路ready。[環境及命令](environment.json)。

## 剩餘與保存停點

A訂單主流程、B未編輯單檔往返、C單次真編輯、D還原、E移除、F本次重新匯入失效已分組保存，**不是R8.1整版驗收通過**。仍待：完整重新分析／失效矩陣及其他輸入情境；其餘10例；folder／UTF-8錯誤及完整路徑；診斷／修改定位；單檔修改返回；390px／鍵盤／焦點細節；R7／IR回歸；固定大樣本與完整verify／其他必要CLI。R8.2～6未開始。

報告分支 `docs/independent-r81-f-coord34` 從main基準 `2b8030a7d19963980190ba860888f243883b6d7b` 起建，只新增本證據目錄。[manifest](manifest.json)列全部本輪證據hash，不含自身，不假定程序或ignored artifacts共享；最終reportSHA／遠端push核對由最終回覆提供。

不改產品／tests／golden／JSON／依賴／workflow，不merge／automerge／結案／環境發布／deploy／release；下載互動落盤持續暫緩。無get_usage_limits，87%／reset1791750426只是協調派前提供值，本端未量測本輪後額度。保存push後立即停，等待本地回收，不自主下一組／購買／重置券／模型變更。

已知PR API `Post "https://api.github.com/graphql": Forbidden` 不重試／改憑證；報告PR未建立／CI未驗，產品PR145／CI為協調前置資訊，不代本組獨立結果。
