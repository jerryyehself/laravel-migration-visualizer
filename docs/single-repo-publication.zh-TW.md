# 單一公開 repo 與 Pages 整合

目標 repo：jerryyehself/laravel-migration-visualizer。目標網址：https://jerryyehself.github.io/laravel-migration-visualizer/ 。本文件與分支是切換準備；GitHub visibility、歷史清理及首次 deployment 尚未執行，不宣稱新網址已上線。

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

清理會改 Git SHA。里程碑文件中的舊 SHA 是歷史交付證據，不可偽稱它們是清理後的 IDs。清理工具的 commit-map 保存於私人備份；正式切換後需提供對應表並標記文件。GitHub PR 關係與簽章不會自動重建。
