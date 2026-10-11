# R8 工作項目建立與實作 session 接手入口

2026-10-11。R8 修訂 1 為 approved，使用者直接要求建立 milestone／issues 並交代修正；研究 session 不實作。完整規格：[R8](../R8-reading-corrections.zh-TW.md)。

## 研究端最初狀態（歷史）

本研究環境的正常 `gh api` 唯讀 milestones 請求回傳 Forbidden，當前設定未允許 api.github.com。未取得 live 工作項目清單，也未成功建立 milestone／issues／PR；不得把下面的 R8.* 說成 GitHub 編號。本包保存已完成的建立內容與派工規格，可由具備 GitHub API 權限的實作 session 接續，不需重問本次建立授權。

沒有修改網路／憑證設定，沒有繞代理或登入新帳號。此限制不阻止文件完成與 Git 分支保存。main push 可能觸發既有 Pages，本研究端只推文件分支。

## 給實作 session 的完整交接

1. 保護未提交工作，重新核對 latest main、AGENTS、提案入口、DECISIONS、CLOUD_HANDOFF。起點 2b8030a，R7 #137／#138 done，不重做已交付批次。
2. 取得 `docs/r8-reading-corrections`，讀本文件與 R8 規格。此分支也帶 A-06 審查，全部是文件；A-06 保持 draft，功能以 R8 指定範圍為準，不把其他 draft 轉 approved。
3. 先確認所在 session 的 GitHub API 可用，依下一節查重／建立 milestone 與六張 issues，回填真正 URLs／numbers。API 不通就回報追蹤建立阻塞，不編造編號或標完成，不自行更改憑證／部署規則。
4. 把規格文件依既有文件授權保存到開發可追溯的來源，核對 docs-only diff／CI／既有 Pages 影響；不能把文件 merge 當功能已交付。
5. 從 latest main 建 feature branch，按 R8.1→R8.2→R8.3→R8.4→R8.5→R8.6 執行。每批寫輸入 SHA、核准來源、實際檔案、前置條件、交付物、驗證／限制與停止點；開工才 in_progress。
6. React 消費既有 ProjectAnalysis／MigrationSnapshot／SchemaDiff，純 web 查詢／呈現 adapter 不 parse／replay。core／公開 JSON／golden 不改，不補 unknown，不追 rename 身分。
7. 用 price／nickname／users-posts FK／同名重建／整表增刪／R6 failed samples 完成必要任務；verify／browser 結果與截圖留證，沒有真人試用就不宣稱直觀已獲證明。
8. 功能 PR 關聯真正完成的 issues、核對 current-head CI；merge／既有 Pages 影響依該 session 的當前授權處理，attach PR 到該 chat。全部必要 merge 與驗收完成再關 milestone／標 done；沒有下個 approved 任務就停止。

取得文件（在正確 repo，保留已有工作，不使用 reset）：

```sh
git fetch origin main docs/r8-reading-corrections
git show origin/docs/r8-reading-corrections:docs/proposals/R8-reading-corrections.zh-TW.md
git diff origin/main...origin/docs/r8-reading-corrections --stat
```

## 建立／更新工作項目：先查重，再 mutation

milestone title 固定為 `R8：結構與 migration 變化閱讀修正`；不先指定 GitHub number，不設虛構 due date、不建立額外 labels。先讀全部狀態（含 closed）避免重複；若同名已存在先核對內容／交付，而不是直接重開或覆寫其他工作。相符 record 更新必要內容，不創第二份。

```sh
gh api 'repos/jerryyehself/laravel-migration-visualizer/milestones?state=all&per_page=100' --paginate --jq '.[] | {number,title,state,html_url}'
gh api 'repos/jerryyehself/laravel-migration-visualizer/issues?state=all&per_page=100' --paginate --jq '.[] | select(has("pull_request") | not) | {number,title,state,html_url,milestone}'
```

確認不存在相符 milestone 才建立；此命令內容已具體授權，需在能正常使用 API 的 session 執行：

```sh
gh api --method POST repos/jerryyehself/laravel-migration-visualizer/milestones -f title='R8：結構與 migration 變化閱讀修正' -F description=@docs/proposals/R8-work-items/milestone.md -f state=open
```

下面每個命令只有確認該 exact title 不存在時才執行；相符 existing issue 要按實際 number 更新 body／milestone，保留必要既有討論。body-file 使用版本化全文，避免 shell 轉義破壞。

```sh
gh issue create --repo jerryyehself/laravel-migration-visualizer --milestone 'R8：結構與 migration 變化閱讀修正' --title '[R8.1] 收斂匯入、分析與閱讀主流程' --body-file docs/proposals/R8-work-items/issue-01-main-flow.md
gh issue create --repo jerryyehself/laravel-migration-visualizer --milestone 'R8：結構與 migration 變化閱讀修正' --title '[R8.2] 呈現跨表與屬性前後變更摘要' --body-file docs/proposals/R8-work-items/issue-02-change-summary.md
gh issue create --repo jerryyehself/laravel-migration-visualizer --milestone 'R8：結構與 migration 變化閱讀修正' --title '[R8.3] 列出同名表與欄位的相關 migration 變化' --body-file docs/proposals/R8-work-items/issue-03-related-changes.md
gh issue create --repo jerryyehself/laravel-migration-visualizer --milestone 'R8：結構與 migration 變化閱讀修正' --title '[R8.4] 保留連續閱讀上下文並整合側別搜尋' --body-file docs/proposals/R8-work-items/issue-04-reading-context.md
gh issue create --repo jerryyehself/laravel-migration-visualizer --milestone 'R8：結構與 migration 變化閱讀修正' --title '[R8.5] 整理表明細、操作來源與進階分析入口' --body-file docs/proposals/R8-work-items/issue-05-details-and-tools.md
gh issue create --repo jerryyehself/laravel-migration-visualizer --milestone 'R8：結構與 migration 變化閱讀修正' --title '[R8.6] 驗收閱讀任務並完成文件與 PR 交付' --body-file docs/proposals/R8-work-items/issue-06-acceptance.md
```

