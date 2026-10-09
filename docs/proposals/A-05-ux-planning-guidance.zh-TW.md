# A-05：UI／UX 規劃來源與工作指引

- 狀態：draft
- 日期／修訂：2026-10-10（Asia/Taipei）／1
- 負責端：研究與決策交接；不實作程式或修改設定／skills
- 核對基準：main `2fe510870c4d41d7c24459173d7e32f2f625968c`
- 依賴：[A-04 修訂 2](A-04-ui-presentation-audit.zh-TW.md)、已交付 R3～R6
- 問題來源：使用者要求先找畫面／UI／UX skill、agent 或指引，建議參考 NN/g 與 Don Norman
- 功能 issue／PR：未建立；文件分支 `docs/a02-discovery-evidence`，文件 PR 尚未建立

## 問題與來源查核

現有 `.agents/skills/migration-ui-review/SKILL.md` 主要保護快照、比較、來源、焦點與匯出的正確性，沒有完整的使用者任務、資訊架構、概念模型與低保真方案比較流程。不能以已有 UI skill 推論已做足 UX 規劃，也不能以通過測試推論操作直觀。

本輪查詢可用 skill catalog：cloud 只有環境 runtime／setup，executor 沒有其他已提供的 skill。唯讀查核以下公開官方來源；沒有安裝 skill、啟動 agent、依賴或專案程式。環境沒有研究模型切換／瀏覽搜尋工具，沒有宣稱使用另一模型。

