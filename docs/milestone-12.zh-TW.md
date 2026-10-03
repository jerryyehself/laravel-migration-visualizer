# Milestone 12：從診斷跳回編輯

M11 的唯讀定位卡片新增「到輸入區修改此檔」按鈕。跳轉依完整路徑選取輸入副本，將焦點移到 textarea，並選取可信診斷行的整行內容。Core 0.5.0 不變。

## Component、state、props、ref 與 effect

ProjectWorkbench 保存 files 與 selectedInput state；DiagnosticSource 透過 onEdit callback prop 回傳點選的診斷，經 ProjectResults 傳回工作台。父層負責切換輸入檔案，子層不用知道輸入如何保存。

切換 state 後，React 才將新檔案內容放到 textarea。editRequest 暫存一次跳轉需求，useEffect 等 DOM 更新完成，透過 ref 取得 textarea，再設定焦點、選取範圍與捲動。完成後清除需求，避免手動切換時再次跳轉。ref 指向畫面元素，不是另一份 PHP 或 schema state。

這些操作只處理畫面。排序、parser、diagnostics、schema replay 與可信度仍由 core 提供。來源副本修改後，原有邏輯會卸載結果與診斷卡片，需要重新分析，不會讓舊 schema 看起來仍有效。

## 選取規則

- 完整路徑唯一匹配才可跳轉；沿用 M11 的歧義保護，不猜 basename。
- analysis／replay 的有效行號選取整行，不包含換行字元；column 不用於字元定位。
- ordering／dependency 或无效行號只開啟對應檔案，游標放在開頭，不選取任意 PHP 行。
- textarea 將 CRLF／CR 正規化為 LF，範圍必須依正規化內容計算；位置以 JavaScript UTF-16 長度計算，可處理中文與 emoji。
- 重複點選同一診斷仍可重新跳轉。修改內容、手動切換输入、載入範例、匯入與重新分析會清除舊跳轉提示。
- 只修改記憶體中的工作台副本，不寫回磁碟，不新增自動修正、完整程式碼編輯器或單檔模式跳轉。

## 驗證

307／307 tests 通過（新增 6 個行選取測試），typecheck、build 通過。測試涵蓋整行範圍、Windows／CR 換行、中文／emoji、空白末行、無效位置與第一行／空來源。

瀏覽器確認：點選 unsupported 第 6 行後跳回正確檔名，textarea 取得焦點，選取 fullText 所在整行。將 fullText 改成 nullable 後舊定位消失；重新分析第 2 份已套用，診斷更新為第 3 份缺少 nickname 的 replay 錯誤。這證明只修正第一個問題不代表整個專案成功，沒有以成功前綴代替 finalSchema。

[PR #38](https://github.com/jerryyehself/laravel-migration-visualizer/pull/38) 已合併 main（8777354），對應 issues／milestone 已關閉。GitHub 交付狀態見 [紀錄](github-milestones.md)。
