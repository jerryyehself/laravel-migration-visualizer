# Milestone 37：R2 nullableTimestamps 靜態別名

核准 PR #119／R2 修訂 2；R1 PR #121 已交付，issue #125／milestone 37。核心 0.15.0；SchemaState、AtomicOperation、操作順序與匯出 JSON 形狀不變。本批只處理 R1 BookStack 首檔揭露的 nullableTimestamps，其他候選 API 不自動加入。

## 固定來源與契約

BookStack commit ff661b59f6f605bf768fe850c0d0a8a2dc09d203 的 composer.lock 使用 Laravel v12.69.3，framework source commit 58ea544a2a80dc03c168e13a5dc9a1d176a88717。

[Blueprint nullableTimestamps:1288](https://github.com/laravel/framework/blob/58ea544a2a80dc03c168e13a5dc9a1d176a88717/src/Illuminate/Database/Schema/Blueprint.php#L1288) 直接委派 timestamps:1272；依序呼叫 timestamp(created_at／updated_at)->nullable()。本次下載 Blueprint.php 的 SHA-256 是 78cf6274c8cb061f545cc7738366411fe2966654d6ed651cef4e79ed7cd9fb90。

| 呼叫 | 支援／拒絕與原因 |
|---|---|
| nullableTimestamps() | 兩個 nullable timestamp addColumn，共用 PHP 來源；沿用 timestamps 省略 precision=0 的分析器政策 |
| nullableTimestamps(0)／(3) | 一個靜態非負整數 precision，兩欄位相同；不承諾任意 DB 接受所有整數 |
| 明確 null／bool／字串／小數／負值／動態／額外參數 | 拒絕；沿用既有靜態 precision 子集合，Laravel 可接受 null 不等於本工具必須推定 runtime default |
| ->nullable／default／useCurrent／useCurrentOnUpdate／index／change | 拒絕全部修飾鏈；上游回傳 collection，不能當成一般單欄位 definition；M22 helper change 排除仍有效 |
| nullableTimestampsTz | 本批無样本證據，不新增支援 |
| DB::table(...)->insert | 維持拒絕，不執行／略過資料寫入 |

## 分層與回滾教學

normalize 是像後端 domain service 的規則入口，將 helper 展開既有 addColumn DTO，並在輸出前核對整條呼叫。replay 仍對整檔 clone 後套用；第一欄位成功、第二欄位撞名時，第一欄位也回滾。React component 像 view，透過 props 接收快照 DTO；state 只管選取、搜尋及畫面，不需因別名支援重做 parser／replay。

success.golden.json 人工依兩份本地 authored PHP 推導：users 原有 integer id，加入 nullable timestamp created_at／updated_at precision=3；無索引／FK。另一跨檔案例先有 boolean updated_at，再呼叫 helper，第二欄位重複导致整檔回滾，created_at 不洩漏，後續 blocked。不是把 analyzer 輸出盲錄成 golden。

## 真實樣本前後比較

使用 R1 同一 commit、118 檔 SHA 校驗過的原始來源再分析；PHP 未修改。比較資料在 docs/research/r2-nullable-timestamps-comparison.json，完整當次輸出在 ignored artifacts/r2-baseline.json。

- Laravel.io 仍 2 applied／1 failed／6 blocked；callback after 與 schema dump 缺口未處理。
- BookStack 仍 0／1／102；首檔 nullableTimestamps 拒絕已移除，可解析出兩欄位 operations，但 DB 寫入拒絕保留，所以 after／diff／final 仍未知。語法操作不等於已生效。

這批改善單項解析與診斷，不宣稱專案 complete 或 DB runtime 相容。不再為使样本成功而連續放寬其他 API。

## 驗證與交付

新增 20 個回歸；實作前 5 failed／15 passed，實作後 20 passed。涵蓋別名等價、參數拒絕、修飾／change 拒絕、TZ 排除、跨檔 golden、第二欄位失敗回滾／未知及資料寫入仍拒絕。built-package demo：npm run demo:nullable-timestamps，成功 schema 與回滾斷言通過。統一 verify 自動包含本次新 demo。

最新 HEAD CI／merge 前維持 in_progress；完成後補實際交付證據。未新增 UI，未重做瀏覽器、下載或部署驗收。

雲端 npm run verify 實際 639 tests（540 core + 99 web）、typecheck、build、12 demos 全部 15 步通過。