每次成功後核對回傳 URL 與 repo／milestone／body，保存真正建立或更新的結果。回填下表，並將依賴對應真正 issues；批次 ID 不取代 API number。

| 項目 | 內容／依賴 | 實際 GitHub 記錄 |
|---|---|---|
| milestone | [全文](milestone.md) | [#43](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/43)，open |
| R8.1 | [主流程](issue-01-main-flow.md)；R7 done | [#139](https://github.com/jerryyehself/laravel-migration-visualizer/issues/139)，open |
| R8.2 | [摘要](issue-02-change-summary.md)；R8.1 | [#140](https://github.com/jerryyehself/laravel-migration-visualizer/issues/140)，open |
| R8.3 | [縱深](issue-03-related-changes.md)；R8.2 | [#141](https://github.com/jerryyehself/laravel-migration-visualizer/issues/141)，open |
| R8.4 | [上下文](issue-04-reading-context.md)；R8.3 | [#142](https://github.com/jerryyehself/laravel-migration-visualizer/issues/142)，open |
| R8.5 | [明細／進階](issue-05-details-and-tools.md)；R8.2～4 | [#143](https://github.com/jerryyehself/laravel-migration-visualizer/issues/143)，open |
| R8.6 | [驗收](issue-06-acceptance.md)；R8.1～5 | [#144](https://github.com/jerryyehself/laravel-migration-visualizer/issues/144)，open |

## 本研究批次的交付與停止點

前置條件是使用者的建立／修正指令與 A-06 問題證據。本次交付 R8 規格、milestone 全文、六張 issue 全文、上述建立與接手步驟、提案／決策／雲端交接更新。檢查文件連結與 diff，核對分支只有 docs。沒有執行專案、修改程式／測試／設定／scripts／workflow、安裝或部署；沒有成功建立 GitHub records，也沒有跨對話傳送工具可用，因此由使用者把此接手入口提供給實作 session。停止於可審查文件分支；不把待 API 接續說成已完成。

## COORD-20261011-04 開發接手

已查重建立上述 milestone／六張 issues，僅派 R8.1；R8.2～6 未開工。產品輸入 main 2b8030a7d19963980190ba860888f243883b6d7b，規格輸入 5eec41476ef22b85d3165d3be3f681f1a20c8f9d，規格保存在 feat/r8-1-main-flow 的 merge commit。停止於可審查 PR，等待協調端安排新 head 獨立驗收，不合併 main。

可審查 PR：[R8.1 #145](https://github.com/jerryyehself/laravel-migration-visualizer/pull/145)，head／CI 以 GitHub 當前紀錄為準；本輪不合併，獨立複驗待協調端安排。

## COORD-20261011-08：R8.2 交付停點

只接續 #140／R8.2，輸入 f9b42c8c220841d40978db48969feaba8c52dc43，產品 444fc9c99f7acf99f2824730ee32c0ca3e56b08d；684 tests／12 demos／15 verify 步驟及 12+14+16+9 browser 自測通過。R8.1 #145 保持固定 head／OPEN，獨立驗收仍 pending；R8.2 ready for review，stacked PR 待前批驗收／合併，不合併 main、不開始 R8.3～6。milestone #43／所有工作項目保持未完成。教學與可攜 manifest 見 docs/r8-2-change-summary.zh-TW.md、docs/acceptance/r8-2-evidence/manifest.json。

## COORD-20261011-11：R8.3 交付停點

協調端按既有使用者核准（R8修訂1@5eec414）只派 #141／R8.3。輸入3e8ee581eee16a80940c7490b491001dc2bd25eb，產品763f71d5089e45781e34ba30e55028916b065a15；698 tests、12 demos、15 verify步驟、12+12+14+16+9 browser自測通過。R8.1 #145／R8.2 #146 固定 head 不改，三批独立驗收均 pending。R8.3 in_progress／ready for review，milestone #43 open，R8.4～6未開工，不合併 main、不automerge。教學 docs/r8-3-related-changes.zh-TW.md，可攜證據 docs/acceptance/r8-3-evidence/manifest.json。規劃8c326339ff5b7656b7e73a3842029a6dfbc24eae只參考，不混產品base。

## COORD-20261011-14：R8.4交付停點

協調端按原人類核准（R8修訂1@5eec414）只派#142／R8.4。輸入8ed11ea960c7e0a046b72e3c78011c4cb744896b，產品c32b52260b6057b2b0f49d223e1c9f68b397f7c8；706tests／12demos／15verifycommands、14+12+12+14+16+9browser自測通過。R8.4父層保literal/query/view與集中側別搜尋，更新R7切步重設view舊限制；core/JSON不改。#145～147固定heads不改、R8.1～4独立驗收pending，#142 ready for review但OPEN／milestone43 OPEN，R8.5～6未開始。規劃8ea8ece98073542eaafc4b6d19f5e7ce639f074c只参考不混base。教學docs/r8-4-reading-context.zh-TW.md，證據docs/acceptance/r8-4-evidence/manifest.json。
