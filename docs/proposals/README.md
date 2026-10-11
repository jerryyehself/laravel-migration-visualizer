# 研究提案與開發核准入口

更新日期：2026-10-10（Asia/Taipei）。本輪核對 main：2fe510870c4d41d7c24459173d7e32f2f625968c；此 SHA 是核對起點，不是永久最新版本。

## 工作流程（使用者已確認）

研究 session 可寫提案；只有使用者明確確認具體提案與範圍後，才可標為 approved。助理不能自行核准。文件 PR 的建立、審閱或合併只保存內容，不等於核准其中的功能。歷史自主開發授權不覆蓋此流程。

狀態順序：draft → approved → in_progress → done。

| 狀態 | 意義與必要證據 |
|---|---|
| draft | 可研究、討論與修訂；不可開始該提案的實作／開發 issues。 |
| approved | 使用者已確認指定 ID、版本與範圍；文件記錄日期、確認內容與來源。 |
| in_progress | 雲端開發 session 開始已核准工作；記錄負責 session、issue／PR 與實際範圍。 |
| done | 核准範圍已驗收交付；記錄 merge commit、驗證與限制，不把僅有程式碼當成完成。 |

若 approved 後新增範圍，新增 draft 提案或保留原核准內容、另列待核准變更；未核准部分不可實作。不要把 done 提案重新解讀成新授權。

## 雲端開發 session每次收到「繼續」

1. 保護未提交工作；同步遠端、核對 main 與文件 PR 的實際狀態，不盲目 pull 或覆蓋本地變更。
2. 讀 AGENTS.md、本入口、已核准提案及其依賴；參考 A-01 報告。未合併文件必須明確取得指定 PR／分支，不假裝已在 main。
3. 只從 approved 項目選下一個有邊界的任務；續作 in_progress 必須能追溯原核准記錄。
4. 若沒有可執行核准項目，回報候選及缺少的確認，不自行批准 draft。
5. 更新狀態與 issue／PR／驗收證據。研究端維持研究與交接，不同時實作。

不做背景輪詢。本次沒有排程；固定時間檢查須另行設置與授權。

## 每次派工的最小記錄

每份 R 提案均有逐次派工表；ID 如 R1.1、R1.2 是批次，不是正式 GitHub milestone。

開始一次工作前，記錄：
- 提案 ID／修訂、批次 ID、使用者核准來源及本次授權範圍。
- 前置條件是否完成、輸入 commit／樣本、預計改動檔案與交付物。
- 本次驗收與停止點；未核准相鄰功能不可順手加入。

結束時記錄：
- 實際完成範圍、檔案、驗證結果與限制。
- issue／PR／HEAD／merge（依實際階段），未完成項目及下一批前置條件。
- 提案／批次狀態，不能把「已寫程式」「已推分支」「CI 通過」「已合併」混為一談。

核准整份具體提案可涵蓋必要步驟，無需每步重問；若只核准某批次，就只做該批次。發現超出契約的新功能，先保留 draft；已核准範圍內必要修正可繼續。功能 PR 的拆分依可審查與驗收邊界決定，不強制每一批次建立 PR。

## 提案索引

| ID | 提案 | 狀態 | 依賴 |
|---|---|---|---|
| R1 | [真實專案與使用任務基準](R1-project-baseline.zh-TW.md) | done（#121） | 無 |
| R2 | [高影響相容性補強](R2-compatibility.zh-TW.md) | done（#126；nullableTimestamps） | R1 結果與具體 API 契約記錄 |
| R3 | [專案結構探索](R3-schema-exploration.zh-TW.md) | done（#123；FK 批次依證據跳過） | R1；與 R2 的關係依樣本結果決定 |
| R4 | [結構與 migration 來源串接](R4-source-navigation.zh-TW.md) | done（#128） | R1、R3；來源查詢契約記錄 |
| R5 | [單次變更閱讀流程](R5-change-reading.zh-TW.md) | done（#130） | R1、R4 |
| R6 | [整合驗收與交付](R6-acceptance.zh-TW.md) | done（#132） | 已核准且完成的前序範圍 |
| R7 | [方案 A：同一工作區閱讀變更](R7-workspace-reading.zh-TW.md) | done（#137／96f13b0；R7.1～R7.3） | 已交付 R3／R4／R5／R6 |
| R8 | [結構與 migration 變化閱讀修正](R8-reading-corrections.zh-TW.md) | in_progress（R8.1～5 ready for review；獨立驗收 pending） | R7 done；[工作項目／接手入口](R8-work-items/README.md)；milestone #43／issues #139～144 已建立 |

