# M32：工作台與 ERD 全流程驗收

修正根目錄 npm dev script 的參數轉傳：`npm run dev -- --host 127.0.0.1 --port 5202 --strictPort` 現在實際啟動指定 port，而不是把 host/port 當 Vite root。移除過期 M20 頁首，新增使用限制說明及十二檔訂單系統範例按鈕。範例用 Vite raw import 打包，排序仍交給 core。

新增三個跨層測試，串接 browser IO adapter、analyzeProject、快照選單、ERD projection、JSON export 與副本編輯還原。最終 JSON 比對 M31 獨立 golden，並確認明確外鍵、價格變更的 before/after、default 0，以及失敗 finalSchema=null。612 tests（520 core + 92 web）、typecheck、build、十一個 demo 通過。

2026-10-04 本地內建瀏覽器實際驗收：十二份 PHP 以倒序多檔匯入，12/12 套用、五表三外鍵；搜尋後只顯示一份，快照仍完整；price change 的兩側顯示 nullable false/true、precision 8/10；聚焦、方向鍵移動與縮放同步兩圖。已知初始空 schema 正確顯示零表。

編輯第十份成不支援 API 後，舊分析與匯出消失；重新分析保留九份成功前綴，後續快照未知、最終下載停用。診斷定位第 5 行，到輸入區精確選取該行；還原後再分析回到 12/12。console warn/error 為空。一般窄側欄及 1280×900 桌面檢視均操作過，這不是所有手機／瀏覽器相容性保證。

下載按鈕已點擊，但此內建瀏覽器的 download event 等待 10 秒逾時，未取得磁碟檔案；不得宣稱完成下載內容驗收。JSON 序列化與 golden 由自動測試確認。使用者先前自行下載成功是歷史證據，並非本次自動化結果。資料夾選取與單檔模式沿用既有測試，本次沒有重跑其完整互動驗收。

本地瀏覽器證據保存在專案旁 `outputs/m32-evidence/`：final-erd.jpg、comparison-desktop.jpg、failed-dom.txt；不把本機絕對路径當成雲端可讀資源。主要修改：main.tsx、ProjectWorkbench.tsx、project-acceptance.test.ts、根 package.json。

教學：component 是畫面的一塊；props 是父層交給它的資料，state 是使用者目前的輸入與選擇。把 core 結果經 props 交給 ERD，就像後端 service 回傳 DTO 給 presentation layer。修改 state 會使舊結果失效，但 React 不自行推算新的 schema；使用者重新分析才呼叫 core。
