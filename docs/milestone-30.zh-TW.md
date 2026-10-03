# M30：第一版相容性收斂

新增可查的 [相容性矩陣](compatibility.zh-TW.md) 與 12 個獨立正／負 contract probes，固定第一版支援邊界。這一階段不改 parser、SchemaState 或 UI，也不追加零散 API。既有 core 0.14.0 保留。

Component 是畫面呈現單位、props 提供 core 結果、state 控制選取；相容性判斷仍只在 core。矩陣不以 UI 是否顯示某欄位推定解析正確，也不把靜態分析說成 DB execution。

M30～M33 是交付驗收路線：M31 作者撰寫的實際應用情境與規模驗證，M32 完整瀏覽器流程，M33 使用／限制／可重現版本交付。沒有新的外部部署需求。

驗證：603 tests（514 core + 89 web）、typecheck、build、十個既有 demo；命令結果與 PR/CI 以 github-milestones.md 的實際證據為準。新增 probes 在既有實作已通過，不是修復前會失敗的 bug 測試。主要檔案：compatibility.zh-TW.md、compatibility-contract.test.ts、fixtures/compatibility/cases.json。
