# R4：結構與 PHP 來源往返

核准 PR #119／R4 修訂 2；R1 #121、R3 #123 已合併。雲端分支 feat/r4-operation-sources；milestone 38／issue #127。認證恢復後已移到 R2 #126 merge cbfdf613 的最新 main；本批已由 PR #128 merge 47b8e0ac1f57edf8727c6a896fa6de8708b6de0d；issue／milestone closed。core 0.15.0 來自已合併 R2；本批沒有新增 core export 或 JSON variant。

## 查詢契約

operationSources 是純 web query service，像後端查詢 service：讀既有 ProjectAnalysis 與完整 table、可選 column 名稱，不讀 PHP、不做 IO、不重新 parse/replay。輸出 migrationIndex／operationIndex、filename、status、operation、source，依 core 順序。完整規則見 proposals/R4-source-navigation.zh-TW.md。

表查詢包含 operation.table、renameTable.to、foreign key target table。欄位查詢只採明列的 column name、renameColumn from/to、addIndex.columns、foreign key 本表／目標欄位。dropIndex／renameIndex／dropForeignKey 只有 constraint 名稱，不由 before schema 推測欄位；表層級 create/drop/rename 也不冒充欄位來源。

同名刪除重建保留每筆操作，不合併成 identity。rename 只匹配這筆 operation 的前後名稱，不沿歷史追蹤另一個表／欄位。failed／blocked 的語法涉及仍可查，但沒有可信已套用效果；applied 是靜態 replay 狀態，不表示 DB 已執行。source 缺少、行號越界或檔案不唯一明列未知。

## 元件、props、state 與返回

TableDetails 類似 view：props 提供當前 schema、選取與 ProjectAnalysis；OperationSources 呼叫純 service 後列來源。欄位搜尋選中時另列欄位涉及，不改 schema／exports。React callback 只把來源 DTO 與返回焦點目標交回 ProjectResults。

ProjectResults 的 state 保存目前 source selection，ref 保存原按鈕 DOM。來源跳轉清逐檔篩選、選原 migrationIndex，OperationSourcePanel 唯讀呈現 PHP 行，沒有偽造 error diagnostic 或新編輯器。返回不重建／混合 schema，而是保留原快照與畫面，捲回原來源列並恢復焦點；DOM 失效時提示重新選取。

切換快照／表或重設選取會清來源；修改輸入副本沿用既有 result=null，使面板與匯出失效。來源片段 utility 與診斷定位共用行號規則，但來源不冒充 diagnosis；ordering／dependency 的診斷依舊不宣稱有效 PHP 行。

## 本次驗收

8 個 service tests 核對 explicit names、FK 目標／composite／self reference、change、rename／重建、failed／blocked、constraint removal 不推測、hostile identifiers、缺少來源。4 個呈現 tests 核對 HTML escaping、exact filename／duplicate 拒絕、未知行及 failed／無來源狀態。既有診斷行號回歸通過。

Chromium／R1 Laravel.io：reserved_at → PHP 第 19 行；Enter 可用；結果篩選清除且選正確 migration；返回保留 after-1、table／column／焦點；換快照清來源；副本修改清分析／來源。內建失敗樣本確認 failed／blocked 語法與 applied 不混淆。console 無 warnings/errors；紀錄 research/r4-browser.json，截圖 artifacts/r4-operation-source.png。未做下載、手機或 DB 執行。

統一 verify（新增 constraint removal test 前）650 tests、typecheck、build、12 demos／15 步通過；新一項追加回歸在 8 service tests 中通過，隨後完整 npm test 651 tests 通過。恢復認證後，完整 verify 651 tests／15 步通過。PR #128 最新 head 5ead8c086507878d0a10fa0fe1e74c7d6d8b23a9／run 37901972576 success；其獨立 CI 通過後合併。首輪 CI 因新增 tests 依賴既有 dist 失敗，改 source import 後通過。
