# R8.1：匯入、分析與閱讀主流程

COORD-20261011-04 只派 R8.1，停止於可審查 PR。產品輸入 main 2b8030a7d19963980190ba860888f243883b6d7b；核准規格 docs/r8-reading-corrections@5eec41476ef22b85d3165d3be3f681f1a20c8f9d，已透過 609ca475a1ba6b7681ae845d9d500ed1ac8cfcd8 保存完整文件歷史。追蹤 milestone #43／issues #139～144；本批 #139 in_progress／ready for review，其他 approved 未開工，milestone open，不合併 main。

## 這次改了什麼

首頁以看結構／讀變更／查來源說明用途，技術 DTO 管線放使用範圍。保留靜態 up()、不執行 PHP／DB 的界線。檔案／資料夾匯入保留，11 個示範在單一「範例」入口，載入取代清單但不自動分析。初始三檔清楚標示為示範。

「管理輸入副本」預設收合，內有檔名／PHP、移除、還原與輸入清單。分析完成收合管理並聚焦閱讀結果；手動展開／收合不改 DTO。修改／還原／移除／新匯入才使結果失效。診斷修改展開正確輸入檔並依 core 行號選取 textarea；只改瀏覽器副本，不改磁碟 migration。

多檔工作台在切工具時保持 mounted，hidden 將其從畫面與鍵盤／輔助工具入口隱藏。從「工具」進單檔，返回同頁多檔副本、結果、閱讀步驟與表選取仍在；返回焦點回到工具 summary。沒有持久化，新整理仍清除。單檔沒有新增 ERD 或背景分析。

工作區前保留 compact 完成／未完成、套用數與可信範圍。primaryDiagnostic 只選 core 已提供的 ordering，否則第一份 failed 的 analysis／replay，不新增原因推論；所有診斷仍在可展開且可定位的完整入口。JSON 匯出移到工作區後的次入口，沿用序列化與未知 final 禁用，不做下載互動。

## 後端類比

core 仍是 domain service；ProjectAnalysis 是不可改的回應 DTO。App 像頁面的 controller，state 選擇目前工具，但不銷毀多檔工作台。ProjectWorkbench component 持有副本／分析與管理展開 state；props 把同一份 DTO 傳給 ProjectResults。管理是否展開只是 view state，不代表 service 資料改動。

primaryDiagnostic 是純 web 選取 adapter，像 controller 從既有錯誤清單選首要提示；所有錯誤 DTO 保留。焦點 ref 是指向 DOM 控制項的參照，供分析後與診斷修改的鍵盤導航，沒有把 parser／replay 搬进 hooks。

## 驗證與修正紀錄

新增三個 primaryDiagnostic 回歸，涵蓋排序優先、第一個失敗原因／不可變 DTO、成功空白／noop 不製造問題。另以真實 Chromium 任務驗證 mounted state、native details、診斷編輯与鍵盤；SSR 不是互動證明。

開發中唯讀 keyboard probe 重現工具返回後 activeElement=BODY；已修正返回工具 summary，並加入 Enter 返回／焦點 assertions。最初 Vite 在普通 sandbox 出現 listen EPERM，允許執行後本機 loopback 啟動成功；沒有改網路／憑證／workflow 或對外部署。

實際最終產品 SHA、verify／browser 數量及可攜證據於本節下方記錄。未執行真人試用、下載落盤、大型效能或 runtime；不能把走查說成已證明直觀。

## 本批停止點

R8.2 摘要、R8.3 相關步驟、R8.4 跨步欄位／query／view 保留、R8.5 明細／來源／進階重整、R8.6 整合驗收均未開始。既有 R7 切步仍清欄位／重設 view，來源列表與完整 schema 表格不在本批重做。core／公開 JSON／golden／依賴／workflow 不變。等待協調端安排此 PR head 的獨立複驗，不標 done、不合併、不部署、不 release。

## 最終產品檢查

產品 head d849b4e8a0ea79e65b8d459a975476b57fe75538。乾淨 commit 上執行 npm run verify：673 tests（540 core／133 web）、typecheck、build、12 demos／15 commands 全通過。R8.1 14 組、R7 16 項、IR 9 項 browser 回歸，共 39 項／組全部通過；11 個範例逐一載入／分析包含在一組任務內，不把它當額外 tests。console warning/error 為空。

可攜證據在 [驗證 manifest](acceptance/r8-1-evidence/manifest.json)、[verify](acceptance/r8-1-evidence/verification.json)、[R8.1 browser](acceptance/r8-1-evidence/browser.json)、[R7](acceptance/r8-1-evidence/r7-regression.json)、[來源返回](acceptance/r8-1-evidence/source-return.json)、[桌面](acceptance/r8-1-evidence/desktop.png)、[390px](acceptance/r8-1-evidence/narrow.png)、[修正前焦點](acceptance/r8-1-evidence/focus-before.json)。verify metadata clean=true 且 commit 對應上述產品 head；最後文件 commit 不改產品。PR 最新 head CI 以 GitHub 真實紀錄與本對話回報為準，文件不預填未發生的 CI／merge。
