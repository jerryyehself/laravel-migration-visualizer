# 獨立驗收缺陷修正（2026-10-10）

issue #134／milestone 41，依 independent-review.zh-TW.md 的 IR-01～IR-04 修復。原始失敗報告／證據完整保留，沒有改寫成通過。IR 本批一併保存 R7 核准原文，當時尚未開發，不擴張到其他 draft。

IR-01：實際 Chromium 先重現收合後來源不可見、焦點未恢復。web DOM helper restoreSourceFocus 展開原按鈕所在的所有 native details，確認可見後 focus，最後讀 activeElement 確認恢復；失效時 ProjectResults 顯示且聚焦提示。沒有改 schema 或 core service。

IR-02：新增本地 favicon.svg 與 HTML 宣告，不依賴外部請求。IR-03：手冊區分當前 core 0.15.0 與旧 release 0.14.0。IR-04：四份提案的舊 approved／開工狀態明列為歷史，當前 done 與交付紀錄保留。

新增 scripts/verify-source-return.py 是 optional 實際瀏覽器 regression，使用環境已提供的 Python Playwright／Chromium，不加入產品依賴。啟動 Vite 後執行 python3 scripts/verify-source-return.py；九項正常／收合返回、無法聚焦提示、nested details、hidden／detached／non-focusable／null、fresh console／favicon 全通過。console 無 warning/error，畫面 artifacts/source-return-restored.png。人工 style suppression 案例只驗證不可返回目標的處理，不冒充新使用任務。

本輪 npm run verify 全部 15 步通過：660 tests、typecheck、build、12 demos。PR #136 的 head 9d356a84a3d6e785a4aa3317606a656f520bb8cf／validate run 38039697252 success；merge d159cbe1dbcba347858eab266109abbfdb094d20。issue #134／milestone 41 closed。沒有執行下載／部署／PHP／DB。