R 編號是研究提案 ID，不是已建立的 GitHub milestone。順序可依證據修訂；R2 不必為湊 milestone 而實作。

## 研究與模板

- [A-01 定位比對報告](A-01-positioning-report.zh-TW.md)：外部已核實能力與研究推論分開；後續决策需記錄採用或不採用的理由。
- [提案模板](TEMPLATE.zh-TW.md)。

## 使用者確認紀錄

- 2026-10-09：使用者同意同時討論「理解專案結構」與「理解單次 migration 變更」；這是產品目標共識，不是 R1～R6 實作核准。
- 2026-10-09：使用者要求依 docs/proposals/、狀態流程、確認紀錄及文件分支／PR 保存；本次只授權文件交付。雲端開發 session 負責後續檢查，研究端維持交接角色。
- 2026-10-09：先前只補登 R1.1 的紀錄已由使用者「全部核准」取代。R1～R6 修訂 2 與各批次全部 approved；雲端開發 session 可依序執行，不再要求同一範圍核准。
- 必要規格及有限 API 依 R1 證據具體化並記錄；條件式步驟保留條件，超出排除或可信度契約的需求仍另立 draft。
- 使用者已授權確定決策文件檢查後合併 main；研究 session 只更新文件，不做程式實作。
- 2026-10-10：使用者對 A／B 具體草圖與操作規則回覆「A」，核准 R7 修訂 1 的同工作區閱讀範圍及必要實作／驗收步驟；其他顯示整理仍 draft。研究端只保存文件，雲端開發 session 實作，不重問同一選擇。
- 2026-10-11：使用者在 A-06 修訂 2 與優先序後直接要求「提出詳細修改步驟 建立milestone 跟issue 告訴實作session如何做修正」，並要求列出驗收、依賴、排除。R8 修訂 1 為 approved，限已提出的摘要／主流程／literal 相關步驟／連續查看及必要交付；A-06 審查與其他候選不整份轉 approved。研究端最初保存全文但 API Forbidden 未建立（歷史）；開發端本輪已查重建立 milestone #43／issues #139～144，不能把規格 ID 當 GitHub number。

