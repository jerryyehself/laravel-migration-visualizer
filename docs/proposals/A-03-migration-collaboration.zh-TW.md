# A-03：多人 migration 審查、預覽與資料庫分支的競品核對

- 狀態：draft（競品研究結果；不是開發提案核准）
- 日期／修訂：2026-10-10（Asia/Taipei）／1
- 負責端：研究與決策交接 session
- 問題來源：使用者詢問「其他競品沒有針對多人開發 migration 討論模擬做功能嗎」
- 依賴：[A-02 方法與證據審查](A-02-discovery-evidence.zh-TW.md)、[A-01 定位報告](A-01-positioning-report.zh-TW.md)
- 相關功能 issue／PR：無；R7 未建立、未核准
- 文件分支：`docs/a02-discovery-evidence`；GitHub API 仍受阻，PR 未建立

## 要解決的問題

查核多人 migration 開發的討論、review、預覽及模擬是否已有官方產品支援，釐清 Git 分支、資料庫分支、靜態 schema 推導與實際 DB 測試的差別。不能以「migration 已經寫了」推論開發後審查沒有用途，也不能以「資料庫不會跟 Git checkout 切換」推論所有產品都沒有資料庫分支。

## 方法、來源與限制

唯讀取得官方 GitHub README、Actions 文件與產品文件原始內容，固定 commit；未安裝、啟動、建立帳號／DB、執行 migration 或聯絡使用者。這是官方功能文件查核，沒有實測或市場採用統計。資料來源證明這類工作流程已被產品明確設計，不證明 LMV 使用者需求強度。

| 產品／來源 | 核對 commit |
|---|---|
| Bytebase 官方 repo README | `7561eeea96b4bbf3d33158528c2010b554998dfa` |
| Atlas 官方 repo README | `f165ef0d010f1da9fa4637b037d860a52078c356` |
| Atlas 官方 GitHub Actions README | `3947726cd1592382e0ee9f20ee12f2453a17aab4` |
| Neon 官方 website repo 文件 | `6626bdcabfe52dbb309ffeb4fd4aa80b45b36f9d` |

Atlas／Bytebase 的官方網站詳細文件取得 403，因此只對已讀 README／Actions 文件能支持的部分下結論。Liquibase README 可取得，但它的舊 docs repo 明示於 2025-09 封存且文件已移轉；本報告不使用舊文件作現行協作能力結論。未全面覆蓋競品，也未核對各方案價格與商用限制。

## 實際核對結果

