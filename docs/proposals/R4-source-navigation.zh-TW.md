# R4：結構與 migration 來源串接

- 狀態：draft
- 日期／修訂：2026-10-09／1
- 負責端：研究與交接；核准後由本地開發
- 依赖：R1、R3；來源查詢契約另經核准
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
4. 保留原快照／選取以支援返回；明列删除、重建同名及 rename 案例。

## 排除項目
Semantic rename inference、穩定物件 identity、timeline、DB／models 關係猜測。
既有 core 不做 IO／不執行 PHP／不連 DB、結構 diff 不猜 rename、lastValidSchema 不補 finalSchema 的契約延續。

## 驗收條件
來源可追溯到 migration 與 operation；同名刪除重建不合併成身分；failed／blocked 不被標示為已生效；未知來源不補值；雙向跳轉可驗收。

## 研究依據
[定位比對報告 A-01](A-01-positioning-report.zh-TW.md)：A-01：逐步可信來源是差異假設，必須用任務驗收，而非宣稱獨有。

## 使用者確認紀錄
尚未取得本提案個別實作核准。2026-10-09 使用者確認雙目標及文件保存流程；不等於本提案 approved。核准時需補日期、修訂、具體範圍與確認來源。

## 交付紀錄
目前只保存 draft；未啟動實作、未建立功能 issue／PR、未執行功能驗證。狀態轉換依 [提案流程](README.md)。
