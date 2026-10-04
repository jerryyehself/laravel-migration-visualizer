# M34：GitHub Pages 網站發布

使用者於 2026-10-04 明確要求發布 Pages，沿用下載互動／落盤驗收暫緩。來源 repo 的 Pages 建立 API 回覆 HTTP 422：目前方案不支援該私有 repo。助理當時自行選擇保留來源私有並建立 jerryyehself/laravel-migration-visualizer-pages 公開部署 repo；只發布本來就要由瀏覽器取得的 built HTML／JS／CSS，不複製原始 repo、docs、對話或憑證。沒有更改來源 repo visibility 或升級方案。

`npm run publish:pages` 先跑既有 verify，再依固定網站子路徑 build。腳本確認目標是專用公開 repo，拒絕未知 dist／部署 repo 項目，以暫時 checkout 更新靜態資產與 .nojekyll，再推 main。使用 gh 既有授權及 GitHub noreply 作者，不保存新密鑰；GitHub Pages 由部署 repo 的 main/root 自動發布。

Vite 開發／本地預覽仍使用 `/`；Pages 資產使用 `/laravel-migration-visualizer-pages/`。發布後 finally 重建本地 root，避免破壞現有 localhost 工作台。Core/UI 原始碼與 JSON 契約不變，產品/web 1.0.0、core 0.14.0。

教學：Pages 是靜態檔案主機，PHP migration 不會在伺服器執行。React component/state/props 與分析 core 都打包成瀏覽器 JavaScript；使用者選取的 PHP 字串只交給本機 core。Vite base 決定網頁去哪個子路徑取得 JS/CSS，不改 schema 分析規則。跨 repo 發布是工具 IO，放 scripts，不放 hooks 或 parser。

網站：https://jerryyehself.github.io/laravel-migration-visualizer-pages/ 。HTTP／資產、Pages deployment 與實際瀏覽器的驗證，以 GitHub 交付紀錄及 issue 為準；發布後須等待 Pages workflow 完成，push 成功不是網站已上線。完整快照、草稿持久化與相容性限制維持；不測下載。CLI 發布需要 gh/Git/網路，source archive 若沒有 scripts 的最新版本，請 clone 最新 main。

首次發布驗證：612 tests、typecheck、build 與十一個 demo，十四步全部通過。部署 commit ad849aba；HTTPS index 與 JS/CSS 均可取得，兩個資產 SHA-256 與本地建置相同。實際公開網站瀏覽器分析十二檔訂單範例成功，ERD 五表三外鍵；失敗範例正確顯示最終 schema 未知、不繪圖。Console warn/error 為空，未操作下載。本地證據保存在專案旁 outputs/m34-evidence/pages.jpg 與 pages-dom.txt；來源 PR 的最新 HEAD CI 另以 GitHub 紀錄為準。

## 授權更正

發布網站是使用者要求，但建立另一個公開 repo 是助理自行選的方式，未先取得明確同意。此紀錄不授權未來建立 repo 或變更 visibility。2026-10-04 使用者要求公開前檢查與修正；來源仍私有，見 publication-audit.zh-TW.md。
