# R5：單次變更閱讀流程

- 狀態：draft
- 日期／修訂：2026-10-09／1
- 負責端：研究與交接；核准後由本地開發
- 依赖：R1、R4
- 相關 issue：未建立
- 文件 PR：docs/research-proposals 分支的保存 PR（不等於功能核准）
- 功能 PR：無

## 要解決的問題
既有 operations／diff／雙圖比較可用，但閱讀流程需整合，避免使用者在多塊結果間自行拼湊。

## 候選方案與取捨
A：整合單次 migration 的既有資料與來源。B：任意两版本比較。C：增加部署安全警示。A 最接近現有 DTO；B 需額外比較規格；C 要新分析責任。

## 選定方向（待核准）
採 A；目前只承諾理解變更，不判定部署安全。

## 範圍與可派小任務
1. 盤點現有結果 UI，定義單次 migration 閱讀入口。
2. 整合 operations、結構 diff、診斷與真實 before／after，避免混合 schema。
3. 受影響物件連到各側明細與原始碼；rename operation 與 removed+added diff 分開呈現。
4. 明列 failed 有 before、after／diff null；blocked snapshots 未知；無變更不同於未知。

## 排除項目
CI／CLI、部署安全、任意兩版本比較、semantic refactoring、down()。
既有 core 不做 IO／不執行 PHP／不連 DB、結構 diff 不猜 rename、lastValidSchema 不補 finalSchema 的契約延續。

## 驗收條件
使用者能回答做了什麼、前後差異、證據來源；失败／blocked 不顯示為無變更；各側使用自己的快照；完成相關 contract 與互動驗收。

## 研究依據
[定位比對報告 A-01](A-01-positioning-report.zh-TW.md)：A-01：Atlas／Guard 的安全分析與本提案分工不同；dbdiagram 版本歷史亦不等於 replay。

## 使用者確認紀錄
尚未取得本提案個別實作核准。2026-10-09 使用者確認雙目標及文件保存流程；不等於本提案 approved。核准時需補日期、修訂、具體範圍與確認來源。

## 交付紀錄
目前只保存 draft；未啟動實作、未建立功能 issue／PR、未執行功能驗證。狀態轉換依 [提案流程](README.md)。
