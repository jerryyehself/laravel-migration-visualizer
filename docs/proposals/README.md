# 研究提案與開發核准入口

更新日期：2026-10-09。研究基準 main：60eb253185cbeb662a660345d76274f7857082c4；此 SHA 是核對起點，不是永久最新版本。

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

相關 issue：未建立。文件 PR：[保存提案與派工流程 #117](https://github.com/jerryyehself/laravel-migration-visualizer/pull/117)，已合併。R1.1 核准補登 [#118](https://github.com/jerryyehself/laravel-migration-visualizer/pull/118) 已合併；全路線核准由 docs/approve-research-roadmap 分支交付。功能 PR：無。

## 本輪完成（2026-10-09）

R1～R6 修訂 2 已依上表實際交付；R3.3 按證據跳過，其他限制保持。R6 #132 最新 head b974995d／run 37903282365 success，merge ce403562；issue #131／milestone 40 closed。後續候選仍需具體提案／核准，不把 done 重新當開工指令。