| 來源 | 本輪取得 | 適用與限制 |
|---|---|---|
| [Vercel web-design-guidelines skill](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines/SKILL.md) | 已讀固定版本原文 | UI 原始碼檢查流程；適合可用性、無障礙及互動審查，不是使用者任務研究 |
| [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md) | 已讀固定版本原文 | 具體規則包括鍵盤替代、可見焦點、明確按鈕標籤、錯誤下一步與空狀態；不是每條都適用 LMV |
| [Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design/SKILL.md) | 已讀固定版本原文 | 先 brief／設計計畫／wireframe，再檢視與實作；偏視覺辨識、字體及布局，不能代替順序閱讀流程設計 |
| [NN/g：10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) | 原文請求被 403 擋下 | 使用者指定來源，待核對；不宣稱本輪讀到全文 |
| [NN/g：Visibility of System Status](https://www.nngroup.com/articles/visibility-system-status/) | 原文請求被 403 擋下 | 同上；不以未讀文章支持具體布局或量化效益 |
| [Don Norman：Signifiers, Not Affordances](https://jnd.org/signifiers_not_affordances/) | 作者官網請求被 403 擋下 | 待核對作者原文；不引用假造原文或頁碼 |
| Don Norman, *The Design of Everyday Things*, Revised and Expanded Edition, Basic Books, 2013 | 本輪未取得書籍全文 | 以下概念是既有知識概述；沒有聲稱本輪逐章閱讀或用本書證明 LMV 需求強度 |
| [18F：Heuristic evaluation](https://github.com/18F/guides/blob/debc24b34f23686194d9fe42e391859d569bd39a/content/methods/discover/heuristic-evaluation.md) | 前輪已讀原文 | 明確引介 Nielsen 原則，舉狀態回饋與使用者語言為例；屬已讀的間接來源，不等於 NN/g 原文 |

NN/g 與 Norman 官網的限制來自目前網路存取；重複相同請求不能補證據。本 session 不修改環境設定或繞過代理。原文核對仍是未完成項目，不能把找到 URL 當作完成閱讀。

## 候選做法與取捨

| 做法 | 優點 | 不足／風險 |
|---|---|---|
| 只用現有 migration-ui-review | 延續 core／DTO 契約與已有驗收 | 無法獨自回答哪些操作該出現、選取如何一致、如何連續閱讀 |
| 只套 frontend-design | 能產出視覺方向與布局方案 | 可能先美化而未解決任務；其中首頁 hero 等建議不應直接套到分析工作台 |
| 只套 Vercel 檢查表 | 有可查的無障礙／互動規則 | 通過規則仍不代表任務容易完成；URL 同步、虛擬清單等不能自動成為本專案新需求 |
| 任務與狀態規劃 → 低保真方案 → 視覺整理 → 專案驗收 | 每層都有不同目的及交付物，可追溯問題與方案 | 需要先做規劃文件／畫面，不應直接從問題清單進入程式改動；建議採此方式，仍待使用者確認具體範圍 |

外部 skills 是本輪比較的參考，未安裝、未啟用為專案規格。它們的程式實作指令、通用美學與額外功能不擴張本 session 授權。

## Norman／Nielsen 概念框架與專案應用

以下是概念概要及本 session 的候選應用，不是本輪新讀原文的摘錄。原文核對待完成；已核對的程式觸發與回饋見 A-04。

| 概念 | 用來檢查什麼 | LMV 可評估的具體問題 |
|---|---|---|
| 概念模型（conceptual model） | 使用者如何理解「目前看到什麼」 | 專案總覽、某份 migration 的前／後、選中的表應有明確上下文，不能圖與摘要各指不同檔 |
| 操作指示（signifiers） | 看得出哪裡能操作，以及操作用途嗎 | 表節點的選取與拖移如何辨識；不能用「看起來能點」替代實際入口設計 |
| 對應（mapping） | 控制與它影響的內容是否有清楚關係 | 選 migration 對應同一步驟的圖／摘要；前後控制對應真實 before／after |
| 回饋（feedback）／狀態可見 | 操作後看得出結果與所在位置嗎 | 顯示目前第幾份、哪一側、哪張表；切換、來源預覽與返回有明確回饋 |
| 限制（constraints） | 無法完成的操作是否清楚且有理由 | 未知快照不能顯示推測圖；表不存在與整個快照未知要分開說明 |
| 辨認優於回憶（recognition rather than recall；Nielsen） | 是否逼使用者記住隱藏的選取與前一步 | 避免在長選單反覆找同一份／同一張表；必要上下文保持可見 |

這些概念不直接推出「一定要三欄布局」或「一定要加時間軸」。固定側欄、分頁、順序控制都只是可比較的解法，應由任務與狀態驗證選擇。

## 建議規劃指引與交付物

1. **先寫使用任務與答案**：用「找出欄位何時新增／移除」等問題描述目的，不從元件或按鈕數量出發。
2. **列出目前路徑**：逐步記錄入口、操作、更新區域、出現條件與來源；程式核對與瀏覽器觀察分開。
3. **畫兩個低保真方案**：比較整合工作區與分開總覽／逐份檢視。展示相同任務與例子，不用漂亮程度決定優劣。
4. **每個方案附狀態／操作表**：哪些內容持續可見、何時可操作、何時禁用、何時顯示空狀態、操作改變什麼、保留什麼、如何返回。
5. **做任務走查**：從匯入到回答問題，逐步核對沒有圖文時點矛盾、隱藏必要入口或無理由跳位。這是設計走查，不宣稱真人測試。
6. **最後才決定視覺樣式與開發範圍**：字體／間距／層級服務已確定流程；用專案 UI skill 與適用的 Vercel 規則交接驗收。

每次交付至少包含：任務表、來源／限制、現況路徑、兩個方案、完整狀態表、取捨、具體驗收、確認紀錄。使用者確認具體修訂前保持 draft。

### 用現有真實內容做設計走查

以下使用 repo 既有自撰 `packages/migration-core/tests/fixtures/project/` 三檔，不假稱外部真實專案需求證據。沒有執行分析，預期由已讀 PHP 與既有交付契約描述，後續由開發端核對。

| 任務 | 現有內容／需要讀出的答案 | 設計需展示 |
|---|---|---|
| 找 nickname 何時新增又何時移除 | 第二份 update_users 新增 nullable nickname；第三份 revise_users 移除 | 表選取、順序導航、前後存在狀態、來源入口 |
| 看 display_name 的兩次定義差別 | 第二份明確 rename name→display_name；第三份先 drop 再新增長度 200、nullable 的 display_name | 操作證據與結構差異分開；不能把同名重建猜成 changeColumn |
| 找最終 users 結構與來源 | 專案總覽後能進表／欄位，再回到來源及原查看位置 | 單一選取上下文、明細入口與來源返回 |
| 分析未完成時理解可讀範圍 | 使用既有失敗案例或 R6 固定真實樣本；final 未知 | 失敗原因、未套用操作、已知前綴與未知側別，不以繼續跳檔冒充完整結果 |

### 畫面出現條件的最小表

| 狀態 | 使用者應能看見 | 可用操作／說明 |
|---|---|---|
| 尚未分析 | 匯入入口、已選檔案與分析操作 | 結果區說明下一步，不出現舊 DTO |
| 已分析、未選表 | 當前檢視／migration／側別、圖或未知提示 | 明細區有選表提示與可發現入口 |
| 已選表且該側存在 | 表名稱、該側屬性、來源入口 | 不必因選取來自搜尋或圖而使用不同展開規則 |
| 該側沒有選中的表 | 選中名稱與此時點不存在提示 | 可回其他已知時點；不默默改選別張表 |
| 快照未知 | 當前步驟與未知原因 | 可讀診斷及語法證據，不畫推測結果 |
| 來源預覽 | 檔案／行號、操作狀態與返回入口 | 保留進入前的結構上下文，避免來源選取意外改成另一個時點 |
| 輸入修改後 | 舊結果已失效、重新分析入口 | 不呈現舊來源／匯出作為新輸入結果 |

像後端 request DTO 有明確狀態與欄位，UI 的規劃表也要定義「輸入哪個狀態，顯示哪些區域，這個操作產生哪個下一狀態」。這是說明方式，不表示新增後端 service、解析 model 或變更 core。

## 範圍、排除、批次與驗收

本輪範圍是 skill／指引查核與研究端規劃文件。未修改 `.agents/skills`、AGENTS.md、設定、測試、scripts、workflow 或程式；沒有安裝依賴、agent／plugin、部署、背景排程或對外聯絡。

| 批次 | 前置條件 | 交付物與驗證 | 停止點 |
|---|---|---|---|
| A-05.1 來源與指引 | 使用者本次指定方向；官方 GitHub 可唯讀 | 本文件、固定官方 skill 版本、原文可讀／受阻紀錄；文件 diff 檢查 | 原文未讀則記待核對；不假裝完成 NN/g／書籍研究，不安裝 skill |
| 候選下一批：規劃畫面 | 可用來源、A-04、具體任務及使用者方向 | 兩個低保真方案、相同任務走查與操作狀態表；評估選取一致性、入口可發現、未知提示及來源返回 | 研究端交付 draft；不直接實作、不把概念當功能核准 |
| 待核准開發批次 | 使用者確認具體畫面、狀態規則、範圍與修訂 | 開發端依專案 skill 驗證真實操作、必要測試與畫面證據 | 不擴增核心、改名歷史追蹤、時間軸、AI、持久化、部署或下載驗收 |

文件驗收只證明來源與推論可追溯，不證明使用者能順利完成任務。畫面驗收也需分開「設計走查」「瀏覽器實測」「真人測試」；沒有量測時，不報虛構節省點擊比例或完成時間。

## 確認與交付紀錄

2026-10-10，使用者要求先查 UI／UX skill／agent／指引，並指定 NN/g 與 Norman 為參考；授權研究，尚未核准安裝或具體功能。A-04 與本文件保持 draft，不建立開發 issue。

本文件保存於既有文件分支；未合併 main。文件 PR 尚未建立，先前 GitHub API Forbidden；不把分支保存稱為 PR／main 交付。main push 可能觸發 Pages，維持研究 session 不自行部署的界線。
