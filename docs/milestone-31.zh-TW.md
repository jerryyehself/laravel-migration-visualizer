# M31：專案情境與規模驗證

新增十二份自行撰寫的 commerce migrations：users/products/orders/order_items/attachments 五表，涵蓋 primary/unique/foreign key/action、enum、current timestamp、change、column/index rename，以及 numeric/UUID morph lifecycle。不是第三方完整專案，沒有私有資料；既有 M20 官方 corpus 也一併重新驗證。未取得使用者真實專案，因此不宣稱已證明任意真實 repo 相容。

final.golden.json 從需求定義獨立建立，不錄製 analyzer output。六個新測試檢查 reverse import、逐份 before/after、整檔回滾、incomplete file 不 replay、快照／diff 隔離與 250/1000 檔 correctness。

本地 Node 22.13.1、macOS arm64，一次 built-package 觀察：250 檔 194ms／RSS 113MiB，1000 檔 2744ms／RSS 482MiB。數字會依機器與負載改變，RSS 包含 Node 程序，不是專案單獨記憶體；沒有速度／記憶體保證。逐檔完整快照會隨 schema 成長增加成本，第一版建議先以小批次或子集評估，1000 檔 core correctness 不等於 browser 操作效能驗收。

執行 `npm run demo:acceptance` 可重現 commerce 成功／失敗與規模觀察；CI 也執行。完整 609 tests（520 core + 89 web）、typecheck、build、十一個 demo 通過。

教學：core 接收檔名與 source，domain service 建立可信 snapshots；component 透過 props 顯示結果，state 只選擇目前看的表／快照。Corpus 與 benchmark 放測試或 examples 的 IO boundary，不讓 core 讀磁碟。不推測多型 FK，遇到失敗明確保留 null，而非成功前綴冒充最終結果。

主要檔案：fixtures/commerce、commerce-acceptance.test.ts、examples/acceptance.mjs、npm script 與 CI；core JSON/版本不變。GitHub 狀態見交付紀錄。
