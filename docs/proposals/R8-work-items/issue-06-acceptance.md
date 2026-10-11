# [R8.6] 驗收閱讀任務並完成文件與 PR 交付

## 問題與結果

各入口可操作不代表演變可理解。按 R8 修訂 1 的具體任務驗收，保存真實檢查、截圖與失敗紀錄，完成功能 PR／latest-head CI／merge 證據。

核准：2026-10-11 使用者修正指令；in_progress／整合準備ready for review，獨立驗收與merge未完成。研究端沒有執行這些驗收。

## 依賴與前置條件

- R8.1～R8.5 實作與必要回歸完成，不以單一 UI 截圖代替。
- 最新 main／feature head、實際 issue／milestone 對應與核准範圍可追溯。
- 開發端有 repo 必需的執行／browser 能力；若缺項如實報告，不宣稱通過。

## 修改步驟／交付物

1. 用 project、commerce、foreign-keys、table-lifecycle、R6 固定真實樣本走查屬性、橫向、縱深、未知與來源返回任務。
2. 執行 AGENTS 的 npm run verify，記錄真實 tests／typecheck／build／demos；670 為歷史基準，不湊數。
3. Browser 驗證拖移／點擊／鍵盤、step／side／filter、390px、來源返回、工具 state 保留、改輸入失效；保存桌面／窄屏截圖、console 與首輪失敗紀錄。
4. 補本批行為必要回歸，保留既有 goldens、core、lockfile、workflow；不用鏡像實作的測試湊量。
5. 更新 user-guide、R8 批次、CLOUD_HANDOFF、DECISIONS、github-milestones／教學，寫實際變更與限制。
6. 功能 branch／PR 關聯真正完成的 issues，檢查 current head CI；merge 權限與既有 Pages 影響依開發 session 當前授權核對。每個新建／實際更新 PR attach 到該 chat。

## 驗收條件

- 不開原始 JSON 可讀 price decimal 8,2→10,2、nullable／default 改動。
- 相關步驟直接找到 nickname 新增／移除；來源返回保留欄位／step／side／view／query。
- 同檔 users／posts 改名與 FK、rename／同名重建、整表增刪可讀，沒有猜身分或 DB 影響。
- Laravel.io 2/1/6、BookStack 0/1/102 限制不變，known empty／unknown／object absent／未套用語法不混淆。
- 主流程、工具返回、全來源去重、進階入口與 final 禁用通過；390px／鍵盤／console結果有證據。
- verify 與當前 PR head CI 結果可查；未執行真人試用、下載或大型性能不虛報。
- 全部必要功能 merge／驗收完成才標 R8 done、關 issues／milestone；文件 PR merge 不當功能完成。

## 排除與停止點

不追加相容性、AI、動畫／history identity、下載落盤、大型性能保證、新 release／workflow／部署設定。完成必要驗收及實際 merge 證據即停止，沒有下一個 approved 任務不做相鄰 draft。

## 實際追蹤

GitHub [#144](https://github.com/jerryyehself/laravel-migration-visualizer/issues/144)；milestone [#43](https://github.com/jerryyehself/laravel-migration-visualizer/milestone/43)。依賴：#139～#143。in_progress／整合準備ready for review，獨立驗收與merge未完成。

## COORD-20261011-20：R8.6 整合自測／交付準備停點

協調端按R8修訂1@5eec41476ef22b85d3165d3be3f681f1a20c8f9d既有人類核准派工，僅 #144／R8.6準備。固定輸入／本輪實際verify与browser基準9010b873cd2bfbf5647406c41935a8dfa718a5f0、clean=true；程式最後改動仍ce16e471573cbf0762ad13293f715eefb61b28f7，沒有本輪產品修正或空產品commit。713tests（540core／173web）、15verify命令／12demos通過；真Chromium十項原矩陣整合任務另加90項／組前批回歸通過、console空。原112份PHP hashes MATCH，Laravel.io2/1/6／BookStack0/1/102、final未知边界不變。首次runner還原locator錯誤及九項部分結果保存，修正後全跑十項，不放寬斷言。教學／整合報告docs/r8-6-integration-preparation.zh-TW.md，16份可攜證據docs/acceptance/r8-6-evidence/manifest.json。

新分支feat/r8-6-integration-preparation，stacked base feat/r8-5-details-and-tools；#145～149固定驗收heads／OPEN狀態不改。规划835cb1e544520ff7b69ea1c20f03bf0ccf8fe66b只參考不混base。獨立隊列03/06/10/13/16/19與未来R8.6仍pending，offline是協調端回報的驗收環境阻礙；開發自測／CI／協調核對不能代獨立報告。#144 in_progress／ready for review但OPEN、R8整批／milestone43 OPEN未done。剩餘独立報告／必要複驗與依授權安排整合／所有必要merge／交付證據由協調回收再派工；本輪不合併、不automerge、不關issuesmilestone、不部署release或下載落盤，不開始新draft。

可審查stacked PR：[R8.6整合準備 #150](https://github.com/jerryyehself/laravel-migration-visualizer/pull/150)，base feat/r8-5-details-and-tools，head feat/r8-6-integration-preparation；runner／教學／證據commit ff1d8a5b973a4df8c58b3931ff7d229e53a57202。最後產品改動ce16e471573cbf0762ad13293f715eefb61b28f7、本輪實際verify9010b873cd2bfbf5647406c41935a8dfa718a5f0與後續文件head分開。current headCI按GitHub當前結果補登；獨立驗收pending，不合併／automerge／標done。
