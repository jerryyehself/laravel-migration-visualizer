# A-02：功能探索方法與需求證據審查

- 狀態：draft（研究報告與建議流程；不是功能核准）
- 日期／修訂：2026-10-10（Asia/Taipei）／1
- 負責端：研究與決策交接 session
- 核對起點：遠端 main／本地 HEAD `2fe510870c4d41d7c24459173d7e32f2f625968c`；不是永久最新 SHA
- 相關 issue／功能 PR：無；未建立 R7、未安排開發
- 文件交付：`docs/a02-discovery-evidence`；PR 尚未建立

## 要解決的問題

先前助理從功能缺口直接提出整批 migration 總覽、可複製說明、工作台暫存及動畫方向，沒有先確認實際任務與未滿足需求。之後引用通用 code review 指南，也不足以支持特定 migration 功能。此報告先查核功能探索方法，再審查那些建議；不以原建議成立為研究前提。

方法來源、一般問題研究、LMV 使用者需求與功能效果是不同證據。找到方法指南不等於找到 LMV 需求；找到技術限制不等於值得投入。缺證據也不等於已證明功能毫無價值。

## 查核方法與限制

唯讀取得機構官方原始文件，閱讀相關段落並保存來源 commit。18F 舊 product-guide 的 README 明示已移轉至 consolidated guides，因此主要引用新來源。第三方副本只在 repo 外暫存；未安裝或執行競品／專案程式。

此環境未提供獨立搜尋或模型路由工具；本次由目前可用模型透過官方 GitHub 原始資料進行查核，沒有另選或啟動研究模型。是否需要其他研究模型的補查尚未完成，不把工具取檔稱為模型切換。

Crossref、Microsoft Research、Google Research、作者研究室與出版平台原始論文查核尚未完成；先前取得 403。Google 書籍章節可讀，但其引用的論文不能算已讀全文。GitHub API 查詢也回覆 Forbidden，不能聲稱檢索過完整使用者 issues。這些是資料取得限制，不是「沒有相關研究」的證據。

## 已讀來源與能支持的結論

18F 是美國政府數位服務團隊的公開實務指南；本報告核對的 consolidated source commit 為 `debc24b34f23686194d9fe42e391859d569bd39a`（最後 commit 日期 2025-01-24）。它能支持方法選擇，不能提供 Laravel／SA 需求比例或效果量。以下只使用相關本文，不把未讀的延伸資源算成查核成果。

