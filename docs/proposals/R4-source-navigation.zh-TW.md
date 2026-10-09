# R4：結構與 migration 來源串接

- 狀態：draft
- 日期／修訂：2026-10-09／2
- 負責端：研究與交接；核准後由本地開發
- 依賴：R1、R3；來源查詢契約另經核准
- 相關 issue：未建立
- 文件 PR：docs/research-proposals 分支的保存 PR（不等於功能核准）
- 功能 PR：無

## 要解決的問題
從結構到來源與逐次變更目前缺少統一入口；同名或已刪物件容易被誤當成同一身分。

## 候選方案與取捨
A：查詢直接涉及名稱的 operations／SourceLocation。B：跨 rename 維持物件身分。C：推測 semantic lineage。A 證據明確；B 要新契約；C 違反既有排除。

## 選定方向（待核准）
先 A；明確 rename 可顯示 operation 的前後名稱，但不等於全歷史身分追蹤。

## 範圍與可派小任務
1. 定義 directly involved 的 operation 集合，區分 applied／failed／blocked 的語法操作與可信 schema 效果。
2. 設計純查詢 service 與來源 DTO，決定是否公開 core export；不得由 hooks 推斷歷史。
3. 從表／欄位明細列出有證據的相關 migration、operation 與 PHP 位置。
4. 保留原快照／選取以支援返回；明列刪除、重建同名及 rename 案例。

## 排除項目
Semantic rename inference、穩定物件 identity、timeline、DB／models 關係猜測。
既有 core 不做 IO／不執行 PHP／不連 DB、結構 diff 不猜 rename、lastValidSchema 不補 finalSchema 的契約延續。

## 驗收條件
來源可追溯到 migration 與 operation；同名刪除重建不合併成身分；failed／blocked 不被標示為已生效；未知來源不補值；雙向跳轉可驗收。

## 研究依據
[定位比對報告 A-01](A-01-positioning-report.zh-TW.md)：A-01：逐步可信來源是差異假設，必須用任務驗收，而非宣稱獨有。

## 逐次派工步驟與每次邊界

下表的「一次」是一個有交付物的工作批次，不是固定時間或模型回合。已核准整份具體範圍時，可依序執行其中必要步驟，不必每步重新詢問；僅核准部分批次就不得超出。前置契約未具體確認時，只能做已授權的研究／規格，不開始功能實作。

| 批次 | 前置條件 | 本次只做的範圍 | 交付物與驗證 | 停止點／本次不做 |
|---|---|---|---|---|
| R4.1 來源語意契約 | R1／R3 結果可讀 | 逐一列 directly involved 的 operation，明列 FK 來源／目標、table rename、column rename、刪除重建、failed／blocked；定義 DTO 欄位、排序與公開 export 決策 | 來源查詢規格與人工預期案例；使用者核准此修訂 | 不創建穩定物件 identity，不把名稱匹配叫 lineage |
| R4.2 純查詢 service | 來源契約已核准 | 只從既有 ProjectAnalysis／operations／SourceLocation 建來源查詢；區分語法涉及與可信已套用效果，依規格安排 core 或純 web adapter | service／DTO diff、涉及／未涉及與同名重建／rename／失敗回歸；若公開 export 則 built-package 驗證 | 不重跑 parser／replay，不改 SchemaDiff；不延伸為全歷史追蹤 |
| R4.3 結構→來源入口 | 查詢 service 完成 | 只在表／欄位明細顯示來源列表並跳到 migration／PHP；保留來源的 snapshot 與物件選取返回目標 | 相關 UI 驗收，來源定位與不在該側的物件明確顯示 | 不改磁碟 PHP，不增加另一套編輯器或資料持久化 |
| R4.4 返回與交付 | 來源入口完成 | 只完成來源→原結構返回、快照切換／副本修改時選取失效處理；驗收指定雙向任務 | 兩端導航、失效與未知案例；必要 checks、最新 HEAD CI／merge | 來源不足時明列未知；跨 rename identity 另立提案 |

每次開始前記錄批次 ID、核准修訂、輸入版本、預計檔案／範圍；結束時記錄實際變更、驗證、issue／PR／commit、未完成項目與下一批前置條件。遇到新需求先列 draft；同一已核准範圍內的必要修正不需要重複取得批准。
部分批次核准或交付時，逐批記錄，未核准批次維持 draft；整份提案狀態不能擴張批次授權。

## 使用者確認紀錄
尚未取得本提案個別實作核准。2026-10-09 使用者確認雙目標及文件保存流程；不等於本提案 approved。核准時需補日期、修訂、具體範圍與確認來源。

## 交付紀錄
目前只保存 draft；未啟動實作、未建立功能 issue／PR、未執行功能驗證。狀態轉換依 [提案流程](README.md)。
