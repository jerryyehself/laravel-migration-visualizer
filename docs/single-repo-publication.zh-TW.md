# 單一公開 repo 與 Pages 整合

來源 repo：jerryyehself/laravel-migration-visualizer，已公開。正式網址：https://jerryyehself.github.io/laravel-migration-visualizer/ 。2026-10-04 已完成歷史清理、release 重建與首次部署。

## 實際切換紀錄

- PR #115 已合併；核准後在獨立 mirror 清理歷史，核對 122 個 refs 的檔案內容，除三份私人匯出移除外保持一致。62 個 heads／tags 以 atomic push 和逐 ref lease 更新，未嘗試修改 GitHub 唯讀 PR refs。
- 整理後 main：029d67dcc9863b9243df9823b8e83a7167a9fc92；v1.0.0：e52935ac267c4bcacb6d4ec883b4d5e2d149009f。舊 checkout 已私人備份，本機 Git 改用整理後的 clone。
- v1.0.0 附件已替換為清理後 tag 的重建包。Archive SHA-256：1428f6887a454f9cd2962bffb8947d6cdd3c92e3af4b45eb7ef23aa756d9e1c5；版本與功能不變。
- [首次 Pages run](https://github.com/jerryyehself/laravel-migration-visualizer/actions/runs/37169871507) 成功：verify、612 tests、typecheck、build、十一個 demos 和部署。Deployment 6835695538；正式 HTML、JS、CSS 均 HTTP 200。
- 正式網站驗收：十二檔全部套用、零診斷、五張表與三個外鍵；失敗專案最終快照未知且不繪製 ERD。沒有測下載。About 已改新網址，原創 Social preview 已上傳並重新載入確認。
- 舊部署 repo 尚未刪除：CLI 憑證缺少 delete_repo scope，HTTP 403；已在登入的 GitHub 設定頁準備最終刪除步驟，等待操作當下確認。新網站已不依賴舊 repo。
- GitHub 舊 PR diff／commit cache 仍可能保留歷史副本；使用者已接受這項限制。公開不代表原始碼已授予開源授權。

## 發布流程

來源 main 更新 → GitHub Actions 安裝 → verify（tests／typecheck／build／十一個 demos）→ 以新子路徑建置 web → 上傳 apps/web/dist → github-pages deployment。

Pages workflow 只接受公開 repo 的 main，private 或其他分支不會部署；只發布 dist，不上傳來源、教學或私人備份。部署 job 使用 GitHub 的短期工作流程 token，沒有新增永久部署金鑰。既有 CI 與 Pages 各自驗證，部署前不依賴另一個 commit 的綠色結果。

npm run publish:pages 改為要求此 repo 的 Pages workflow 執行 main；拒絕 private repo、未提交修改、與遠端 main 不同的本機 HEAD，以及尚未設定 Actions publishing 的 Pages。它不再 clone／推送另一個 repo。排入 workflow 不代表已上線。

React component／props／state 與 migration-core 完全不變。Vite base 只改 JS／CSS 取得位置；工作台仍在瀏覽器分析 PHP，不執行 migrations。流程放 scripts／GitHub Actions，不能放進 parser 或 React hooks。

## 切換順序與風險

1. 私人 Git bundle、對話原檔、舊 release 與 GitHub metadata 留在 repo 外。獨立 mirror 清理所有分支／tag 的對話匯出與個人 email，產生 old/new SHA 對照，不直接修改原 checkout。
2. 遠端歷史替換與 release 更換須先具體核准。舊 PR／SHA／cache 仍可能包含副本，不能保證 rewrite 完成 GitHub 伺服器清理；完整限制見 publication-audit.zh-TW.md。公開會使剩餘副本也可被讀取，必須先決定是否接受。
3. 核對 refs 沒有新的遠端變更後，整合已驗證分支並執行核准的歷史替換；舊 checkout 不可直接 merge/push 回去，要從整理後歷史重新 clone。
4. Repo 轉 public，Pages 設為 GitHub Actions，正式網站成功後更新 About、Social preview 與 Deployments；驗證新 URL 與資產 base、成功／失敗分析。不做下載互動。
5. 既有部署 repo 必須在新網站確認成功後才退役。刪除需要另行核准，會讓舊 /laravel-migration-visualizer-pages/ 網址失效。先備份 Git 與設定。若只封存，仍是兩個 repo，不能說已完成單一 repo。

## 歷史 commit 引用

清理已改 Git SHA。里程碑文件中的舊 SHA 是清理前的歷史交付證據，不是目前 IDs；完整對照見 [歷史 SHA 對照](history-commit-map.tsv)。GitHub PR 關係與簽章不會自動重建。原始 Git／對照另有私人備份，不能把舊 clone 的分支直接推回來源 repo。
