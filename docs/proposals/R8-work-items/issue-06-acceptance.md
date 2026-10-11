# [R8.6] 驗收閱讀任務並完成文件與 PR 交付

## 問題與結果

各入口可操作不代表演變可理解。按 R8 修訂 1 的具體任務驗收，保存真實檢查、截圖與失敗紀錄，完成功能 PR／latest-head CI／merge 證據。

核准：2026-10-11 使用者修正指令；approved，尚未開工。研究端沒有執行這些驗收。

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
