# 第一版交付：產品 1.0.0／core 0.14.0

第一版包括多檔／資料夾匯入、檔名排序、靜態 AST 正規化、整檔原子 replay、逐檔可信快照、結構 diff、診斷定位／編輯還原、JSON 匯出，以及 ERD 快照／前後比較／同步互動／表明細。相容性矩陣以 M30 十二案例與既有 core tests 固定；M31 十二檔自撰專案及規模測試；M32 實際工作台驗收；M33 文件、統一驗證與交付包。

產品與 web 標示 1.0.0，core 維持 0.14.0，公開 JSON 不變。這是目前約定範圍的第一版，不是完整 Laravel API 或穩定外部 SDK 的承諾。套件仍 private，沒有 npm 發布、資料庫、雲端部署或新費用。

`npm run verify` 執行 tests、typecheck、build 與所有 demo scripts，遇到任何失敗立即停止；artifacts/verification.json 記錄 Git HEAD、環境與每步 exit status。CI 同樣執行該指令再測試產包。

`npm run release:bundle` 需要乾淨 checkout，先重新 verify 再從該 HEAD git archive source，附上 build 的 web、手冊、驗證紀錄及逐檔 SHA-256 manifest，產生 artifacts/laravel-migration-visualizer-v1.0.0.tar.gz 與 checksum。拒絕未提交變更或不同 HEAD 的驗證紀錄；node_modules、.git 與本機憑證不進入包。包內 source 不含 Git history，重新产包需 clone；時間與環境資訊使 archive 不保證 byte-for-byte deterministic。

已知限制與風險：不執行任意 PHP／SQL，僅支援靜態子集合；沒有 DB runtime 正確性承諾。全部快照的記憶體成本隨 schema 增長，1000 檔 core correctness 不等於 browser 效能。沒有草稿持久化；編輯不回寫 PHP。M32 內建瀏覽器 download event 逾時，未取得落盤檔案，JSON 內容由測試驗證；使用者先前手動下載成功。手機／跨瀏覽器／單檔與資料夾流程未做本次全面實測。

驗證數字、GitHub CI 與最終 merge/tag 以交付紀錄為準；手冊見 user-guide.zh-TW.md。下一步以使用者真實 Laravel 專案做相容性回饋，按具體診斷選 API 補強與效能方案，不為湊 milestone 擴增排除功能。
