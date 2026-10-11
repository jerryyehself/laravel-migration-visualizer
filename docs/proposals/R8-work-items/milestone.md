# R8：結構與 migration 變化閱讀修正

使用者於 2026-10-11 在 A-06 修訂 2 審查後要求建立 milestone／issues 並交代實作 session 修正。範圍見 docs/proposals/R8-reading-corrections.zh-TW.md 修訂 1；目前 approved、尚未實作。本文件是 GitHub milestone 的 description 建立內容，沒有宣稱 milestone 已建立。

目標：使用既有 ProjectAnalysis／MigrationSnapshot／SchemaDiff，讓讀者直接理解單次跨表／屬性變更、查詢同名表／欄位的相關步驟，並在閱讀／來源返回時保留上下文。收斂匯入→分析→閱讀的主流程，保留輔助能力的次入口。

依賴：最新 main、R7／M42 done（#137／#138）、R3／R4／R5／R6。核對起點 2b8030a，開工重新查最新 main。工作項目順序 R8.1→R8.2→R8.3→R8.4→R8.5→R8.6；每項 issue 有自己的前置條件。

完成條件：六批必要工作均實作／merge；commerce price 屬性、users.nickname 跨步、同檔 users／posts FK、rename／同名重建、failed／blocked／known empty／unknown、來源返回、輸入失效、鍵盤與窄屏任務通過。repo verify、真實 browser 回歸、截圖及 latest-head CI 的結果與限制可追溯；文檔與 issue 狀態更新。沒有證據時不宣稱真人可用性或完整 Laravel 相容。

排除：core／公開 JSON／golden 改動、新 parser API／相容性、物件 identity／自動 rename 接續、動畫／Timeline／Semantic Zoom、PHP／DB／SQL runtime、AI／migration 生成、持久化／URL state、外部帳號／費用／排程、下載落盤、新依賴／workflow／部署設定／release。保留未知 final 禁用與原有副本規則。

狀態保持 open，直到 R8.1～R8.6 必要功能 PR 已 merge 且驗收證據完成；文件 PR 合併不關 milestone。GitHub 的實際 milestone number 由 API 回傳，R8 不是 number，也不預設一定是 M43。
