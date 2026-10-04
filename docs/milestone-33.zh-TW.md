# M33：第一版文件與可追溯交付

產品／web 1.0.0，core 仍為 0.14.0；不改 parser／replay／JSON。頁首由 web package.json 讀版本，避免下一次標示漂移。新增使用手冊、release 說明，更新 README、AGENTS、決策索引與本地／雲端交接；歷史紀錄保留並標明以最新交付證據為準。

verify script 串接 test、typecheck、build 和全部十一個 demos，失敗即停止，記錄每步 exit status、環境與 Git HEAD。source archive 沒有 .git 仍能 verify，但不能冒用上層 repo 的 commit。CI 使用同一流程，再檢查產包。

release:bundle 先驗證乾淨 checkout，再從該 HEAD 封裝 source、built web、手冊與紀錄，附逐檔 SHA-256 manifest、archive checksum。驗證紀錄不是目前 HEAD／乾淨狀態時拒絕產包；無 Git history 的 archive 必須 clone 才能重新產包。artifacts gitignore，沒有 node_modules／.git 或新增 npm／網站部署。環境／時間資訊使 archive 不保證 byte-for-byte 恆等。

已實際乾淨 npm ci 後通過 612 tests（520 core + 92 web）、typecheck、build、十一個 demo；十四個步驟全部 exit 0。離線 npm ci 因一份 cache 缺失失敗，改使用 lockfile 連線安裝成功，沒有更新依賴。乾淨 HEAD 產包、解壓後重建與最終 GitHub CI／merge／release 的實際證據見 github-milestones.md，沒有提前宣稱尚未執行的檢查。

教學：產品版本是交付給使用者的工作台版本，core 版本是分析契約。兩者可以獨立演進；React component 接收 props 表示資料、state 管理選擇，domain 規則仍在 core。驗證與產包 script 屬工具 IO boundary，不塞進 component 或 parser。第一版完成的是約定的靜態分析／視覺化範圍，已知限制不是被版本號消除。
