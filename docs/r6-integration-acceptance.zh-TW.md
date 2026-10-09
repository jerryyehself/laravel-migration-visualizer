# R6：雙目標整合驗收

2026-10-09；R6 修訂 2／issue #131／milestone 40。輸入 main 28c1d59d365673a07f558fe42f30fbaf673f6d4e，產品／web 1.0.0，core 0.15.0。本批只整合驗收、教學與交接，不新增分析 API 或部署。

## 已交付的範圍

| 提案 | 實際交付 | 界線 |
|---|---|---|
| R1 | #121／2dfbbc6：兩個固定 MIT 專案、來源雜湊及任務基準 | 沒有解析 schema dump 或承諾完整相容 |
| R2 | #126／cbfdf61：nullableTimestamps 有限靜態別名 | 真實原始樣本仍不完整；不略過 DB write |
| R3 | #123／9e4b804：當前已知快照欄位搜尋與明細 | FK 導覽批次缺需求證據跳過 |
| R4 | #128／47b8e0a：名稱直接涉及的操作來源、唯讀 PHP／返回 | 不建立跨 rename 身分 |
| R5 | #130／28c1d59：單次摘要、真實 diff、各側明細 | 不增加任意版本比較或部署安全判定 |

最新功能 HEAD CI：R2 61f4bfce／run 37898773657、R4 5ead8c08／37901972576、R5 5db1590b／37902435289，均 success；issues／milestones 37～39 已關閉。這些是功能交付證據，本轮整合另列下面。

## 固定樣本與預期答案

Laravel.io d056c6493dd7bf905e471f2ad6fe716c35642ae4：9 PHP，Laravel lock v11.55.0。jobs.reserved_at 在第二份已套用 migration 新增為 nullable integer；來源第 19 行。Before 沒有 jobs，After 有該欄位。其 after(callback) 在第三份失敗，完整專案 2 applied／1 failed／6 blocked，final 未知。原 repo 有 SQL dump，未解析。

BookStack ff661b59f6f605bf768fe850c0d0a8a2dc09d203：103 PHP，Laravel lock v12.69.3。第一檔 nullableTimestamps 現在識別兩筆 nullable timestamp operations，DB::table insert 第 26 行仍拒絕；0 applied／1 failed／102 blocked。Before 是已知空白，After 及 final 未知；不能把語法 timestamp 當已生效欄位。

樣本來源、118 檔雜湊與 MIT 原文沿用 research/r1-samples.json／licenses。完整原始 PHP 在 ignored artifacts，未提交第三方 source。重新執行 research-baseline 對固定檔逐一 SHA 校驗、分析與 unknown assertions 通過；本輪摘要 research/r6-sample-results.json。

## 兩種任務與本輪結果

1. 理解結構：Laravel.io after-1 搜尋 reserved_at → 開 jobs 欄位明細 → 直接來源 PHP 第 19 行 → 正確的第二份 migration 閱讀摘要 → 返回 → After 明細。每一步保留正確名稱與快照；表明細／一般快照選單重設也通過。
2. 理解單次變更：內建成功樣本第二檔明列 renameColumn users.name→display_name，結構仍 columnRemoved／columnAdded；旧欄位只在 Before，新名稱只在 After。來源往返恢复焦點／原欄位。失敗樣本 first failed 保留 before，after 不可導航；blocked 兩側未知；副本修改使整個舊分析與摘要失效。

本輪 Chromium／CDP 十一項任務通過，console 無 warning/error；research/r6-browser.json。BookStack 實際畫面確認 helper 診斷消失、兩筆 timestamp 語法出現，但 DB write 仍阻擋，known empty 與 unknown final 不混淆。R5 交付前另實測八項任務及 R4 六項、R3 十一項回歸，這些歷史結果不充當本輪重跑證據。

首次本輪 BookStack 瀏覽器 assertion 失敗：長時間 Vite 畫面仍呈現旧 helper 診斷，與 core CLI 不一致。重啟本 session 的 Vite，加 --force，再跑完整十一項任務通過；沒有放寬 core 規則。後續分支／依賴切換應重啟並以代表案例確認新程式載入。

## 驗證與交付

本輪 npm run verify 在乾淨輸入 HEAD 28c1d59 上完成：660 tests（540 core／120 web）、typecheck、build、12 demos／15 步全部通過；Node v24.19.0／Linux。research/r6-verification.json 保存 commit、clean=true 及各命令 exit code。PR 最新 head CI／merge 另核對，不沿用前序綠燈。React 仍只消費 DTO；純 web service 整理 labels、literal 物件查詢與側別可用性，畫面 state 不重新 replay。

## 未涵蓋與下一步

沒有下載互動／落盤、全部手機／瀏覽器、大型 UI 效能或 DB runtime 保證。沒有新增部署、版本發布、Worker、持久化、排程、timeline、down、AI、SQL parser 或 semantic refactoring。R1 原始樣本仍有限成功前綴；dynamic after 與資料寫入缺口保留，未當成本批新功能。

本輪核准路線交付後，再依研究提案與使用者具體核准選後續範圍；不把已交付 R1～R6 重新當新功能授權。雲端草稿 start_skill 已更新但未發布，啟用需使用者於環境設定檢閱、保存、發布。localhost／登入／程序不會跨 session 自動轉移。
