# R8.2：跨表與屬性前後變更摘要

COORD-20261011-08 明確核准只接續 R8.2／issue #140，milestone #43 保持 open。輸入產品／文件 head f9b42c8c220841d40978db48969feaba8c52dc43（R8.1 產品 d849b4e8a0ea79e65b8d459a975476b57fe75538）；核准規格 5eec41476ef22b85d3165d3be3f681f1a20c8f9d 已由前批保存。07842cca988c17f6cfa21f8f0665114f9a0eec3a 的規劃交接只作參考，沒有混進產品 base。核對時規劃分支遠端已到 8c326339ff5b7656b7e73a3842029a6dfbc24eae，這不改變本輪指定輸入。

R8.1 PR #145 仍 OPEN、固定 f9b42c8…；COORD-07 comment：https://github.com/jerryyehself/laravel-migration-visualizer/pull/145#issuecomment-6105604142 。R7/IR COORD-03 與 R8.1 COORD-06 獨立驗收仍 pending，環境 offline 不等於通過。本批只交付 stacked PR，不合併 main、不開 R8.3～6。

## 讀什麼與怎麼呈現

`change-summary.ts` 是純 web adapter，直接讀 core 的 SchemaDiff。用 Map 按 change.table（owning table）分組，不把 FK 引用表列成修改表，不產生新的差異。Column changed 只列真的屬性變化：commerce price 顯示 decimal(8,2)→decimal(10,2)、nullable false→true、default 未指定→0。完整值在摘要可讀，不必展開 JSON。

own-property 存在性先比較，再比較值；缺省、NULL、false、0、空字串各不同。allowedValues、索引欄位、FK 欄位與引用欄位依既有陣列順序呈現。索引／外鍵保留名稱、型別／引用及 actions，沒有補 DB defaults。整表新增／移除保持一筆核心差異，以可展開的已知內容顯示 columns／indexes／foreignKeys；不製造額外核心 changes。

主要摘要在 ERD 前，前後比較也只列一次。新增只提供 After、移除只提供 Before、變更提供兩側可信明細；索引／外鍵導向所屬表明細。FK 的引用表／欄位另標關係上下文，在各側自己的快照導航；不存在與未知停用並說明原因。rename 語法操作仍與 removed＋added 分開；drop 後同名 add 仍可能是淨 columnChanged，不追物件身分。

來源重用 R4 名稱操作索引，列完整分析順序的涉及操作。這不是每筆差異的一對一 PHP 因果映射；不唯一檔名／未知位置沿用既有拒絕定位。來源返回恢復原摘要按鈕焦點，不更動輸入與 DTO。原 R7 明細／圖形切側重設契約保留，R8.4 連續上下文尚未實作。

## 後端類比

core 是 domain service，SchemaChange 是其回應 DTO。adapter 像 controller 的純 presentation mapper，負責中文標籤與前後值；不跑 replay，也不改 DTO。ChangeSummary 是 rendering component（畫面單元），props 接收 step、analysis 與導航 callback；ProjectResults 的既有 state 管理時點／選取。增加摘要沒有把 schema 規則搬进 React hooks，也沒有新增 history state。

## 實測與失敗修正

固定產品 commit：444fc9c99f7acf99f2824730ee32c0ca3e56b08d。乾淨 checkout 執行 npm run verify，15 步均 exit 0：684 tests（540 core／144 web）、typecheck、build、12 個 built-package demos。新增 11 個 web 行為回歸；core、公開 JSON、golden、依賴、workflow 全無變更。

真實 Chromium：R8.2 12 組、R8.1 14 組、R7 16 組、IR 9 項，共 51 項／組；console warning/error 與 pageerror 空白。R8.2 涵蓋 commerce、各側鍵盤、名稱來源返回焦點、比較單一摘要／ERD 前置、foreign-keys 第三份舊新外鍵及引用欄位、rename／netdiff、整表增刪、failed／blocked、known empty、390px 無橫向溢出。SSR／adapter 測試另涵蓋 explicit null／false／0／缺省、有序欄位及 actions、特殊名稱與不變 DTO。這是開發自測，不能代替獨立驗收。

首輪新增 adapter 回歸先因尚未有 module 失敗，實作後通過。TypeScript 初次指出 unknown array 在 callback 的 narrowing，改用局部變數保持 narrowing。瀏覽器首輪把 commerce 第八份誤當 price，修成第七份；known-empty probe 初次改到反向輸入清單的另一份，修成依完整 filename 明確選取。這些是測試／型別接線修正，沒有盲改 golden。原 IR 腳本查來源改成限制於固定明細區，避免新摘要中收合的同名來源入口混淆測試。

可攜證據：[manifest](acceptance/r8-2-evidence/manifest.json)，含每份 report／截圖／失敗紀錄的 SHA256；verify 與新增 browser report 標固定產品 SHA。桌面與390px 截圖已實際檢視。前批原始證據未覆寫；本輪回歸另保存副本。

## 停止點與限制

R8.2 in_progress／ready for review、issue #140 保持 OPEN，整批 R8 未完成、milestone #43 OPEN；R8.3～6 未開工。需協調端安排新固定 head 的獨立複驗，依賴 R8.1 通過／合併後才能整合；不啟動 automerge。main 核對仍是 2b8030a7d19963980190ba860888f243883b6d7b。

沒有新增資料庫安全判斷、rename 身分、任意時間 diff、來源推測、下載落盤、正式部署或 release。未知快照不借最後可信前綴補值。完整進階 JSON 入口仍存在；摘要不是完整 Laravel／DB runtime 支援。
