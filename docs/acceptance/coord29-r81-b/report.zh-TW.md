# COORD-20261011-29：R8.1 短批 B 獨立往返檢查

2026-10-11（Asia/Taipei）。**本組通過，R8.1 整版仍待驗。** 固定產品 `f9b42c8c220841d40978db48969feaba8c52dc43`；產品 checkout `/workspace/scratch/coord28-r81-product`，檢查前後 Git status 空。沿使用者「切小一點派看看」及 COORD29 的唯一往返授權，沒有擴大需求。

依賴 COORD28 短批A報告 `89f0254ceca1826c94f2f5ca6918e6ba655a152a`、COORD03報告 `c8dabc488b1db95edb65a011d033a685c25ac133` 已保留。只讀固定版 R8.1 主流程／issue01 的工具往返條款及實際工具控制項，沿既有 migration-ui-review 指引。PR145未合併及CI38112821394 success是協調前置資訊，不充當本組實測或本輪API核對。

## 本輪唯一任務與證據

載入訂單12檔並分析作前置，記下完整多檔清單、選定副本與既有分析DTO；點「工具」→「單檔練習」，不編輯單檔，直接點「返回多檔閱讀」。

預期：同頁多檔輸入及已分析結果保留。實際：單檔模式顯示返回控制项且多檔結果隱藏；返回後12檔清單、選定檔名／PHP相同，完整DTO字串相同，前後SHA-256均為 `6a291925e59dedc6913201303c60adba44368a1be2d74c02871f804a46087033`，結果保持同一DOM節點。摘要12/12 applied、0診斷，ERD5表3外鍵仍可見。沒有發現本組缺陷。

[expected/actual JSON](browser.json)、[獨立runner](browser.py)、[原始log](browser.log)；截圖：[往返前](before-project.png)、[單檔工具](single-tool.png)、[返回後](after-project.png)。完整DTO從既有DOM textContent读取，沒有下載或新增產品API。輸入保留核對12檔清單及當前副本，不把本組當作所有修改／還原路徑通過。

Python Playwright 1.62.0／Chromium154.0.8037.57，1440×1000、zh-TW、headless；當輪console warning/error=[]、pageerror=[]、HTTP>=400=[]。只有一組任務，不以斷言數增報任務數。

## 必要啟動與版本保護

沿用已安裝依賴，未重裝／build／setup／full verify。先核對固定HEAD/status；5204已有服務但無法確認來源，嘗試啟動回覆Port already in use。沒有關閉未知程序或繞過權限；從指定checkout以 `npm run dev -- --host 127.0.0.1 --port 5205 --strictPort` 啟動Vite7.3.6，實際ready與HTTP200。當轮沒有存取拒絕，未更改CloudBrowser權限／surface／CDP；歷史WorkCloudBrowser block保持原紀錄。

實際檢查命令 `python artifacts/coord29-r81-b/browser.py` exit0。產品在固定detach HEAD保持乾淨；報告分支 `docs/independent-r81-b-coord29` 從main基準 `2b8030a7d19963980190ba860888f243883b6d7b` 建立，只加本目錄，不帶未合併產品。工具／命令／clean與服務來源見 [environment.json](environment.json)，可取回證據SHA-256见 [manifest.json](manifest.json)。

## 剩餘與停止點

本批未驗：單檔編輯後返回；其餘10例；folder／UTF-8／完整路徑；診斷修改定位；副本修改／還原／移除／重新匯入失效；窄屏／鍵盤／返回焦點細節；R7／IR回歸；大樣本；完整verify與其他必要CLI。短批A僅已有訂單主流程實測，本批僅增加直接工具往返，不能宣稱R8.1 done。R8.2～6未開始。

不改產品／tests／golden／依賴／workflow，不merge／automerge／結案／部署／release／發布環境；下載互動及落盤持續暫緩。無get_usage_limits，39%／reset1791732307只是協調派前資料，本輪後用量無法讀取；遵守本次單組及30%底線的試跑授權，保存push後立即停，等本地回收，不購買／重置或改模型。

已知PR API錯誤 `Post "https://api.github.com/graphql": Forbidden` 原樣保留，本批未重試或改憑證，報告PR未建立／CI未驗。最終reportSHA與遠端push核對由最終回覆提供；manifest不含自身，不假定ignored artifacts／程序共享。