初始文件階段（歷史）：尚未建立功能 issue。文件 PR：[保存提案與派工流程 #117](https://github.com/jerryyehself/laravel-migration-visualizer/pull/117)，已合併。R1.1 核准補登 [#118](https://github.com/jerryyehself/laravel-migration-visualizer/pull/118) 已合併；全路線核准由 docs/approve-research-roadmap 分支交付；當時尚無功能 PR。目前功能交付見上表與各提案。

## 本輪完成（2026-10-09）

R1～R6 修訂 2 已依上表實際交付；R3.3 按證據跳過，其他限制保持。R6 #132 最新 head b974995d／run 37903282365 success，merge ce403562；issue #131／milestone 40 closed。後續候選仍需具體提案／核准，不把 done 重新當開工指令。

## R7 最初研究文件交接（歷史，2026-10-10）

R7 修訂 1 已核准，功能尚未開工；文件分支 `docs/r7-workspace-a`。GitHub API 本輪仍 Forbidden，文件 PR 尚未建立；未合併 main。開發端須明確取回此分支／文件並核對核准內容，不假裝 main 已包含 R7，也不把另一文件分支 `docs/a02-discovery-evidence` 的全部 draft 轉成開發需求。main 文件合併可能觸發 Pages，本研究 session 未擴張部署授權。

R7 開發端最終交付：PR #137 merge 96f13b0c2f8fba1389f5f5e915bcec346229747b；head 4080690468227623340747561111791695123890／validate run 38040663529 success。issue #135／milestone 42 closed。 雲端 verify 670 tests／12 demos，16 項工作區與九項來源返回 browser checks 通過。最新現行 main 依 Git 核對，不把上述歷史的未開工／Forbidden 當現在狀態。

## 2026-10-11 閱讀目標審查

[A-06：演變閱讀目標與 R7 交付落差](A-06-design-goal-audit.zh-TW.md) 修訂 2 為 draft，核對起點 main 2b8030a。含 20 類 UI 能力的原始／後續來源、8 類產品缺口與候選優先序；區分單表沿 migration 演變、同檔跨表差異、現行能力與呈現限制，不把 R7 done 視為全部產品目標完成。沒有新增 approved 功能，R7 的已交付狀態保留。

COORD-20261011-04：僅 R8.1 in_progress／ready for review，其他 R8 批次未開工；教學 r8-1-main-flow.zh-TW.md，停止於分支／PR，不合併 main。

## COORD-20261011-08：R8.2 交付停點

只接續 #140／R8.2，輸入 f9b42c8c220841d40978db48969feaba8c52dc43，產品 444fc9c99f7acf99f2824730ee32c0ca3e56b08d；684 tests／12 demos／15 verify 步驟及 12+14+16+9 browser 自測通過。R8.1 #145 保持固定 head／OPEN，獨立驗收仍 pending；R8.2 ready for review，stacked PR 待前批驗收／合併，不合併 main、不開始 R8.3～6。milestone #43／所有工作項目保持未完成。教學與可攜 manifest 見 docs/r8-2-change-summary.zh-TW.md、docs/acceptance/r8-2-evidence/manifest.json。

## COORD-20261011-11：R8.3 交付停點

協調端按既有使用者核准（R8修訂1@5eec414）只派 #141／R8.3。輸入3e8ee581eee16a80940c7490b491001dc2bd25eb，產品763f71d5089e45781e34ba30e55028916b065a15；698 tests、12 demos、15 verify步驟、12+12+14+16+9 browser自測通過。R8.1 #145／R8.2 #146 固定 head 不改，三批独立驗收均 pending。R8.3 in_progress／ready for review，milestone #43 open，R8.4～6未開工，不合併 main、不automerge。教學 docs/r8-3-related-changes.zh-TW.md，可攜證據 docs/acceptance/r8-3-evidence/manifest.json。規劃8c326339ff5b7656b7e73a3842029a6dfbc24eae只參考，不混產品base。

## COORD-20261011-14：R8.4交付停點

協調端按原人類核准（R8修訂1@5eec414）只派#142／R8.4。輸入8ed11ea960c7e0a046b72e3c78011c4cb744896b，產品c32b52260b6057b2b0f49d223e1c9f68b397f7c8；706tests／12demos／15verifycommands、14+12+12+14+16+9browser自測通過。R8.4父層保literal/query/view與集中側別搜尋，更新R7切步重設view舊限制；core/JSON不改。#145～147固定heads不改、R8.1～4独立驗收pending，#142 ready for review但OPEN／milestone43 OPEN，R8.5～6未開始。規劃8ea8ece98073542eaafc4b6d19f5e7ce639f074c只参考不混base。教學docs/r8-4-reading-context.zh-TW.md，證據docs/acceptance/r8-4-evidence/manifest.json。

## COORD-20261011-17：R8.5 交付停點

協調端按原人類核准（R8修訂1@5eec41476ef22b85d3165d3be3f681f1a20c8f9d）只派 #143／R8.5。固定輸入2dd3a9a348df5225f4cbf157d3c76ff5ef539622，產品ce16e471573cbf0762ad13293f715eefb61b28f7；713 tests（540core／173web）、15 verify命令／12demos與13+14+12+12+14+16+9＝90項／組browser自測通過。明細中文屬性優先、單一完整分析來源與未來時點標示、集中進階DTO／表格／診斷與兩JSON入口；core／公開JSON／golden／依賴／workflow無差異。#145～148固定驗收heads不改，COORD16及各批獨立驗收pending／offline阻礙沒有解除，不能用自測或協調核對當驗收。#143 in_progress／ready for review但OPEN，整R8與milestone43 OPEN，R8.6未開始。不合併、不automerge、不部署／release／下載落盤。規劃d2e3aaa2f761752842cdb4856afc2af0e47ba435只參考不混產品base。教學docs/r8-5-details-and-tools.zh-TW.md，12份可攜證據SHA256見docs/acceptance/r8-5-evidence/manifest.json。