| 來源 | 本文要點 | 對 LMV 的使用方式／限制 |
|---|---|---|
| [18F：Define the problem](https://github.com/18F/guides/blob/debc24b34f23686194d9fe42e391859d569bd39a/content/product/define/problem.md) | “Informs decisions about solutions without prescribing a specific solution”；用研究驗證痛點，按 frequency、urgency、impact 排序 | 先寫誰在何種任務受影響，不把「需要動畫」當問題陳述 |
| [18F：Understand users and their as-is process](https://github.com/18F/guides/blob/debc24b34f23686194d9fe42e391859d569bd39a/content/product/discover/users.md) | 了解使用者現在如何完成工作、步驟、工具、分歧與痛點；必要時量化質性發現 | 不憑工程師／SA 職稱推定需求；整理現有解法和它的不足 |
| [18F：Craft a roadmap](https://github.com/18F/guides/blob/debc24b34f23686194d9fe42e391859d569bd39a/content/product/define/roadmap.md) | 用問題或成果表達方向；完整建置前可透過原型增加信心 | roadmap 不是功能承諾；先前候選不形成開發清單 |
| [18F：Comparative analysis](https://github.com/18F/guides/blob/debc24b34f23686194d9fe42e391859d569bd39a/content/methods/decide/comparative-analysis.md) | 先建立比較準則，再比較選定產品的具體經驗 | 比較同一任務，而非只列功能；README 未提及不代表不存在 |
| [18F：Design hypothesis](https://github.com/18F/guides/blob/debc24b34f23686194d9fe42e391859d569bd39a/content/methods/decide/design-hypothesis.md) | 指定對象、措施、預期成果與可觀察信號，以實驗修正方向 | 提案需寫成功與否定條件，避免用「完成開發」當價值驗收。該頁 description 與主題不符，本報告依本文而非錯置的摘要 |
| [18F：Contextual inquiry](https://github.com/18F/guides/blob/debc24b34f23686194d9fe42e391859d569bd39a/content/methods/discover/contextual-inquiry.md) | 在同意下觀察典型工作，再提問和核對理解 | 未經授權不聯絡或觀察他人；這份報告沒有執行訪談 |
| [18F：Prototyping](https://github.com/18F/guides/blob/debc24b34f23686194d9fe42e391859d569bd39a/content/methods/make/prototyping.md)、[Usability testing](https://github.com/18F/guides/blob/debc24b34f23686194d9fe42e391859d569bd39a/content/methods/validate/usability-testing.md) | 可用靜態草圖或既有產品觀察指定任務，依使用行為調整 | 需求成立後再選低成本驗證；沒有因此核准 coded prototype、競品安裝或功能開發 |
| [Google Engineering Practices：CL descriptions](https://github.com/google/eng-practices/blob/master/review/developer/cl-descriptions.md) | 描述主要改動與原因；原始碼未必交代 why | 不能推導出「逐項列 schema 變化貼 PR」是慣例，也不能證明需要 LMV 產生 |
| [Google：Small CLs](https://github.com/google/eng-practices/blob/master/review/developer/small-cls.md)、[Code review chapter](https://github.com/abseil/abseil.github.io/blob/master/resources/swe-book/html/ch09.html) | 聚焦自足變更、理解、知識分享與歷史紀錄 | 不把任意連續 migrations 當同一業務變更；一般 review 價值不等於整批總覽需求 |
| [Google：Measuring Engineering Productivity](https://github.com/abseil/abseil.github.io/blob/master/resources/swe-book/html/ch07.html) | 先問測量對決策是否有用；工具指標不一定等於使用者經驗，結合質性與量化資料 | 自動化通過／功能數量不能代替使用者受益，避免假精確評分 |

## 候選方法與取捨

| 方法組合 | 能得到什麼 | 缺點／適用條件 |
|---|---|---|
| 從競品功能差異直接想功能 | 快速形成構想 | 沒有需求證據；不採為推薦依據 |
| 只做文獻與公開資料研究 | 能查既有問題、方法、案例與限制；目前可先完成的工作 | 不足以直接證明 LMV 族群的頻率、採用與收益 |
| 文獻／公開資料＋現有工作流程證據＋同任務比較＋有限概念驗證 | 能逐步連結問題、解法與效果，及早淘汰候選 | 需要真實任務；訪談／原型須先有具體範圍與相應授權 |

## 建議方向（draft）

採第三種組合分階段進行；本次只完成方法查核、既有證據審查和研究記錄格式。這是依機構指南整理的 LMV 建議流程，並非指南已驗證 LMV 的研究結果，也不是使用者已核准的新路線。

1. 問題：誰正在做什麼、現有工具與流程、何處有損失。記錄實際事件和來源，不問「你想不想要這個功能」來代替需求。
2. 核對：是否已有 R1～R6 能力、Git diff、IDE 或其他工具能完成；現有替代方案不足須有證據。
3. 同任務比較：對競品固定版本／入口、評估準則、已實測／只有文件／未確認。差異不等於需求，也不直接要求全面對標。
4. 假設：有問題證據後才列候選解法、最小範圍、可能收益及否定條件。缺資料不填分數，不虛構成本估算。
5. 驗證：有具體授權後用靜態草圖或現有畫面對照，觀察正確理解、完成任務、操作與時間；小樣本結論不外推市場規模。
6. 決策：證據支持才提具名開發範圍。若既有工具已足夠、沒有任務收益或投入不划算，可維持現狀。使用者確認後才能 approved。

## 先前所有建議的審查

| 候選 | 現有證據 | 尚缺什麼 | 本次處置 |
|---|---|---|---|
| 整批 migration 總覽 | R5 有單份閱讀；一般 review 指南要求理解脈絡 | 實際多檔任務的困難與頻率、R5／Git diff 不足、總覽的收益；所選檔案是否同一目的 | 撤下優先建議；未驗證候選 |
| 可複製變更說明 | Google 支持清楚描述主要改動和原因 | 沒有逐項 schema 摘要貼 PR 的慣例證據；沒有 LMV 產生摘要的需求或採用證據 | 撤下優先建議；不由 migration 推導業務理由 |
| 暫存／恢復 | README 明列刷新會失去輸入／結果 | 真實丟失工作事件、頻率、恢復代價與保存需求；保存 PHP 的邊界 | 未驗證候選；限制不等於需求 |
| 動畫／步進 | 使用者提出偏好方向，沒有核准具體範圍 | 任務、對象、對靜態比較的效果；沒有 SA 需求證據，也未完成動畫實證論文查核 | 未驗證候選；timeline 維持排除，不開發 |
| 相容性／阻斷補強與未知結果探索 | R1／R6 固定樣本確有 after(callback)、DB write 和輸入缺口 | 使用者任務收益、頻率、後續限制與維護成本 | 使用者已決定延後；不啟動新樣本或補核心批次 |

R1／R6 的 source hashes、分析與自動化瀏覽器任務證明固定案例的分析／互動行為；沒有真人使用者研究，不能直接當成市場需求或人類理解效率實驗。R3.3 FK 導覽缺證據而跳過仍有效。A-01 的競品功能描述與「雙目標」共識不核准其餘候選功能；歷史 R1～R6 未核准的敘述以後續核准／done 紀錄為準。

## 問題證據記錄格式

每個問題建立下列記錄；可以沒有候選解法，不以湊功能或 milestone 為目標。

| 欄位 | 記錄要求 |
|---|---|
| 來源與證據類型 | 原文／固定版本／日期；機構方法、實證研究、使用事件、技術案例、推論分開 |
| 對象與任務 | 實際職責及任務，不從 SA／工程師名稱直接推定需求 |
| 現有流程與問題 | 使用的工具、步驟、具體失敗／損失；目前已知及未知 |
| 頻率、影響、替代方案 | 觀測或回報依據；沒資料標未知；比較既有 LMV／其他工具 |
| 競品差異 | 同任務是否解決、已讀官方資料或實測、未確認部分 |
| 候選與否定條件 | 為何可能有效、可縮小範圍；什麼結果會放棄 |
| 狀態與授權 | 尚需何種證據；使用者確認、issue／PR 依實際狀態填寫 |

## 批次、交付物與停止點

| 批次 | 前置條件 | 本次範圍 | 交付物／驗證 | 停止點 |
|---|---|---|---|---|
| A-02.1 方法查核 | 使用者要求查資料，並要求先查功能構思模式 | 官方方法與其可支持的結論；核對移轉來源與限制 | 上述固定來源與分析；唯讀來源核對完成 | 不聲稱已訪談、研究市場規模或讀完受阻論文 |
| A-02.2 既有建議審查 | 方法文件已可讀；main／R1～R6 核對 | 所有已提候選與證據差距，不新增開發需求 | 上述審查表與問題記錄格式；文件檢查 | 不從一般文獻直接核准任一功能 |
| 後續公開資料補查（未完成） | 所需來源可取得；記錄具體檢索問題 | 查真實工作問題、原始論文方法／結果及反證 | 問題與證據清單，含無法成立項目與方法限制 | 不以付費牆／403當無研究；不安排訪談、coded prototype、R7 或開發 |

## 範圍與排除

只做研究、文件與交接；未改應用程式、tests、設定、scripts、workflow，未安裝依賴、執行專案程式、部署或排程。不解析使用者 Laravel 的 model／service；「分析核心」指 LMV migration-core。下載互動／落盤驗收維持暫緩。核心可信度、DTO、語意 rename 排除不變。

## 驗收

所有推薦可追溯到已讀來源；指南、問題證據與功能驗證不混用；每個既有候選都有證據缺口與處置；文件保持 draft。檢查相對連結、來源引用、diff 與改動範圍，不執行 npm／專案程式。這些是文件驗證，不是新功能或需求實驗。

## 使用者確認紀錄

2026-10-10（本 session／Asia/Taipei）：使用者要求找可信文獻分析全部先前建議，指正功能構思與需求驗證應先查資料，並要求開始執行。兩條持續規則原文：

> 1.不要只是順從我的話，但如果要質疑或反駁我要有理有據，最好有實質文獻證據
> 2.探索性及提供建議的相關任務要先用適合查資料的模型查相關資料
> 這是所有對話都應該遵守的規則

研究工作已授權；本報告的方法建議與候選功能尚未核准，不能自行標 approved。使用者延後相容性／阻斷處理的決定有效。這份記錄保存本 session 可見指示，不聲稱已修改全域個人化設定或保證其他 session 載入。

## 交付與 publication 影響

文件分支 `docs/a02-discovery-evidence`；PR 未建立，GitHub API 唯讀檢查回覆 Forbidden。若可建立 PR，文件保存不等於核准功能。

`.github/workflows/pages.yml` 對 main push 沒有 docs path 排除；合併文件也會觸發既有 Pages build／deploy。依使用者研究角色與禁止部署的界線，本批不合併 main、不修改 workflow。只保存供審查的文件分支，不擴張部署授權。PR 如建立，既有 pull_request CI 會自行執行既有驗證；本 session 不手動執行或派送專案程式。
