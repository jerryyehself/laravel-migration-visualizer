# COORD-20261011-28：R8.1 獨立驗收短批 A

2026-10-11（Asia/Taipei）。**本次單一訂單範例主流程檢查組通過；R8.1 整體驗收尚未完成。** 固定產品 SHA：`f9b42c8c220841d40978db48969feaba8c52dc43`，未以報告 SHA 或最新 R8 版本替代。沒有發現本組產品缺陷。

## 授權、隔離與前置

本次授權為 COORD28 短批 A，沿原 R8 修訂 1 需求，只驗「預設收合副本編輯器下，訂單範例載入→不自動分析→直接分析→閱讀結果」。已讀指定版 AGENTS、R8 主流程契約、issue-01-main-flow、docs/r8-1-main-flow；沿本對話已讀 migration-ui-review／handoff／delivery 技能。不引用實作自測代替本輪互動。

原 COORD03 報告 `c8dabc488b1db95edb65a011d033a685c25ac133` 及其分支保留，開始時乾淨。以 local shared clone 取得 `/workspace/scratch/coord28-r81-product`，detach 指定固定產品；只讀既有 Git objects，未 pull 新版、建立 worktree 或混入文件 snapshot。產品在本組前後 git status 均空。報告另建 `docs/independent-r81-a-coord28`，由 main 基準 `2b8030a7d19963980190ba860888f243883b6d7b` 建立，只新增本證據目錄，避免把未合併 R8.1 產品帶入 docs 差異。

PR #145 OPEN／指定 head CI 38112821394 success 是協調提供的前置資訊，本批未再查 GitHub API，不當作本輪測試。COORD03 已通過及協調 snapshot `623975a5d26bf906ccb03e966cd62661e6629b09` 沿交接；沒有重跑03或取得兩個大樣本。

## 實際操作與工具

Node 22.23.3／npm 10.9.9，使用既有 `/workspace/.tools` 工具及可寫 cache；checkout 內 `npm ci` 成功安裝46套件，exit 0，lockfile 未改。Vite 7.3.6 以 `npm run dev -- --host 127.0.0.1 --port 5204 --strictPort` 啟動，未跑 build／verify／完整 runner。此為独立固定版服務，未關閉先前服務或更改環境草稿。

Python Playwright 1.62.0／`/usr/bin/chromium` 154.0.8037.57，1440×1000、zh-TW、headless。實際執行 `python artifacts/coord28-r81-a/browser.py`，exit 0；可取回 [runner](browser.py)、[完整 expected/actual](browser.json)、[log](browser.log)。服務首頁 navigation 200，沒有收到本環境存取拒絕，未變更已儲存權限、CDP 或其他 browser surface；原 Work Cloud Browser block 保留為歷史，不宣稱已解除。

## 單一主流程組 expected／actual

以下五項 assertions 都屬同一次新 browser 的**一組**訂單任務，不宣稱五個獨立任務。

| 操作 | 預期 | 本輪實際 |
|---|---|---|
| fresh page／範例入口 | 副本編輯器預設收合，示範入口集中，既有選項仍可選 | 只有一個 native details「範例」入口；11個非disabled選項可見。管理details open=false，textarea不可見；沒有閱讀結果。 |
| 選訂單12檔 | 載入取代清單，不自動分析，不必展開編輯器 | 選 value=2，畫面為「示範輸入 · 12份 · 未修改」，輸入清單12項；沒有專案閱讀結果，管理仍收合。 |
| 直接按分析 | 分析完成、管理收合、焦點合理、输入保留 | 專案分析完成，12/12套用、0診斷；activeElement為 aria-label「專案閱讀結果」、tabindex=-1 的SECTION，管理仍收合。12個檔名與選定輸入的檔名／PHP bytes相同，未開編輯器。 |
| 進入閱讀結果 | 正確最終結構與完整結果 | 實際ERD為5表／3外鍵；browser內既有完整DTO為 complete=true、12份全applied、0診斷，final tables為attachments、order_items、orders、products、users，FK總數3。僅讀DOM textContent核對，未操作下載或另外展開JSON導航。 |
| fresh console | 無warning/error、pageerror、HTTP錯誤 | console warning/error=[]、pageerror=[]、HTTP >=400=[]。 |

截圖：[載入但未分析](loaded-not-analyzed.png)、[分析完成](analysis-completed.png)、[閱讀結果](reading-result.png)。輸入保留只核對本組載入前後12檔清單、目前選定副本與結果，沒有冒稱全部編輯／還原／移除路徑通過。11選項只是可發現性／存在檢查，**其餘10例未載入或分析**。

## 未完成範圍與停止點

後批待驗：其餘10例；folder／UTF-8／完整路徑；診斷與修改定位；單檔工具往返／多檔state；副本編輯／還原／移除／重新匯入的失效規則；390px／鍵盤；R7／IR固定R8.1版回歸；完整 verify／其他必要CLI檢查。R8.2～6完全未開始。本組通過不等於R8.1或整批done。

沒有產品／測試／golden／公開JSON／依賴／workflow修改，沒有merge／automerge／issue或milestone結案／部署／release／環境發布。下載互動及落盤仍暫緩。沒有取得或執行兩個固定上游大樣本，沒有延伸新案例。

工具無 get_usage_limits，無法讀本輪後5h剩餘／reset；56%與reset1791732307僅為協調派前輸入，不是本端當輪量測。遵守單組預算邊界，完成證據保存與commit／push即停，等待本地回收再派，不自行下一組或更換模型／購買／使用重置券。

證據 [manifest](manifest.json) 列本輪JSON、runner、log及截圖的SHA-256，不含manifest自身。[environment.json](environment.json) 保存精確產品、clean、實際命令與工具；未假定程序或ignored artifacts共享。先前建立報告PR的錯誤 `Post "https://api.github.com/graphql": Forbidden` 保留；依本次指示**不重試API、不改權限**，本批報告PR未建立，CI未查。最終reportSHA／遠端branch由最終回覆提供，可用Git fetch取回完整證據。
