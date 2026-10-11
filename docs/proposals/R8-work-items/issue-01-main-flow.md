# [R8.1] 收斂匯入、分析與閱讀主流程

## 問題與結果

完整編輯器、11 個範例與輔助工具佔據結果閱讀前方。改為匯入／示範→分析→工作區，保留 A 的 migration 清單／ERD／明細架構，副本管理與其他工具有清楚的次入口。

核准：使用者 2026-10-11 要求依 A-06 審查建立修正工作；規格 docs/proposals/R8-reading-corrections.zh-TW.md 修訂 1。狀態 approved；實際開工才 in_progress。

## 依賴與前置條件

- 重新查 main、AGENTS、提案入口及 R8；R7 #137／#138 已交付，起點 2b8030a 不是永久 SHA。
- 取得 docs/r8-reading-corrections；先核對／建立 milestone 與六項工作，回填實際編號。
- 保護已有工作；建立 feature branch。沒有 core 改動必要性。

## 修改步驟／交付物

1. 首頁先說看結構／讀變更／追來源，技術 DTO 管線移到說明；靜態 up() 界線可見。
2. 匯入區只保留檔案／資料夾、單一範例入口、分析、管理輸入與工具；11 種範例仍可選且標示示範，載入不自動分析。
3. 輸入管理內保留檔名／PHP／移除／還原；分析後預設收合；展開不清分析，真正改輸入才失效。
4. 診斷跳修改展開正確輸入檔、聚焦可信行，保存既有副本語意。
5. 單檔練習移到工具，返回多檔保留同頁輸入／結果；不新增單檔 ERD、持久化或背景分析。
6. 工作區前保留 compact 分析狀態、首要問題、完整診斷入口；不把全部診斷／JSON 下載列在主工作區前。

預計 main、ProjectWorkbench、ProjectResults、ProjectExports、style；記錄實際必要檔案，不盲目改整份清單。

## 驗收條件

- 匯入／示範後不用先編輯就能分析並找到工作區；分析後完整編輯器預設收合。
- 11 個既有示範、多檔／資料夾、UTF-8／完整路徑仍可用；取代清單說明不消失。
- 副本編輯／還原／移除清舊結果；展開管理與工具返回不清分析，單檔切換不丟多檔 state。
- 未完成與首要問題可見，所有診斷仍可展開／定位；known empty 與 unknown 不混淆。
- 鍵盤可達，390px 代表窄屏可完成主路徑；記錄實際 browser 截圖與 console 結果。

## 排除與停止點

不刪範例／匯出／副本能力，不改 core／JSON、持久化、單檔 ERD、動畫、依賴／workflow。完成此批相關檢查與 commit／PR 紀錄後，下一批須滿足 R8.2 前置條件；未驗收不標 done。

## 實際追蹤

GitHub [#139](https://github.com/jerryyehself/laravel-migration-visualizer/issues/139)；milestone [#43](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/43)。依賴：R7 #137／#138 已交付。本輪 R8.1 in_progress；完成檢查後 ready for review，未合併不標 done。

R8.1 ready for review：產品 d849b4e8a0ea79e65b8d459a975476b57fe75538；673 tests／12 demos、39 項／組 browser 回歸通過。等待協調端安排新 head 獨立驗收，不合併、不標 done。教學 docs/r8-1-main-flow.zh-TW.md。
