# Milestone 24：索引明確更名

Core 0.9.0 新增 `{kind:'renameIndex',table,from,to,source}` AtomicOperation。SchemaState 格式不變，外部 exhaustive operation consumers 需補此 variant。只支援 Schema::table 中獨立的 `renameIndex('old','new')`；接受兩個非空靜態字串、不接受 chained modifiers 或 Schema::create 內更名。

## 來源與範圍

核對固定 Laravel framework commit `71cf667d43f9cd3f840b1733bb2b7bec65d72282`：[Blueprint::renameIndex](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Blueprint.php#L558) 建立 from/to 指令，[MySqlGrammar::compileRenameIndex](https://github.com/laravel/framework/blob/71cf667d43f9cd3f840b1733bb2b7bec65d72282/src/Illuminate/Database/Schema/Grammars/MySqlGrammar.php#L671) 用兩個名字編譯 SQL。分析器只保存更名意圖，不執行 SQL，也不承諾每種 DB 接受這個指令。

Replay 只接受既有一般 index／unique，保留 type 與 columns 的原順序，將 record key 和 index.name 一起更新。未知表／索引、空名字、目標名稱已存在、同名操作，以及 primary 更名均拒絕。primary 拒絕與 create／chaining 拒絕是分析器保守範圍，不是宣稱 Laravel 禁止這些寫法。

不依欄位名稱猜舊索引名稱；rename 後若要 drop，必須用新名稱。原本的 primary／foreignKeys metadata 不改動，仍從權威索引同步 column.primary。不推測 DB 隱含外鍵支援索引或索引依賴。原有 Blueprint 指令調度子集合仍有效；不模擬完整 Laravel fluent command scheduling。

## 核心與 UI

normalize 像後端 command adapter，讀 PHP AST 的兩個靜態名稱並產生操作。Replay 像 domain service，驗證名字與索引類型後在拷貝的 schema 更名。若同份 migration 前面改名成功、後面遇到不存在的索引，整檔仍回滾；lastValidSchema 保留原名，後續 snapshots/diff 為 null。

SchemaDiff 維持結構比較，顯示 indexRemoved + indexAdded，沒有新增 semantic rename detector。component 是畫面單元、state 保存可變的選取／視圖資料、props 傳遞分析結果。React 直接呈現 core 的新操作 JSON 與既有 diff，不在 hooks 重新判斷索引。沒有 UI 修改或瀏覽器互動驗收。

## 接回與驗證

2026-10-04 從雲端取回 `feat/m24-rename-index` WIP commit `045e041a9813440db2c893aad70597af0a043346`，原有 7 份測試／PHP／golden 檔案完整保留；雲端已停止開發。M23 已交付基準 main=a8d7b5a、core 0.8.0、446 tests；原本 M22 的本地版本仍保留於 baseline/local-m22。

30 個接手回歸在實作前為 15 failed／15 passed。核心實作後，一個 assertion 把兩項結構 diff 誤當成一項，改為定位 indexAdded 後檢查拷貝隔離；golden 未改動。涵蓋 index／unique、複合欄位順序、primary／foreignKeys 保留、非法語法、公開 replay source／operationIndex、特殊名字 __proto__/constructor、不可變、rename→drop 與跨檔失敗信任邊界。

自行撰寫的四份 PHP fixture 與獨立推導的 success／blocked golden 檢查完整前後快照、diff、最終 schema 與診斷 codes，不是官方樣本。執行 npm run demo:index-rename 可驗證建置後公開 package 的三檔成功與中途失敗流程，CI 加入同一命令。

476／476 tests、typecheck、build 與七個 demo 全數通過。PR 狀態見 github-milestones.md。未加入 timeline、down()、AI、SQL parser、runtime execution 或 semantic refactoring detection。
