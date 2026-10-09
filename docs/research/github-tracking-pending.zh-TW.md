# 待恢復認證的交付紀錄

2026-10-09；GitHub gh API 回 401，Git 連線也缺少可用登入。已檢查注入 GH_TOKEN 存在、GITHUB_TOKEN 未設、無 stored gh 備援。不可把憑證存在說成可用；不要求在聊天貼 token。

- R2：issue #125／milestone 37／PR #126 已建立；head 61f4bfce2b1230b24ed97389a1573c9bcaafd32f 的 validate run 37898773657 completed success（透過公開 REST 讀取核對）。尚未合併，issue／milestone 尚未關閉。
- R4：本地 feat/r4-operation-sources，尚未建立 issue／milestone／PR，不虛構編號。待建立題目：R4 結構與 migration 來源往返，範圍／驗收見 proposals/R4-source-navigation.zh-TW.md 與 r4-operation-sources.zh-TW.md。
- 認證恢復後先核對遠端最新 main、保護本地 commit／patch；先以 match-head 核對並交付 R2，再將 R4 的獨立提交移到最新 main，補 tracking／PR，核對 R4 最新 HEAD CI 通過才 merge。

2026-10-09 07:51 UTC 實際重試 gh api user／git ls-remote 成功；R2 #126 已合併 cbfdf613，milestone 37 closed。R4 已建立 issue #127／milestone 38；先前 401 是歷史阻礙，不能當目前缺權限。
