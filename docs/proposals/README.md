# 研究提案與開發核准入口

更新日期：2026-10-09。研究基準 main：60eb253185cbeb662a660345d76274f7857082c4；此 SHA 是核對起點，不是永久最新版本。

## 工作流程（使用者已確認）

研究 session 可寫提案；只有使用者明確確認具體提案與範圍後，才可標為 approved。助理不能自行核准。文件 PR 的建立、審閱或合併只保存內容，不等於核准其中的功能。歷史自主開發授權不覆蓋此流程。

狀態順序：draft → approved → in_progress → done。

| 狀態 | 意義與必要證據 |
|---|---|
| draft | 可研究、討論與修訂；不可開始該提案的實作／開發 issues。 |
| approved | 使用者已確認指定 ID、版本與範圍；文件記錄日期、確認內容與來源。 |
| in_progress | 本地開發端開始已核准工作；記錄負責 session、issue／PR 與實際範圍。 |
| done | 核准範圍已驗收交付；記錄 merge commit、驗證與限制，不把僅有程式碼當成完成。 |

若 approved 後新增範圍，新增 draft 提案或保留原核准內容、另列待核准變更；未核准部分不可實作。不要把 done 提案重新解讀成新授權。

## 本地開發端每次收到「繼續」

1. 保護未提交工作；同步遠端、核對 main 與文件 PR 的實際狀態，不盲目 pull 或覆蓋本地變更。
2. 讀 AGENTS.md、本入口、已核准提案及其依赖；參考 A-01 報告。未合併文件必須明確取得指定 PR／分支，不假裝已在 main。
3. 只從 approved 項目選下一個有邊界的任務；續作 in_progress 必須能追溯原核准記錄。
4. 若沒有可執行核准項目，回報候選及缺少的確認，不自行批准 draft。
5. 更新狀態與 issue／PR／驗收證據。研究端維持研究與交接，不同時實作。

不做背景輪詢。本次沒有排程；固定時間檢查須另行設置與授權。

## 提案索引

| ID | 提案 | 狀態 | 依赖 |
|---|---|---|---|
| R1 | [真實專案與使用任務基準](R1-project-baseline.zh-TW.md) | draft | 無 |
| R2 | [高影響相容性補強](R2-compatibility.zh-TW.md) | draft | R1 結果與具體 API 範圍核准 |
| R3 | [專案結構探索](R3-schema-exploration.zh-TW.md) | draft | R1；與 R2 的關係依樣本結果決定 |
| R4 | [結構與 migration 來源串接](R4-source-navigation.zh-TW.md) | draft | R1、R3；來源查詢契約核准 |
| R5 | [單次變更閱讀流程](R5-change-reading.zh-TW.md) | draft | R1、R4 |
| R6 | [整合驗收與交付](R6-acceptance.zh-TW.md) | draft | 已核准且完成的前序範圍 |

R 編號是研究提案 ID，不是已建立的 GitHub milestone。順序可依證據修訂；R2 不必為湊 milestone 而實作。

## 研究與模板

- [A-01 定位比對報告](A-01-positioning-report.zh-TW.md)：外部已核實能力與研究推論分開；後續决策需記錄採用或不採用的理由。
- [提案模板](TEMPLATE.zh-TW.md)。

## 使用者確認紀錄

- 2026-10-09：使用者同意同時討論「理解專案結構」與「理解單次 migration 變更」；這是產品目標共識，不是 R1～R6 實作核准。
- 2026-10-09：使用者要求依 docs/proposals/、狀態流程、確認紀錄及文件分支／PR 保存；本次只授權文件交付。本地負責後續檢查，研究端維持交接角色。
- 各 R 提案目前沒有個別實作核准。不得以「照這個去做」的文件保存指令推定整批功能 approved。

相關 issue：未建立。文件 PR：由本次 docs/research-proposals 分支提出；查詢該分支 PR 取得實際編號。功能 PR：無。
