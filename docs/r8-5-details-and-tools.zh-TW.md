# R8.5：結構明細、單一來源與進階分析入口

COORD-20261011-17 是協調端按既有使用者核准派工，只接 #143／R8.5，milestone #43 保持 open。核准來源是 R8 修訂1@5eec41476ef22b85d3165d3be3f681f1a20c8f9d 保存的人類詳細修正指令；協調端沒有新增或代核准。固定輸入 2dd3a9a348df5225f4cbf157d3c76ff5ef539622（R8.4 產品 c32b52260b6057b2b0f49d223e1c9f68b397f7c8）。規劃交接 d2e3aaa2f761752842cdb4856afc2af0e47ba435 只參考，不合併產品 base；實際規劃遠端已到 835cb1e544520ff7b69ea1c20f03bf0ccf8fe66b，不自動擴大本批範圍。

產品 commit：ce16e471573cbf0762ad13293f715eefb61b28f7。分支 feat/r8-5-details-and-tools，stacked base feat/r8-4-reading-context。#145～148 各固定驗收 head 未更動：f9b42c8c220841d40978db48969feaba8c52dc43、3e8ee581eee16a80940c7490b491001dc2bd25eb、8ed11ea960c7e0a046b72e3c78011c4cb744896b、2dd3a9a348df5225f4cbf157d3c76ff5ef539622。main 仍 2b8030a7d19963980190ba860888f243883b6d7b。本批等待獨立验收／依賴整合，停止於 ready for review；不合併、不 automerge、不開始 R8.6。

## 操作與資料契約

右側直接提供「結構明細／相關變更／PHP 來源」鍵盤入口。結構明細先讀目前側的欄位、索引、外鍵；compare 各側只讀自己的 schema，缺表、缺欄、null 未知分開提示。欄位沿既有摘要 adapter 顯示中文用途與原屬性名，明確保留 NULL、false、0 和 ordered allowedValues，沒有填 DB defaults；缺省 default 明示未指定，其他缺省屬性由說明交代。

全分析名稱來源獨立收合，工作區只列一份，不在 compare 两側或每個摘要項重複。摘要的來源按鈕會開啟同一清單，聚焦來源標題；可明確選表名稱／欄名稱來源，不更動目前閱讀物件。來源 query 可以是該側已移除的 literal，不因缺少或未知 schema 而猜測別名。相關步驟與當步「已識別操作」仍保留 step-local PHP 語法入口，這些不是重複的全專案清單。

清單按完整 core 分析順序顯示原 index，保留 applied／failed／blocked 靜態結果，另標目前時點之後的來源。套用前的當份操作也尚不屬該快照；compare 的共同來源以當份 after 邊界提示後續步，並明說完整清單不表示各側已套用。初始時點所有 migration 都是之後來源。名稱涉及操作不是差異一對一來源、物件 identity 或自動 rename history。

PHP preview 唯讀，不換 step／side／literal／query／GraphView，也不替代结构 DTO。返回使用既有 restoreSourceFocus，展開收合來源祖先並恢復原按鈕焦點；隱藏／失效 origin 保留聚焦提示。檔案歧義不猜 basename，未知行只顯示檔案開頭且不捏造高亮行。明確改來源 query 或閱讀位置會關閉舊 preview，真修改／重新分析依前批 generation 契約清整個舊結果。

## 進階入口

工作區的「進階分析」按鈕及原生 details summary 都能鍵盤到達。完整診斷、當份 before／after 表格、diff／operations／ProjectAnalysis JSON、兩種 JSON 匯出集中在此。主摘要、首要診斷及未完成／未知 final 提示仍在主流程，不藏進進階。

當份表格標明原第幾份、filename、Before／After；初始／final 替代表格標明目前閱讀時點。另需查看完整 final／lastValid 時，從明確標示的收合入口開啟；歷史 workspace 底部不預設攤另一份 final／prefix 表格。成功前綴不是未知 final 的替代品。完整分析下載保留，未知 final 下載仍禁用；不執行下載互動或落盤驗收。

搜尋與 layout 只變畫面 state，完整 DTO／匯出仍讀原 result。原始 JSON 未加任何 UI labels、selection 或 view，core／公開 JSON／golden／依賴／workflow 沒有差異。

## 後端類比

core 是 domain service，ProjectAnalysis 是已有回應 DTO。ProjectResults 像 controller，持有閱讀及來源 query、接收事件；WorkspaceDetails／TableDetails 是 rendering component，props 只傳各側 DTO 與 callbacks。中文屬性值沿既有 presentation adapter 顯示，不再計算 migration。新增來源 request 只是開啟／聚焦一次入口的 UI 訊號，不是表 identity。進階入口相當於同一服務回應的完整檢視，收合不能刪掉 DTO 或改变匯出內容。

## 實測、首次失敗與限制

固定產品 clean checkout 執行 npm run verify：713 tests（540 core／173 web）、typecheck、build、12 built-package demos，共15命令全 exit0。新增7個 web 契約回歸，涵蓋 compare 去重、缺席名稱來源、未來來源且保留 failed／blocked、進階／prefix與下載禁用、歧義來源。原 optional 值回歸更新中文標籤斷言，保留 false／0／NULL／own default 數量與有序值，不盲改 golden。

實際 Chromium：R8.5 13 組、R8.4 14、R8.3 12、R8.2 12、R8.1 14、R7 16、IR source-return 9，共90項／組；console warning／error／pageerror 全空。包含桌面與390px、快捷入口／原生 summary／來源返回鍵盤、before／compare側別、removed／unknown、DTO文字於query／zoom後不變、輸入改動失效。歧義／未知檔／未知行用真 DOM 掛載既有 preview 元件測 metadata 邊界，不宣稱支援 core 產生新的 unknown metadata；既有 IR9 測 collapsed／nested／hidden／detached／invalidorigin。

首輪 npm test：705 passed／1 failed，舊 table-details 測試仍期待英文 default／小寫 null，依核准的中文顯示契約更新，沒有放寬值與own-property規則。新增來源邊界 browser probe 首輪讀 Vite CJS named export 時 createRoot 不是函式，改讀 default export 後通過；這是腳本裝載錯誤，不是產品錯誤。兩份原始失敗 transcript 保存。前批 browser 只更新來源收合入口、summary 導向單一清單、進階入口的 ancestor 操作；原語意、順序、DTO、focus、unknown断言保持。

可攜證據：[manifest](acceptance/r8-5-evidence/manifest.json) 列12份 report／截圖／首次失敗 SHA256。產品 commit 上重新執行全部必要驗證與瀏覽器；截圖實際檢視。這些是開發端自測，不是獨立驗收通過。COORD16 與 R7/IR、R8各批獨立驗收仍 pending／驗收環境 offline 阻礙；協調直接核對與 CI 不能代替。#143 in_progress／ready for review但 OPEN，整批R8／milestone43未完成；等待協調回收安排新固定 head 驗收。沒有部署、release、下載落盤、新 PHP／ERD 匯出、持久化、identity、runtime 或相鄰 draft。
