# R5：單次變更閱讀流程

- 狀態：draft
- 日期／修訂：2026-10-09／2
- 負責端：研究與交接；核准後由本地開發
- 依賴：R1、R4
- 相關 issue：未建立
- 文件 PR：docs/research-proposals 分支的保存 PR（不等於功能核准）
- 功能 PR：無

## 要解決的問題
既有 operations／diff／雙圖比較可用，但閱讀流程需整合，避免使用者在多塊結果間自行拼湊。

## 候選方案與取捨
A：整合單次 migration 的既有資料與來源。B：任意兩版本比較。C：增加部署安全警示。A 最接近現有 DTO；B 需額外比較規格；C 要新分析責任。

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

## 逐次派工步驟與每次邊界

下表的「一次」是一個有交付物的工作批次，不是固定時間或模型回合。已核准整份具體範圍時，可依序執行其中必要步驟，不必每步重新詢問；僅核准部分批次就不得超出。前置契約未具體確認時，只能做已授權的研究／規格，不開始功能實作。

| 批次 | 前置條件 | 本次只做的範圍 | 交付物與驗證 | 停止點／本次不做 |
|---|---|---|---|---|
| R5.1 閱讀流程規格 | R1／R4 結果可讀 | 盤點現有逐檔結果／比較，指定 applied、failed、blocked 各自入口與展示順序；定義受影響清單與兩側明細跳轉 | 一份有限互動規格、三狀態案例與核准記錄 | 不重做比較引擎；任意兩快照比較與安全警示排除 |
| R5.2 單次變更摘要 | 流程規格已核准 | 只整合當前 migration 的 operations、diff、diagnostics 與受影響物件列表；rename 操作證據和 removed+added diff 分開 | 成功／無變更／failed／blocked adapter 與呈現驗證 | operations 不等於已生效；未知不可轉成空 diff |
| R5.3 明細與來源連結 | 摘要完成且 R4 可用 | 只把摘要項目連到 before／after 各自表明細與 PHP；沿用真實雙圖與既有同步 view | 新增／刪除／變更／rename／缺表的導航驗收 | 不合併兩側 schema，不建立新的 schema 推算 |
| R5.4 任務回歸與交付 | 前述核准步驟完成 | 驗收指定單次變更任務與副本重分析；完成相關 checks、手冊與功能 PR | 使用者能指出操作、差異及來源；CI／merge 證據與限制 | 部署安全、CI reporter、CLI 不隨本批加入 |

每次開始前記錄批次 ID、核准修訂、輸入版本、預計檔案／範圍；結束時記錄實際變更、驗證、issue／PR／commit、未完成項目與下一批前置條件。遇到新需求先列 draft；同一已核准範圍內的必要修正不需要重複取得批准。
部分批次核准或交付時，逐批記錄，未核准批次維持 draft；整份提案狀態不能擴張批次授權。

## 使用者確認紀錄
尚未取得本提案個別實作核准。2026-10-09 使用者確認雙目標及文件保存流程；不等於本提案 approved。核准時需補日期、修訂、具體範圍與確認來源。

## 交付紀錄
目前只保存 draft；未啟動實作、未建立功能 issue／PR、未執行功能驗證。狀態轉換依 [提案流程](README.md)。
