# 原始碼公開前隱私檢查

日期：2026-10-04。檢查起點 main `68f2f27`。來源 repo 仍為 private；本次只準備與修正，不變更 visibility、不 force push、不刪除 GitHub 資料。

## 已修正的現行內容

- 兩份逐字對話、來源 manifest 與原索引已完整備份於 repo 外；逐一核對 SHA-256 後移除三份原始匯出，索引改為隱私說明。備份不是公開附件，也不隨 clone 傳送。
- 保留技術選型、core/UI 分層、可信快照、功能排除、中文教學與 GitHub 流程等決策；交接文件不再要求讀逐字對話。
- .gitignore 排除對話匯出與 .env 檔；.gitattributes 讓新來源 archive 排除整個對話目錄。忽略規則不會移除舊歷史，也不能防止 git add -f。
- 修正 AGENTS 與 M34 記錄：建立公開部署 repo 是助理自行選的方式，不能誤寫成使用者明確授權。既有帳號憑證不授權新公開 repo、visibility 變更或歷史重寫。
- 本地此 repo 後續 commit 使用 GitHub noreply 信箱。此設定不追溯修改舊作者資料，也不改全域設定。
- 新 release 打包停用 macOS AppleDouble metadata，避免 ._* 隱藏檔夾帶額外檔案屬性；既有發布包保持不變。

## 檢查範圍與觀察

- 本地所有 refs 可達的 1,226 個 Git objects，其中 667 個 blobs：掃描常見 GitHub/OpenAI/AWS token 格式、私鑰標頭、URL 內嵌帳密、本機路徑、私人任務連結及 email；commit messages 亦檢查隱私標記。沒有命中上述憑證格式。不是完整秘密偵測或憑證有效性驗證。
- 兩個歷史對話 blobs 含本機路徑，一個含私人 Cloud task 連結；manifest 含對話 ID。一般 fixture 的 password/token/remember_token 為欄位名稱，不是實際帳密。部署腳本的信箱是 GitHub noreply。
- 135 個可達歷史 commits 的 author 或 committer 使用非 noreply 個人信箱。公開 Git 歷史將暴露這些資訊。
- 唯讀查詢來源 GitHub repo 確認 private；遠端 58 個 branches、一個 v1.0.0 tag。舊 branches 與 tag 都可能保留已刪文件，不能只清 main。
- 檢查 GitHub 112 筆 Issues／PR 的 title/body、0 筆 issue comments、0 筆 review comments、一份 release 說明；未命中上述隱私標記。這不涵蓋所有 Actions logs、附件、PR review body 或 GitHub 保留的不可達 objects。
- PR #73 的 files API 確認仍有四個原始對話檔 diff。歷史 rewrite 不保證移除 GitHub PR cache；公開前須核對，必要時由維護者聯絡 GitHub Support。
- v1.0.0 指向舊來源；本地同名交付 archive 確認包含逐字對話與 manifest。GitHub release 仍有既有 tar.gz 與 checksum。此次沒有下載／替換附件，也不宣稱驗證了遠端附件 bytes。
- Actions artifacts API total_count=0；沒有下載或讀取所有 CI logs。公開部署 repo 仍只有 built web；編譯後 JS 與內建範例本來就可由網站訪客讀取。

## 公開前仍需處理

1. 在獨立 clone 準備歷史清理：所有分支／tag 移除逐字對話與 manifest、匿名化個人 email。先保留私人 Git 備份，列出 SHA 對應；這會改 commit IDs、tag 與 PR／教學中的歷史引用，須同步處理。不能直接 force push 現行工作 repo。
2. 處理 PR #73 的 diff/cache、舊 release 附件與相關 CI logs。刪 main 檔案、新 .gitattributes 或重打包都不會自動清掉它們。
3. 決定專案 LICENSE。目前只有 Laravel fixture 的上游 MIT 文件；沒有替使用者選定整個專案的開源授權。公開可讀不等於已授權他人重新利用。
4. 上述結果再次核對後，另行取得來源 repo 公開與 Pages 搬遷的具體授權。既有公開部署 repo 不在本次刪除範圍。

## 本次驗證

功能與 JSON 契約不變。驗證結果以修正 PR 的最新 head CI 與交付摘要為準；不做下載互動／落盤驗收。檢查不能證明 repo 已適合直接公開，因歷史與遠端副本尚未清理。
