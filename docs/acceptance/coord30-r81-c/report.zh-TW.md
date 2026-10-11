# COORD-20261011-30：R8.1 短批 C／副本修改失效

2026-10-11（Asia/Taipei）。**本次唯一檢查組通過；R8.1 整版仍待驗。** 固定產品SHA `f9b42c8c220841d40978db48969feaba8c52dc43`，沿28隔離checkout，前後Git status空；先前03／28A／29B報告分支與成果保留。本報告分支從main基準 `2b8030a7d19963980190ba860888f243883b6d7b` 建立，只加本目錄，不混入產品。

核准來源為COORD30／原R8修訂1 issue139與使用者重置前最後10分鐘的單組例外。只讀固定R8.1主流程／issue01副本真正修改失效條款，沿migration-ui-review。另依新增cloud-environment-runtime讀網路指引、完整解析非秘密policy snapshot與runtime status；connected/current，runtime policy state unknown，不把設定當網路全面可用。未改設定或權限。

## 單組 expected／actual

實際操作：新Chromium頁面載入訂單範例→分析12檔作前置→展開「管理輸入副本」→在當前多檔副本textarea追加 `// COORD30 browser copy only` 一行註解。**沒有重新分析或做其他輸入操作。**

預期：展開管理不清結果；真正改副本才使舊分析結果及閱讀工作區失效，其他檔清單仍保留，磁碟來源不變。

實際：展開後原12/12 applied、零診斷結果仍存在。編輯 `2026_10_04_000012_rename_index.php` 副本後，專案閱讀結果、reading-workspace、project-results及舊摘要DOM數皆0；畫面標1份已修改及「尚無有效結果，請分析專案」。textarea保留修改文字，檔名不變；12個輸入項與其他檔名不變，僅本檔新增修改標示。十二份磁碟commerce PHP SHA-256在本組前後全部相同；產品Git status仍空。未發現本組缺陷。

[expected/actual及磁碟hash](browser.json)、[獨立runner](browser.py)、[原始log](browser.log)、[修改前](before-edit.png)、[修改後失效](after-edit-invalidated.png)。Python Playwright1.62.0／Chromium154.0.8037.57，1440×1000、zh-TW、headless；console warning/error、pageerror及HTTP>=400皆空。實際 `python artifacts/coord30-r81-c/browser.py` exit0，只計一組任務。

沿COORD29從固定checkout啟動的5205服務；本輪檢查服務可讀該checkout package且與磁碟相同，fresh navigation 200。未重裝／build／setup／fullverify／重啟，未關未知程序。未遇本環境存取拒絕，未使用CloudBrowser／CDP或改其權限；歷史WorkCloudBrowser block保持紀錄。工具、版本、clean與命令見 [environment.json](environment.json)。

## 剩餘與停止點

短批A僅完成訂單主流程，B僅完成未編輯的單檔往返，本批C僅完成一次textarea真編輯失效。仍待驗：重新分析、還原、移除、再匯入／完整失效矩陣；診斷導航與修改定位；單檔修改返回；其餘10例；folder／UTF-8／完整路徑；390px／鍵盤／焦點細節；R7／IR回歸；固定大樣本及完整verify／必要CLI。R8.2～6完全未開始，不因本組pass標整版done。

不改產品／tests／golden／JSON／依賴／workflow，不merge／automerge／結案／deploy／release／發布環境；下載互動及落盤維持暫緩。工具無get_usage_limits，21%與reset1791732308是協調派前資料，不是本輪後量測。只完成此例外單組及保存push後立即停止，等待本地回收實際用量／是否重置，不自主延伸、購買、用重置券或改模型。

已知PR API `Post "https://api.github.com/graphql": Forbidden` 不重試、不改憑證；報告PR未建立，CI未驗。最終reportSHA／遠端分支由最終回覆提供；[manifest](manifest.json)含本輪全部證據SHA-256，不含自身，不假定程序或ignored artifacts共享。