| 產品 | 官方有的功能 | 對應的工作情境 | 不應推論的能力 |
|---|---|---|---|
| [Bytebase](https://github.com/bytebase/bytebase/blob/7561eeea96b4bbf3d33158528c2010b554998dfa/README.md#change-management) | GUI request／review／deploy／rollback、GitHub／GitLab GitOps、SQL Review 規則；README 明列開發團隊協作變更審查 | 工程師提出 DB 變更，由團隊透過受控流程審查與交付 | README 不足以證明自動處理兩個未合併分支衝突、DB 分支或完整 rehearsal；也不是 PHP migration 靜態閱讀工具 |
| [Atlas](https://github.com/ariga/atlas-action/blob/3947726cd1592382e0ee9f20ee12f2453a17aab4/README.md#arigaatlas-actionmigratelint) | `migrate/lint` 支援 `git-base`、`dev-url`；PR 留 lint 結果，CLI 有 change summary 時另列各檔 changed objects／diffs／statements；CI report 含 ERD／migration 分析 | migration 已寫入 Git 分支，在合併前由 CI 分析，讓 reviewer 檢視變更效果與風險 | 不等於 Git 分支是 DB 分支；不等於兩個 PR 的合併一定安全；這份 Action 示例需 Atlas Cloud 和 dev DB，不能稱為 LMV 式無環境操作 |
| [Neon](https://github.com/neondatabase/website/blob/6626bdcabfe52dbb309ffeb4fd4aa80b45b36f9d/content/docs/guides/branching-github-actions.md) | PR 可建立 ephemeral Postgres branch、在隔離環境跑測試、刪除／reset branch；schema diff Action 比較 DB 分支，回貼 PR comment | 各分支的程式碼可搭配獨立 DB 狀態，先實際套用並測試，再讓團隊 review schema 差異 | Actions 不會憑 Git 分支名稱就自動同步 DB；需設定 workflow、API／project；schema diff 本身也不證明合併後無誤 |

### Atlas：有 Git 基底與 dev DB 的具體入口

[Atlas Action 的 `migrate/lint` 本文](https://github.com/ariga/atlas-action/blob/3947726cd1592382e0ee9f20ee12f2453a17aab4/README.md#arigaatlas-actionmigratelint) 明列：

> On pull requests, the action comments with the lint results. On GitHub, if the Atlas CLI reports a change summary, the comment also lists the changed objects of each file with their diffs and statements.

Inputs 包含 `git-base`（base branch）、`dev-url`（分析使用的 development database）與 migration directory。README 的 CI 示例先啟動 MySQL service，再執行 lint；官方 CLI README 另有 migration／schema testing 能力。

`migrate/apply` 的 `dry-run` 定義是 print SQL without executing it；因此 dry run 與在隔離 DB 實際測試不應叫成同一種模擬。這些入口證明已有 PR 後的 DB 變更審查設計；不應改寫成「只適合開發前討論」。

### Neon：資料庫確實可透過平台分支

[Neon branching 本文](https://github.com/neondatabase/website/blob/6626bdcabfe52dbb309ffeb4fd4aa80b45b36f9d/content/docs/introduction/branching.md) 定義 branch 為 copy-on-write clone，與 parent 隔離；可以驗證 schema／queries，並行測試。這是平台提供的真實 DB 分支，不是 Laravel／一般 DB 隨 Git checkout 自動切換。

[Schema diff 文件](https://github.com/neondatabase/website/blob/6626bdcabfe52dbb309ffeb4fd4aa80b45b36f9d/content/docs/guides/schema-diff.md) 支援 parent／child 及 CLI／API 的分支比較，明列 pre-migration review；[GitHub Actions 文件](https://github.com/neondatabase/website/blob/6626bdcabfe52dbb309ffeb4fd4aa80b45b36f9d/content/docs/guides/branching-github-actions.md) 明列為 PR 建立隔離分支、測試、清理及把 schema diff 貼回 PR。

因此可有以下流程：PR 的 code checkout → 明確建立該 PR 的隔離 DB → workflow 實際執行 migration／測試 → 比較 DB schema → PR reviewer 討論結果。schema diff Action 並不替使用者自動執行所有 framework 的 migrations；中間執行步驟需要自己的配置。

## 修正先前結論

1. 先前查核 Google 一般 CL description 指南，確實不能支持「LMV 應產生 schema 摘要貼 PR」；但本次已有 Neon／Atlas 官方文件明確描述 schema diff／migration 結果貼回 PR 的產品工作流程。應從「沒有找到相關例子」修正為「有官方功能證據，尚無 LMV 特定使用／採用證據」。
2. Git 分支不自動帶出 DB 分支這點仍正確；Neon 等產品明確提供 DB branching，因此不能泛稱「資料庫不能分支」。兩者需要整合，不能混為同一條分支。
3. 多人開發後的 review／隔離測試有官方產品支持；不能因已寫 migration 就否定用途。不過先前草稿對照／分支比較推薦仍缺問題定義、實作範圍、成本與需求證據，不會因此恢復成已核准建議。
4. 競品已覆蓋 PR 分析、審查、資料庫隔離與測試，這不是尚未被服務的空白。LMV 的差異仍需限定於 PHP migration 靜態理解、不建 DB 的流程；目前沒有證據支持把 LMV 擴成協作治理平台。

## 候選方案與取捨

| 路線 | 優點 | 成本／問題 |
|---|---|---|
| 接近 Bytebase／Atlas 的協作審查平台 | 有官方已有工作流程可參考 | Git／CI／SQL／DB／權限與部署責任遠超目前 scope，功能重疊大；本批不推薦納入 |
| 接近 Neon 的 DB 分支與實際測試 | 能觀察真實 DB 行為，而非單靠靜態推導 | 需要資料庫平台、資源、憑證與環境；與 LMV 不執行 PHP／DB 的邊界不同 |
| 保持 LMV 靜態理解，另尋同任務中未解決的問題 | 延續已交付架構與無 DB 成本 | 仍需實際需求與同任務比較；本報告沒有填補這個證據缺口 |

## 方向、範圍與排除

本次結論是「有相關競品能力」，不是開發需求。只核對官方產品功能與修正交接；不實作 GitHub integration、DB branching、CI reporter、runtime simulation、分支比較、動畫或 R7。不略過未知 PHP，不改 lastValid／final 契約。下載驗收繼續暫緩。

## 本次批次與驗收

| 批次 | 前置條件 | 範圍 | 交付與驗證 | 停止點 |
|---|---|---|---|---|
| A-03.1 官方能力核對 | 使用者本次明確提問 | 固定來源版本，核對 Bytebase／Atlas／Neon 的協作入口 | 上述官方文字、參數與工作流程；文件連結／diff 檢查 | 不安裝工具、建立 DB、執行 SQL 或宣稱實測 |
| A-03.2 更正證據與交接 | A-03.1 有原始資料 | 更正 A-02 對 PR 摘要證據的時點；記錄不是空白市場 | 本文與 A-02 交叉引用、提案索引 | 不將競品有功能轉成 LMV 已核准需求 |

驗收為文獻／功能描述查核及文件檢查；沒有真人使用研究或需求實驗。來源不夠的項目保持未確認。

## 使用者確認與交付紀錄

2026-10-10（Asia/Taipei），使用者要求查核多人 migration 討論／模擬競品；只授權研究與文件，不核准新增功能。本報告維持 draft。

保存到既有文件分支；不合併 main，因現有 Pages workflow 對 main push 沒有 docs 排除，文件合併會觸發部署。GitHub API 先前 Forbidden，PR 尚未建立；分支保存不等於 main 已更新。沒有執行專案程式或改設定／workflow。
