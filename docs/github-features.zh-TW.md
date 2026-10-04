# GitHub 專案功能設定

2026-10-04 核對與更新。設定是 GitHub repo metadata，不在 React state 或 migration-core；clone 不會自動重新套用。Core／UI 功能與 JSON 契約未變。

## 已設定

- 來源與公開部署 repo 的 About：專案描述與正式網站 URL。來源描述說明靜態分析、快照、diff、ERD 及技術選型；部署 repo 描述說明瀏覽器體驗。
- 來源 topics：database、erd、laravel、migrations、php、react、schema、static-analysis、typescript、visualization、vite。部署 repo 使用相關 topics，另含 github-pages。更新時保留既有 topics。
- 公開部署 repo 的 Settings → Social preview 已上傳原創專案圖；重新載入設定頁確認已保存。JPG 1280×640、低於 1 MB；圖中是概念示意，不宣稱為產品截圖。SVG 與 JPG 保存在 docs/images/social-preview.*，可供後續更新。
- README 加入實際 CI 連結與部署紀錄入口。CI badge 在 private repo 的訪客端可能不可讀；不能視為公開驗證服務。

## Deployments

[公開部署紀錄](https://github.com/jerryyehself/laravel-migration-visualizer-pages/deployments/github-pages) 已由真正的 Pages 發布自動建立，並非本次新造紀錄。Deployment 6835227581、commit ad849aba、狀態 success；environment_url 指向正式網站，log_url 指向 Pages run 37166959035。github-pages environment 已有自訂 branch policy，維持現行設定。

重新發布仍使用 npm run publish:pages：驗證來源、推 built web 到部署 repo，再由 GitHub Pages 建置／更新 deployment。只更新 topics、About 或 Social preview 不會重建網站。來源 repo 沒有假的 production deployment，也不會因 metadata 設定而轉為公開。

## 限制

- 私有來源 repo 的 General 設定頁沒有 Social preview 區塊，因此不能在該 repo 上傳第一張圖片。圖檔已備妥；不為了預覽功能變更 visibility 或升級方案。
- [GitHub 官方 Social preview 說明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview)：可上傳公開 repo，或曾上傳過圖片的私有 repo。分享平台的快取更新時間不由本專案控制。
- 原始碼公開前的歷史隱私問題仍見 publication-audit.zh-TW.md，本次不改寫 Git 歷史、不新增公開 repo。
